# Modal 与覆盖层接入

## 基础 Modal

### 接入方式

`app/design/ui/components/modal.tsx` 增加可选的协调配置：

```ts
interface IModalCoordinationProps {
	canActivate?: () => boolean;
	id: TOverlayId;
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

基础 Modal 不负责：

- 自动猜测两个 Modal 的父子关系。
- 根据 z-index 决定优先级。
- 替业务组件写入或清除 store。
- 统一重写 Modal 内部动画。
- 改动基础组件的样式和内边距。

### 不可直接全量自动注册

项目存在动态嵌套：

- 隐藏内容 Modal 在 `/preferences` 页面中是根任务。
- 同一组件在设置 Modal 中渲染时是子任务。
- 账号 Modal 可从 Navbar 独立打开，也可从设置 Modal 压栈打开。

因此 `parentId` 必须由打开请求或当前渲染上下文明确提供，不能固化在 ID 表中。

## P0 账号阻断 Modal

### 强制修改密码

- `requestedOpen` 仍由 `isLoggedIn && passwordMustChange` 决定。
- 作为 `blocking` 登记，不开放普通关闭请求。
- 激活时覆盖当前 P1 任务栈。
- SSO 强制登出后需要打开账号 Modal 时，等待 P0 业务状态解除后再提交 `account.main` 请求。

### 同步冲突

- 保留现有 `conflict !== undefined && user !== null && !passwordMustChange` 条件。
- 作为 `blocking` 登记，不增加关闭按钮，不改变现有处理中状态。
- 多个 namespace 冲突仍在冲突 Modal 内顺序处理，不将每个冲突分区登记成单独覆盖层。

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
