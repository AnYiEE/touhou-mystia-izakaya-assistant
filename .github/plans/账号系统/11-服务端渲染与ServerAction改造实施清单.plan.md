---
name: 账号系统服务端渲染与 Server Action 改造实施清单
overview: 将账号系统服务端化审查结论拆成可执行批次，明确每批修改范围、安全前置、保留 API、验证方式和回滚边界。
isProject: false
---

# 账号系统服务端渲染与 Server Action 改造实施清单

> 日期：2026-06-12
> 基准审查：[10-服务端渲染与ServerAction改造审查.plan.md](10-服务端渲染与ServerAction改造审查.plan.md)
> 范围：账号系统、管理员后台、SSO 管理页、普通账号低耦合流程。

## 一、执行原则

- 先迁移管理员后台首载和后台操作，再迁移 SSO 管理页，最后评估普通账号弹窗的低耦合项。
- 每批只处理一个页面族或一类 action；不在同一批同时改同步客户端、普通账号弹窗和管理员后台。
- Server Action 不直接绕过 route handler 的安全语义；迁移前先抽可复用 server helper，保证 feature gate、cookie security、same-origin、rate limit、管理员 session、CSRF 仍有等价约束。
- 现有外部协议 API 继续保留：`/api/v1/sync/state`、`/api/v1/sync/ping`、`/api/v1/sso/*`。
- Legacy backups API 继续保留：`/api/v1/backups*` 不属于本次账号系统主迁移对象，但旧备份码导入依赖其 DB、文件和 cleanup 语义。
- 任何涉及 session cookie 写入的 action，都必须明确 cookie `secure` 计算来源，不能伪造 `NextRequest` 静默复用 route helper。

## 二、批次总览

| 批次 | 目标                               | 主要文件                                                                                    | 完成判定                                                                                                                                  |
| ---- | ---------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | 抽取服务端复用 helper              | `app/lib/account/server/*`、`app/api/v1/*/utils.ts`                                         | route handler 行为不变，服务器组件和 action 可复用同一套鉴权/CSRF/限流语义                                                                |
| 1    | 管理员首页 SSR                     | `app/(pages)/admin/page.tsx`、新增后台客户端子组件                                          | 首屏服务端读取管理员状态和用户列表，不再依赖 `fetchAdminMe` + `listAdminUsers` 后置请求                                                   |
| 2    | 管理员用户详情 action 化           | `app/(pages)/admin/users/[id]/page.tsx`、后台 action 模块                                   | 用户详情服务端加载；重置密码、启用、禁用、恢复、清数据、踢会话使用 Server Action                                                          |
| 3    | SSO 客户端列表和表单 SSR/action 化 | `admin/sso/page.tsx`、`admin/sso/[id]/page.tsx`、`admin/sso/new/page.tsx`、`clientForm.tsx` | 列表和详情首载服务端读取；创建、更新、删除、生成 secret 使用 Server Action                                                                |
| 4    | 普通账号低耦合流程                 | `accountManager.tsx`、账号 action/helper                                                    | 授权应用列表、认证会话操作、账号数据导出/清空/删除、账号 bootstrap/me 刷新已 action 化；动态账号页可预读 initial grants；同步运行时不移动 |
| 5    | 回归和 API 收口                    | `app/lib/account/client/api.ts`、`07-验证清单与发布回归.plan.md`                            | 删除已无调用的后台和普通认证 fetch 封装，保留 sync/SSO/legacy/外部 API，关键手测和构建通过                                                |

## 三、批次 0：服务端复用 helper

### 修改范围

- 新增或整理账号系统内部 server helper，用于服务器组件和 Server Action 读取管理员状态、普通账号状态、CSRF 绑定和请求上下文。
- 将 route handler 中和 `NextRequest` 强绑定的逻辑拆成两层：
    - 纯安全判断：feature gate、管理员开关、cookie secure 策略、CSRF token 绑定、rate limit key 计算。
    - route 适配层：从 `NextRequest` 读取 header、cookie、origin、IP 和 body。
- 保留现有 route utils 作为 API route 的入口适配层。

### 需要复用的现有能力

| 能力                     | 现有位置                                                                                                                                   | 使用要求                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| 账号功能门禁和 DB 懒加载 | `app/lib/account/server/environment.ts`、`app/lib/account/server/db.ts`                                                                    | Server Action 也必须先检查账号功能状态和 DB 可用性              |
| 普通账号 session/CSRF    | `app/lib/account/server/auth.ts`                                                                                                           | 迁移普通账号流程时继续使用 session token hash 绑定 CSRF         |
| 管理员 session/CSRF      | `app/lib/account/server/admin.ts`                                                                                                          | 后台 action 继续使用管理员 session token 绑定 CSRF              |
| route 安全语义           | `app/lib/account/server/routeResponses.ts`、`app/lib/account/server/adminRouteResponses.ts`、`app/lib/account/server/ssoRouteResponses.ts` | action helper 要保留等价语义，不直接调用数据访问函数后返回      |
| 数据访问                 | `app/lib/account/server/repositories/users.ts`、`sessions.ts`、`credentials.ts`、`userState.ts`、`sso.ts`                                  | 服务器组件和 action 优先复用这些模块，不从客户端 API 反向 fetch |

### 验收

- 现有 `auth`、`account`、`sync`、`admin`、`sso` route 响应码和错误码不因 helper 抽取变化。
- 账号禁用、自托管、Vercel、`OFFLINE=true` 场景仍符合原门禁。
- 没有在服务器组件中引入 `app/lib/account/client/*`。
- 没有在客户端组件中静态引入 `better-sqlite3`、`argon2` 或账号 server DB 模块。

## 四、批次 1：管理员首页 SSR

### 修改范围

- 将 `app/(pages)/admin/page.tsx` 改为服务器组件。
- 抽出小型客户端组件承载登录表单、筛选输入、防抖跳转、刷新按钮和下拉选择。
- 服务器组件从 `searchParams` 解析 `page`、`query`、`status`，服务端读取管理员会话和用户列表。
- 管理员登录/退出提供 Server Action，成功后 `redirect` 或 `revalidatePath('/admin')`。

### 迁移步骤

1. 定义后台页面服务端结果类型：`unauthenticated`、`authenticated`、`feature-disabled`、`error`。
2. 服务器组件读取管理员 session；未登录时直接渲染登录面板，不再先显示“读取会话状态”。
3. 已登录时调用 `listUsers` 读取用户列表，并把分页、筛选和管理员 CSRF 传给客户端子组件。
4. 登录 action 复用管理员凭据校验和 session cookie 写入逻辑；失败返回稳定错误消息。
5. 退出 action 校验管理员 session 和 CSRF，清理管理员 session cookie。
6. 删除页面内 `fetchAdminMe`、`listAdminUsers`、`loginAdmin`、`logoutAdmin` 的直接调用。

### 保留点

- 筛选输入和分页仍可以通过 URL query 驱动，避免在客户端保存重复列表状态。
- `trackEvent` 若仍需要浏览器事件，只放在客户端交互组件。
- 管理员 API route 暂时保留，直到后台页面和外部调用确认无依赖。

### 验收

- 未登录访问 `/admin` 时首屏直接显示登录面板。
- 已登录访问 `/admin` 时 HTML 首屏包含用户指标和列表数据。
- 改变 `page`、`query`、`status` 后 URL 与服务端列表结果一致。
- 登录、退出后 cookie 状态正确，刷新页面不出现旧客户端 loading 闪烁。

## 五、批次 2：管理员用户详情 action 化

### 修改范围

- 将 `app/(pages)/admin/users/[id]/page.tsx` 改为服务器组件。
- 抽出客户端操作面板，保留密码输入、确认 popover、按钮 loading 和消息展示。
- 新增后台用户操作 Server Action：重置密码、启用、禁用、恢复、清空云端数据、删除 session。

### 迁移步骤

1. 服务器组件解析 `params.id` 和返回列表所需的 `searchParams`。
2. 服务端校验管理员会话后读取 `fetchAdminUser` 等价详情数据，直接渲染 namespace 摘要、session 数和状态。
3. 每个 action 先做管理员功能门禁、管理员 session、CSRF、rate limit，再调用现有数据访问函数。
4. 重置密码 action 复用 `PASSWORD_RULE_DESCRIPTION` 和 `checkPasswordPolicy` 的规则。
5. 清空云端数据 action 必须保留 SSO callback 入队逻辑和 `state_epoch` 递增。
6. action 成功后 `revalidatePath` 当前详情页和 `/admin` 列表页。

### 保留点

- 二次确认交互继续在客户端组件内处理。
- 明文新密码只存在于当前 action 请求和客户端输入框，不写 URL、日志或缓存。
- 已删除用户的恢复、启用、禁用限制保持和现有 API 一致。

### 验收

- 刷新详情页时不再先请求 `fetchAdminMe` 和 `fetchAdminUser` 才显示数据。
- 六类管理员操作成功后详情页数据刷新。
- 错误码语义保持：`target-user-not-found`、`invalid-user-status`、`update-not-applied`、`credential-not-found` 等不被吞成泛化错误。
- 管理员清空用户云端数据后，用户旧 session 失效，重新登录不会自动重传旧本地快照。

## 六、批次 3：SSO 客户端管理 SSR/action 化

> 状态：已完成。`/admin/sso`、`/admin/sso/[id]`、`/admin/sso/new` 已完成首载 SSR；创建、保存、生成 secret、启用/禁用、删除已迁移到页面专用 Server Actions。外部 `/api/v1/admin/sso/*` 协议端点仍保留。

### 修改范围

- 已将 `app/(pages)/admin/sso/page.tsx` 改为服务器组件，并新增 `app/(pages)/admin/sso/client.tsx` 承载列表刷新和浏览器交互。
- 已新增 `app/(pages)/admin/sso/server.ts`，复用账号功能门禁、管理员开关、`createCurrentRequest`、cookie security、管理员 session 和 CSRF 生成。
- `admin/sso/[id]/page.tsx` 已服务端读取目标客户端 public profile，`admin/sso/new/page.tsx` 已服务端读取管理员状态和 CSRF。
- `clientForm.tsx` 已接收 SSR initial data，并跳过首轮重复 `fetchAdminMe` / `fetchAdminSsoClient`；后续 GET fallback 保留。
- 已新增 `app/(pages)/admin/sso/actions.ts`，创建、更新、生成 secret、启用/禁用、删除均使用 Server Action。
- 已将 SSO client payload 解析抽到 `app/lib/account/server/adminSsoClientPayload.ts`，`app/api/v1/admin/sso/clients/utils.ts` 继续 re-export，保持 API route 使用原导入路径。

### 迁移步骤

1. 已完成：SSO 客户端列表页服务端校验管理员会话并调用 `listSsoClients`，结果经 `createSsoClientPublicProfile` 下发。
2. 已完成：编辑页服务端读取目标客户端，未找到时以 `sso-client-not-found` 进入现有错误 UI；客户端重试仍可走 GET fallback。
3. 已完成：创建 action 调用 `createSsoClient`，只在 action success data 中带一次性 `client_secret`。
4. 已完成：更新 action 调用 `updateSsoClient`，生成 secret 时一次性返回新 secret。
5. 已完成：删除 action 调用 `deleteSsoClient`，客户端成功后 `router.replace('/admin/sso')`。
6. 已完成：复制 secret 继续保留浏览器 Clipboard API 和 fallback。
7. 已完成：Server Action guard 覆盖 feature gate、管理员开关、same-origin、cookie security、rate limit、管理员 session 和 CSRF。
8. 已完成：复审后加固 action 直接调用边界，payload parser 接收 `unknown` 并对非对象返回 `invalid-object-structure`；update/toggle 在应用 override 后重新用最终 `secret_hashes` 校验配置，避免 `generate_secret` 与空 secret hash 组合写坏客户端配置。
9. 已完成：运行时加载边界收敛，SSO client API routes 和 Server Actions 先完成管理员 guard，再动态加载 payload parser 与 `adminSsoClientService`；`adminSsoClientService` 静态依赖轻量 `ssoValidation.ts`，读取具体 client 时再动态加载 `sso.ts`。

### 保留点

- `client_secret` 不写入 URL、server cache、日志或持久化页面 props，只在创建/生成 secret 的 action 成功结果中返回一次。
- 表单中的多行 URI parse/normalize 继续作为客户端纯函数，提交后由 action 复用服务端 payload parser 校验。
- 外部协议端点 `/api/v1/sso/authorize`、`validate`、`status`、`dispatch-callbacks` 不参与删除或合并。
- 管理端外部 API 继续保留：`GET/POST /api/v1/admin/sso/clients`、`GET/PUT/DELETE /api/v1/admin/sso/clients/[id]` 仍在构建路由表中。
- `app/lib/account/client/api.ts` 的 SSO admin GET helper 暂时保留，用于客户端刷新 fallback；mutation helper 虽已不被 SSO 表单调用，但需在批次 5 统一清理前再确认无其它调用方。

### 验收

- 已验证：`/admin/sso`、`/admin/sso/[id]`、`/admin/sso/new` 在 `pnpm build` 路由表中均为 dynamic SSR。
- 已验证：`/api/v1/admin/sso/clients`、`/api/v1/admin/sso/clients/[id]` 在 `pnpm build` 路由表中保留。
- 已验证：`pnpm exec tsc --noEmit` 通过。
- 已验证：`pnpm lint` 通过，仅保留既有 9 个 `onClick` deprecated warning。
- 已验证：`pnpm build` 通过，仅保留既有 Sass `@import` deprecation warning 和既有 `onClick` deprecated warning。
- 待手测：新建、更新、禁用/启用、生成 secret、删除流程成功后列表和详情刷新一致。
- 待手测：生成的新 secret 只展示一次，刷新后不可再次读出明文。
- 待手测：外部 SSO 授权、验证、状态查询和 callback dispatch 仍通过现有 API 完成。

## 七、批次 4：普通账号低耦合流程

> 状态：已完成本批低耦合目标。已完成普通账号 SSO 授权应用列表刷新和撤销授权的 Server Action 化；普通账号登录、注册、改密、退出当前设备、退出全部设备、导出账号数据、清空云端数据、删除账号、`account/me` 状态刷新、主动同步 state 读写和旧备份码导入也已迁移到 Server Actions。外部 `/api/v1/account/sso/grants*`、`/api/v1/auth/*`、`/api/v1/account/me`、`/api/v1/account/export`、`/api/v1/account/delete-data`、`/api/v1/account/delete`、`/api/v1/sync/state`、`/api/v1/sync/import-backup-code` 协议端点均保留。账号管理面板仍由全局 `AccountModal` 客户端挂载；已在动态账号场景 `/sso/authorize` 中局部预读 initial grants 并通过共享 store 喂给账号弹窗，避免根布局读取账号 cookie 导致首页、资料页和设置页退化为动态渲染。

### 修改范围

- 已优先处理 `app/lib/account/client/components/accountManager.tsx` 中和同步运行时耦合较低的授权应用列表。
- 已新增 `app/lib/account/actions/ssoGrants.ts`，提供普通账号授权列表刷新和撤销授权 Server Actions。
- 已新增 `app/lib/account/actions/auth.ts`，提供普通账号登录、注册、改密、退出当前设备、退出全部设备 Server Actions。
- 已新增 `app/lib/account/actions/utils.ts`，统一普通账号 Server Action 的 result envelope、错误构造、JSON body stringify 与字节上限校验。
- 已在同一 action 模块中提供账号数据导出、清空云端数据和删除账号 Server Actions；客户端下载 JSON、本地 sync 状态修正和 BroadcastChannel 广播仍保留在 `AccountManager`。
- 已在同一 action 模块中提供 `fetchAccountMeAction`，让 `refreshAccountState` 和 bootstrap 状态刷新不再浏览器 fetch `/api/v1/account/me`；旧备份码导入和本地数据接管仍保留在客户端 session 流程中。
- 已新增 `app/lib/account/actions/sync.ts`，让站内主动 `fetchSyncState`、`putSyncState` 和 `importBackupCode` 客户端 helper 走 Server Actions，并复用现有 `/api/v1/sync/state` 与 `/api/v1/sync/import-backup-code` route handler 响应语义。
- 已在 `next.config.ts` 配置 `serverActions.bodySizeLimit = SERVER_ACTION_BODY_SIZE_LIMIT`，避免主动同步 state 上传和站内 legacy 备份上传在进入业务层 byte limit 校验前被 Next 默认 Server Action body 上限提前拦截；具体值由 `app/lib/account/shared/requestLimits.ts` 基于 `max(MAX_BACKUP_UPLOAD_JSON_BODY_BYTES, MAX_SYNC_JSON_BODY_BYTES) + 2MiB` 余量推导，当前为 `13mb`。
- 已新增 `app/lib/account/server/initialData.ts` 和 `app/lib/account/client/components/accountSsoGrantInitialDataHydrator.tsx`，让动态账号页面可服务端预读 grants，再由客户端账号弹窗按当前 `user.id` 消费。
- 已新增 `app/lib/account/client/components/accountInitialStateHydrator.tsx`，让动态 `/sso/authorize` 页面可服务端注入当前账号首态；登录要求、强制改密和已登录确认页不再完全等待全局客户端 bootstrap 才更新账号弹窗状态。
- 同步运行时、旧备份码导入后的本地接管、dirty queue、lease、BroadcastChannel、sendBeacon 仍保留浏览器协调层；本批只迁移可由服务端承接的账号数据读写边界。

### 迁移步骤

1. 已完成：为账号授权应用列表提供 Server Action 刷新能力，复用账号功能门禁、same-origin、cookie security、普通账号 session 和限流。
2. 已完成：撤销授权提供 Server Action，保留账号 session、CSRF、限流和账号功能门禁，错误码对齐现有 API：`invalid-object-structure`、`forbidden`、`sso-grant-not-found`。
3. 已完成：`/sso/authorize` 在已登录且无需强制改密时服务端读取当前用户 grants，并通过 `AccountSsoGrantInitialDataHydrator` 写入 `accountStore.shared.ssoGrantInitialData`；`AccountManager` 仅在 initial data 的 `user_id` 与客户端已确认账号一致时使用，并立即清除该临时数据。
4. 已验证并避免：不在根 layout 读取账号 cookie，防止普通静态资料页从 SSG 退化为动态渲染。
5. 已完成：登录/注册 action 复用账号功能门禁、same-origin、cookie security、用户名/密码策略、登录/注册限流、密码校验成本、账号状态判断、session cookie 写入和 SSO context 检测；成功后客户端更新 `accountStore`，若存在 SSO context 则按 action 返回的 `redirect_to` 回到 `/sso/authorize`。
6. 已完成：改密 action 复用普通账号 session、CSRF、限流、密码策略、凭据锁定和当前 session 保留语义；强制改密弹窗和账号管理面板均改用该 action。
7. 已完成：退出当前设备和退出全部设备在客户端完成 `flushAccountSyncQueueUntilIdle` 后再调用 Server Action；action 保留普通账号 session、限流、CSRF、session 删除和 session cookie 清理语义。
8. 已完成：账号数据导出 action 保留普通账号 session 和 `account-export` 限流；客户端仍在 flush 成功后下载 JSON。
9. 已完成：清空云端数据 action 保留普通账号 session、`account-delete-data` 限流、CSRF、`state_epoch` 递增和 legacy import record 清理；客户端仍负责本地保留 dirty 修正和跨标签页广播。
10. 已完成：删除账号 action 保留普通账号 session、`account-delete` 限流、CSRF、用户逻辑删除、session 删除、SSO callback 入队和 session cookie 清理；客户端成功后清空本地账号状态。
11. 已完成：`account/me` action 保留普通账号功能门禁、same-origin、cookie security、允许强制改密状态读取、未登录返回匿名状态的语义；客户端 `refreshAccountState` 继续负责 legacy code 自动导入、本地数据接管和 sync flush 调度。
12. 已完成：主动同步 state 读取和上传改走 `fetchSyncStateAction`、`putSyncStateAction`，客户端 helper 继续抛出 `AccountApiError`，让 dirty queue、冲突处理和 `state_epoch` mismatch 分支保持原有行为。
13. 已完成：旧备份码导入网络层改走 `importBackupCodeAction`，但导入后的本地 `cloudCode` 清理、本地数据接管、sync meta 修正和后续同步仍由客户端流程完成。
14. 已完成：Server Action body 上限显式提升到 `SERVER_ACTION_BODY_SIZE_LIMIT`（当前 `13mb`），覆盖现有 `MAX_SYNC_JSON_BODY_BYTES`、`MAX_BACKUP_UPLOAD_JSON_BODY_BYTES` 和 action 传输开销；超出业务上限仍由对应业务层返回 `payload-too-large`。
15. 已完成：`/sso/authorize` 在未登录、强制改密和已登录授权确认分支中注入账号首态；该注入只作用于动态授权页，不放入根 layout，避免首页、资料页、设置页等静态页面退化为动态渲染。
16. 已完成：普通账号 SSO grants initial data、授权应用 action 和外部 grants routes 不再顶层静态加载 `app/lib/account/server/sso.ts`；client id 格式校验改走轻量 `ssoValidation.ts`，列表读取在 guard 通过后动态加载 `sso.ts`。
17. 已完成：legacy backup route/action 先用轻量 `legacyBackupCode.ts` 校验 UUID code，再动态加载 `legacyBackup.ts` 执行上传、下载、metadata 和删除逻辑。

### 保留点

- `app/lib/account/client/bootstrap.ts` 的在线/聚焦重试保留。
- `app/lib/account/client/syncClient.ts` 完整保留。
- `GET/PUT /api/v1/sync/state`、`POST /api/v1/sync/import-backup-code`、`POST /api/v1/sync/ping` 完整保留。
- `sendSyncPing` 和 `/api/v1/sync/ping` 继续使用浏览器 `navigator.sendBeacon`，页面隐藏或关闭时不能改成 Server Action。
- 旧备份码导入已经抽成 Server Action，但必须保留客户端本地状态修正和 sync meta 协调。
- 全局账号 bootstrap 继续由 `AccountFeatureModals` / `startAccountFeatureClients` 在客户端启动；它依赖 localStorage、跨标签页、dirty queue 和本地接管，不应放进根 layout 读取账号 cookie。
- 外部普通认证 API 继续保留：`POST /api/v1/auth/login`、`register`、`change-password`、`logout`、`logout-all` 仍可被直接调用。
- 外部普通账号状态 API 继续保留：`GET /api/v1/account/me` 仍可被直接调用。
- 外部普通账号数据 API 继续保留：`GET /api/v1/account/export`、`DELETE /api/v1/account/delete-data`、`DELETE /api/v1/account/delete` 仍可被直接调用。

### 验收

- 已验证：授权应用列表刷新、撤销授权调用走 Server Action，外部 `/api/v1/account/sso/grants*` 仍在 `pnpm build` 路由表中，可直接调用。
- 已验证：`/sso/authorize` 保持 dynamic SSR；首页、资料页、设置页在 `pnpm build` 路由表中仍保持静态/SSG，没有因账号 initial data 退化为全站动态。
- 已验证：`/sso/authorize` 可局部注入账号首态；强制改密和账号弹窗状态不再完全依赖全局 bootstrap 后置请求。
- 登录/注册后本地数据接管不退化。
- 改密后强制改密弹窗状态正确。
- 退出前同步 flush 行为不变。
- 外部 `/api/v1/auth/*` 仍保持原有响应结构、错误码、cookie 写入和 SSO redirect 行为；站内账号弹窗改用 Server Actions 不影响直接 API 调用方。
- 外部 `/api/v1/account/export`、`/api/v1/account/delete-data`、`/api/v1/account/delete` 仍保持原有鉴权、CSRF、限流、错误码、JSON 响应结构和 cookie 行为；站内账号弹窗改用 Server Actions 不影响直接 API 调用方。
- 外部 `/api/v1/account/me` 仍保持原有匿名返回、强制改密状态返回、错误码和 JSON 响应结构；站内 bootstrap 改用 Server Action 不影响直接 API 调用方。
- 站内主动 `fetchSyncState`、`putSyncState` 和 `importBackupCode` helper 走 Server Actions；外部 `/api/v1/sync/state` 和 `/api/v1/sync/import-backup-code` 仍保持原有鉴权、CSRF、限流、错误码、JSON 响应结构和 no-store 行为。
- 多标签页、断网恢复和页面关闭 ping 行为不变。

## 八、批次 5：回归和 API 收口

> 状态：已完成。已删除普通账号 SSO grants、普通账号认证、普通账号数据操作、普通账号 me 刷新、普通账号主动同步 state 读写、旧备份码导入、管理员用户详情、SSO 管理和管理员首页中无调用方的客户端 fetch 封装；后台登录/退出、用户列表刷新、管理员状态检查、SSO 列表刷新、SSO 详情刷新以及普通账号认证/数据操作/bootstrap/主动同步状态刷新已改走页面内部或账号共享 Server Actions。管理员后台代码已从 `app/(pages)/(layout)/admin` 移到 `app/(pages)/admin`，URL 仍为 `/admin*`。legacy 云备份设置页 helper 已改走账号共享 Server Actions 包装，外部 `/api/v1/*` 路由未删除。

### 修改范围

- 已清理 `app/lib/account/client/api.ts` 中已经没有调用方的普通账号 grants、管理员用户详情 mutation、SSO 管理 mutation fetch 封装。
- 已清理 `app/lib/account/client/api.ts` 中已经没有调用方的普通账号登录、注册、改密、退出当前设备、退出全部设备 fetch 封装。
- 已清理 `app/lib/account/client/api.ts` 中已经没有调用方的账号数据导出、清空云端数据、删除账号 fetch 封装。
- 已清理 `app/lib/account/client/api.ts` 中已经没有调用方的 `fetchAccountMe` fetch 封装。
- 已将 `app/lib/account/client/api.ts` 中保留给 sync runtime 使用的 `fetchSyncState`、`putSyncState` 和 `importBackupCode` helper 改为调用 `app/lib/account/actions/sync.ts`，只保留 `sendSyncPing` 的浏览器 `sendBeacon` 协议实现。
- 已将站内 legacy 云备份客户端 facade 收口到 `app/lib/account/client/legacyBackups.ts`，`app/(pages)/preferences/dataManager.tsx` 只作为设置页消费者引用账号客户端 facade。
- 已将 `Retry-After` header helper 移到通用 [app/lib/api/http.ts](../../../app/lib/api/http.ts)，SSO route helper、账号 guard 和 API route 调用点均直接引用该中性 helper，避免通用 API helper 与账号领域模块相互 re-export。
- 已将原 `app/actions/account/*` 账号 DB repository/service 文件迁移到 `app/lib/account/server/repositories/*`，API routes、admin SSR、Server Actions 和账号 server helpers 均改为引用账号 server 域路径；不再让全局 `actions` 目录承载账号仓储层。
- 已新增 `app/(pages)/admin/actions.ts`，承接管理员登录、退出、状态检查、用户列表、SSO 列表和 SSO 详情的页面内部 Server Actions。
- 已新增 `app/lib/account/actions/auth.ts`，承接普通账号登录、注册、改密、退出当前设备、退出全部设备的账号共享 Server Actions。
- 已新增 `app/lib/account/actions/ssoGrants.ts`，承接普通账号 SSO 授权列表刷新和撤销授权 Server Actions；设置页不再保留页面局部 action 模块。
- 已新增 `app/lib/account/actions/sync.ts`，承接普通账号主动同步 state 读取、上传和旧备份码导入的账号共享 Server Actions。
- 已新增 `app/lib/account/actions/legacyBackups.ts`，承接站内 legacy 云备份设置页的元数据读取、下载、上传和删除动作，并复用 [app/lib/account/server/legacyBackup.ts](../../../app/lib/account/server/legacyBackup.ts) 的共享服务能力；外部 `/api/v1/backups*` route 继续作为兼容 API 保留。
- 已新增 `app/lib/account/actions/utils.ts`，让普通账号 auth/sync actions 复用相同的 action result 和 JSON body 处理工具，减少 route-action 包装逻辑漂移。
- 已将管理员首页、用户详情、SSO 列表和 SSO 表单的客户端 fallback 从后台 fetch helper 改为 Server Actions。
- 已将 `app/lib/account/client/legacyBackups.ts` 的站内 legacy 云备份 facade 改为调用 `legacyBackups.ts` Server Actions；设置页错误处理仍保留原有 `status/data` 分支。
- 已为 `app/components/timeAgo.tsx` 增加可选首屏基准时间，并在后台用户列表、用户详情和 SSO 客户端列表的 SSR initial data 中传入 `renderedAt`；创建时间、最近登录、更新时间不再先空白再由客户端 effect 填入。
- 已将 `IAdminMeData`、`IAdminUserListData`、`IAdminUserDetailData` 迁入 shared types，避免 Server Action/SSR 代码从 client API 模块取数据形状。
- 保留所有仍面向浏览器运行时、外部协议或 legacy 兼容的 API 封装。
- 已更新验证清单中和 SSR/action 迁移相关的手测项。

### 已删除

| 封装                                                                                                  | 删除原因                                                                                                 |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `listAccountSsoGrants`、`revokeAccountSsoGrant`                                                       | 普通账号授权应用刷新和撤销已改走 Server Action                                                           |
| `fetchAdminUser`、`resetAdminUserPassword`、`disableAdminUser`、`enableAdminUser`、`restoreAdminUser` | 用户详情首载和写操作已由 SSR/Server Action 承接                                                          |
| `clearAdminUserData`、`deleteAdminUserSessions`                                                       | 用户详情危险操作已由 Server Action 承接                                                                  |
| `createAdminSsoClient`、`updateAdminSsoClient`、`deleteAdminSsoClient`                                | SSO 管理写操作已由 Server Action 承接                                                                    |
| `fetchAdminMe`、`listAdminUsers`、`loginAdmin`、`logoutAdmin`                                         | 管理员首页登录、退出、会话检查和列表刷新已由 Server Action 承接                                          |
| `listAdminSsoClients`、`fetchAdminSsoClient`                                                          | SSO 管理列表和详情刷新已由 Server Action 承接                                                            |
| `registerAccount`、`loginAccount`、`changeAccountPassword`、`logoutAccount`、`logoutAllAccount`       | 普通账号登录、注册、改密、退出当前/全部设备已由 Server Action 承接                                       |
| `exportAccountData`、`deleteAccountData`、`deleteAccount`                                             | 普通账号数据导出、清空云端数据、删除账号已由 Server Action 承接                                          |
| `fetchAccountMe`                                                                                      | 普通账号 bootstrap/状态刷新已由 Server Action 承接                                                       |
| `fetchSyncState`、`putSyncState`、`importBackupCode` 的浏览器 fetch 实现                              | 站内主动同步 state 读写和旧备份码导入已由 Server Action 承接；保留同名 helper 只作为客户端调用适配层     |
| `app/lib/account/client/legacyBackups.ts` 中的 `/api/v1/backups*` 浏览器 fetch 实现                   | 站内 legacy 云备份设置页已改走 `app/lib/account/actions/legacyBackups.ts`；外部 legacy API routes 仍保留 |

### 必须保留

| API/封装                                                                     | 保留原因                                                    |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `sendSyncPing`                                                               | 页面隐藏或关闭时需要浏览器 `navigator.sendBeacon`           |
| `fetchSyncState`、`putSyncState`、`importBackupCode` helper                  | 客户端同步运行时仍需要调用适配层，但内部已走 Server Actions |
| `/api/v1/account/me`                                                         | 外部或直接调用方仍可按原协议读取普通账号状态                |
| `/api/v1/auth/*`                                                             | 外部或直接调用方仍可按原协议进行普通账号认证                |
| `/api/v1/account/export`、`delete-data`、`delete`                            | 外部或直接调用方仍可按原协议导出或删除普通账号数据          |
| `/api/v1/admin/*`                                                            | 外部或直接调用方仍可按原协议访问后台 API                    |
| `/api/v1/sso/*`                                                              | 外部 SSO 协议端点                                           |
| `/api/v1/account/sso/grants*`                                                | 外部或直接调用方仍可按原协议管理普通账号授权                |
| `/api/v1/sync/state`、`/api/v1/sync/import-backup-code`、`/api/v1/sync/ping` | 外部同步协议和页面关闭 beacon 协议端点                      |
| `/api/v1/backups*`                                                           | legacy 旧备份外部兼容 API 和 route handler 复用入口         |

### 验收

- `rg "listAccountSsoGrants|revokeAccountSsoGrant|fetchAdminUser|resetAdminUserPassword|disableAdminUser|enableAdminUser|restoreAdminUser|clearAdminUserData|deleteAdminUserSessions" app` 不再出现旧客户端 fetch 封装调用。
- `rg "fetchAdminMe|listAdminUsers|listAdminSsoClients|fetchAdminSsoClient|loginAdmin|logoutAdmin" app` 不再出现旧客户端 fetch 封装调用。
- `rg "registerAccount|loginAccount|changeAccountPassword|logoutAccount|logoutAllAccount" app` 只出现 Server Action 名称，不再出现同名客户端 fetch 封装。
- `rg "exportAccountData|deleteAccountData|deleteAccount\\(" app` 只出现 Server Action 名称，不再出现同名客户端 fetch 封装。
- `rg "fetchAccountMe" app` 只出现 Server Action 名称，不再出现同名客户端 fetch 封装。
- `rg "fetch\(|/api/v1/sync/state|/api/v1/sync/import-backup-code|createAccountRequestInit|readAccountApiResponse" app/lib/account/client/api.ts` 不再出现匹配；`sendSyncPing` 仍保留。
- `rg "fetch\(.*api/v1/backups|/api/v1/backups" app/lib/account/client/legacyBackups.ts` 不再出现匹配；`/api/v1/backups*` route 仍在 `pnpm build` 路由表中。
- `app/(pages)/admin` 下存在后台页面；`app/(pages)/(layout)/admin` 下无残留文件；`pnpm build` 路由表仍生成 `/admin`、`/admin/sso`、`/admin/sso/[id]`、`/admin/sso/new`、`/admin/users/[id]`。
- `rg "<TimeAgo" app/(pages)/admin` 的所有后台时间显示都传入 `initialNowTimestamp`，避免 SSR 首屏时间列空白。
- `/sso/authorize` 继续为 dynamic SSR，首页、资料页和设置页仍在 `pnpm build` 路由表中保持静态/SSG。
- `pnpm exec tsc --noEmit` 通过。
- `pnpm lint` 通过。
- `pnpm build` 通过。
- `SELF_HOSTED=false pnpm build`、`VERCEL=1 pnpm build`、`pnpm build:offline` 不因 server import 失败。

## 九、跨批次风险清单

| 风险                           | 防护要求                                                                                                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server Action 静态缓存敏感数据 | 后台页面和 action 使用请求期 cookie/header，不缓存管理员数据或 SSO secret                                                                                                                                                                         |
| CSRF 被弱化                    | 所有写 action 校验 session token 绑定的 CSRF，不能只依赖表单来源                                                                                                                                                                                  |
| cookie secure 计算错误         | 先抽 request context helper，明确 `TRUST_PROXY`、`ALLOW_INSECURE_COOKIES` 和生产环境行为                                                                                                                                                          |
| rate limit 丢失                | 登录、改密、管理员写操作和账号写操作保留等价限流                                                                                                                                                                                                  |
| SSO secret 泄露                | secret 只在创建/生成 action 响应中一次性返回，不进入 URL、日志、缓存或可重放页面                                                                                                                                                                  |
| 同步状态错乱                   | 普通账号、清空云端、导入旧备份、退出流程不得跳过本地 store、dirty queue、BroadcastChannel                                                                                                                                                         |
| Server Action body 上限过小    | 同步上传 action 和站内 legacy 备份上传 action 需要覆盖各自业务上限，当前通过 `SERVER_ACTION_BODY_SIZE_LIMIT`（`max(MAX_BACKUP_UPLOAD_JSON_BODY_BYTES, MAX_SYNC_JSON_BODY_BYTES) + 2MiB` 后向上取整到 MiB，当前 `13mb`）防止 Next 默认上限提前拦截 |
| API 误删                       | `sync`、外部 `sso`、legacy `backups` API 只有在另行专项评估后才能改动                                                                                                                                                                             |
| 禁用环境破坏                   | 禁用账号功能时不静态加载账号 DB/Argon2，不显示账号入口，不请求账号 API                                                                                                                                                                            |

### 后续边界收口暂缓项

- `app/lib/account/server/repositories/*` 现在承载账号 DB repository/service 层；后续如果继续细分 repository 与 service，应按业务模块拆分 transaction/查询职责，不要回迁到 `app/actions/account/`。
- 账号 route guard response adapter、账号 JSON body 读取和少量 response helper 已迁入 `app/lib/account/server/routeResponses.ts`；后续若继续细分 route adapter，也必须保留 `/api/v1/*` 外部协议语义，不能复活未使用的半成品通用 `requestBody.ts`/`routeResponses.ts`。
- 同步 namespace、payload schema、stored state parse 和 legacy 兼容校验已迁入 `app/lib/account/sync/validation.ts`；后续如果继续拆 server sync payload helper，应单独验证同步兼容性。

## 十、最终验收顺序

1. 批次 0 后运行 API smoke，确认既有 route 响应语义不变。
2. 批次 1 后手测管理员首页未登录、登录、筛选、分页、退出。
3. 批次 2 后手测用户详情六类管理员操作和被操作用户重新登录。
4. 批次 3 后手测 SSO 客户端创建、编辑、生成 secret、删除和外部授权闭环。
5. 批次 4 后手测普通账号登录、注册、改密、SSO 授权应用撤销、多标签页同步。
6. 批次 5 后运行 `pnpm exec tsc --noEmit`、`pnpm lint`、`pnpm build`、禁用环境构建和 offline 构建。
7. 发布前按 [07-验证清单与发布回归.plan.md](07-验证清单与发布回归.plan.md) 补跑账号系统关键场景。
