# 高频动态请求与统一子域名迁移方案（2026-06-15）

## 背景与目标

本方案承接 [API 暴露面、鉴权与限流盘点](./api-exposure-auth-rate-limit-2026-06-15.md)，目标是把自动同步、账号状态、公告、管理后台、SSO、legacy backup、在线人数等动态请求从主站 CDN 域名中剥离，统一交给一个动态服务子域承接。

当前迁移前提：

- CDN 无法按路径绕过或回源，因此不采用“主站域名 + 路径规则 bypass”的方案。
- 所有相关动态请求统一迁到一个子域，不按功能拆分多个子域。
- 迁移范围同时覆盖 `app/api/v1/**/route.ts` 的 REST API 和浏览器可触发的 Next Server Actions。

## 实施进度清单

| 状态       | 工作项                                                      | 下一步动向                                                                                                                                                                        |
| ---------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 已完成     | 文档改为统一 `assistant-bff.izakaya.cc` BFF 子域            | 以 `SERVICE_API_ORIGIN` 作为唯一浏览器侧动态服务 origin 配置                                                                                                                      |
| 已完成     | 盘点 `app/api/v1/**/route.ts` 和浏览器可触发 Server Actions | 用完整覆盖清单约束后续实现，避免只迁高频模块                                                                                                                                      |
| 已完成     | 基础设施：配置注入、应用层 CORS/OPTIONS、cookie domain      | 已加入 `SERVICE_API_ORIGIN`、`SERVICE_ALLOWED_ORIGINS`、`ACCOUNT_COOKIE_DOMAIN` 类型声明与运行时接入；`/api/v1/:path*` middleware 统一 CORS/OPTIONS；route-local `OPTIONS` 已收敛 |
| 已完成     | 服务子域 URL helper 与客户端请求封装                        | 已新增统一 BFF URL、`credentials: 'include'`、JSON API 错误和 `Retry-After` 解析                                                                                                  |
| 已完成     | 同步模块迁移                                                | `fetchSyncState`、`putSyncState`、`importBackupCode`、`sendSyncPing` 已改为显式 BFF REST 请求                                                                                     |
| 已完成     | 账号模块迁移                                                | 账号状态、登录注册、改密、登出、导出、删除、SSO grant 浏览器调用已替换为 BFF REST wrapper                                                                                         |
| 已完成     | 公告、统计、legacy backup、管理后台迁移                     | 公告读取/关闭、在线人数、legacy backup、admin 用户/公告/SSO client 浏览器入口已改为 BFF REST wrapper                                                                              |
| 已完成     | SSO 授权页提交迁移                                          | `/sso/authorize` 的同意/取消 inline Server Actions 已合并为 `POST /api/v1/sso/authorize` 服务子域 REST 提交，并由浏览器按 JSON `redirect_url` 跳转                                |
| 已完成     | 旧 Server Action 入口清理                                   | 原浏览器可触发 Server Action 文件与配套 offline stub 已删除，现由 REST client / route handler 承接                                                                                |
| 已完成     | SSO grant 弹窗请求去重                                      | 账号弹窗同一用户的 `/api/v1/account/sso/grants` 刷新共享 in-flight 请求，避免打开弹窗时并发请求两次                                                                               |
| 已完成     | 静态与离线构建验证                                          | `pnpm lint` 无错误；`pnpm build:offline` 已通过，离线产物未包含 `/api/v1`、`/admin`、`_api` 等动态入口痕迹                                                                        |
| 待环境验证 | 线上/预发运行时验证                                         | 在配置 `SERVICE_API_ORIGIN`、`SERVICE_ALLOWED_ORIGINS`、`ACCOUNT_COOKIE_DOMAIN` 后复核 429、CORS、CSRF、cookie 行为                                                               |

## 统一子域名

建议使用统一 BFF 子域：

```text
assistant-bff.izakaya.cc
```

该子域统一承接站内动态服务请求，包括：

- 账号登录态与账号数据同步。
- 公告读取与公告关闭。
- 管理后台 API。
- SSO 授权、状态与回调调度。
- legacy backup。
- 在线人数等站内动态统计接口。

应用配置建议统一为：

```env
SERVICE_API_ORIGIN=https://assistant-bff.izakaya.cc
SERVICE_ALLOWED_ORIGINS=https://izakaya.cc,https://www.izakaya.cc
ACCOUNT_COOKIE_DOMAIN=.izakaya.cc
```

本项目当前通过 `next.config.ts` 的 `env` 字段和 `siteConfig` 向浏览器侧下发配置，不要求浏览器可读变量使用 Next 的公开变量前缀。因此 `SERVICE_API_ORIGIN` 应加入 `next.config.ts` 的 `env` 白名单，再由统一的 dynamic service URL helper 读取。

客户端不应在各模块里拼接多个 origin。应提供一个统一的 dynamic service URL helper，例如：

```ts
createServiceApiUrl('/api/v1/sync/state');
```

### Nginx 反代配置

统一服务子域的 nginx 只负责 TLS、HTTP/3、基础拦截和反向代理，不下发 CORS 响应头，也不在 nginx 层处理 `OPTIONS` 预检。CORS allowlist、`Access-Control-*` 响应头和预检响应由 Next 应用根据 `SERVICE_ALLOWED_ORIGINS` 统一生成。

## 高频判定口径

本报告按浏览器触发频率和用户数量放大效应分级：

- 高频：页面常驻、登录后自动触发、定时轮询、跨标签广播、页面隐藏/恢复等无显式用户确认即可触发的请求。
- 中频/突发：页面初始化、登录后接管、焦点/联网重试、后台列表搜索、用户连续操作时可能形成短时间请求簇。
- 低频：登录、注册、改密、导出、删除、管理后台写操作、legacy backup、SSO 服务端回调等显式动作或机器侧调用。

这些分级只用于识别流量来源，不用于分批落地。实际迁移应按功能模块系统性完成，避免同一模块内一部分请求走主站、一部分请求走服务子域。

## 高频入口总览

| 频率      | 模块          | 入口类型                                | 入口                                                          | 主要触发点                                                                                            | 流量特征                                             |
| --------- | ------------- | --------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 高频      | 同步          | Server Action                           | `fetchSyncStateAction`                                        | 登录/启动后的本地接管、state epoch mismatch 后远端刷新、跨标签 `uploaded` / `remote-applied` 被动刷新 | 登录用户越多、标签页越多，读请求越容易被放大         |
| 高频      | 同步          | Server Action                           | `putSyncStateAction`                                          | dirty queue 达到阈值、静默 2 秒、最长 30 秒、手动同步、冲突恢复后再次 flush                           | 数据修改会批量上传，自动队列会持续重试               |
| 高频      | 同步          | REST API v1                             | `POST /api/v1/sync/ping`                                      | `visibilitychange` 隐藏、`pagehide`，小体积 dirty queue 使用 beacon 发送                              | 页面切走、关闭、移动端后台化时触发                   |
| 高频      | 统计          | REST API v1                             | `GET /api/v1/analytics/visitors`                              | 页脚在线人数每 30 秒轮询一次；每个打开标签独立轮询                                                    | 未登录用户也会产生，公开页面访问量越大越明显         |
| 中频/突发 | 账号          | Server Action                           | `fetchAccountMeAction`                                        | 账号 bootstrap、登录后刷新、焦点/online 错误重试                                                      | 每个访问会话至少一次，错误状态会在 focus/online 重试 |
| 中频/突发 | 同步/迁移     | Server Action                           | `importBackupCodeAction`                                      | 登录后如果本地存在 legacy cloud code，会在接管流程里尝试导入                                          | 只在迁移/导入场景触发，但可能跟首次登录集中出现      |
| 中频/突发 | 公告          | REST API v1 / Server Action             | `GET /api/v1/announcements`、`dismissAnnouncementAction`      | 公告读取、登录用户关闭公告                                                                            | 读取取决于公开访问量；关闭是显式动作                 |
| 中频/突发 | 管理后台      | REST API v1 / Server Actions            | admin 列表、详情、搜索、版本读取                              | 管理后台进入、分页、搜索 debounce                                                                     | 用户少，但搜索/分页可形成突发                        |
| 低频      | 账号          | REST API v1 / Server Actions            | auth、account export/delete、SSO grants                       | 登录、注册、改密、登出、导出、删除、授权应用管理                                                      | 显式操作，低频但安全敏感                             |
| 低频      | legacy backup | REST API v1 / Server Actions            | backup upload/download/metadata/delete/cleanup                | 备份功能和 code-based 访问                                                                            | 不是自动同步流量主因                                 |
| 低频      | 外部 SSO      | REST API v1 / Server Components/Actions | authorize、validate、status、dispatch callbacks、agree/cancel | 外部 client、服务端回调、用户授权                                                                     | 取决于外部集成和用户授权行为                         |

## 完整迁移覆盖清单

本清单来自当前 `app/api/v1/**/route.ts` 与原 `'use server'` 入口盘点。当前共有 42 个 `API v1` route 文件、52 个业务 HTTP handler；`OPTIONS` 预检由 `/api/v1/:path*` middleware 统一处理；原有 48 个浏览器可触发的 Server Action / inline form action 已迁移为显式 REST client 或合并进 REST route handler，旧 Server Action 文件已删除。未发现游离于下列模块之外的 `API v1` route 或浏览器可触发入口。

### REST API v1

| 模块            | 当前入口                                                                                                                                                                                                                                                                                                                                | 目标归属                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 同步            | `GET /api/v1/sync/state`、`PUT /api/v1/sync/state`、`POST /api/v1/sync/ping`、`POST /api/v1/sync/import-backup-code`                                                                                                                                                                                                                    | 同步模块                                                 |
| 账号            | `GET /api/v1/account/me`、`GET /api/v1/account/export`、`DELETE /api/v1/account/delete-data`、`DELETE /api/v1/account/delete`                                                                                                                                                                                                           | 账号模块                                                 |
| 账号认证        | `POST /api/v1/auth/login`、`POST /api/v1/auth/register`、`POST /api/v1/auth/change-password`、`POST /api/v1/auth/logout`、`POST /api/v1/auth/logout-all`                                                                                                                                                                                | 账号模块                                                 |
| 账号 SSO 授权   | `GET /api/v1/account/sso/grants`、`DELETE /api/v1/account/sso/grants/[clientId]`                                                                                                                                                                                                                                                        | 账号模块                                                 |
| 公告            | `GET /api/v1/announcements`                                                                                                                                                                                                                                                                                                             | 公告模块                                                 |
| 统计            | `GET /api/v1/analytics/visitors`                                                                                                                                                                                                                                                                                                        | 统计模块                                                 |
| 管理认证        | `POST /api/v1/admin/auth/login`、`POST /api/v1/admin/auth/logout`、`GET /api/v1/admin/me`                                                                                                                                                                                                                                               | 管理后台模块                                             |
| 管理用户        | `GET /api/v1/admin/users`、`GET /api/v1/admin/users/[id]`、`POST /api/v1/admin/users/[id]/reset-password`、`POST /api/v1/admin/users/[id]/enable`、`POST /api/v1/admin/users/[id]/disable`、`POST /api/v1/admin/users/[id]/restore`、`DELETE /api/v1/admin/users/[id]/sessions`、`DELETE /api/v1/admin/users/[id]/data`                 | 管理后台模块                                             |
| 管理公告        | `GET /api/v1/admin/announcements`、`POST /api/v1/admin/announcements`、`POST /api/v1/admin/announcements/preview`、`GET /api/v1/admin/announcements/[id]`、`PUT /api/v1/admin/announcements/[id]`、`DELETE /api/v1/admin/announcements/[id]`、`PATCH /api/v1/admin/announcements/[id]`、`GET /api/v1/admin/announcements/[id]/versions` | 管理后台模块                                             |
| 管理 SSO client | `GET /api/v1/admin/sso/clients`、`POST /api/v1/admin/sso/clients`、`GET /api/v1/admin/sso/clients/[id]`、`PUT /api/v1/admin/sso/clients/[id]`、`DELETE /api/v1/admin/sso/clients/[id]`                                                                                                                                                  | 管理后台模块                                             |
| 外部 SSO        | `GET /api/v1/sso/authorize`、`POST /api/v1/sso/authorize`、`POST /api/v1/sso/validate`、`POST /api/v1/sso/status`、`POST /api/v1/sso/dispatch-callbacks`                                                                                                                                                                                | SSO 模块                                                 |
| Legacy backup   | `POST /api/v1/backups`、`GET /api/v1/backups/[code]`、`DELETE /api/v1/backups/[code]`、`GET /api/v1/backups/[code]/metadata`、`DELETE /api/v1/backups/cleanup`                                                                                                                                                                          | Legacy Backup 模块                                       |
| CORS 预检       | `OPTIONS /api/v1/:path*`                                                                                                                                                                                                                                                                                                                | `/api/v1/:path*` middleware 统一应用层 CORS/OPTIONS 处理 |

### Server Actions

| 模块            | 当前入口                                                                                                                                                                                                                                      | 目标归属                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 同步            | `fetchSyncStateAction`、`putSyncStateAction`、`importBackupCodeAction`                                                                                                                                                                        | 同步模块 REST client                                               |
| 账号            | `loginAccountAction`、`fetchAccountMeAction`、`registerAccountAction`、`changeAccountPasswordAction`、`logoutAccountAction`、`logoutAllAccountAction`、`exportAccountDataAction`、`deleteAccountDataAction`、`deleteAccountAction`            | 账号模块 REST client                                               |
| 账号 SSO 授权   | `refreshAccountSsoGrantsAction`、`revokeAccountSsoGrantAction`                                                                                                                                                                                | 账号模块 REST client                                               |
| 公告            | `dismissAnnouncementAction`                                                                                                                                                                                                                   | 公告模块 REST client                                               |
| 管理认证/列表   | `checkAdminAction`、`loginAdminAction`、`logoutAdminAction`、`listAdminUsersAction`、`getAdminUsersByIdsAction`、`listAdminSsoClientsAction`、`fetchAdminSsoClientAction`                                                                     | 管理后台 REST client                                               |
| 管理用户详情    | `refreshAdminUserDetailAction`、`resetAdminUserPasswordAction`、`disableAdminUserAction`、`enableAdminUserAction`、`restoreAdminUserAction`、`deleteAdminUserSessionsAction`、`clearAdminUserDataAction`                                      | 管理后台 REST client                                               |
| 管理公告        | `listAdminAnnouncementsAction`、`getAdminAnnouncementAction`、`previewAnnouncementAction`、`createAnnouncementAction`、`updateAnnouncementAction`、`archiveAnnouncementAction`、`restoreAnnouncementAction`、`listAnnouncementVersionsAction` | 管理后台 REST client                                               |
| 管理 SSO client | `createAdminSsoClientAction`、`updateAdminSsoClientAction`、`generateAdminSsoClientSecretAction`、`toggleAdminSsoClientDisabledAction`、`deleteAdminSsoClientAction`                                                                          | 管理后台 REST client                                               |
| Legacy backup   | `fetchLegacyBackupMetadataAction`、`deleteLegacyBackupAction`、`downloadLegacyBackupAction`、`uploadLegacyBackupAction`                                                                                                                       | Legacy Backup REST client                                          |
| SSO 授权页      | `agreeSsoAuthorize`、`cancelSsoAuthorize`                                                                                                                                                                                                     | 已合并为 `POST /api/v1/sso/authorize`，通过 `intent` 区分同意/取消 |

`readAdminSsoAuthInitialData`、`readAdminAnnouncementAuthInitialData` 这类 server component 初始数据函数不是 Server Action，不在本清单中；它们随页面渲染发生，是否迁移取决于是否要把对应页面渲染本身也从主站动态请求中剥离。

## 模块化迁移方案

### 1. 统一动态服务客户端

新增一个统一的浏览器侧请求基础设施，所有站内动态模块复用同一个服务子域配置：

- 读取 `siteConfig.serviceApiOrigin`，其值来自 `SERVICE_API_ORIGIN`。
- 提供 `createServiceApiUrl(path)`。
- 提供 JSON fetch helper，统一处理：
    - `credentials: 'include'`
    - `cache: 'no-store'`
    - `Retry-After`
    - 429 错误结构
    - 401/403 账号状态失效
    - CORS 失败时的用户可理解错误
- 保留同源 fallback：未配置服务子域时继续使用当前 origin，方便本地开发和离线/自托管差异化部署。

### 2. 同步模块

同步模块是 CDN 流量暴涨的核心来源，应作为一个模块整体迁移，避免读写分裂。

需迁移的入口：

| 当前入口                 | 目标入口                                                   | 说明                                                                     |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| `fetchSyncStateAction`   | `GET {SERVICE_API_ORIGIN}/api/v1/sync/state`               | 浏览器侧 `fetchSyncState()` 改为显式 REST fetch。                        |
| `putSyncStateAction`     | `PUT {SERVICE_API_ORIGIN}/api/v1/sync/state`               | 浏览器侧 `putSyncState()` 改为显式 REST fetch。                          |
| `sendSyncPing()`         | `POST {SERVICE_API_ORIGIN}/api/v1/sync/ping`               | 跨子域时使用 `fetch(..., { keepalive: true, credentials: 'include' })`。 |
| `importBackupCodeAction` | `POST {SERVICE_API_ORIGIN}/api/v1/sync/import-backup-code` | 属于登录后同步接管链路，应随同步模块一起迁移。                           |

注意事项：

- `sendBeacon` 不能设置自定义 header，跨子域下也更难统一 CORS/credentials 行为；同步 ping 建议改为 `fetch` + `keepalive`，同源 fallback 再保留 `sendBeacon`。
- `/api/v1/sync/state` 的 `GET` 仍可无 token CSRF，但必须校验 allowed origin / same-site origin，并保留账号鉴权和限流。
- `/api/v1/sync/state` 的 `PUT` 与 `/api/v1/sync/ping` 必须继续校验账号 CSRF。
- 客户端同步队列已有 429 / Retry-After 适配，迁移后要保证服务子域返回相同错误结构。

### 3. 账号模块

账号模块应与同步模块使用同一个服务子域，避免登录态、CSRF token、cookie domain 在多个 origin 之间分散。

需迁移的入口：

| 能力           | 当前 Server Action / REST API                                       | 目标入口                                                |
| -------------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| 当前账号状态   | `fetchAccountMeAction` / `GET /api/v1/account/me`                   | `GET {SERVICE_API_ORIGIN}/api/v1/account/me`            |
| 登录           | `loginAccountAction` / `POST /api/v1/auth/login`                    | `POST {SERVICE_API_ORIGIN}/api/v1/auth/login`           |
| 注册           | `registerAccountAction` / `POST /api/v1/auth/register`              | `POST {SERVICE_API_ORIGIN}/api/v1/auth/register`        |
| 改密           | `changeAccountPasswordAction` / `POST /api/v1/auth/change-password` | `POST {SERVICE_API_ORIGIN}/api/v1/auth/change-password` |
| 登出           | logout actions / logout REST APIs                                   | `{SERVICE_API_ORIGIN}` 下对应 REST API                  |
| 导出           | `exportAccountDataAction` / `GET /api/v1/account/export`            | `GET {SERVICE_API_ORIGIN}/api/v1/account/export`        |
| 删除数据/账号  | delete actions / delete REST APIs                                   | `{SERVICE_API_ORIGIN}` 下对应 REST API                  |
| SSO grant 管理 | grant actions / grant REST APIs                                     | `{SERVICE_API_ORIGIN}` 下对应 REST API                  |

注意事项：

- 账号 cookie 需要设置 `Domain=.izakaya.cc`、`Secure`、`SameSite=Lax`、`Path=/`。
- 浏览器 fetch 必须带 `credentials: 'include'`。
- 写操作继续带账号 CSRF token。
- 登录/注册成功后的 `Set-Cookie` 必须来自服务子域，但 cookie domain 覆盖主站与服务子域。
- 登出/删除账号必须清理同 domain cookie。

### 4. 公告模块

公告模块应统一改到服务子域，包含公开读取与登录态关闭状态。

需迁移的入口：

| 能力     | 当前入口                    | 目标入口                                        |
| -------- | --------------------------- | ----------------------------------------------- |
| 公告读取 | `GET /api/v1/announcements` | `GET {SERVICE_API_ORIGIN}/api/v1/announcements` |
| 公告关闭 | `dismissAnnouncementAction` | 新增或复用服务子域下的公告关闭 REST API         |

注意事项：

- 公告读取可继续允许可选账号；登录态关闭要继续校验账号 CSRF。
- 公告关闭 cookie 若用于未登录态，也要考虑 domain 是否应覆盖主站与服务子域。

### 5. 管理后台模块

管理后台应作为一个独立模块整体迁移到同一个服务子域，避免后台模块内部请求分裂。

覆盖范围：

- `/api/v1/admin/auth/*`
- `/api/v1/admin/me`
- `/api/v1/admin/users*`
- `/api/v1/admin/announcements*`
- `/api/v1/admin/sso/clients*`
- 对应的 admin Server Actions。

注意事项：

- admin session cookie 同样需要支持服务子域访问；建议复用统一 cookie domain 策略，但保持独立 cookie 名称。
- admin 写操作继续要求 admin CSRF。
- 管理后台列表、详情、版本读取虽然不是公开高频流量，但搜索/分页可能产生突发请求，应统一走服务子域，避免同一后台模块请求分裂。

### 6. SSO 模块

SSO 模块包含浏览器授权页、外部 client 调用和服务端回调调度，应统一使用服务子域 API 入口。

覆盖范围：

- `/api/v1/sso/authorize`
- `/api/v1/sso/validate`
- `/api/v1/sso/status`
- `/api/v1/sso/dispatch-callbacks`
- `/sso/authorize` 页面中的 `agreeSsoAuthorize`、`cancelSsoAuthorize`

注意事项：

- 外部 client 的 `redirect_uri`、validate/status endpoint 配置需要同步更新。
- `validate` / `status` / `dispatch-callbacks` 使用 client secret / dispatch secret，不套浏览器 CSRF。
- 授权页 agree/cancel 是浏览器态操作，应校验 allowed origin、transaction/context cookie 和对应限流。

### 7. Legacy Backup 模块

legacy backup 不是自动同步流量主因，但为保持动态请求统一入口，也应迁到服务子域。

覆盖范围：

- `/api/v1/backups`
- `/api/v1/backups/[code]`
- `/api/v1/backups/[code]/metadata`
- `/api/v1/backups/cleanup`
- 对应 legacy backup Server Actions。

注意事项：

- code-based 接口继续保持原限流和 backup lock。
- cleanup 继续使用 `x-cleanup-secret`。
- 旧客户端或外部引用若仍使用主站 URL，需要兼容重定向或保留一段过渡入口。

### 8. 统计模块

站内动态统计接口应走同一个服务子域。外部分析服务不经主站 CDN，不纳入本次子域迁移范围。

覆盖范围：

- `GET /api/v1/analytics/visitors`

注意事项：

- 在线人数轮询是未登录公开流量，每 30 秒/标签页一次，属于 CDN 流量放大的高频来源。
- `GET /api/v1/analytics/visitors` 可继续保留 30 秒后台缓存，但请求入口应从主站 CDN 域剥离。

## Next Server Actions 处理原则

Server Actions 的浏览器网络请求由 Next 绑定到当前页面 origin，不能通过配置直接改到服务子域。凡是希望从主站 CDN 域名剥离的 Server Action，都应改为显式 REST API client。

迁移原则：

- 保留现有 REST route handler 作为服务端能力入口。
- 浏览器侧调用统一改成服务子域 fetch。
- 原 Server Action 文件应退役删除；需要保留的服务端能力归并到 REST route handler 或普通 server helper，未配置服务子域时由 REST client 的同源 fallback 继续走当前 origin。
- 错误结构、429 Retry-After、401/403 登录态处理要与现有客户端兼容。

## 跨子域必须配套的改动

### Cookie

当前账号 session cookie 是 host-only。动态服务迁到统一子域后，需要支持：

- `Domain=.izakaya.cc`
- `Secure`
- `SameSite=Lax`
- `Path=/`
- fetch 侧 `credentials: 'include'`

建议新增服务端配置：

```env
ACCOUNT_COOKIE_DOMAIN=.izakaya.cc
```

admin session 与 SSO context cookie 也应审查是否需要同样的 domain 策略。

### CORS

带 cookie 的跨子域请求不能使用 `Access-Control-Allow-Origin: *`。CORS 响应由 Next 应用根据环境配置精确 allowlist 统一生成，nginx 不添加 `Access-Control-*` 响应头，也不拦截 `OPTIONS` 预检：

```env
SERVICE_ALLOWED_ORIGINS=https://izakaya.cc,https://www.izakaya.cc
```

响应要求：

- `Access-Control-Allow-Origin: <matched-origin>`
- `Access-Control-Allow-Credentials: true`
- `Vary: Origin`
- 允许 `Content-Type`、账号/admin CSRF header（如果写操作走 header token）
- 处理 `OPTIONS` 预检

### 同源/CSRF

当前同源校验要求请求 `Origin` / `Referer` 与当前 request origin 完全一致。迁到服务子域后，主站页面请求服务子域时 Origin 会是主站 origin，必须把同源 guard 扩展为“允许的站点 origin”。

建议原则：

- 读接口：校验 allowed origin 或 same-site origin，继续保留鉴权和限流。
- 写接口：校验 allowed origin + CSRF token + session。
- 外部 SSO/cleanup 这类机器接口继续使用 client secret / dispatch secret，不套浏览器 CSRF。

### 限流 IP

统一服务子域若经过新的反代或平台，需要确认可信 IP 头保持一致：

- `x-forwarded-for`
- `x-real-ip`
- 平台专用真实 IP 头

否则所有用户可能被归到同一个代理 IP，导致同步、登录和在线人数限流误伤。

### HSTS 与 HTTPS

当前安全头使用 `includeSubDomains; preload`，统一服务子域必须全程 HTTPS 可用，否则浏览器会直接阻断。

## 结论

CDN 流量暴涨最可疑的高频来源是同步读写、页面隐藏同步 ping 和在线人数轮询。由于只能使用子域名方案，建议使用一个统一动态服务子域承接所有相关动态请求，并按功能模块系统性迁移：同步、账号、公告、管理后台、SSO、legacy backup、统计。

实现上不能只改 REST API URL。当前不少浏览器可触发入口是 Server Actions；这些入口若要避开主站 CDN，必须替换为显式服务子域 REST fetch，同时配套 cookie domain、CORS、allowed origin、CSRF、限流真实 IP 和 429 错误兼容。
