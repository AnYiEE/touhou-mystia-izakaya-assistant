---
name: SSO 管理与审计能力补全实施清单
overview: 全量补齐 SSO 授权关系管理、管理员撤销、分页搜索、callback 运营、ticket 观测、secret 元数据、审计日志和外部状态事件的修改计划。
isProject: false
---

# SSO 管理与审计能力补全实施清单

> 日期：2026-06-17
> 基准文档：[08-轻量SSO票据方案.plan.md](08-轻量SSO票据方案.plan.md)、[09-SSO外部服务接入文档.plan.md](09-SSO外部服务接入文档.plan.md)、[11-服务端渲染与ServerAction改造实施清单.plan.md](11-服务端渲染与ServerAction改造实施清单.plan.md)
> 范围：SSO 授权关系、SSO client 管理、管理员用户详情、callback 队列、ticket 生命周期、secret 轮换、审计日志、外部 SSO 协议补强。

## 一、执行原则

- 本计划按“全量补齐”执行，不因为改动大、跨层多、当前频率低或低优先级而跳过能力。
- 不删除现有公开协议端点：`/api/v1/sso/authorize`、`/api/v1/sso/validate`、`/api/v1/sso/status`、`/api/v1/sso/dispatch-callbacks` 必须保持兼容。
- 当前代码中，浏览器侧后台和 SSO 管理交互通过 `app/(pages)/admin/api.ts` 调用 `/api/v1/admin/*` API；页面 SSR 首载通过 server helper 直接读服务端 service/repository，不通过浏览器 API。
- 新增管理能力必须先落在稳定 API route、浏览器 API helper 和共享 service 上；SSR 首载只复用同一 service 读初始数据，不新增只有 Server Action 才能访问的能力。
- `app/actions/*` 当前是普通服务端工具模块，不是浏览器可直接调用的 Next Server Actions；若后续另行引入真正 Server Action，必须显式标注并复用同一 service/guard，不替代 API 契约。
- 管理端新增能力优先复用既有账号系统安全语义：账号功能门禁、管理员开关、cookie security、same-origin、rate limit、管理员 session、CSRF。
- 所有 secret、ticket、签名材料只展示安全摘要或元数据，不在日志、URL、审计详情、页面 props 中写入明文。
- 当前态表和历史表分离：当前授权、当前 secret、当前 callback queue 用于运行时判断；审计和历史表用于回溯，不反向影响协议判断。
- 历史表必须有保留策略：`sso_callback_deliveries` 不允许无限追加，默认保留 30 天且最多 10000 条；后续 audit/grant event 大表也需要在页面/API 接入前明确清理或归档策略。
- UI 先保证可操作和可排查，再做信息密度优化；管理员危险操作必须有确认、明确影响范围和结果反馈。
- 外部服务可感知的状态变化要尽量通过 callback 或可查询状态暴露，不能只在本地删除数据后静默结束。

## 二、当前能力与缺口

| 能力域          | 已落地状态                                                                                                                                                           | 仍需验证或后续收口                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| SSO client 配置 | 列表分页搜索、软删除、详情授权用户、callback、ticket、secret 元数据和运营指标已接入                                                                                  | 完整手测 client 创建、编辑、禁用、软删除、返回列表状态和禁用环境构建                            |
| 授权关系当前态  | 管理员按 client/user/global 查询 grants，支持单项和批量撤销，撤销原因进入 grant event/callback                                                                       | 继续用验证清单覆盖用户自助撤销和管理员多入口撤销一致性                                          |
| 授权关系历史    | `sso_grant_events` 已记录创建、刷新、用户撤销、管理员撤销和client删除事件并提供查询页                                                                                | 仍需真实SQLite迁移fixture和管理链路手测                                                         |
| 外部状态事件    | `grant_revoked`、`user_deleted`、`user_disabled`、`client_disabled`、`client_deleted`、`secret_rotated` 均已入队/校验/投递，callback队列已有独立租约和generation CAS | 外部服务联调需覆盖 nullable `user_id`、`metadata`、幂等处理和同机/内网`status_callback_url`部署 |
| callback 运营   | 队列页、delivery history、手动重试/丢弃/投递、默认 30 天/10000 条清理策略已接入                                                                                      | 手测失败、重试、最终失败和清理策略                                                              |
| ticket 生命周期 | ticket 查询、pending/used/revoked/expired 状态、未消费撤销和过期清理已接入                                                                                           | 手测过期清理、撤销未消费 ticket 和 validate 对 revoked ticket 的拒绝                            |
| secret 管理     | `sso_client_secrets` 元数据表、label、创建人、最后使用时间、禁用/撤销、最后 active 保护已接入                                                                        | 手测 secret 创建/启停/撤销对 validate/status 和 `secret_rotated` callback 的影响                |
| 审计日志        | 结构化审计表、查询页、client/secret/callback/ticket/dispatch管理链路审计已接入，IP/User-Agent 只保存哈希                                                             | 协议层审计和持久outbox按真实运维需求后续扩展；管理链路仍需手测验证                              |
| 管理员用户详情  | 用户详情已展示授权的 SSO clients，并支持撤销授权                                                                                                                     | 手测与全局 grants/client 详情撤销结果一致                                                       |
| 管理端可观测性  | `/admin/sso`、grants、callbacks、history、tickets、audit 页面和导航已接入                                                                                            | 发布前按验证清单覆盖搜索、过滤、分页、空态、错误态和 URL 状态保留                               |

## 三、目标交付物

| 交付物              | 说明                                                                        | 主要入口                               |
| ------------------- | --------------------------------------------------------------------------- | -------------------------------------- |
| 授权用户列表        | 管理员在某个 client 详情页查看已授权用户、授权时间、最近更新时间、用户状态  | `/admin/sso/[id]`                      |
| 管理员撤销授权      | 管理员撤销单个 user-client 授权；支持从 client 详情和用户详情两侧操作       | `/admin/sso/[id]`、`/admin/users/[id]` |
| 全局授权关系页      | 分页、搜索、按 client/user/status 过滤，支持批量排查和撤销                  | `/admin/sso/grants`                    |
| SSO client 分页搜索 | client 列表支持 page/query/status/callback 配置状态过滤                     | `/admin/sso`                           |
| 用户详情 SSO 面板   | 展示该用户授权过的 clients、授权时间、最近更新时间、撤销按钮                | `/admin/users/[id]`                    |
| callback 队列页     | 查看 pending、retrying、final failed，支持手动重试和丢弃                    | `/admin/sso/callbacks`                 |
| callback 历史页     | 查看投递成功/失败历史、HTTP 状态、错误摘要、耗时                            | `/admin/sso/callbacks/history`         |
| ticket 观测页       | 查看未消费、已消费、过期 ticket 统计和安全摘要，支持清理                    | `/admin/sso/tickets`                   |
| secret 元数据管理   | 生成、标记、禁用、撤销 secret；查看最后使用时间和创建人                     | `/admin/sso/[id]`                      |
| 审计日志            | 查询管理员、账号和协议层关键事件，支持按 scope/action/actor/target/时间过滤 | `/admin/audit`                         |
| 外部事件补强        | 授权撤销、client 禁用/删除、secret 轮换等事件有可追踪策略                   | callback 与 audit                      |

## 四、数据模型修改计划

### 4.1 现有表保留

- `sso_clients` 继续作为 client 当前配置表。
- `sso_user_client_grants` 继续作为当前有效授权关系表。
- `sso_tickets` 继续作为 ticket 当前生命周期表。
- `sso_callback_queue` 继续作为待投递 callback 队列表。

### 4.2 新增或迁移表

| 表                                       | 用途                                                                 | 关键字段                                                                                                                                   |
| ---------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `sso_client_secrets`                     | 替代 `sso_clients.secret_hashes` JSON 数组，保存每个 secret 的元数据 | `id`、`client_id`、`secret_hash`、`label`、`created_at`、`created_by_admin`、`last_used_at`、`disabled_at`、`revoked_at`                   |
| `sso_grant_events`                       | 授权关系历史，不影响当前态判断                                       | `id`、`client_id`、`user_id`、`event`、`actor_type`、`actor_id`、`reason`、`created_at`                                                    |
| `sso_callback_deliveries`                | callback 投递历史，成功也保留；按保留策略清理，避免无界增长          | `id`、`queue_key`、`client_id`、`user_id`、`event`、`attempt`、`status`、`http_status`、`duration_ms`、`error`、`created_at`               |
| `account_audit_logs` 或 `sso_audit_logs` | 结构化审计日志                                                       | `id`、`scope`、`action`、`actor_type`、`actor_id`、`target_type`、`target_id`、`metadata_json`、`ip_hash`、`user_agent_hash`、`created_at` |

### 4.3 现有表字段补强

| 表            | 字段               | 说明                                                                |
| ------------- | ------------------ | ------------------------------------------------------------------- |
| `sso_clients` | `deleted_at`       | 支持软删除和审计留存；公开协议只接受 `deleted_at is null` 的 client |
| `sso_clients` | `deleted_by_admin` | 记录删除操作者摘要，便于审计关联                                    |
| `sso_tickets` | `revoked_at`       | 支持管理员按 client/user 撤销未消费 ticket                          |
| `sso_tickets` | `revoked_reason`   | 记录清理原因，例如 `admin-revoke-grant`、`client-disabled`          |

### 4.4 迁移步骤

1. 更新 `app/lib/db/constant.ts` 增加新表名。
2. 更新 `app/lib/db/types.d.ts` 增加 `ITableSsoClientSecret`、`ITableSsoGrantEvent`、`ITableSsoCallbackDelivery`、`ITableAccountAuditLog`。
3. 在 `app/lib/db/migrations/sso.ts` 增加幂等建表、缺列补齐、索引和结构校验。
4. 从 `sso_clients.secret_hashes` 回填 `sso_client_secrets`：每个 hash 生成一条 active secret，`created_at` 使用 client `created_at`，`label` 使用 `Legacy secret #n`。
5. 保留 `secret_hashes` 读兼容一段时间；迁移完成后服务层读取优先使用 `sso_client_secrets`，必要时降级读取 JSON 字段。
6. 新增索引：
    - `sso_user_client_grants(client_id, updated_at)`。
    - `sso_user_client_grants(user_id, updated_at)`。
    - `sso_grant_events(client_id, created_at)`、`sso_grant_events(user_id, created_at)`。
    - `sso_client_secrets(client_id, revoked_at, disabled_at)`。
    - `sso_callback_deliveries(client_id, created_at)`、`sso_callback_deliveries(status, created_at)`。
    - `account_audit_logs(scope, created_at)`、`account_audit_logs(target_type, target_id, created_at)`。

## 五、服务端能力修改计划

### 5.1 Repository 层

修改和新增位置：

- `app/lib/account/server/repositories/sso.ts`
- `app/lib/account/server/sso.ts`
- `app/lib/account/server/adminSsoClientService.ts`
- 新增 `app/lib/account/server/repositories/ssoGrants.ts` 或在现有 `sso.ts` 中拆分授权关系查询。
- 新增 `app/lib/account/server/repositories/auditLogs.ts`。

步骤：

1. 新增 `listSsoUserClientGrantsForClient(clientId, options)`：返回 user profile、grant `created_at/updated_at`、用户状态。
2. 新增 `listAdminSsoGrants(options)`：支持 page、page_size、query、client_id、user_id、user_status、client_status。
3. 新增 `listSsoClientGrantsForUserAsAdmin(userId, options)`：供管理员用户详情使用。
4. 扩展 `deleteSsoUserClientGrant`：接收 actor、reason、是否入队 callback、是否写 audit、是否撤销未消费 ticket。
5. 新增 `deleteSsoUserClientGrantsByClient(clientId, actor, reason)` 和 `deleteSsoUserClientGrantsByUser(userId, actor, reason)`，用于批量撤销。
6. 新增 grant event 写入函数：创建/刷新授权、用户自助撤销、管理员撤销、批量撤销、client 删除级联都写历史。
7. 调整 `validateSsoTicket`：validate 成功创建或刷新 grant 时写 `sso_grant_events`。
8. 调整 `verifySsoClientSecret`：从 `sso_client_secrets` 验证 active secret，并记录 `last_used_at`。
9. 新增 callback delivery 历史写入：仅真实外部投递尝试写 delivery，成功后删除 queue 但保留有界 delivery；空跑或不可投递配置清理不写历史。
10. 新增 ticket 查询和清理函数：list、revoke pending、cleanup expired、按 client/user 清理。
11. 新增 audit log 写入 helper：管理员写操作和外部协议关键失败/成功均可调用。

### 5.2 Service 层

新增或扩展：

- `listAdminSsoClientUsers(clientId, options)`。
- `revokeAdminSsoClientUserGrant(clientId, userId, reason, csrfContext)`。
- `listAdminSsoGrants(options)`。
- `revokeAdminSsoGrant(clientId, userId, reason)`。
- `listAdminSsoCallbacks(options)`、`retryAdminSsoCallback(id)`、`discardAdminSsoCallback(id, reason)`。
- `listAdminSsoCallbackDeliveries(options)`。
- `listAdminSsoTickets(options)`、`cleanupAdminSsoTickets(options)`、`revokeAdminSsoTickets(options)`。
- `createAdminSsoClientSecret(clientId, label)`、`disableAdminSsoClientSecret(secretId)`、`revokeAdminSsoClientSecret(secretId)`、`renameAdminSsoClientSecret(secretId, label)`。
- `listAdminAuditLogs(options)`。

服务层要求：

- 管理员撤销授权时必须删除该 user-client 下所有未消费 ticket。
- 管理员撤销授权时必须写 grant event 和 audit log。
- 用户自助撤销授权也必须写 grant event；actor 为 `user`。
- client 禁用时应入队 `client_disabled` 或写可查询事件；如果 callback URL 不可用，审计也必须可见。
- client 删除改为两步：先软删除并撤销授权，再可选物理清理；第一版 UI 使用软删除。
- secret 轮换不再直接编辑 JSON 数组；所有 secret 操作通过 secret 表完成。

## 六、API 与服务端复用层修改计划

当前代码关系按以下边界执行：

- 浏览器交互：客户端组件调用 `app/(pages)/admin/api.ts`，再请求 `/api/v1/admin/*` route。
- API route：route guard、body parser、CSRF/rate limit、service、repository/db 依次处理。
- SSR 首载：页面服务器组件或 `server.ts` helper 读取 cookie/session 后直接调用同一 service/repository，避免服务器端反向 fetch 自己的 API。
- `app/actions/*` 当前是可复用的普通服务端工具目录，不是本计划中新增浏览器调用入口。

因此本节第一交付物是 API route、浏览器 API helper 和共享 service。SSR initial data helper 只负责首屏数据，不能成为唯一可访问路径；未来如果另行引入真正 Next Server Action，应作为单独薄封装复用同一 service/guard，而不是替代 API。

### 6.1 管理员 API route

新增 route：

| 方法     | 路径                                                | 用途                                          |
| -------- | --------------------------------------------------- | --------------------------------------------- |
| `GET`    | `/api/v1/admin/sso/grants`                          | 全局授权关系列表，分页搜索                    |
| `DELETE` | `/api/v1/admin/sso/grants/[clientId]/[userId]`      | 管理员撤销单个授权                            |
| `GET`    | `/api/v1/admin/sso/clients/[id]/users`              | 查看某 client 已授权用户                      |
| `DELETE` | `/api/v1/admin/sso/clients/[id]/users/[userId]`     | 从 client 详情撤销授权                        |
| `DELETE` | `/api/v1/admin/sso/clients/[id]/grants`             | 批量撤销某 client 全部授权                    |
| `GET`    | `/api/v1/admin/users/[id]/sso/grants`               | 查看某用户授权的 clients                      |
| `DELETE` | `/api/v1/admin/users/[id]/sso/grants/[clientId]`    | 从用户详情撤销授权                            |
| `GET`    | `/api/v1/admin/sso/callbacks`                       | 查看 callback queue                           |
| `POST`   | `/api/v1/admin/sso/callbacks/[id]/retry`            | 手动重试 callback                             |
| `DELETE` | `/api/v1/admin/sso/callbacks/[id]`                  | 丢弃 callback queue 项                        |
| `GET`    | `/api/v1/admin/sso/callbacks/history`               | 查看 callback delivery 历史                   |
| `GET`    | `/api/v1/admin/sso/tickets`                         | 查看 ticket 生命周期                          |
| `DELETE` | `/api/v1/admin/sso/tickets`                         | 按过滤条件撤销未消费 ticket 或清理过期 ticket |
| `GET`    | `/api/v1/admin/audit-logs`                          | 查询审计日志，支持账号和 SSO scope            |
| `POST`   | `/api/v1/admin/sso/clients/[id]/secrets`            | 生成新 secret，带 label                       |
| `PATCH`  | `/api/v1/admin/sso/clients/[id]/secrets/[secretId]` | 更新 secret label 或禁用状态                  |
| `DELETE` | `/api/v1/admin/sso/clients/[id]/secrets/[secretId]` | 撤销 secret                                   |

保留并扩展现有 route：

- `/api/v1/admin/sso/clients`：增加分页、搜索和过滤参数，同时保持无参数时兼容返回第一页。
- `/api/v1/admin/sso/clients/[id]`：详情返回可增加统计字段，但不得删除现有 `client` 字段。
- `/api/v1/account/sso/grants/[clientId]`：用户自助撤销时写 grant event、audit、可选 callback。
- `/api/v1/sso/validate`：secret 验证成功后更新 secret `last_used_at`，validate 成功写 grant event。
- `/api/v1/sso/status`：成功/失败写轻量审计或指标事件，不记录 secret 明文。

### 6.2 SSR 初始数据与浏览器 API helper

新增位置建议：

- `app/(pages)/admin/api.ts` 扩展 grants、callback、ticket、secret、audit 的浏览器请求 helper。
- `app/(pages)/admin/sso/server.ts` 扩展管理员 SSO 首载鉴权、首屏统计和 initial data helper。
- `app/lib/account/server/adminSsoClientService.ts` 保留 SSO client 基础配置 service。
- 新增 `app/lib/account/server/adminSsoGrantService.ts`、`adminSsoCallbackService.ts`、`adminSsoTicketService.ts`、`adminAuditService.ts`，或在同一 service 文件中按当前代码风格分组。

步骤：

1. 为每个新增 API route 先建立 service 函数、payload parser 和错误映射；禁止把业务逻辑只写在 route handler 中。
2. 在 `app/(pages)/admin/api.ts` 增加对应浏览器 helper，保持 `fetchAdminApiResult` 的 result envelope 和 unauthorized 清理分支可复用。
3. client 详情页浏览器刷新、分页和撤销授权调用 `/api/v1/admin/sso/clients/[id]/users*`；SSR 首载可直接调用同一 service 读取第一页和统计。
4. 用户详情页浏览器刷新、分页和撤销授权调用 `/api/v1/admin/users/[id]/sso/grants*`；SSR 首载或 lazy panel 只复用同一 service。
5. 全局 grants、callback、ticket、audit 页面通过 API route 做查询、过滤、批量操作、重试和清理；SSR 只预读首屏默认查询。
6. secret label、disable、revoke 必须有对应 API route 和浏览器 helper；创建/生成 secret 的一次性明文返回规则由 service 统一保证。
7. 不在本批新增只有 Server Action 能调用的管理能力；若后续确需 Next Server Action，另列薄封装批次并复用同一 service、guard、payload parser 和错误映射。

## 七、前端与页面修改计划

### 7.1 `/admin/sso` SSO 运营入口

修改文件：

- `app/(pages)/admin/sso/page.tsx`
- `app/(pages)/admin/sso/client.tsx`
- `app/(pages)/admin/sso/server.ts`

步骤：

1. client 列表支持 `page`、`query`、`status`、`callback`、`has_grants` 过滤。
2. 顶部增加 SSO 运营导航：`客户端`、`授权关系`、`Callback`、`Tickets`、`审计`。
3. 指标区增加 active clients、disabled clients、active grants、pending callbacks、failed callbacks、pending tickets。
4. 列表行展示授权用户数、pending callback 数、未消费 ticket 数、最后 validate/status 时间。
5. 编辑入口保留，新增“查看授权用户”快捷入口。

### 7.2 `/admin/sso/[id]` client 详情

修改文件：

- `app/(pages)/admin/sso/[id]/page.tsx`
- `app/(pages)/admin/sso/clientForm.tsx`
- 新增 `clientGrantPanel.tsx`、`clientSecretPanel.tsx`、`clientCallbackPanel.tsx`、`clientAuditPanel.tsx`。

步骤：

1. 表单保留基础配置编辑区。
2. Secret 区改为表格：label、hash 摘要、创建时间、创建人、最后使用时间、状态、操作。
3. 授权用户区：分页、搜索用户名/user id、按用户状态过滤。
4. 授权用户行提供“撤销授权”，确认弹窗说明会删除未消费 ticket，并可能通知外部服务。
5. 增加“批量撤销此 client 全部授权”，需要二次确认输入 client id。
6. Callback 区展示该 client pending/final failed 和近期 delivery。
7. Ticket 区展示该 client 未消费/已消费/过期统计和清理按钮。
8. 审计区展示该 client 最近操作。

### 7.3 `/admin/users/[id]` 用户详情

修改文件：

- `app/(pages)/admin/users/[id]/page.tsx`
- `app/(pages)/admin/users/[id]/client.tsx`
- `app/lib/account/shared/types.ts`

步骤：

1. 用户详情服务端 initial data 增加 `sso_grants` 或单独 lazy panel。
2. 新增 SSO 授权面板：client 名称、client id、授权时间、最近更新时间、client 状态。
3. 每行提供撤销按钮。
4. 增加“撤销该用户全部 SSO 授权”，需要确认。
5. 用户被禁用/删除时，面板展示 callback 投递状态或提示外部服务会收到状态事件。

### 7.4 `/admin/sso/grants` 全局授权关系页

新增文件：

- `app/(pages)/admin/sso/grants/page.tsx`
- `app/(pages)/admin/sso/grants/client.tsx`

步骤：

1. 支持 query 搜索用户名、user id、client id、client name。
2. 支持过滤 client 状态、用户状态、授权时间范围、最近更新时间范围。
3. 行操作支持打开用户详情、打开 client 详情、撤销授权。
4. 批量操作支持选择多行撤销。
5. 导出当前筛选结果的 CSV 可作为后续扩展，不阻塞第一版。

### 7.5 `/admin/sso/callbacks` 与历史页

新增文件：

- `app/(pages)/admin/sso/callbacks/page.tsx`
- `app/(pages)/admin/sso/callbacks/client.tsx`
- `app/(pages)/admin/sso/callbacks/history/page.tsx`

步骤：

1. Queue 页显示 event、client、user、attempts、next_retry_at、last_error。
2. 支持按状态、event、client、user 过滤。
3. 单条支持立即重试、丢弃。
4. 顶部支持“立即 dispatch 一批”，复用 dispatch 服务但走管理员 action guard。
5. History 页展示每次投递的 HTTP status、耗时、错误摘要和时间。

### 7.6 `/admin/sso/tickets`

新增文件：

- `app/(pages)/admin/sso/tickets/page.tsx`
- `app/(pages)/admin/sso/tickets/client.tsx`

步骤：

1. 展示 ticket 安全摘要，不展示原 ticket。
2. 支持按 client、user、状态过滤：pending、used、expired、revoked。
3. 支持清理过期 ticket。
4. 支持撤销某 client/user 下未消费 ticket。
5. 显示异常统计：短时间大量 invalid ticket、过期未清理数量。

### 7.7 `/admin/audit`

新增文件：

- `app/(pages)/admin/audit/page.tsx`
- `app/(pages)/admin/audit/client.tsx`

步骤：

1. 支持按 action、actor、target、client、user、时间范围过滤。
2. 展示管理员写操作：创建/更新/禁用/启用/删除 client、生成/禁用/撤销 secret、撤销授权、批量撤销、重试/丢弃 callback、清理 ticket。
3. 展示外部协议关键事件：authorize 成功/失败、validate 成功/失败、status 成功/失败、callback 投递结果。
4. metadata 只显示安全字段，不显示 secret、ticket、完整签名。

## 八、外部协议与 callback 修改计划

### 8.1 callback event 扩展

现有 event：

- `user_deleted`
- `user_disabled`

新增 event：

- `grant_revoked`：用户自助或管理员撤销授权。
- `client_disabled`：管理员禁用 client，外部服务应暂停自己的登录态或拒绝新建会话。
- `client_deleted`：管理员删除 client，外部服务应清理映射或进入不可用状态。
- `secret_rotated`：生成新 secret 或撤销旧 secret 后通知外部服务尽快轮换。

步骤：

1. 更新 `TSsoCallbackEvent` 类型和 `sso_callback_queue.event` check constraint 迁移。
2. 更新 `checkSsoCallbackEvent`。
3. 更新 callback body schema，保持向后兼容：旧字段不删除，新事件通过 `event` 区分。
4. 对 `grant_revoked` 加入 `reason` 的安全枚举或放入 `metadata`。
5. 对 `client_deleted` 明确投递策略：软删除后先投递，完成后再允许物理清理。

### 8.2 status 与 validate 补强

步骤：

1. `validate` 成功时写 grant event：首次授权为 `grant_created`，重复授权刷新为 `grant_refreshed`。
2. `validate` 成功时更新 secret `last_used_at`。
3. `validate` 失败按安全摘要写 audit：invalid client、disabled client、invalid ticket、user disabled/deleted。
4. `status` 成功和失败写 audit 或轻量统计，避免大量请求撑爆审计表时可采样或只记录异常。
5. 所有失败审计不得保存 `client_secret`、ticket 原文、code_verifier 原文。

### 8.3 User-Agent 记录与限流策略

结论：

- User-Agent 不作为默认硬限流 key；现有账号/管理员/SSO 限流继续以可信 IP、session/admin-session、username、业务 parts（client、user、ticket、secret、backup code 等）为稳定维度。
- User-Agent 可伪造且高基数，纳入硬限流 key 容易稀释 IP/session/username/client/ticket 等稳定桶，反而降低拦截效果。
- 对会写入 `account_audit_logs` 的高价值管理员写操作，使用 `getRequestAuditContext(request)` 统一传入请求 IP 和 User-Agent，由 audit repository 写入哈希，不保存原文。
- 对登录/注册失败、SSO validate/status 失败、dispatch invalid secret、backup cleanup invalid secret 等异常场景，User-Agent 只作为后续风控/异常分析软信号，不替代现有硬限流维度。
- 高频成功读请求（公告、analytics、普通列表/详情、sync ping/state 成功请求）不额外写 User-Agent 审计，避免噪声和审计表膨胀。

后续实现要求：

1. 新增管理员敏感写操作 audit 时，route 层统一传 `getRequestAuditContext(request)`，service/repository 只接收安全上下文，不直接依赖 `NextRequest`。
2. 如未来需要按 User-Agent 做风控，只新增独立软信号或统计，不把 User-Agent 拼入现有 `checkAccountRateLimitRouteResponse` / `checkSsoRateLimitRouteResponse` 的默认 key。
3. 所有持久化 User-Agent 信息必须哈希化或 HMAC 化，并遵守审计/备份数据保留策略。

## 九、文档修改计划

需要同步更新：

- [09-SSO外部服务接入文档.plan.md](09-SSO外部服务接入文档.plan.md)：补充撤销授权 callback、client 禁用/删除、secret 轮换通知和外部服务处理建议。
- [08-轻量SSO票据方案.plan.md](08-轻量SSO票据方案.plan.md)：补充全量管理能力后的数据模型和协议边界。
- [07-验证清单与发布回归.plan.md](07-验证清单与发布回归.plan.md)：补充 SSO 管理、callback、ticket、audit 的测试矩阵。
- [00-账号系统落地总纲.plan.md](00-账号系统落地总纲.plan.md)：登记本计划和实施状态。

## 十、实施批次

| 批次 | 目标                                   | 主要修改                                                              | 完成判定                                        |
| ---- | -------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------- |
| 0    | 数据模型和迁移                         | 新表、缺列、索引、类型、回填 secret hash                              | 旧数据可迁移，重复启动幂等                      |
| 1    | Repository 和 service                  | 授权查询/撤销、secret 元数据、ticket、callback delivery、audit helper | 服务层单独可调用，协议行为不退化                |
| 2    | 管理员 API、SSR helper 与浏览器 helper | grants、client users、user grants、callbacks、tickets、audit、secrets | 浏览器 API 主路径可用；SSR 首载复用同一 service |
| 3    | client 详情授权管理                    | `/admin/sso/[id]` 展示授权用户、撤销、批量撤销、secret 元数据         | 管理员可完成 client 维度授权治理                |
| 4    | 用户详情授权管理                       | `/admin/users/[id]` 展示和撤销该用户授权                              | 管理员可完成 user 维度授权治理                  |
| 5    | 全局 SSO 运营页                        | grants、callbacks、tickets、audit 页面                                | 管理员可跨维度搜索和排查                        |
| 6    | 外部事件补强                           | callback event 扩展、validate/status 审计、secret last_used_at        | 外部服务可感知撤销和关键变更                    |
| 7    | 文档与回归                             | 更新接入文档、验证清单、手测和构建                                    | lint/build/offline/关键手测通过                 |

## 十一、详细步骤清单

### 批次 0：数据模型和迁移

- [x] 在 `TABLE_NAME_MAP` 增加 `ssoClientSecret`、`ssoGrantEvent`、`ssoCallbackDelivery`、`accountAuditLog`。
- [x] 在 Kysely 类型中增加四张新表和对应 `Selectable/Insertable/Updateable` 类型。
- [x] 在 SSO migration 中创建新表、索引和缺列补齐逻辑。
- [x] 为 `sso_clients` 增加 `deleted_at`、`deleted_by_admin`。
- [x] 为 `sso_tickets` 增加 `revoked_at`、`revoked_reason`。
- [x] 迁移 `secret_hashes` JSON 到 `sso_client_secrets`。
- [x] 更新结构校验，覆盖新增表、列和索引。
- [ ] 编写迁移重复执行测试或手测脚本：空库、旧库、半迁移库都能启动。

进度记录：

- 2026-06-17：已完成新表常量登记和 Kysely 类型扩展，包含 client 软删除字段、ticket 撤销字段和 grant/callback/audit 类型。
- 2026-06-17：已完成 SSO migration 新表创建、旧库补列、索引、结构校验和 `secret_hashes` 到 `sso_client_secrets` 的幂等回填；回填使用确定性 legacy secret id，并通过 `position` 保留旧数组顺序。
- 2026-06-17：`sso_callback_queue` 先扩展到可承载 `grant_revoked` 这类 user-client 事件；后续批次 6 已继续完成 nullable `user_id`、`metadata_json`、client 级事件和 delivery history 贯通。
- 2026-06-17：已执行 `git diff --check` 和 `pnpm exec tsc --noEmit`，当前批次 0 代码无空白错误且类型检查通过；迁移重复执行脚本/旧库手测仍待补充。

### 批次 1：Repository 和 service

- [x] 新增 client -> users 授权查询。
- [x] 新增 user -> clients 管理员查询，和普通用户查询区分返回字段。
- [x] 新增全局 grants 分页搜索。
- [x] 扩展撤销授权函数，支持 actor、reason、audit、callback、ticket revoke。
- [x] 新增批量撤销函数。
- [x] 新增 grant event 写入和查询。
- [x] 将 secret 校验改为读取 `sso_client_secrets` active 记录。
- [x] validate/status 使用 secret 后更新 `last_used_at`。
- [x] 新增 secret label/disable/revoke repository。
- [x] 新增 callback delivery 写入和查询。
- [x] 新增 ticket list/revoke/cleanup repository。
- [x] 新增 audit log 写入和查询 repository。

进度记录：

- 2026-06-17：已让 SSO client 新建/更新双写 `sso_client_secrets`，并继续维护 `sso_clients.secret_hashes` 作为兼容字段。
- 2026-06-17：`getSsoClientById`、`listSsoClients` 优先从 active secret 表读取并按 `position` 稳定排序，缺少 active secret 时回退旧 JSON 字段；公开 SSO client 读取已排除 `deleted_at` 不为空的软删除 client。
- 2026-06-17：`/api/v1/sso/validate` 和 `/api/v1/sso/status` 已使用 `verifyAndTouchSsoClientSecret`，secret 校验成功后更新匹配 active secret 的 `last_used_at`。
- 2026-06-17：`validateSsoTicket` 已拒绝 `revoked_at` 不为空的 ticket，并在成功创建/刷新授权时写入 `grant_created` / `grant_refreshed` 事件；后续已补齐 grant event 查询、撤销事件和 audit 查询底座。
- 2026-06-17：已执行针对相关文件的诊断和 `pnpm exec tsc --noEmit`，批次 1 第一段服务层改动类型检查通过。
- 2026-06-17：已新增 repository 层 `listSsoUserClientGrantsForClient` 与 `listSsoClientGrantsForUserAsAdmin`，支持分页和基础 query 搜索；后续已封装全局 grants 分页搜索。
- 2026-06-17：`deleteSsoUserClientGrant` 已支持 actor/reason、撤销未消费 ticket、写 `user_revoked` / `admin_revoked` grant event，并入队 `grant_revoked` callback；后续已为管理员撤销授权链路接入 audit 写入。
- 2026-06-17：已新增 `adminSsoGrantService` 和共享响应类型，封装 client -> users、user -> clients 查询以及管理员撤销授权服务；已执行 `pnpm exec tsc --noEmit`，类型检查通过。
- 2026-06-17：已新增 repository 层 `listAdminSsoGrants`，支持全局授权关系分页、query、client id、user id、user status、client status 过滤；service 层已封装为 `listAdminSsoGrantRelations` 并补充共享响应类型 `IAdminSsoGrantListData`。
- 2026-06-17：已新增 repository 层 `deleteSsoUserClientGrantsByClient` / `deleteSsoUserClientGrantsByUser` 和 service 层 `revokeAdminSsoGrantsForClient` / `revokeAdminSsoGrantsForUser`；批量撤销会删除当前 grant、撤销未消费 ticket、写 grant event，并入队 `grant_revoked` callback，后续已完成 audit、API 和 UI 接入。
- 2026-06-17：本轮批次 1 服务层改动已执行 `pnpm exec tsc --noEmit` 和 `pnpm lint`；TypeScript 通过，lint 无 error，仅剩既有 `onClick` deprecated warning。
- 2026-06-17：已新增 repository 层 `listAdminSsoTickets`、`revokeUnusedSsoTicketsForClient`、`revokeUnusedSsoTicketsForUser`、`cleanupExpiredSsoTickets`，支持 ticket 分页、query、client/user、pending/used/revoked/expired 状态过滤、未消费 ticket 撤销和过期清理。
- 2026-06-17：已新增 `adminSsoTicketService` 和共享响应类型 `IAdminSsoTicketListData` / `IAdminSsoTicketMutationData`；管理响应只返回 `ticket_hash_prefix` 和元数据，不返回 ticket 明文或完整 HMAC hash。
- 2026-06-17：ticket 底座已执行 `pnpm exec tsc --noEmit` 和 `pnpm lint`；TypeScript 通过，lint 无 error，仅剩既有 `onClick` deprecated warning。
- 2026-06-17：已新增 `repositories/auditLogs.ts`，提供 `writeAuditLog` 与 `listAuditLogs`；写入时 metadata JSON 序列化，IP/User-Agent 只保存 SHA-256 摘要，不保存原文。
- 2026-06-17：已新增 `adminAuditService` 和共享响应类型 `IAdminAuditLogListData`，支持按 scope/action/actor/target/time/query 分页查询；管理员撤销授权链路已接入 audit 写入，其它 client/secret/callback/ticket/protocol 写入覆盖按后续风险继续收敛。
- 2026-06-17：audit 底座已执行 `pnpm exec tsc --noEmit` 和 `pnpm lint`；TypeScript 通过，lint 无 error，仅剩既有 `onClick` deprecated warning。
- 2026-06-17：已新增 `repositories/ssoCallbackDeliveries.ts` 和 `adminSsoCallbackService`，支持 callback delivery 写入、分页查询和清理；dispatch 空跑不写历史，仅真实投递尝试记录 delivery。
- 2026-06-17：callback delivery 已采用有界保留策略，默认保留 30 天且最多 10000 条；dispatch 后以 best-effort 清理旧记录，避免外部触发 callback 导致历史表无限膨胀。
- 2026-06-17：callback delivery 底座已执行 `pnpm exec tsc --noEmit` 和 `pnpm lint`；TypeScript 通过，lint 无 error，仅剩既有 `onClick` deprecated warning。
- 2026-06-17：已新增 per-secret repository 能力：`listSsoClientSecrets`、`createSsoClientSecretForClient`、`renameSsoClientSecret`、`setSsoClientSecretDisabled`、`revokeSsoClientSecret`；每次变更后同步 legacy `sso_clients.secret_hashes`，保持现有 validate/status 运行时兼容，后台 UI/API 已在后续批次迁移到 per-secret 元数据模型。
- 2026-06-17：已新增 `adminSsoClientSecretService` 和共享响应类型，支持 secret 列表、生成带 label 的 secret、重命名、禁用/启用、撤销；响应只返回 hash 前缀和元数据，新 secret 明文仅创建时返回一次，并保护最后一个 active secret 不被禁用或撤销。
- 2026-06-17：secret 元数据底座已执行 `pnpm exec tsc --noEmit` 和 `pnpm lint`；TypeScript 通过，lint 无 error，仅剩既有 `onClick` deprecated warning。
- 2026-06-17：已新增 grant event 查询 repository/service 底座，支持按 client、user、event、actor、时间范围和 query 分页查询，并返回 client/user 摘要；左连接结果保留 nullable 语义，避免把合法 `last_login_at = null` 误判为用户缺失。
- 2026-06-17：grant event 查询底座已执行 `pnpm exec tsc --noEmit` 和 `pnpm lint`；TypeScript 通过，lint 无 error，仅剩既有 `onClick` deprecated warning。
- 2026-06-17：已为管理员撤销授权链路接入 audit 写入；全局单项撤销、client 详情单项撤销、用户详情单项撤销、按 client 批量撤销、按 user 批量撤销都会在成功删除 grant、撤销未消费 ticket、写 grant event、入队 `grant_revoked` callback 后写入 `account_audit_logs`。审计上下文通过 `getRequestAuditContext` 统一传入请求 IP 和 User-Agent，audit repository 只保存哈希，不保存原文。
- 2026-06-17：grant event 写入、查询 service、API route 与浏览器 helper 已完成；计划中“API/audit 接入待补”的旧描述已同步清理。

### 批次 2：管理员 API、SSR helper 与浏览器 helper

- [x] 新增 admin grants API routes。
- [x] 新增 client users API routes。
- [x] 新增 user grants API routes。
- [x] 新增 callback queue/history API routes。
- [x] 新增 ticket API routes。
- [x] 新增 audit log API route。
- [x] 新增 grant event API route。
- [x] 新增 per-secret API routes。
- [x] 为所有新增 route 接入 `checkAdminSsoClientRequest` 或等价 guard。
- [x] 明确浏览器侧页面默认通过 API route 请求列表、过滤、刷新、撤销、重试、清理和审计查询。
- [x] 在 `app/(pages)/admin/api.ts` 增加所有新增 route 的浏览器 helper。
- [x] 为需要 SSR 初始数据的页面新增或扩展 `server.ts` helper，直接复用 service/repository 读取首屏数据。
- [x] 确保 API route 与 SSR helper 共享 service、payload parser、错误码映射和安全 helper，不形成两套业务逻辑。
- [x] 不新增只有 Server Action 才能调用的 SSO 管理能力；若后续引入真正 Server Action，另列薄封装步骤并保持 API 等价。
- [x] 清理后台自用 `/api/v1/admin/sso/clients*` 中仅服务旧 UI 兼容的 `secret_hashes` / `generate_secret` 管理入口；公开 SSO 协议端点继续保留运行时兼容。

进度记录：

- 2026-06-17：已新增 `/api/v1/admin/sso/clients/[id]/users` 与 `/api/v1/admin/sso/clients/[id]/users/[userId]`，支持按 client 查询授权用户和管理员撤销单个授权。
- 2026-06-17：已新增 `/api/v1/admin/users/[id]/sso/grants` 与 `/api/v1/admin/users/[id]/sso/grants/[clientId]`，支持用户详情侧查询授权 client 和撤销单个授权。
- 2026-06-17：`checkAdminSsoClientRequest` 成功结果已携带管理员 auth，撤销授权事件可记录管理员 username 作为 actor；后续已接入浏览器 helper 和 SSR 首载。
- 2026-06-17：已在 `app/(pages)/admin/api.ts` 增加 client users、user grants 及两侧撤销授权的浏览器 helper；后续已补齐 callback/ticket/audit/secret helper。
- 2026-06-17：已新增 `/api/v1/admin/sso/clients/[id]/secrets` 与 `/api/v1/admin/sso/clients/[id]/secrets/[secretId]`，支持 secret 列表、生成、label 更新、启停和撤销；写操作均走 `checkAdminSsoClientRequest`、same-origin/rate limit/admin auth 和 CSRF。
- 2026-06-17：已在 `app/(pages)/admin/api.ts` 增加 per-secret 浏览器 helper；后台 client profile 改为返回 `active_secret_count`，不再向 UI/API 暴露完整 `secret_hashes`，client update body 也移除 `generate_secret` 和 `secret_hashes`。
- 2026-06-17：已拆分 `updateSsoClientConfig`，后台保存基础配置不再同步 `sso_client_secrets` 或覆盖 secret disabled/revoked 元数据；secret 变更仅通过 per-secret service/repository 入口执行。
- 2026-06-17：已新增 `/api/v1/admin/sso/grants` 与 `/api/v1/admin/sso/grants/[clientId]/[userId]`，支持全局授权关系列表和管理员从全局视角撤销单项授权；列表支持 page/page_size/query/client_id/client_status/user_id/user_status。
- 2026-06-17：已新增 `/api/v1/admin/sso/clients/[id]/grants` 的批量撤销 route，并为 `/api/v1/admin/users/[id]/sso/grants` 增加批量撤销 `DELETE`；两者均支持可选 reason、管理员 actor、CSRF 和现有 grant revoke service。
- 2026-06-17：已在 `app/(pages)/admin/api.ts` 增加全局 grants 查询、全局单项撤销、client 批量撤销、user 批量撤销的浏览器 helper；已执行 `pnpm exec tsc --noEmit`、`pnpm lint` 和 `git diff --check`，TypeScript/lint 通过，lint 仅剩既有 9 个 warning，diff check 仅提示 Windows LF/CRLF 换行转换。
- 2026-06-17：已新增 `/api/v1/admin/sso/callbacks/history`，支持 callback delivery 历史查询和按保留策略清理；写操作走 CSRF，查询支持 page/page_size/query/client_id/user_id/event/status/start_time/end_time。
- 2026-06-17：已新增 `/api/v1/admin/sso/tickets`，支持 ticket 生命周期查询、清理过期 ticket、按 client/user 撤销未消费 ticket；查询支持 page/page_size/query/client_id/user_id/status。
- 2026-06-17：已新增 `/api/v1/admin/audit-logs` 与 `/api/v1/admin/sso/grant-events`，分别支持结构化审计日志和授权事件历史查询；查询均走 admin guard 并复用现有 service/error map。
- 2026-06-17：已在 `app/(pages)/admin/api.ts` 增加 callback delivery history、ticket、audit log、grant event 的浏览器 helper；已执行 `pnpm exec tsc --noEmit`、`pnpm lint` 和 `git diff --check`，TypeScript/lint 通过，lint 仅剩既有 9 个 warning，diff check 仅提示 Windows LF/CRLF 换行转换。
- 2026-06-17：已新增 `/api/v1/admin/sso/callbacks`、`/api/v1/admin/sso/callbacks/[id]/retry` 与 `/api/v1/admin/sso/callbacks/[id]`，支持 callback queue 分页查询、管理员手动重试和丢弃；状态由 queue 现有字段派生为 `pending`、`retrying`、`final_failed`，重试不会覆盖未到期/疑似 worker lease 的记录。
- 2026-06-17：已在 `app/(pages)/admin/api.ts` 增加 callback queue list/retry/discard helper；已执行 `pnpm exec tsc --noEmit`、`pnpm lint` 和 `git diff --check`，TypeScript/lint 通过，lint 仅剩既有 9 个 warning，diff check 无输出。
- 2026-06-17：已复核新增 SSO 管理 route 均接入 `checkAdminSsoClientRequest` 或等价 guard，写操作均要求 CSRF；`app/(pages)/admin/api.ts` 覆盖 client、secret、grants、client users、user grants、callback queue/history、tickets、audit logs、grant events 等浏览器 API helper。
- 2026-06-17：已为 `/admin/sso` 与 `/admin/sso/[id]` 扩展 `server.ts` 首屏 helper，SSO client list/detail API route 与 SSR 首屏读取均复用 `adminSsoClientService`，页面不再直接调用底层 `sso` 模块；当前没有新增 Server Action-only 的 SSO 管理能力。

### 批次 3：client 详情授权管理

- [x] client 详情 SSR 读取授权用户第一页和统计。
- [x] `clientForm.tsx` 拆出授权用户 panel。
- [x] Secret 区改为 per-secret 元数据表格。
- [x] Secret 区支持生成、label 编辑、启停、撤销和刷新。
- [x] 授权用户 panel 支持分页、搜索、刷新。
- [x] 单用户撤销授权确认弹窗。
- [x] 批量撤销当前 client 授权确认弹窗。
- [x] 撤销成功后刷新 grants、ticket、callback、audit 摘要。
- [x] 为新增交互补 `trackEvent`。

进度记录：

- 2026-06-17：`clientForm.tsx` 已接入授权用户面板，浏览器侧通过新增 API helper 拉取 client 授权用户，支持分页、搜索、刷新和单用户撤销；后续已补齐二次确认弹窗、SSR 首载和批量撤销面板。
- 2026-06-17：已为授权用户刷新和撤销操作补充 `trackEvent`。
- 2026-06-17：已修正授权用户面板新增埋点的 action 类型，`pnpm exec tsc --noEmit` 通过；`pnpm lint` 当前无 error，仅剩既有 `onClick` deprecated warning。
- 2026-06-17：已按现有后台列表风格修正授权用户面板：搜索输入补图标和固定高度、表格行改用 `AdminTableRow`、撤销改为 Popover 二次确认、分页改用带页码输入/跳转/统计的通用 `AdminPagination`。
- 2026-06-17：已从后台整体视角抽取 `AdminBadge`、`AdminSsoClientStatusBadge`、`AdminEntityCell`、`AdminPanelToolbar`、`AdminTableActionLink`、`AdminTableCell`、`AdminTableHeadCell` 等共享 UI 基础件；`clientForm.tsx` 授权用户区域已开始复用统一 entity cell、状态 badge、工具栏、确认按钮和分页样式。
- 2026-06-17：`clientForm.tsx` 授权用户表已进一步替换为共享 `AdminTableCell` / `AdminTableHeadCell`，移除本地 grant table class 常量，新增 UI 与后台列表表格 spacing、nowrap 和操作列对齐方式一致。
- 2026-06-17：`clientForm.tsx` 的 secret 区已从完整 hash 列表改为 per-secret 元数据表格，仅展示 hash 前缀、label、状态、创建时间、最近使用时间；支持生成带备注的新 secret、blur 保存 label、启停、撤销和刷新，撤销保留二次确认。
- 2026-06-17：`/admin/sso` client 列表已改用 `active_secret_count` 展示和统计可用 secret 数，不再依赖后台 profile 返回完整 secret hash 数组。
- 2026-06-17：已扩展 `/admin/sso/[id]` SSR 首屏读取，登录管理员进入 client 详情时会通过 `server.ts` 复用 `adminSsoGrantService` 读取授权用户第一页；`clientForm.tsx` 初始数据增加 `clientUsers`。
- 2026-06-17：已将 client 详情授权用户区域拆为 `clientGrantPanel.tsx`，面板内维护搜索、分页、单项撤销、批量撤销和轻量运营摘要；`clientForm.tsx` 仅传入 admin、clientId、首屏 grants 和消息/未授权回调。
- 2026-06-17：`clientGrantPanel.tsx` 已接入“撤销全部授权”二次确认，调用既有 `revokeAdminSsoClientGrants` helper；单项和批量撤销成功后会刷新 grants，并刷新未消费 ticket、callback queue、SSO audit 摘要，相关刷新/撤销交互已补 `trackEvent`。

### 批次 4：用户详情授权管理

- [x] 用户详情 SSR 或 lazy action 读取该用户 SSO grants。
- [x] 用户详情页面增加 SSO 授权面板。
- [x] 支持从用户详情撤销某 client 授权。
- [x] 支持撤销该用户全部授权。
- [x] 用户禁用/删除操作后展示 callback 状态提示。
- [x] 为新增交互补 `trackEvent`。

进度记录：

- 2026-06-17：用户详情页已新增 SSO 授权面板，浏览器侧通过 `/api/v1/admin/users/[id]/sso/grants*` 拉取和撤销授权；后续已补齐 SSR 首载和撤销全部授权。
- 2026-06-17：用户详情页 SSO 授权刷新和撤销操作已补充 `trackEvent`，单项撤销复用现有确认弹窗。
- 2026-06-17：已修正用户详情 SSO 面板新增埋点的 action 类型，`pnpm exec tsc --noEmit` 通过；`pnpm lint` 当前无 error，仅剩既有 `onClick` deprecated warning。
- 2026-06-17：已按现有后台详情/列表风格修正用户详情 SSO 授权面板：搜索输入补图标和固定高度、client 状态改为一致的状态徽标、表格行改用 `AdminTableRow`、分页改用带页码输入/跳转/统计的通用 `AdminPagination`。
- 2026-06-17：已把危险操作确认按钮抽为共享 `AdminConfirmButton` 并替换用户详情和 SSO client 详情中的授权撤销/启停/删除确认；用户详情 SSO 授权区已复用 `AdminEntityCell`、`AdminSsoClientStatusBadge`、`AdminPanelToolbar` 和 `AdminPagination`。
- 2026-06-17：用户详情页的 SSO 授权表和命名空间表已统一使用 `AdminTableRow`、`AdminTableCell`、`AdminTableHeadCell`，避免详情页继续维护与列表页重复的 th/td class。
- 2026-06-17：用户详情 SSR 已复用 `adminSsoGrantService.listAdminSsoUserGrants` 读取 SSO grants 首屏第一页，并通过 `IAdminUserDetailInitialData.ssoGrants` 初始化客户端状态；无首屏数据时仍保留浏览器 lazy 读取。
- 2026-06-17：用户详情 SSO 授权面板已接入“撤销全部授权”二次确认，调用既有 `revokeAdminUserSsoGrants` helper；单项撤销、全部撤销和刷新均保留 `trackEvent`。
- 2026-06-17：用户禁用后会展示 SSO callback 状态提示，明确仍有授权且配置 callback 的客户端会入队 `user_disabled`，管理员可在 Callback 队列查看投递状态。

### 批次 5：全局 SSO 运营页

- [x] `/admin/sso/grants` 页面和导航入口。
- [x] `/admin/sso/callbacks` 页面和导航入口。
- [x] `/admin/sso/callbacks/history` 页面。
- [x] `/admin/sso/tickets` 页面。
- [x] `/admin/audit` 页面。
- [x] `/admin/sso` client 列表增加分页、搜索、过滤和运营指标。
- [x] 页面间保留返回列表和 query 状态。
- [x] 为全部新增页面加 loading/error/empty states。

进度记录：

- 2026-06-17：已系统化收敛现有后台列表 UI：`/admin` 用户列表、`/admin/sso` SSO client 列表、`/admin/announcements` 通知列表均改用共享 entity cell、table action link、table cell/head cell；用户列表和通知列表的本地分页实现已替换为共享 `AdminPagination`。
- 2026-06-17：后台通知表单的版本历史表也已改用共享 table cell/head cell；`AdminTableCell` 增加 `align="top"` 支持，保留原表格顶部对齐视觉而不再复制本地表格 class。
- 2026-06-17：已重新按页面结构复审后台 UI 一致性，而不是只依赖样式搜索；确认已共享的主干包括 `AdminShell`、`AdminHeader`、`AdminPanel`、`AdminTable*`、`AdminPagination`、`AdminConfirmButton`、`AdminMetricPanel`、`AdminSearchInput`、`adminTextareaClassNames`、`AdminHeaderActionLink` 等。
- 2026-06-17：已进一步统一现有后台与新增后台 UI：用户列表、SSO client 列表、通知列表、SSO client 表单、通知表单和用户详情页的 metric 容器、空值弱化文本、搜索输入、textarea 背景、Header 链接按钮均改为共享组件或共享 classNames；通知归档确认也复用 `AdminConfirmButton` 并支持 `confirmColor`。
- 2026-06-17：本轮复审仍发现后续可收敛点：根级 admin auth SSR helper、`AdminLoadingState` / `AdminErrorRetryState`、`AdminFilterPanel`、公告状态/等级 badge、`AdminSecretCallout` / `AdminCodeBlock`、`adminSelectClassNames` / `adminAutocompleteClassNames`；暂不建议抽通用表格列 DSL、CRUD 表单生成器或 metric 内容模型。
- 2026-06-17：已继续落地上述后台 UI 收敛项：新增 `AdminLoadingState`、`AdminErrorRetryState`、`AdminHeaderActionButton`、`AdminFilterPanel`、`AdminAnnouncementStatusBadge`、`AdminAnnouncementLevelBadge`、`AdminCodeBlock`；6 个后台认证加载分支、管理员会话错误重试、用户/通知筛选面板、通知状态/等级徽标、SSO secret/hash 展示均已切到共享实现。
- 2026-06-17：批次 5 已落地 `/admin/sso` 运营入口增强和 `/admin/sso/grants`、`/admin/sso/callbacks`、`/admin/sso/callbacks/history`、`/admin/sso/tickets`、`/admin/audit` 页面；各页接入分页、筛选、刷新、loading/error/empty 状态，并通过 URL 保留 page/query/filter，client 详情返回会带回列表 query 状态。新增 callback 管理 dispatch route/helper 支持管理员立即 dispatch 一批 callback；本轮已执行 `pnpm exec tsc --noEmit` 通过。
- 2026-06-17：批次 5 review 发现项已全部修复：callback delivery 手动清理现在会应用默认保留期和最大行数策略；`datetime-local` 筛选回填改为本地时间，避免刷新后时区偏移；SSO client 列表 `pending_callback_count` 改为仅统计 pending queue；callback queue/history/tickets 搜索补齐页面文案承诺的 id、错误和 redirect uri 字段。已执行 `pnpm exec tsc --noEmit` 与 `pnpm lint`，TypeScript 通过，lint 无 error，仅剩既有 9 个 `onClick` deprecated warning。

### 批次 6：外部事件补强

- [x] 扩展 callback event 类型和 DB check constraint。
- [x] 用户自助撤销授权入队 `grant_revoked`。
- [x] 管理员撤销授权入队 `grant_revoked`。
- [x] client 禁用入队 `client_disabled`。
- [x] client 删除改为软删除并入队 `client_deleted`。
- [x] secret 轮换或撤销入队 `secret_rotated`。
- [x] dispatch body 和验签文档补充新事件。
- [x] 外部服务接入文档补充幂等处理建议。

进度记录：

- 2026-06-17：批次 6 已完成外部 callback 事件补强：`TSsoCallbackEvent`、校验和 DB check constraint 覆盖 `grant_revoked`、`client_disabled`、`client_deleted`、`secret_rotated`；`sso_callback_queue` / delivery history 支持 `user_id = null` 和 `metadata_json`，用户级事件继续保留 `(client_id, user_id, event)` 唯一 upsert，client 级事件按 `(client_id, event)` 保留最新待处理记录。
- 2026-06-17：client 禁用、软删除、secret 创建/启用禁用/撤销均已入队对应 client 级事件；dispatch body 增加 `metadata` 且 `user_id` 可为 `null`，client 级事件允许在禁用或软删除后投递，callback 队列/历史 UI 已显示 client 级用户占位和 metadata。

### 批次 7：文档、验证和回归

- [x] 更新 SSO 外部服务接入文档。
- [x] 更新轻量 SSO 票据方案。
- [x] 更新验证清单。
- [x] 更新账号系统总纲状态。
- [ ] 补充单元或集成测试：迁移、grant 查询、撤销、callback、ticket、secret。（本轮按用户要求不新增/修改测试脚本。）
- [x] 执行 `pnpm exec tsc --noEmit`。
- [x] 执行 `pnpm lint`。
- [x] 执行 `pnpm run build`。
- [x] 执行 `pnpm run build:offline`。
- [ ] 手测管理员完整链路和外部 SSO validate/status/callback。

进度记录：

- 2026-06-17：`pnpm exec tsc --noEmit` 通过。
- 2026-06-17：`pnpm lint` 无 error；新增的 `app/(pages)/admin/sso/[id]/page.tsx` searchParams 类型收窄 warning 已修复，当前仅剩 9 个既有 `onClick` deprecated warning，未纳入本计划改动范围。
- 2026-06-17：阶段 7 文档已同步更新：SSO 外部服务接入文档覆盖新 callback 事件、nullable `user_id`、`metadata`、secret 轮换、幂等建议和联调清单；轻量 SSO 方案补齐 ticket 撤销字段、per-secret 元数据表、client 软删除、callback 签名来源和 callback 队列模型；验证清单补充 SSO 管理、callback、ticket、secret、audit 和 offline 构建回归矩阵；账号系统总纲已登记 SSO 管理补全批次 0-6 已落地，阶段 7 已完成文档、build 和 offline build 收口，仍待完整手测。
- 2026-06-17：本轮按用户要求跳过新增或修改测试脚本，测试脚本项保持未完成；已执行 `git diff --check`，无空白错误，仅有 Windows LF/CRLF 换行提示。
- 2026-06-17：已执行 `pnpm run build`，生产构建通过；仅出现既有 Sass `@import` deprecation warning 和既有 lint warning。
- 2026-06-17：已执行 `pnpm run build:offline`，离线导出构建通过；该脚本跳过类型和 lint 校验，仅出现既有 Sass `@import` deprecation warning。
- 2026-06-17：复审收口阶段再次执行 `pnpm build` 和 `pnpm build:offline` 均通过；离线构建路由表不包含 `/admin`，仅包含普通静态/SSG 页面和 `/sso/authorize` 离线兜底页。一次中间失败命中 `.next` 残留 `/admin/announcements` 清单，复核 `--prepare` 确认后台页/API route 会被移走后重跑通过；源码树已恢复且无 `app/_offline_pages` / `app/_api` 残留。
- 2026-06-17：新增授权 UI 对齐现有后台风格后，已再次执行 `pnpm exec tsc --noEmit` 和 `pnpm lint`；TypeScript 通过，lint 无 error，仅剩上述既有 warning。
- 2026-06-17：批次 1 ticket 管理底座完成后，已再次执行 `pnpm exec tsc --noEmit` 和 `pnpm lint`；TypeScript 通过，lint 无 error，仅剩上述既有 warning。
- 2026-06-17：批次 1 audit repository/service 底座完成后，已再次执行 `pnpm exec tsc --noEmit` 和 `pnpm lint`；TypeScript 通过，lint 无 error，仅剩上述既有 warning。
- 2026-06-17：批次 1 callback delivery 有界历史完成后，已再次执行 `pnpm exec tsc --noEmit` 和 `pnpm lint`；TypeScript 通过，lint 无 error，仅剩上述既有 warning。
- 2026-06-17：批次 1 secret 元数据 repository/service 底座完成后，已再次执行 `pnpm exec tsc --noEmit` 和 `pnpm lint`；TypeScript 通过，lint 无 error，仅剩上述既有 warning。
- 2026-06-17：批次 1 grant event 查询 repository/service 底座完成后，已再次执行 `pnpm exec tsc --noEmit` 和 `pnpm lint`；TypeScript 通过，lint 无 error，仅剩上述既有 warning。
- 2026-06-17：后台共享 UI 基础件抽取和 `/admin`、`/admin/sso`、`/admin/announcements` 列表替换后，已执行 `pnpm exec tsc --noEmit` 和 `pnpm lint`；TypeScript 通过，lint 无 error，仅剩既有 9 个 `onClick` deprecated warning。`git diff --check` 仅提示 Windows LF/CRLF 换行转换。
- 2026-06-17：后台 UI 一致性复审和第二批共享件落地后，已执行 `pnpm exec tsc --noEmit`、`pnpm lint` 和针对后台相关文件的 `git diff --check`；TypeScript 通过，lint 无 error，仅剩既有 9 个 `onClick` deprecated warning，diff check 无输出。
- 2026-06-17：继续抽取 `AdminLoadingState`、`AdminFilterPanel`、公告 badge 和 `AdminCodeBlock` 后，已执行 `pnpm exec tsc --noEmit`、`pnpm lint` 和针对本轮后台文件的 `git diff --check`；TypeScript 通过，lint 无 error，仅剩既有 9 个 `onClick` deprecated warning；diff check 仅提示 Windows LF/CRLF 换行转换。
- 2026-06-17：per-secret API/helper/UI 闭环和后台旧 `secret_hashes` / `generate_secret` 管理入口清理后，已执行 `pnpm exec tsc --noEmit`、`pnpm lint` 和 `git diff --check`；TypeScript 通过，lint 无 error，仅剩既有 9 个 `onClick` deprecated warning；diff check 仅提示 Windows LF/CRLF 换行转换。
- 2026-06-17：全局 grants API/helper 和 client/user 批量撤销 API/helper 落地后，已执行 `pnpm exec tsc --noEmit`、`pnpm lint` 和 `git diff --check`；TypeScript 通过，lint 无 error，仅剩既有 9 个 `onClick` deprecated warning；diff check 仅提示 Windows LF/CRLF 换行转换。

## 十二、验收矩阵

| 场景                       | 验收点                                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 管理员查看 client 授权用户 | 可分页搜索，用户状态正确，授权时间正确                                                                                             |
| 管理员撤销单个授权         | grant 删除，未消费 ticket 撤销，grant event/audit 写入，必要 callback 入队                                                         |
| 管理员批量撤销授权         | 影响数量准确，失败项可见，不因单项失败中断全部反馈                                                                                 |
| 用户详情查看授权           | 用户详情能看到全部授权 client，并可撤销                                                                                            |
| 外部 validate              | 首次授权写 `grant_created`，重复授权写 `grant_refreshed`，secret last_used_at 更新                                                 |
| 外部 status                | 无授权、撤销授权或用户不存在返回 404 `user-not-found`，禁用/删除用户返回既有 403 错误，审计无敏感值                                |
| callback 队列              | pending/failed/final failed 可查，可手动重试和丢弃                                                                                 |
| callback 历史              | 成功投递后仍可查历史，失败原因安全截断                                                                                             |
| ticket 管理                | 未消费、已消费、过期、撤销状态准确，过期清理幂等                                                                                   |
| secret 管理                | 新 secret 只显示一次；hash、label、last_used_at 可查；禁用/撤销立即影响 validate/status                                            |
| client 软删除              | 公开协议不可再使用；历史、审计、callback 投递仍可追踪                                                                              |
| 审计日志                   | audit 查询底座可按 scope/action/actor/target/time 搜索；grant revoke 管理员链路已写入；写入后会按保留期和最大行数 best-effort 清理 |
| 禁用环境                   | 账号功能关闭时新增 admin SSO 能力不加载 SQLite，不破坏构建                                                                         |
| 离线构建                   | offline 页面不引入 server-only SSO 管理代码                                                                                        |

## 十三、回滚边界

- 数据迁移必须向前兼容：新增表和列不影响旧代码读取现有 `sso_clients`、`sso_tickets`、`sso_user_client_grants`。
- secret 表迁移期间保留 `secret_hashes` fallback；完成验证后再考虑删除旧字段使用。
- client 删除先软删除，避免一键物理删除造成授权、callback 和审计不可追踪。
- 新增 callback event 后，如果外部服务暂未支持，仍必须通过事件名幂等忽略，不影响既有 `user_deleted`、`user_disabled`。
- 审计表已加入保留策略；默认保留 365 天且最多保留最近 100000 条，写入后低频 best-effort 清理，避免影响主流程。

## 十四、风险与约束

| 风险                                   | 处理方式                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| secret 元数据迁移影响 validate/status  | 保留 JSON fallback，迁移后双读验证，最终切主读 secret 表                                    |
| 授权撤销 callback 导致外部服务重复处理 | event body 带 timestamp 和 stable event key，文档要求幂等                                   |
| 全局审计记录过多                       | 先记录管理员写操作和异常，validate/status 成功可按配置采样或只写统计；接入前补清理/归档策略 |
| callback 历史无限膨胀                  | dispatch 只记录真实投递尝试，默认保留 30 天且最多 10000 条，并提供管理员清理 service        |
| callback 历史保存敏感错误              | error 截断并清洗，禁止保存 request secret/header/body 明文                                  |
| ticket 观测泄漏登录能力                | 只展示 HMAC 摘要和元数据，不展示原 ticket、code_verifier 或 code_challenge 全值             |
| 批量撤销误操作                         | 需要二次确认、显示影响数量、写 audit，必要时要求输入 client id 或 username                  |
| 软删除改变现有删除语义                 | API `DELETE` 返回仍兼容 `sso-client-deleted`，内部改为 `deleted_at`；物理清理另设维护动作   |
