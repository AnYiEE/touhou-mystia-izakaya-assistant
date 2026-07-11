# Modal 与覆盖层接入

## 基础 Modal

### 接入方式

`app/design/ui/components/modal.tsx` 增加可选的协调配置：

```ts
interface IModalCoordinationProps {
	canActivate?: () => boolean;
	id: TOverlayId;
	requestOwnership?: 'component' | 'external';
	shortcuts?: ReadonlyArray<IOverlayShortcutDefinition>;
}

interface IModalProps {
	coordination?: IModalCoordinationProps;
}
```

基础 Modal 只负责：

1. 将业务 `isOpen` 与协调器的展示许可组合为实际 `isOpen`。
2. 在必要时将打开/退出完成信号回报给协调器。
3. 保留现有 HeroUI props、portal、focus trap、scroll mode、ScrollMask 和高外观样式。
4. 向全局 Host 登记根元素和可关闭状态；已展开的 Select、Autocomplete、Popover、Dropdown、Tooltip 等局部浮层仍通过触发器关联优先消费 Escape。
5. 普通 Modal 子任务沿用底层 Modal 的背景模糊；营业预设 Drawer 的模糊层位于抽屉内容下方，因此它的直接上层保留自身背景模糊。
6. 默认由组件同步业务 `isOpen` 与协调 request；P0 使用 external ownership，组件只注册展示适配，mount/unmount 不得撤销业务 request。
7. 组件所有模式下，如果一个此前未 requested 的新 P1 业务状态绕过入口变为 open，而协调请求被 P0/tutorial/其他任务拒绝，立即调用业务 close 回滚；已在栈中并被 P0 covered 的任务不回滚。

基础 Modal 不负责：

- 自动猜测两个 Modal 的父子关系。
- 根据 z-index 决定优先级。
- 替业务组件写入或清除 store。
- 统一重写 Modal 内部动画。
- 改动基础组件的样式和内边距。

## P0 期间的应用交互边界

`app/layout.tsx` 保持原有结构，`#modal-portal-container` 仍是 `<main>` 的第一个子节点。`OverlayCoordinatorHost` 在 P0 requested/pending/active/transition 期间从 portal 向 `body` 遍历祖先链，只对每一级不包含 portal 的兄弟子树设置 inert；portal 和祖先链本身不设 inert。Host 同时只观察这些祖先的直接子节点变化，使 hydration 替换出的新页面根也立即进入 inert，但不观察 Modal 内部动画 DOM，避免 mutation/render 回环。P0 关闭时按节点原值恢复 inert。

这层 inert 是全局交互边界，不替代协调请求决策。所有 P1 入口仍必须先得到 `activated`，所有局部 portaled Popover/Dropdown 还必须验证位于 P0 backdrop 下且不可聚焦。

底层交互不得在没有可见说明时保持 inert。blocker transition 或 external blocker 已 requested 但对应 P0 根尚未出现时，Host 使用项目基础 `Modal` 在原 portal 中展示不可关闭的准备层；该准备层不登记协调 ID，避免与真实 P0 争抢槽位。1 秒后仍未出现则显示刷新/更新提示并记录脱敏错误码。准备层只解释阻断，不提供丢弃冲突或绕过 P0 的按钮，业务代码不直接调用 `createPortal()` 或另写 backdrop/层级样式。

### 不可直接全量自动注册

项目存在动态嵌套：

- 隐藏内容 Modal 在 `/preferences` 页面中是根任务。
- 同一组件在设置 Modal 中渲染时是子任务。
- 账号 Modal 可从 Navbar 独立打开，也可从设置 Modal 压栈打开。

因此 `parentId` 必须由打开请求或当前渲染上下文明确提供，不能固化在 ID 表中。

## P0 账号阻断 Modal

### 强制修改密码

- 适配组件始终挂载和注册，业务条件为 false 时只传 `isOpen=false`，不通过 `return null` 卸载协调 registration。
- `requestedOpen` 仍由 `isLoggedIn && passwordMustChange` 决定。
- 所有业务写入通过统一 `accountStore.setPasswordMustChange()` action，在 boolean 变化的同一调用链登记或撤销 `account.password-required`；Modal 使用 external request ownership，只登记和读取展示状态。
- 作为 `blocking` 登记，不开放普通关闭请求。
- 激活时覆盖当前 P1 任务栈。
- 任一标签从权威账号响应发现强制改密，或完成注册/登录/切号/改密/退出/删除账号、确认 session 401 时，发布现有 `account-updated` 和无业务数据的 storage 失效信号；监听在匿名/旧账号状态也常驻，账号事件在 userId 过滤前触发权威刷新，再由每个标签各自推导 blocker。事件不能携带密码、CSRF 或协调器 snapshot，接收刷新不能再次广播。
- 两个标签并发提交改密时由服务端预期旧 password hash 的条件更新裁决，只有一个成功；`409 credential-changed` 触发刷新，不重试旧表单。
- SSO 强制登出后需要打开账号 Modal 时，等待全部 P0 业务状态解除后再提交普通 P1 请求；不得直接写 `accountModal.isOpen` 绕过全局协调。

### 同步冲突

- 适配组件始终挂载和注册；无冲突时基础 Modal 关闭，但 external request owner 不依赖组件 mount/effect。
- `requestedOpen` 只由“当前用户存在未解决冲突”决定，不再包含 `!passwordMustChange`。强制改密和冲突同时成立时两个请求都保留，由协调器只展示 rank 更高的强制改密。
- 作为 `blocking` 登记，不增加关闭按钮，不改变现有处理中状态。
- 多个 namespace 冲突仍在冲突 Modal 内顺序处理，不将每个冲突分区登记成单独覆盖层。
- 冲突写入账号运行时 store 的同一调用链就向协调器请求 blocker；Modal 使用 external request ownership，组件 effect 和 registration cleanup 都不能开关该 request。
- 删除组件本地 `resolvedConflictKeys` 对业务列表的过滤；退出动画可保留最后展示快照，但相同 snapshot key 再次进入 store 时必须重新展示。

## 全局搜索

### 打开入口

以下入口必须先调用 `requestOpen('global.search')`，成功后再设置搜索 store：

- Navbar 搜索按钮。
- Ctrl/⌘+K。
- 非文本输入语境的 `/`。

若当前已有 P1 栈顶，快捷键搜索作为保留父层的子任务压栈；不自动关闭设置、营业预设或其他当前任务。

教程租约活动时：

- 快捷键事件可以 `preventDefault()`，但不写入 `globalSearch.isOpen`。
- 不排队此用户请求。

### 从搜索打开其他功能

下列流程改用 `handoff()`：

- 搜索 → 全局设置。
- 搜索 → 账号。
- 搜索 → 营业预设。

执行顺序：

1. 记录目标请求和当前路由代数。
2. 设置搜索业务状态为关闭。
3. 按搜索退出时长等待，或消费搜索退出完成信号。
4. 重新检查目标是否有效。
5. 激活目标覆盖层，再写入目标 store。

搜索完全关闭后的查询状态重置可继续使用现有 `SPOTLIGHT_CLOSE_RESET_DELAY`，它是搜索内部清理时序，不是全局优先级。

## 全局设置

- Navbar、侧边按钮和搜索打开时可作为根 P1 任务。
- 营业预设的帮助区打开设置时，使用 `pushOverlayChild({ parentId: 'customer-rare.plan-drawer', childId: 'preferences', ... })`。
- 设置中打开账号时，使用 `pushOverlayChild({ parentId: 'preferences', childId: 'account.main', ... })`，不再仅依靠 `isDismissable={!isAccountModalOpen}` 表达两者关系。
- 隐藏内容弹窗的 `parentId` 由 `onModalClose`/设置渲染上下文决定，不写死。
- 高外观模式切换后等待 800ms、关闭 Modal 再刷新页面的业务流可保留，参照动画时序文档整理常量和取消。

## 账号 Modal 和法律声明

- 账号 Modal 从 Navbar、SSO 页面或旧备份导入打开时是根任务。
- 从设置中打开时是显式子任务。
- 账号 Modal 与搜索、设置、顾客信息和 Drawer 一样服从通用 P1 门禁；不能把账号 action 的单独判断当成 P0 安全边界。
- 法律声明只是账号子 Modal，不允许独立根打开。
- 账号内部的删除数据、删除账号、撤销会话等确认 Popover 保持局部状态。
- 账号 Modal 失活或关闭时，这些局部 Popover 必须关闭，但无需全局登记。

## 顾客信息 Modal

- 普客和稀客使用不同覆盖层 ID，因为它们的路由有效期和内容不同。
- `?info` 是业务打开意图，协调器只决定当前是否展示。
- 路由不再匹配对应顾客页时，请求立即失效。
- 若用户通过深链直接进入 `?info`，它应作为用户任务，不当作被动弹窗。

## 营业预设 Drawer

### 保留的现有机制

- `customerStore.shared.planDrawer.isOpen` 继续作为业务打开意图。
- `isShellOpen` 继续支撑进出场动画和内容准备。
- body overflow 继续由 Drawer 自己管理。
- Drawer 内 Popover 继续 portal 到 Drawer 内部容器。

### 替换的直接依赖

当前 Drawer 直接读取：

- `globalSearch.isOpen`。
- `preferencesModal.isOpen`。

实施后改为读取 Drawer 自己是否位于任务栈顶部，例如 `isActiveTask`。

当 Drawer 不在栈顶时：

- 不处理 Esc。
- 不运行 Tab 圈闭。
- 保留帮助和删除确认 Popover 的业务状态，由上层遮罩隔离交互。
- 不将焦点还给左侧书签按钮。
- 必要时设置 `inert` 或等效的 pointer/focus 禁用。

子任务关闭后：

- Drawer 仍然满足业务打开条件时，恢复为栈顶。
- 焦点恢复到 Drawer 内的稳定元素，不恢复到页面书签。

## 移动端 NavbarMenu

- `isMenuOpened` 仍由 Navbar 本地状态管理。
- 菜单打开时登记为短生命周期 P1 任务。
- 菜单内导航到普通路由时，先关闭菜单，再经统一的菜单退出延迟执行路由切换。
- 菜单内打开搜索、账号或设置时使用 `handoff`。
- `showProgress()` 中的 300ms 是进度可见性保留时间，不必和 NavbarMenu 退出时长合并成同一常量，即使当前数值相同。

## 捐赠 Modal

- 达到里程碑后创建 P3 请求，不直接将 Modal 渲染为打开。
- 保留现有跨标签锁，它解决的是多标签重复弹出，与当前页面优先级是两个不同问题。
- 实际出队时重新检查里程碑、上次展示时间和当前路由。
- 教程运行时不再需要捐赠组件自己了解教程 store key，由 P3 规则统一延后。

## 局部 Popover 和确认层

下列组件保持局部：

- `AccountConfirmButton`。
- `AdminConfirmButton`。
- 设置数据保存/重置 Popover。
- Drawer 删除预设和帮助 Popover。
- 搜索面板内的操作 Popover。
- 物品、顾客、标签详情 Popover。

协调器不存储这些浮层的 ID、触发元素或开关状态。
