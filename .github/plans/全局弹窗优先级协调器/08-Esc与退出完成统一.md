# 全局快捷键、Esc 与退出完成统一设计

## 目标

在不替换 HeroUI 焦点圈闭、不重写 Drawer 动画、不改变视觉样式的前提下，进一步统一 Modal、营业预设 Drawer、NavbarMenu 和全局搜索的三项跨组件能力：

1. Ctrl/⌘+K、`/` 等会打开根覆盖层的全局快捷键入口。
2. 当前活动覆盖层对 Esc 的所有权与关闭入口。
3. 覆盖层退出完成后，关闭、交接或导航回调的执行时机。

本设计只统一协议和所有权，不统一各组件内部的焦点圈闭、动画定义和 body scroll lock。

## 实施进度

- 已完成：单一 `OverlayCoordinatorHost` 接管 Ctrl/⌘+K、`/` capture 监听。
- 已完成：快捷键定义随 `global.search` 登记，协调器先完成门控或子任务压栈，再触发搜索业务状态。
- 已完成：重复快捷键、教程拒绝、文本输入避让与事件消费规则的纯状态脚本。
- 已完成：Host 接管 Modal、Drawer、NavbarMenu 的 Esc；局部浮层优先规则上移，Drawer 只保留 Tab 圈闭。
- 已完成：NavbarMenu 路由回调等待协调器关闭完成 Promise，不再维护组件内退出 timer；登记时长作为统一兜底。
- 待实施：Modal/Drawer 的真实动画完成信号。为避免无浏览器验证时改变现有离场动画，本切口不改 HeroUI `motionProps` 或 Drawer variants。

## 当前问题

### Esc 分散

- 基础 Modal 在 `window` capture 阶段提供关闭兜底，并自行判断局部 Popover、Select、Dropdown、Autocomplete 和 Tooltip。
- Drawer 在自己的 `keydown` 监听中同时处理 Esc 与 Tab 圈闭。
- NavbarMenu 依赖 HeroUI 内部的 Esc 行为。

三者都需要知道当前是否位于协调栈顶，但关闭入口和事件传播规则并不相同。

### 搜索快捷键与协调决策分散

- 全局搜索组件自己在 `window` capture 阶段监听 Ctrl/⌘+K 和 `/`。
- 搜索组件知道按键组合和文本输入避让规则，协调器知道教程、P0、父任务和任务栈规则，两边共同决定一次快捷键能否打开搜索。
- 组件直接处理全局事件后再调用 store，容易出现事件已消费但协调请求被拒绝、或者后续新增入口重复实现平台判断的问题。

本阶段只统一会打开或关闭根覆盖层的快捷键，不接管输入框内的方向键、Enter、Backspace、表单键盘交互或页面级业务快捷键。

### 退出完成分散

- Modal 使用登记的退出时长。
- Drawer 已有 `AnimatePresence`，但协调器仍依赖登记时长。
- NavbarMenu 没有公开退出完成回调，导航仍需使用同一具名时长等待。

登记时长是必要兜底，但能获得真实动画完成信号的组件不应继续只靠定时器推进交接。

## 设计边界

### 统一管理

- 当前活动覆盖层 ID。
- 根覆盖层全局快捷键的匹配、优先级、门控和事件消费。
- Esc 是否可关闭、关闭回调和事件消费。
- 局部浮层优先处理 Esc。
- 退出周期、完成信号、超时兜底和完成后的回调。
- 被覆盖层的 `inert` 和交互所有权。

### 保留在适配层

- HeroUI Modal 和 NavbarMenu 的 FocusScope/focus trap。
- Drawer 当前的 Tab/Shift+Tab 圈闭。
- Modal、Drawer、NavbarMenu 各自的动画 variants。
- Drawer 的 body overflow 管理。
- 各业务 store 的打开意图和关闭副作用。
- 搜索组件打开时的埋点、震动、查询重置和焦点逻辑。

## 方案

### 1. 单一全局键盘 Host

新增一个无视觉输出的 `OverlayCoordinatorHost`，在应用 Provider 层只挂载一次。Host 在 `window` capture 阶段统一监听 Esc 和已登记的根覆盖层快捷键，并从协调器读取当前真正活动的覆盖层。

覆盖层登记增加以下运行期信息：

```ts
interface IOverlayRegistration {
	canActivate?: () => boolean;
	dismissable?: () => boolean;
	exitDelayMs?: number;
	getRootElement?: () => HTMLElement | null;
	id: TOverlayId;
	onRequestClose?: (reason: 'escape' | 'coordinator') => void;
	shortcuts?: readonly IOverlayShortcutDefinition[];
}

interface IOverlayShortcutDefinition {
	canHandle?: (event: KeyboardEvent) => boolean;
	matches: (event: KeyboardEvent) => boolean;
	onTrigger: () => void;
}
```

Host 的处理顺序：

1. 忽略非 Esc、输入法合成和已被更早处理的事件。
2. 获取 P0、P1 或 P3 中当前实际活动的覆盖层，而不只读取 P1 栈顶。
3. 若覆盖层不可关闭，则不触发业务关闭。
4. 根据活动根元素、事件目标以及 `aria-controls`/`aria-describedby` 判断是否存在应优先关闭的局部浮层。
5. 局部浮层存在时放行事件，由 HeroUI/React Aria 自己处理。
6. 否则消费事件并调用登记项的 `onRequestClose('escape')`。

基础 Modal 删除自己的全局 Esc effect；Drawer 的键盘监听只保留 Tab 圈闭；NavbarMenu 不再依赖其内部 Esc 来决定业务关闭。

搜索快捷键处理顺序：

1. 忽略输入法合成和已被更早处理的事件。
2. 按登记顺序匹配 Ctrl/⌘+K 或普通 `/`；Ctrl/⌘+K 保留现有跨输入控件触发行为，`/` 在文本输入目标中继续放行。
3. 由协调器先判断目标是否可激活：P0 或教程活动、任务交接中时拒绝；P1 父任务活动时将搜索压入子任务栈。
4. 匹配到已打开的搜索时只消费浏览器默认行为，不重复入栈或重置查询。
5. 激活成功后才调用搜索组件登记的 `onTrigger()`，继续执行现有震动、埋点、查询重置和 store 更新。
6. 匹配成功的全局快捷键统一 `preventDefault()`；只有实际接管事件时才停止继续传播。

快捷键定义跟随目标覆盖层登记，即使目标当前关闭也保持有效；组件卸载时与覆盖层登记一起移除。首期只有 `global.search` 登记 Ctrl/⌘+K 和 `/`，不建立可配置的通用命令面板。

### 2. 通用退出完成协议

协调器为每次退出创建单调递增的退出周期 token。只有同时匹配覆盖层 ID 和 token 的完成信号才能推进当前交接，迟到的旧动画回调会被忽略。

协调快照记录 `exitingOverlayId` 和 `exitToken`；`useCoordinatedOverlay()` 只在当前覆盖层正处于该退出周期时返回对应 token，并提供已经绑定 ID/token 的 `reportExitComplete()`。业务组件不自行保存或拼装 token。

建议接口：

```ts
requestOverlayClose(id): Promise<void>;
reportOverlayExitComplete(id, exitToken): void;
```

- `requestOverlayClose()` 仍立即撤销展示请求，但返回的 Promise 在本次退出真正完成后 resolve。
- `useCoordinatedOverlay()` 返回的 `reportExitComplete()` 是组件适配层的主要入口；底层 `reportOverlayExitComplete()` 只由 hook 封装和状态机测试使用。
- 同一退出周期内的重复关闭调用加入同一个完成结果，不创建第二次退出。
- 交接内部等待同一完成结果，再激活目标。
- 组件卸载、请求失效或 reduced-motion 为 0 时立即完成。
- 每次退出仍启动具名时长兜底，避免第三方组件未触发完成回调时永久阻塞。
- 完成信号与兜底定时器竞争，先完成者结算一次并取消另一方。

### 3. 各覆盖层适配

#### Modal

- 继续由基础 Modal 自动登记。
- 将 HeroUI `motionProps.onAnimationComplete` 与调用方已有回调安全串联。
- 仅在退出 definition 完成时报告当前退出 token。
- 无动画或 reduced-motion 时由协调器立即完成。

#### Drawer

- 根节点提供给登记项，用于局部浮层与 Esc 所有权判断。
- `AnimatePresence.onExitComplete` 报告退出完成。
- 删除 Drawer Esc 分支，保留当前 Tab 圈闭和焦点恢复规则。

#### NavbarMenu

- 根节点提供给登记项。
- HeroUI Navbar 当前没有公开稳定的退出完成回调，因此首期继续使用 `MOBILE_NAV_MENU_EXIT_DELAY_MS` 兜底。
- 普通路由跳转使用 `requestOverlayClose(...).then(route)`，删除 Navbar 自己的关闭定时器和 timer ref。
- 打开搜索、账号或设置 Modal 继续使用 `handoffOverlay()`。

## 数据流

### Esc 关闭

```text
window capture Esc
  → OverlayCoordinatorHost
  → 当前活动覆盖层登记项
  → 局部浮层检查
  → onRequestClose('escape')
  → 业务 isOpen=false + requestOverlayClose()
  → 退出完成信号或超时兜底
  → 恢复父任务/出队 P3
```

### 快捷键打开搜索

```text
window capture Ctrl/⌘+K 或 /
  → OverlayCoordinatorHost
  → global.search 快捷键登记
  → 文本输入避让与协调器门控
  → 无父任务：requestOverlayOpen(global.search)
  → 有 P1 父任务：pushOverlayChild(parent, global.search)
  → 激活成功后执行搜索组件 onTrigger
```

### 交接

```text
handoffOverlay(from, to)
  → 撤销 from 展示请求
  → from 播放退出动画
  → reportOverlayExitComplete(from, token)
  → 校验目标仍有效
  → 激活 to
```

## 异常和兼容处理

- 无根元素时仍允许关闭当前活动覆盖层，但无法识别与其关联的 portaled 局部浮层；Modal、Drawer、NavbarMenu 接入完成后必须始终提供根元素。
- 动画完成回调抛错不能阻止协调器结算；先执行调用方回调，并用 `finally` 报告完成。
- 组件卸载时必须取消登记并结算或失效当前退出周期，不能遗留未 resolve 的 Promise。
- P0 的 `dismissable` 固定为 `false`，Host 不得绕过强制改密或同步冲突的不可关闭约束。
- `event.defaultPrevented` 和输入法合成状态继续保留。
- 快捷键回调抛错不能回滚已经完成的协调状态；Host 不吞异常，由现有错误边界处理。
- 同一目标不得重复登记含义相同的快捷键；登记被替换或卸载后，旧回调不得继续执行。
- 不引入新的持久化字段，退出 token、Promise 和登记信息全部为模块级瞬时状态。

## 实施顺序

1. 为退出周期、重复关闭、迟到完成信号和超时兜底补纯状态机用例。
2. 扩展登记信息和退出完成协议，不改任何覆盖层组件。
3. 新增 `OverlayCoordinatorHost`，接管基础 Modal 的 Esc，并接管搜索 Ctrl/⌘+K、`/` 监听。
4. 删除搜索组件自己的全局 `keydown` effect，只登记匹配规则和原有打开回调。
5. 接入 Drawer，删除其 Esc 分支并连接 `AnimatePresence.onExitComplete`。
6. 接入 NavbarMenu，用关闭 Promise 替换导航 timer ref；保留时长兜底。
7. 连接 Modal 动画完成信号，验证调用方 `motionProps` 回调仍会执行。
8. 全仓扫描顶层 Esc/搜索快捷键监听和覆盖层专用关闭定时器，删除已被协议替代的实现。

## 验证要求

### 自动验证

- P0、P1、P3 的活动覆盖层选择正确。
- 不可关闭 P0 不响应 Host Esc。
- 普通 Modal、Drawer、NavbarMenu 的 Esc 只关闭当前活动项。
- 局部 Popover、Select、Dropdown、Autocomplete、Tooltip 优先关闭自身。
- 真实完成信号、超时兜底、重复信号和迟到 token 均只结算一次。
- NavbarMenu 路由回调只在退出结算后执行。
- Ctrl/⌘+K 和 `/` 在无覆盖层、设置、营业预设、账号或移动菜单活动时均按既定栈规则打开搜索。
- 搜索关闭后恢复原父任务，遮罩点击不关闭父任务。
- `/` 在 input、textarea、select 和 contenteditable 中不触发；Ctrl/⌘+K 保留现有行为。
- P0、教程和任务交接期间的快捷键不会写入搜索业务状态。
- 搜索已经活动时重复快捷键不重复入栈或重置查询。
- 源或目标卸载不会留下未完成交接。
- TypeScript、ESLint、Prettier、`git diff --check` 和协调状态机脚本通过。

### 保留人工验证

- 不同主题、高外观和 reduced-motion 下的真实动画观感。
- 键盘焦点恢复位置。
- HeroUI NavbarMenu 在不同视口下的实际退出时机。

本阶段仍按要求不启动浏览器。

## 完成定义

- 全仓只有 `OverlayCoordinatorHost` 负责根覆盖层 Esc 以及 Ctrl/⌘+K、`/` capture。
- Drawer 不再自行处理 Esc，Modal 不再包含全局 Esc effect。
- 全局搜索不再包含自己的全局 `keydown` effect，只登记快捷键定义和打开回调。
- Navbar 不再维护仅用于等待菜单退出的 timer ref。
- 能报告真实退出完成的 Modal 和 Drawer 优先使用完成信号；NavbarMenu 使用统一兜底。
- 焦点圈闭和视觉动画保持现有实现，不产生双 FocusScope 或样式变化。
