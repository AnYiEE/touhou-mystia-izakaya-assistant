# 公共多频道实时群聊 v1 最终方案

## 方案

- 本期交付 **公共一或多频道实时群聊**。
- 所有正常登录用户默认可参与公共频道聊天。
- 未登录用户也可看到聊天入口与 `/chat` 页面，但只能进入登录 / 注册引导态。
- 服务端只存储文本消息；前端可渲染图片链接、Markdown 等文本派生展示。
- 底层统一采用 **conversation / participant / message / moderation** 通用模型，兼容未来成员权限、加入退出、禁言、私聊。
- 实时通道采用 **SSE 收事件 + HTTP 发消息 / 拉历史**。
- 前端提供两种使用形态：
    - `/chat` 独立页面
    - **跨端统一的右侧入口柄 + 自适应聊天面板**
- **聊天入口不放顶部导航，不放左下角 / 右下角悬浮按钮组，不额外放入移动端菜单入口。**
- 本期不引入 IndexedDB，不做 Web Push。

## 入口与布局

- 聊天属于 **全站级功能**，统一使用右侧入口柄作为快速入口。
- 入口柄仅在以下条件同时满足时显示：
    - `siteConfig.isAccountFeatureClientEnabled = true`
    - `accountBootstrapStatus` 为 `anonymous` 或 `loggedIn`
    - 当前路由不是 `/chat`
- 已登录用户还需满足 `chat.enabled = true` 才显示入口柄。
- 未登录用户不受 `chat.enabled` 影响，始终显示入口柄。
- `accountBootstrapStatus = unknown` 时不显示入口柄，避免拉起空账号弹窗。
- `accountBootstrapStatus = disabled` 或 `error` 时不显示聊天入口与聊天页交互入口。
- 入口柄固定在视口右侧边缘、低于导航栏、避开右下角页面局部悬浮按钮区的位置。
- 入口柄固定在视口右侧边缘、低于导航栏、避开右下角页面局部悬浮按钮区的位置。
- 入口柄是窄的纵向 pill / tab，承担打开与收起聊天面板的唯一快捷入口。
- 入口柄显示聊天图标；仅已登录用户显示未读徽标。
- 已登录用户点击入口柄后，从右侧滑出聊天面板；面板覆盖页面内容，不推动主布局重排。
- 未登录用户点击入口柄后，不打开聊天面板，直接拉起现有全局账号弹窗，提供登录与注册入口。
- `/chat` 页面内不显示入口柄与聊天面板，避免双套聊天 UI 并存。
- 聊天面板在任意端复用同一套会话列表、消息列表、输入区与运行时状态。
- 聊天面板顶部提供“打开完整聊天页”按钮，跳转到 `/chat`。
- 未登录访问 `/chat` 时，页面渲染登录 / 注册引导态，不建立聊天运行时，并提供打开现有全局账号弹窗的主操作按钮。
- 由聊天入口或 `/chat` 引导态触发登录 / 注册成功后：
    - 若来源是入口柄，则自动打开聊天面板
    - 若来源是 `/chat`，则当前页面立即刷新为已登录聊天态
- 桌面端 `xl` 及以上：
    - 面板默认宽度 `24rem`
    - 最大宽度 `28rem`
    - 高度 `calc(100dvh - var(--navbar-height) - 1.5rem)`
    - 顶部与导航保留安全间距
    - 底部无需避让右下角页面局部悬浮按钮组，可在展开时覆盖其区域
- 平板端 `md` 到 `xl`：
    - 面板仍从右侧展开
    - 宽度为 `min(24rem, calc(100vw - 1rem))`
    - 高度为 `calc(100dvh - var(--navbar-height) - 0.75rem)`
- 移动端 `md` 以下：
    - 仍显示右侧入口柄
    - 面板复用同一实现，但展开为贴右侧的全高窄抽屉
    - 宽度为 `min(100vw, 26rem)`；当视口更窄时退化为全宽
    - 高度为 `calc(100dvh - var(--navbar-height))`
    - 保留安全区 inset，避免遮挡系统手势区域
- 聊天相关浮层通过独立 `chat-portal-container` 挂载。
- 需在根布局中新增 `#chat-portal-container`，并同步补充对应 DOM selector 类型声明。
- z-index 规则：
    - 页面内容 < 页面局部悬浮按钮组 < 聊天入口柄 < 聊天面板 < 模态框 / 对话框 / 关键弹层
- 聊天面板展开后可覆盖页面局部悬浮按钮组；面板关闭后页面局部悬浮按钮组恢复正常可见与可点击状态。
- `chat.enabled = false` 时：
    - 已登录用户的入口柄隐藏
    - 面板不可打开
    - SSE、通知、leader 竞选全部停止
    - `/chat` 仍可访问，但渲染“聊天已关闭”空状态，并提供重新开启入口

## 关键规则

- `chat.enabled` 是已登录用户的产品偏好，不是服务端权限。
- 服务端只校验登录态、用户状态、会话可见性、participant 状态、禁言状态。
- 未登录用户不创建 participant，不建立 SSE，不参与 leader 竞选，不接收通知，不产生未读状态。
- 同一账号同一浏览器多标签页，只允许一个 leader tab：
    - 只有 leader 建 SSE
    - 只有 leader 发原生通知
    - 其他标签页通过聊天专用 BroadcastChannel 接收轻量事件
- 标签页可随时关闭：
    - `pagehide / unload` 仅做 best-effort 释放
    - 真正接管依赖 lease 超时
- 首次创建 participant：
    - `joined_at = now`
    - `last_read_message_id = 当前频道当时的 last_message_id`
    - 历史可翻看，但首次进入前历史不计入未读
- 同一标签页只有一个 `currentConversationId`。
- `/chat` 页面与聊天面板共用同一运行时、同一数据源、同一未读与已读状态。
- 当前会话真实可见且消息区滚动到底部时，自动上报最新已读。
- 最后一条消息被删除时：
    - `last_message` 仍指向最新消息
    - 摘要显示“消息已删除”
    - 排序不回退
- 历史消息：
    - 服务端保留完整历史
    - 首屏默认最近 `50` 条
    - 翻页默认 `50` 条，单次最大 `100`
    - 补拉单次最大 `100`
    - 本期不自动清理历史
- 多设备：
    - 未读、已读、静音以服务端 `participant` 为准
    - 多设备原生通知 v1 不做全局去重
- 偏好同步：
    - 同浏览器其他标签页尽快生效
    - 其他设备最终一致，不承诺秒级

## 数据与接口

- 核心表：
    - `chat_conversations`
        - `id`、`type`、`slug`、`title`、`description`、`visibility`、`join_policy`、`archived_at`、`created_by_user_id`、`created_at`、`updated_at`、`last_message_id`
        - 本期固定 `type = public_channel`
        - 本期固定 `visibility = public_authenticated`
        - 本期固定 `join_policy = auto`
    - `chat_participants`
        - `conversation_id`、`user_id`、`role`、`state`、`joined_at`、`last_read_message_id`、`last_seen_at`、`muted_until`、`banned_until`
    - `chat_messages`
        - `id` 自增、`conversation_id`、`sender_user_id`、`body_text`、`created_at`、`deleted_at`
    - `chat_moderation_events`
        - 为未来禁言、移除、恢复预留结构
- 用户接口：
    - `GET /api/v1/chat/conversations`
    - `GET /api/v1/chat/conversations/[id]/messages?before=<id>&limit=50`
    - `GET /api/v1/chat/conversations/[id]/messages?after=<id>&limit=100`
    - `POST /api/v1/chat/conversations/[id]/messages`
    - `POST /api/v1/chat/conversations/[id]/read`
    - `GET /api/v1/chat/stream`
- 管理接口：
    - `GET /api/v1/admin/chat/conversations`
    - `POST /api/v1/admin/chat/conversations`
    - `PATCH /api/v1/admin/chat/conversations/[id]`
    - `POST /api/v1/admin/chat/conversations/[id]/archive`
    - `DELETE /api/v1/admin/chat/messages/[messageId]`
- 会话列表项至少包含：
    - `id`、`type`、`slug`、`title`、`description`
    - `archived_at`
    - `unread_count`
    - `last_read_message_id`
    - `last_message`
        - `id`、`sender_user_id`、`sender_name`
        - `preview_text`
        - `created_at`
        - `deleted`
    - `updated_at`
- 消息项至少包含：
    - `id`
    - `conversation_id`
    - `sender`
        - `id`、`username`、`nickname`
    - `body_text`
    - `created_at`
    - `deleted_at`
    - `deleted`
- SSE 事件：
    - `chat.conversation.updated`
    - `chat.participant.updated`
    - `chat.message.created`
    - `chat.message.deleted`

## 跨标签页、同步与通知

- 聊天专用广播通道：`chat-runtime`
- 广播最小载荷：
    - `leader-changed`
        - `userId`、`leaderTabId`、`leaseExpiresAt`
    - `tab-presence`
        - `userId`、`tabId`、`visible`、`routeKind`、`currentConversationId`、`panelExpanded`、`updatedAt`
    - `conversation-updated`
        - `userId`、`conversationId`、`updatedAt`
    - `message-created`
        - `userId`、`conversationId`、`messageId`、`senderId`、`createdAt`
    - `message-deleted`
        - `userId`、`conversationId`、`messageId`、`deletedAt`
    - `read-updated`
        - `userId`、`conversationId`、`lastReadMessageId`、`updatedAt`
    - `preferences-updated`
        - `userId`、`enabled`、`pageNotifications`、`nativeNotifications`、`updatedAt`
- leader lease：
    - TTL `20s`
    - 续租周期 `8s`
    - follower 在启动、`focus`、`visibilitychange = visible`、lease 过期、每 `10s` 可见态巡检时尝试接管
- tab presence：
    - 路由变化、当前会话变化、面板展开收起、`visibilitychange`、`focus / blur` 时广播
    - 存活标签页每 `15s` 心跳一次
    - leader 只有在没有任何活跃标签页正在看该会话时，才允许发该会话原生通知
- 原生通知：
    - 自己发的消息永不通知
    - 当前会话若被任一标签页活跃查看：不发任何提示
    - 页面可见但没人看该会话：发页内轻提示、未读角标、标题提醒，不发原生通知
    - 页面隐藏，且 `nativeNotifications = true`，且当前标签页为 leader：发原生通知
- 原生通知限频：
    - 同一会话 `15s` 内最多 1 条
    - 同一标签页全局 `60s` 内最多 6 条
    - 限频窗口内按“频道名 + 新消息数量”聚合展示
- 偏好：
    - `globalPreferences.chat.enabled`
    - `globalPreferences.chat.pageNotifications`
    - `globalPreferences.chat.nativeNotifications`
- 默认值：
    - `enabled = true`
    - `pageNotifications = true`
    - `nativeNotifications = false`
- 匿名用户没有 `globalPreferences.chat`；匿名态聊天入口与 `/chat` 引导态不依赖该偏好。

## 实施清单

### Phase 1：数据、服务与接口

- 新增聊天相关表、索引、Kysely 类型与迁移
- 增加聊天模块共享类型
- 在 `globalPreferences` 中新增 `chat` 偏好结构
- 更新严格 shape 校验、默认值、迁移与序列化
- 实现 `conversationService`
- 实现 `participantService`
- 实现 `messageService`
- 实现 `realtimeService`
- 实现用户接口、管理接口、统一错误码、鉴权、CSRF、`no-store`
- 接入审计日志与发消息限流
- 增加 `chatStorage` 抽象，v1 使用空实现或轻持久化内存实现

### Phase 2：运行时、布局与通知

- 实现单例 `chatController`
- 实现 `chatLeader` lease 机制
- 新增聊天专用 BroadcastChannel
- 实现 leader 选举、续租、超时接管
- 实现 tab presence 广播、过期清理、跨标签页轻量事件同步
- 实现偏好变化后的运行时重配
- 新增 `/chat` 页面
- 新增跨端统一右侧入口柄
- 新增自适应聊天面板
- 实现匿名入口态与 `/chat` 登录 / 注册引导态
- 页面版与面板版复用同一套会话 / 消息组件和同一数据源
- `/chat` 页面打开时关闭聊天面板
- 在设置页新增聊天与通知开关
- 聊天关闭后立即退出 leader 竞选、停止 SSE、停止通知、隐藏聊天 UI
- 实现未读角标、频道未读、标题提醒、页内轻提示
- 实现浏览器权限读取与申请
- 实现原生通知派发、聚合、限频和点击回跳

### Phase 3：管理、治理与验证

- 新增公共频道管理页面
- 支持创建、编辑、归档频道
- 支持删除消息
- 增加历史治理后续项：频道归档后的历史保留策略、历史清理工具、运维说明
- 覆盖迁移兼容、偏好同步、严格校验、鉴权、发消息、拉历史、实时接收、断线恢复、已读、通知、归档频道、管理员操作
- 覆盖首次 participant 创建后的未读基线
- 覆盖同一账号多标签页只保留一个 SSE
- 覆盖 leader 被强制关闭后 follower 在 TTL 后接管
- 覆盖一个标签页看当前会话时，其他标签页不会误发该会话通知
- 覆盖聊天入口不挤压顶部导航且不混入左下角 / 右下角页面局部悬浮按钮组
- 覆盖匿名用户可见入口、点击后拉起现有账号弹窗、登录成功后回到预期聊天态
- 覆盖旧账号云偏好升级后不会因 `globalPreferences` shape 变化报错
- 完成双账号联调

## 进度追踪

| Phase   | 模块       | 状态   | 说明                                                                                                                        |
| ------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| Phase 1 | 数据层     | 已完成 | 聊天表、类型、迁移、`globalPreferences.chat` 已落地                                                                         |
| Phase 1 | 服务层     | 已完成 | 会话、成员、消息、实时服务、专用发言限流、管理操作审计日志、`chatStorage` 抽象已落地                                        |
| Phase 1 | API 层     | 进行中 | 用户接口、管理接口、发送消息专用限流已落地；回归验证待补                                                                    |
| Phase 2 | 运行时     | 进行中 | 单例运行时、leader lease、BroadcastChannel、单 SSE、历史上翻、已读同步、关闭/退出即时释放 leader lease 已落地，仍需联调回归 |
| Phase 2 | 布局层     | 已完成 | 右侧入口柄、自适应面板、匿名引导态、`/chat` 复用已落地                                                                      |
| Phase 2 | 通知层     | 进行中 | 页内轻提示、标题提醒、权限申请、原生通知主链路、通知点击回跳对应频道已落地，限频与聚合需继续联调                            |
| Phase 2 | 设置层     | 已完成 | `chat.enabled`、页内提示、浏览器通知偏好开关已落地                                                                          |
| Phase 3 | 管理端     | 进行中 | 管理 API、频道维护/消息删除、管理操作审计日志已落地，管理页面细节已清理，需继续回归                                         |
| Phase 3 | 治理项     | 已完成 | 归档保留策略、清理工具后续项、运维说明已补充（见“历史治理与运维说明”）                                                      |
| Phase 3 | 测试与验收 | 进行中 | 类型检查、Lint、生产构建通过；仓库无测试框架，单元/集成需另建框架，双账号联调为人工验收                                     |

## 验收标准

- 未登录用户可看到聊天入口，并可通过入口或 `/chat` 页面进入现有登录 / 注册弹窗。
- 登录用户默认可进入公共频道并发送文本消息。
- 未登录用户不会建立聊天面板运行时、participant、SSE、未读、通知与 leader 状态。
- 新用户首次进入频道时，历史消息可翻看，但首次进入前的历史不计入未读。
- 用户可持续向上加载历史消息，不限制只能查看最近若干条。
- 用户既可在 `/chat` 使用完整聊天，也可在其他页面通过右侧聊天面板快速聊天。
- 页面版与面板版的数据、未读、已读、当前会话切换完全一致，不出现双份状态。
- 同一标签页任意时刻只存在一个 `chatController` 实例。
- 同一账号在同一浏览器多标签页下，任意时刻只存在一个 SSE 连接和一个原生通知源。
- leader 标签页被随时关闭、崩溃或冻结后，其他标签页可在 lease 过期后自动接管。
- 一个标签页收到新消息后，其他同账号标签页可通过广播快速同步 UI 状态。
- 聊天入口不会挤压顶部导航，也不会混入左下角 / 右下角页面局部悬浮按钮组。
- 移动端与桌面端复用同一入口形态与同一面板能力，只在尺寸与展开宽度上自适应。
- 面板内可直接跳转到 `/chat`；`/chat` 页面中不会重复显示入口柄与面板。
- 由匿名聊天入口触发登录 / 注册成功后，聊天面板可立即打开；由匿名 `/chat` 引导态触发登录 / 注册成功后，页面可立即切换为聊天态，无需手动刷新。
- 用户可在设置中关闭聊天；关闭后当前设备立即停止 leader 竞选、停止 SSE、停止通知、隐藏聊天 UI。
- `/chat` 在聊天关闭时仍可访问，但只显示关闭态，不建立聊天运行时。
- 用户可在设置中控制页面通知与原生通知偏好；偏好在跨设备登录时保持一致，但跨设备生效允许存在同步延迟。
- 当前正在看的会话不会触发任何提示；非当前会话按既定规则触发页内通知或原生通知。
- 原生通知按既定窗口限频和聚合，不会因高频消息刷屏。
- 两个账号在线时，新消息可通过 SSE 近实时到达。
- SSE 断线后可自动恢复，并通过增量拉取补齐消息。
- 未读数和已读位置在刷新页面与跨设备后保持一致。
- 归档频道不可继续发言。
- 匿名、禁用、删除用户无法访问聊天接口。
- 当前实现可在不重做核心结构的前提下扩展成员权限、加入退出、禁言、私聊、Web Push 和 IndexedDB 本地缓存。

## 历史治理与运维说明

### 频道归档后的历史保留策略

- 服务端保留完整历史，本期不自动清理任何消息或会话。
- 频道归档即 `chat_conversations.archived_at` 置为非空：
    - 不可继续发言（`checkConversationWritable` 返回 `false`，发送接口返回 `chat-conversation-archived` 403）。
    - 历史仍可查看、翻页与增量补拉，`last_message` 与排序不受影响。
    - 归档为软状态，可在管理端恢复（清空 `archived_at`）而不丢历史。
- 消息删除为软删除（`chat_messages.deleted_at` 置为非空）：
    - 记录保留，前端渲染为“消息已删除”。
    - `last_message` 仍指向最新消息，摘要显示“消息已删除”，排序不回退。

### 历史清理工具（后续项）

- 本期不提供自动清理，也不引入定时任务。
- 后续如需清理，建议以运维脚本或管理端接口实现，并遵循以下约束：
    - 按 `conversation_id` + 时间窗口批量硬删除超期软删除消息。
    - 清理或硬删除消息后，需同步校正所在会话的 `last_message_id` 与相关 `chat_participants.last_read_message_id`，避免出现悬空引用或未读基线漂移。
    - 归档频道的硬删除应先确认无恢复需求，并连带清理其 participant 与 moderation 记录。
    - 清理动作应写入 `scope = chat` 的管理审计日志。

### 运维说明

- 实时通道当前为单实例进程内内存 pub/sub，位于 `chatStorage` 抽象（`app/lib/chat/server/chatStorage.ts`）之后：
    - 单实例部署可直接使用内存实现。
    - 多实例 / 水平扩展时，用共享 broker（如 Redis pub/sub）实现 `IChatStorage` 并替换 `createInMemoryChatStorage`，`realtimeService` 与调用方无需改动。
- 管理端频道创建 / 编辑 / 归档与消息删除均记录 `scope = chat` 审计日志（含操作者、目标、IP / UA）。
- 发送消息在通用账号限流之外，另有每用户专用发言限流（默认 10 条 / 10 秒），可在 `app/lib/chat/server/route.ts` 的 `CHAT_MESSAGE_SEND_RATE_LIMIT` 调整。
- 关注 `chat_messages` 表增长；在引入清理工具前，历史体量随使用持续增长属预期行为。
