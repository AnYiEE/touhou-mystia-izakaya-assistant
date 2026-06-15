# API 暴露面、鉴权与限流盘点（2026-06-15）

## 口径

本报告按两类入口盘点：

- 外部 REST API：`app/api/v1/**/route.ts` 下导出的 HTTP 方法。
- Next Server Actions：带 `use server` 且会被客户端组件或表单触发的函数。Server Actions 没有稳定 REST URL，但在浏览器侧可触发，因此作为内部 RPC 暴露面单列。

判定规则：

- 账号鉴权：调用 `authenticateAccountFromRequest`。
- 管理员鉴权：route handler 调用 `authenticateAdminFromRequest`；Server Component / Server Action 读取 cookie 后调用 `authenticateAdminSessionToken`。
- 可选账号：调用 `authenticateAccountFromRequest(request, true)`，失败时按未登录继续处理。
- CSRF：账号侧为 `verifyAccountCsrf*`，管理员侧低层 boolean 为 `verifyAdminCsrf*`，guard 层为 `checkAdminCsrfGuard`，route response 层为 `checkAdminCsrfRouteResponse`。
- 同源：guard 层为 `checkSameOriginGuard`，route response 层为 `checkSameOriginRouteResponse`。它不是 token CSRF，但会拦截跨站请求。
- 账号/后台统一限流：guard 层为 `checkAccountRateLimitGuard`，route response 层为 `checkAccountRateLimitRouteResponse`，默认 20 次/分钟，按可信 IP、用户名、账号 session、管理员 session、业务对象 parts 等维度分桶。
- SSO 限流：route response 层为 `checkSsoRateLimitRouteResponse`，默认 20 次/分钟，按可信 IP、SSO 参数和参数/IP 组合分桶。
- legacy backup 限流：服务层 `checkRecentBackupAccessByIp`，TTL 为 3 分钟；metadata/delete 另有 code/IP 内存限流，upload 失败路径有短期 IP 限流；backup code lock/cleanup lock 是并发控制，不替代频率限制。

## REST API 总表

| 路径                                        | 方法      | 鉴权                         | CSRF/同源           | 限流                                                                     | 入口                                                                                                                        |
| ------------------------------------------- | --------- | ---------------------------- | ------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `/api/v1/sync/state`                        | `GET`     | 账号                         | 同源，无 token CSRF | `sync-state-get`                                                         | [app/api/v1/sync/state/route.ts](../../../app/api/v1/sync/state/route.ts)                                                   |
| `/api/v1/sync/state`                        | `PUT`     | 账号                         | 同源 + 账号 CSRF    | `sync-state-put`                                                         | [app/api/v1/sync/state/route.ts](../../../app/api/v1/sync/state/route.ts)                                                   |
| `/api/v1/sync/ping`                         | `POST`    | 账号                         | 同源 + body CSRF    | `sync-ping`                                                              | [app/api/v1/sync/ping/route.ts](../../../app/api/v1/sync/ping/route.ts)                                                     |
| `/api/v1/sync/import-backup-code`           | `POST`    | 账号                         | 同源 + 账号 CSRF    | `import-backup-code` + backup-code 维度 + backup lock                    | [app/api/v1/sync/import-backup-code/route.ts](../../../app/api/v1/sync/import-backup-code/route.ts)                         |
| `/api/v1/auth/login`                        | `POST`    | 无 session，登录凭据         | 同源，无 token CSRF | `login` + username/IP + 凭据锁                                           | [app/api/v1/auth/login/route.ts](../../../app/api/v1/auth/login/route.ts)                                                   |
| `/api/v1/auth/register`                     | `POST`    | 无 session，注册             | 同源，无 token CSRF | `register` + username/IP                                                 | [app/api/v1/auth/register/route.ts](../../../app/api/v1/auth/register/route.ts)                                             |
| `/api/v1/auth/change-password`              | `POST`    | 账号                         | 同源 + 账号 CSRF    | `change-password` + 凭据锁                                               | [app/api/v1/auth/change-password/route.ts](../../../app/api/v1/auth/change-password/route.ts)                               |
| `/api/v1/auth/logout`                       | `POST`    | 可选账号                     | 同源 + 账号 CSRF    | `auth-logout`                                                            | [app/api/v1/auth/logout/route.ts](../../../app/api/v1/auth/logout/route.ts)                                                 |
| `/api/v1/auth/logout-all`                   | `POST`    | 可选账号                     | 同源 + 账号 CSRF    | `auth-logout-all`                                                        | [app/api/v1/auth/logout-all/route.ts](../../../app/api/v1/auth/logout-all/route.ts)                                         |
| `/api/v1/account/me`                        | `GET`     | 可选账号                     | 同源，无 token CSRF | `account-me`                                                             | [app/api/v1/account/me/route.ts](../../../app/api/v1/account/me/route.ts)                                                   |
| `/api/v1/account/export`                    | `GET`     | 账号                         | 同源，无 token CSRF | `account-export`                                                         | [app/api/v1/account/export/route.ts](../../../app/api/v1/account/export/route.ts)                                           |
| `/api/v1/account/delete-data`               | `DELETE`  | 账号                         | 同源 + 账号 CSRF    | `account-delete-data`                                                    | [app/api/v1/account/delete-data/route.ts](../../../app/api/v1/account/delete-data/route.ts)                                 |
| `/api/v1/account/delete`                    | `DELETE`  | 账号                         | 同源 + 账号 CSRF    | `account-delete`                                                         | [app/api/v1/account/delete/route.ts](../../../app/api/v1/account/delete/route.ts)                                           |
| `/api/v1/account/sso/grants`                | `GET`     | 账号                         | 同源，无 token CSRF | `account-list-sso-grants`                                                | [app/api/v1/account/sso/grants/route.ts](../../../app/api/v1/account/sso/grants/route.ts)                                   |
| `/api/v1/account/sso/grants/[clientId]`     | `DELETE`  | 账号                         | 同源 + 账号 CSRF    | `account-revoke-sso-grant` + client 维度                                 | [app/api/v1/account/sso/grants/[clientId]/route.ts](../../../app/api/v1/account/sso/grants/%5BclientId%5D/route.ts)         |
| `/api/v1/admin/auth/login`                  | `POST`    | 无 admin session，管理员凭据 | 同源，无 token CSRF | `admin-login` + username/IP                                              | [app/api/v1/admin/auth/login/route.ts](../../../app/api/v1/admin/auth/login/route.ts)                                       |
| `/api/v1/admin/auth/logout`                 | `POST`    | 管理员                       | 同源 + admin CSRF   | `admin-logout`，超限仍继续登出                                           | [app/api/v1/admin/auth/logout/route.ts](../../../app/api/v1/admin/auth/logout/route.ts)                                     |
| `/api/v1/admin/me`                          | `GET`     | 管理员                       | 同源，无 token CSRF | `admin-me`                                                               | [app/api/v1/admin/me/route.ts](../../../app/api/v1/admin/me/route.ts)                                                       |
| `/api/v1/admin/users`                       | `GET`     | 管理员                       | 同源，无 token CSRF | `admin-list-users`                                                       | [app/api/v1/admin/users/route.ts](../../../app/api/v1/admin/users/route.ts)                                                 |
| `/api/v1/admin/users/[id]`                  | `GET`     | 管理员                       | 同源，无 token CSRF | `admin-user-detail` + target-user 维度                                   | [app/api/v1/admin/users/[id]/route.ts](../../../app/api/v1/admin/users/%5Bid%5D/route.ts)                                   |
| `/api/v1/admin/users/[id]/reset-password`   | `POST`    | 管理员                       | 同源 + admin CSRF   | `admin-reset-password` + target-user 维度                                | [app/api/v1/admin/users/[id]/reset-password/route.ts](../../../app/api/v1/admin/users/%5Bid%5D/reset-password/route.ts)     |
| `/api/v1/admin/users/[id]/enable`           | `POST`    | 管理员                       | 同源 + admin CSRF   | `admin-enable-user` + target-user 维度                                   | [app/api/v1/admin/users/[id]/enable/route.ts](../../../app/api/v1/admin/users/%5Bid%5D/enable/route.ts)                     |
| `/api/v1/admin/users/[id]/disable`          | `POST`    | 管理员                       | 同源 + admin CSRF   | `admin-disable-user` + target-user 维度                                  | [app/api/v1/admin/users/[id]/disable/route.ts](../../../app/api/v1/admin/users/%5Bid%5D/disable/route.ts)                   |
| `/api/v1/admin/users/[id]/restore`          | `POST`    | 管理员                       | 同源 + admin CSRF   | `admin-restore-user` + target-user 维度                                  | [app/api/v1/admin/users/[id]/restore/route.ts](../../../app/api/v1/admin/users/%5Bid%5D/restore/route.ts)                   |
| `/api/v1/admin/users/[id]/sessions`         | `DELETE`  | 管理员                       | 同源 + admin CSRF   | `admin-delete-user-sessions` + target-user 维度                          | [app/api/v1/admin/users/[id]/sessions/route.ts](../../../app/api/v1/admin/users/%5Bid%5D/sessions/route.ts)                 |
| `/api/v1/admin/users/[id]/data`             | `DELETE`  | 管理员                       | 同源 + admin CSRF   | `admin-clear-user-data` + target-user 维度                               | [app/api/v1/admin/users/[id]/data/route.ts](../../../app/api/v1/admin/users/%5Bid%5D/data/route.ts)                         |
| `/api/v1/admin/announcements`               | `GET`     | 管理员                       | 同源，无 token CSRF | `admin-list-announcements`                                               | [app/api/v1/admin/announcements/route.ts](../../../app/api/v1/admin/announcements/route.ts)                                 |
| `/api/v1/admin/announcements`               | `POST`    | 管理员                       | 同源 + admin CSRF   | `admin-create-announcement`                                              | [app/api/v1/admin/announcements/route.ts](../../../app/api/v1/admin/announcements/route.ts)                                 |
| `/api/v1/admin/announcements/[id]`          | `GET`     | 管理员                       | 同源，无 token CSRF | `admin-get-announcement`                                                 | [app/api/v1/admin/announcements/[id]/route.ts](../../../app/api/v1/admin/announcements/%5Bid%5D/route.ts)                   |
| `/api/v1/admin/announcements/[id]`          | `PUT`     | 管理员                       | 同源 + admin CSRF   | `admin-update-announcement`                                              | [app/api/v1/admin/announcements/[id]/route.ts](../../../app/api/v1/admin/announcements/%5Bid%5D/route.ts)                   |
| `/api/v1/admin/announcements/[id]`          | `DELETE`  | 管理员                       | 同源 + admin CSRF   | `admin-archive-announcement`                                             | [app/api/v1/admin/announcements/[id]/route.ts](../../../app/api/v1/admin/announcements/%5Bid%5D/route.ts)                   |
| `/api/v1/admin/announcements/[id]`          | `PATCH`   | 管理员                       | 同源 + admin CSRF   | `admin-restore-announcement`                                             | [app/api/v1/admin/announcements/[id]/route.ts](../../../app/api/v1/admin/announcements/%5Bid%5D/route.ts)                   |
| `/api/v1/admin/announcements/[id]/versions` | `GET`     | 管理员                       | 同源，无 token CSRF | `admin-list-announcement-versions`                                       | [app/api/v1/admin/announcements/[id]/versions/route.ts](../../../app/api/v1/admin/announcements/%5Bid%5D/versions/route.ts) |
| `/api/v1/admin/announcements/preview`       | `POST`    | 管理员                       | 同源 + admin CSRF   | `admin-preview-announcement`                                             | [app/api/v1/admin/announcements/preview/route.ts](../../../app/api/v1/admin/announcements/preview/route.ts)                 |
| `/api/v1/admin/sso/clients`                 | `GET`     | 管理员                       | 同源，无 token CSRF | `admin-list-sso-clients`                                                 | [app/api/v1/admin/sso/clients/route.ts](../../../app/api/v1/admin/sso/clients/route.ts)                                     |
| `/api/v1/admin/sso/clients`                 | `POST`    | 管理员                       | 同源 + admin CSRF   | `admin-create-sso-client`                                                | [app/api/v1/admin/sso/clients/route.ts](../../../app/api/v1/admin/sso/clients/route.ts)                                     |
| `/api/v1/admin/sso/clients/[id]`            | `GET`     | 管理员                       | 同源，无 token CSRF | `admin-get-sso-client` + client 维度                                     | [app/api/v1/admin/sso/clients/[id]/route.ts](../../../app/api/v1/admin/sso/clients/%5Bid%5D/route.ts)                       |
| `/api/v1/admin/sso/clients/[id]`            | `PUT`     | 管理员                       | 同源 + admin CSRF   | `admin-update-sso-client` + client 维度                                  | [app/api/v1/admin/sso/clients/[id]/route.ts](../../../app/api/v1/admin/sso/clients/%5Bid%5D/route.ts)                       |
| `/api/v1/admin/sso/clients/[id]`            | `DELETE`  | 管理员                       | 同源 + admin CSRF   | `admin-delete-sso-client` + client 维度                                  | [app/api/v1/admin/sso/clients/[id]/route.ts](../../../app/api/v1/admin/sso/clients/%5Bid%5D/route.ts)                       |
| `/api/v1/sso/authorize`                     | `GET`     | 可选账号，SSO client 参数    | 无 token CSRF       | `sso-authorize` + client/IP                                              | [app/api/v1/sso/authorize/route.ts](../../../app/api/v1/sso/authorize/route.ts)                                             |
| `/api/v1/sso/validate`                      | `POST`    | SSO `client_secret`          | 无 token CSRF       | `sso-validate` + client/ticket/IP + 失败桶                               | [app/api/v1/sso/validate/route.ts](../../../app/api/v1/sso/validate/route.ts)                                               |
| `/api/v1/sso/status`                        | `POST`    | SSO `client_secret`          | 无 token CSRF       | `sso-status` + client/user/IP + invalid-client 失败桶                    | [app/api/v1/sso/status/route.ts](../../../app/api/v1/sso/status/route.ts)                                                   |
| `/api/v1/sso/dispatch-callbacks`            | `POST`    | `x-dispatch-secret`          | 无 token CSRF       | `sso-dispatch-callbacks` + invalid-secret 失败桶                         | [app/api/v1/sso/dispatch-callbacks/route.ts](../../../app/api/v1/sso/dispatch-callbacks/route.ts)                           |
| `/api/v1/announcements`                     | `GET`     | 可选账号                     | 无 token CSRF       | `announcements-public-read`                                              | [app/api/v1/announcements/route.ts](../../../app/api/v1/announcements/route.ts)                                             |
| `/api/v1/analytics/visitors`                | `GET`     | 无                           | 无 token CSRF       | `analytics-visitors-public-read`；30 秒后台缓存                          | [app/api/v1/analytics/visitors/route.ts](../../../app/api/v1/analytics/visitors/route.ts)                                   |
| `/api/v1/analytics/visitors`                | `OPTIONS` | 无                           | 无                  | 无显式限流                                                               | [app/api/v1/analytics/visitors/route.ts](../../../app/api/v1/analytics/visitors/route.ts)                                   |
| `/api/v1/backups`                           | `POST`    | 无账号，legacy code-based    | 无 token CSRF       | `checkRecentBackupAccessByIp(created_at)` + upload IP 限流 + backup lock | [app/api/v1/backups/route.ts](../../../app/api/v1/backups/route.ts)                                                         |
| `/api/v1/backups`                           | `OPTIONS` | 无                           | 无                  | 无显式限流                                                               | [app/api/v1/backups/route.ts](../../../app/api/v1/backups/route.ts)                                                         |
| `/api/v1/backups/[code]`                    | `GET`     | 无账号，code-based           | 无 token CSRF       | `checkRecentBackupAccessByIp(last_accessed)` + backup lock               | [app/api/v1/backups/[code]/route.ts](../../../app/api/v1/backups/%5Bcode%5D/route.ts)                                       |
| `/api/v1/backups/[code]`                    | `DELETE`  | 无账号，code-based           | 无 token CSRF       | code/IP 限流 + backup lock                                               | [app/api/v1/backups/[code]/route.ts](../../../app/api/v1/backups/%5Bcode%5D/route.ts)                                       |
| `/api/v1/backups/[code]`                    | `OPTIONS` | 无                           | 无                  | 无显式限流                                                               | [app/api/v1/backups/[code]/route.ts](../../../app/api/v1/backups/%5Bcode%5D/route.ts)                                       |
| `/api/v1/backups/[code]/metadata`           | `GET`     | 无账号，code-based           | 无 token CSRF       | code/IP 限流                                                             | [app/api/v1/backups/[code]/metadata/route.ts](../../../app/api/v1/backups/%5Bcode%5D/metadata/route.ts)                     |
| `/api/v1/backups/[code]/metadata`           | `OPTIONS` | 无                           | 无                  | 无显式限流                                                               | [app/api/v1/backups/[code]/metadata/route.ts](../../../app/api/v1/backups/%5Bcode%5D/metadata/route.ts)                     |
| `/api/v1/backups/cleanup`                   | `DELETE`  | `x-cleanup-secret`           | 无 token CSRF       | invalid-secret IP 限流；内部并发限制 + locks                             | [app/api/v1/backups/cleanup/route.ts](../../../app/api/v1/backups/cleanup/route.ts)                                         |
| `/api/v1/backups/cleanup`                   | `OPTIONS` | 无                           | 无                  | 无显式限流                                                               | [app/api/v1/backups/cleanup/route.ts](../../../app/api/v1/backups/cleanup/route.ts)                                         |

## Server Actions 暴露面

| 文件/函数组                                                                                                                                                                                                                                     | 鉴权                                               | CSRF/同源                                              | 限流                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| [app/lib/account/actions/auth.ts](../../../app/lib/account/actions/auth.ts) `loginAccountAction`, `registerAccountAction`                                                                                                                       | 无 session，凭据/注册数据                          | 同源，无 token CSRF                                    | `login` / `register`，登录另有凭据锁                                             |
| [app/lib/account/actions/auth.ts](../../../app/lib/account/actions/auth.ts) `fetchAccountMeAction`                                                                                                                                              | 可选账号                                           | 同源，无 token CSRF                                    | `account-me`                                                                     |
| [app/lib/account/actions/auth.ts](../../../app/lib/account/actions/auth.ts) `changeAccountPasswordAction`, `logoutAccountAction`, `logoutAllAccountSessionsAction`, `exportAccountDataAction`, `deleteAccountDataAction`, `deleteAccountAction` | 账号                                               | 同源；写操作要求账号 CSRF，导出无 token CSRF           | 账号限流 scope                                                                   |
| [app/lib/account/actions/sync.ts](../../../app/lib/account/actions/sync.ts) `fetchSyncStateAction`                                                                                                                                              | 账号                                               | 同源，无 token CSRF                                    | `sync-state-get`                                                                 |
| [app/lib/account/actions/sync.ts](../../../app/lib/account/actions/sync.ts) `putSyncStateAction`, `importBackupCodeAction`                                                                                                                      | 账号                                               | 同源 + 账号 CSRF                                       | `sync-state-put` / `import-backup-code` + backup-code 维度，导入另有 backup lock |
| [app/lib/account/actions/ssoGrants.ts](../../../app/lib/account/actions/ssoGrants.ts) `refreshAccountSsoGrantsAction`, `revokeAccountSsoGrantAction`                                                                                            | 账号                                               | 同源；刷新无 token CSRF，撤销有账号 CSRF               | 均有账号限流；撤销含 client 维度                                                 |
| [app/lib/account/actions/legacyBackups.ts](../../../app/lib/account/actions/legacyBackups.ts) legacy backup actions                                                                                                                             | 无账号，code-based                                 | 无 token CSRF                                          | 上传/下载继承 DB 频率限制；metadata/delete 走 code/IP 服务层限流                 |
| [app/components/announcementActions.ts](../../../app/components/announcementActions.ts) `dismissAnnouncementAction`                                                                                                                             | 可选账号                                           | 同源；登录态校验账号 CSRF                              | `announcement-dismiss` + announcement 维度                                       |
| [app/(pages)/sso/authorize/page.tsx](<../../../app/(pages)/sso/authorize/page.tsx>) `agreeSsoAuthorize`, `cancelSsoAuthorize`                                                                                                                   | `agree` 要账号；`cancel` 只依赖 SSO context cookie | 同源；校验 transaction/context                         | `sso-authorize-agree` / `sso-authorize-cancel`                                   |
| [app/(pages)/admin/actions.ts](<../../../app/(pages)/admin/actions.ts>) admin overview actions                                                                                                                                                  | 登录 action 用管理员凭据；其余管理员               | 同源；登出有 admin CSRF，读 action 无 token CSRF       | 均有账号限流 scope，登出超限仍继续                                               |
| [app/(pages)/admin/users/[id]/actions.ts](<../../../app/(pages)/admin/users/%5Bid%5D/actions.ts>) admin user detail actions                                                                                                                     | 管理员                                             | 同源；详情刷新无 token CSRF，修改类有 admin CSRF       | 均有账号限流 scope + target-user 维度                                            |
| [app/(pages)/admin/announcements/actions.ts](<../../../app/(pages)/admin/announcements/actions.ts>) admin announcement actions                                                                                                                  | 管理员                                             | 同源；列表/详情/版本无 token CSRF，修改类有 admin CSRF | 均有账号限流 scope                                                               |
| [app/(pages)/admin/sso/actions.ts](<../../../app/(pages)/admin/sso/actions.ts>) admin SSO client actions                                                                                                                                        | 管理员                                             | 同源 + admin CSRF                                      | create/update/delete scope；update/delete 含 client 维度                         |

## 运行时加载边界

本轮已将高风险/重依赖服务改为“轻量 guard / parser 先行，重服务按需加载”：

- 公告：前台关闭 action、后台公告 API routes 和后台公告 Server Actions 均先完成账号/管理员 guard、body 读取和 payload parser，再动态加载 `app/lib/announcements/server/service.ts`。
- SSO：`/api/v1/sso/authorize`、`validate`、`status`、`dispatch-callbacks` 和 `/sso/authorize` 页面静态依赖 `ssoValidation.ts` / `ssoContext.ts`，在参数、限流、cookie context、账号状态等轻量校验通过后再动态加载 `app/lib/account/server/sso.ts`。
- 管理员 SSO client：API routes 和 `app/(pages)/admin/sso/actions.ts` 先完成管理员 guard，再动态加载 payload parser 与 `adminSsoClientService.ts`；service 内部只静态依赖轻量校验，读取 SSO client 时再动态加载 `sso.ts`。
- legacy backup：API routes 和 `legacyBackups.ts` 先用 `legacyBackupCode.ts` 校验 UUID code，再动态加载 `legacyBackup.ts` 做上传、下载、metadata、删除和锁/频率逻辑。

剩余 `from './sso'` 静态引用位于 DB migration 与 repository 内部同名模块，不是 `app/lib/account/server/sso.ts` 的入口加载问题。

## 本轮已补齐的限流缺口

- `GET /api/v1/sync/state` 与 `fetchSyncStateAction` 已补 `sync-state-get`；客户端同步队列已读取 action error data 中的 `retry_after`，遇到 429 时按 `Retry-After` 延迟重试，避免自动同步密集重放。
- `GET /api/v1/account/me` 与 `fetchAccountMeAction` 已补 `account-me`，覆盖登录态与未登录态读取。
- `GET /api/v1/announcements` 已补 `announcements-public-read`；`dismissAnnouncementAction` 已增加 announcement id 维度分桶。
- `GET /api/v1/analytics/visitors` 已补 `analytics-visitors-public-read`，继续保留 30 秒后台缓存；`OPTIONS` 仍保持简单预检响应。
- legacy backup metadata/delete 已统一走服务层 code/IP 限流，REST 和 Server Actions 一致；upload 失败路径增加短期 IP 限流，cleanup invalid secret 增加 IP 限流。
- SSO validate/status 对 invalid client、invalid ticket 增加失败桶，dispatch callbacks 对 invalid secret 增加失败桶。
- admin user 详情/修改 routes 与 actions 增加 target-user 维度；account SSO grant revoke 与 admin SSO client 详情/修改/删除增加 client 维度。

## 浏览器侧 429 兼容

- 同步队列的 `PUT /sync/state`、`GET /sync/state` 读刷新、state epoch mismatch 后的远端刷新、跨标签被动刷新均保留 401/403 特殊处理，同时将 429 识别为限流错误并按 `Retry-After` 延迟下一次同步，不误判为登录失效、密码问题、CSRF 或数据冲突。
- `fetchAccountMeAction` 的 429 会保留 `retry_after` 到 `AccountApiError`；bootstrap 仍显示通用账号初始化失败并等待 focus/online 触发重试，不自动密集重放。
- `GET /api/v1/analytics/visitors` 429 时页脚在线人数不会显示成服务端数据错误；客户端读取 `Retry-After` 并暂停轮询到窗口后。
- legacy backup、账号导入备份码、公告关闭、后台用户修改、后台 SSO client 修改等显式用户动作不自动重放；这些路径保留可理解的限流提示或静默失败，不把 429 映射为备份不存在、数据损坏、登录失效或权限错误。

## 未鉴权但有限流或密钥

- 登录/注册类：无 session，但同源并按 `login` / `register` scope 限流。
- SSO client-facing API：`authorize`、`validate`、`status`、`dispatch-callbacks` 依赖 SSO 参数、`client_secret` 或 dispatch secret，并走 SSO 限流。
- legacy backup `POST`/`GET`：无账号，依赖备份 code 和 `checkRecentBackupAccessByIp`。
- cleanup：依赖 `x-cleanup-secret`，secret 失败路径有 IP 限流。

## 仍保持无业务 handler 限流的入口

- `OPTIONS` 预检接口：`analytics/visitors`、`backups*`、`backups/cleanup` 仍无鉴权、无 CSRF、无业务 handler 限流，保持简单 CORS 预检响应；异常高频应由边缘层或统一中间层处理。

## 鉴权与限流落地结果

本节记录已落地结果，不再区分“最建议优先落地的改动”。除单独说明外，REST API 与对应 Server Actions 保持一致策略，避免修补 route handler 后留下 action 直调用绕过路径。当前账号/SSO helper 已支持业务对象维度分桶；阈值仍沿用默认窗口，若后续需要按 scope 配不同窗口，可在 helper options 中继续扩展 `limit/windowMs`。

### 统一原则

- 所有账号、管理员敏感读取接口都应有显式限流；读限流可以比写限流宽松，但不应完全缺失。
- 浏览器可触发的写操作保持 `same-origin + CSRF + rate limit`；外部机器调用的 SSO/cleanup 接口使用 client secret 或运维 secret，不要求 CSRF。
- 区分登录态分桶：未登录按可信 IP 与业务标识分桶；已登录按账号 ID、管理员 session、账号 session 与可信 IP 分桶；外部服务按 `client_id` / ticket / user / IP 等业务维度分桶。
- destructive 操作、凭据操作、导出操作、SSO secret 操作使用独立 scope，不与普通读取共享阈值。

### 账号登录与注册

- `POST /api/v1/auth/login` 与 `loginAccountAction` 保持未登录可访问、同源、无 token CSRF；继续使用 `login` scope、用户名/IP 限流与凭据锁。落地时保留 `ip + username`、`username`、`ip` 多层分桶，避免单 IP 打一个用户或多 IP 打同一用户。
- `POST /api/v1/auth/register` 与 `registerAccountAction` 保持未登录可访问、同源、无 token CSRF；继续按 `register` scope 限流。落地时增加规范化用户名维度，使用 `ip + username`、`username`、`ip` 分桶，减少批量占名。
- `POST /api/v1/auth/change-password` 与 `changeAccountPasswordAction` 保持账号鉴权、同源、账号 CSRF、`change-password` 限流与凭据锁。落地时按 `userId + ip` 分桶，并保持比普通写操作更严格的阈值。

### 账号状态、资料与删除

- `GET /api/v1/account/me` 与 `fetchAccountMeAction` 保持可选账号和同源；补轻量限流。未登录按 `ip` 分桶，已登录按 `userId/sessionId + ip` 分桶，阈值可宽于写接口。
- `GET /api/v1/account/export` 与 `exportAccountDataAction` 保持账号鉴权、同源、无 token CSRF、`account-export` 限流；不额外增加冷却时间。落地时确认分桶包含 `userId + ip`，与普通读写 scope 隔离。
- `DELETE /api/v1/account/delete-data`、`DELETE /api/v1/account/delete` 及对应 actions 保持账号鉴权、同源、账号 CSRF 与独立限流 scope。落地时按 `userId + ip` 分桶，保持 destructive 操作的低阈值。

### 同步接口

- `GET /api/v1/sync/state` 与 `fetchSyncStateAction` 保持账号鉴权和同源；补账号读取限流，按 `userId/sessionId + ip` 分桶。落地时必须同时适配客户端同步队列：客户端遇到 429 时应进入退避/重试队列，尊重 `Retry-After`，避免自动同步在限流窗口内密集重放。
- `PUT /api/v1/sync/state` 与 `putSyncStateAction` 保持账号鉴权、同源、账号 CSRF 与 `sync-state-put` 限流。落地时确认分桶包含 `userId + ip`；超业务体积的请求应返回 `payload-too-large`，并避免把正常队列重试放大成连续写入。
- `POST /api/v1/sync/ping` 保持账号鉴权、body CSRF 与 `sync-ping` 限流。落地时使用较宽的 `userId + ip` 分桶，避免心跳类请求与重写操作共享过严阈值。
- `POST /api/v1/sync/import-backup-code` 与 `importBackupCodeAction` 保持账号鉴权、账号 CSRF、`import-backup-code` 限流与 backup lock。落地时增加 `backupCode + userId/ip` 短期失败分桶，减少枚举或重复导入尝试。

### 账号 SSO 授权应用

- `GET /api/v1/account/sso/grants` 与 `refreshAccountSsoGrantsAction` 保持账号鉴权、同源和账号读限流；落地时按 `userId + ip` 分桶。
- `DELETE /api/v1/account/sso/grants/[clientId]` 与 `revokeAccountSsoGrantAction` 保持账号鉴权、同源、账号 CSRF 与账号写限流；落地时按 `userId + clientId + ip` 分桶。

### 管理员登录与后台账号管理

- `POST /api/v1/admin/auth/login` 保持未登录可访问、同源、无 token CSRF 与 `admin-login` 限流。落地时使用 `ip + username`、`username`、`ip` 多层分桶，阈值应比普通账号登录更严格。
- `GET /api/v1/admin/me` 与 admin overview 读 actions 保持管理员鉴权、同源和读限流；落地时按 `adminSession + ip` 分桶。
- admin users 列表和详情接口保持管理员鉴权、同源和读限流；落地时列表接口比详情接口更严格，列表按 `adminSession + ip` 分桶，详情可增加 `targetUserId` 维度。
- admin users 修改接口保持管理员鉴权、同源、admin CSRF 和独立写限流；落地时 destructive 或跨账号影响操作按 `adminSession + targetUserId + ip` 分桶。

### 公告接口

- `GET /api/v1/announcements` 保持公开/可选账号，不强制登录；补低成本 IP 限流或边缘层限流。未登录按 `ip` 分桶，已登录按 `userId + ip` 分桶，并继续优先利用缓存和可见性过滤。
- `dismissAnnouncementAction` 保持可选账号、同源、登录态账号 CSRF 和 `announcement-dismiss` 限流。未登录 dismissal 按 cookie/token + IP 分桶，已登录按 `userId + announcementId + ip` 分桶。
- 后台公告 API 与 Server Actions 保持管理员鉴权、读操作无 token CSRF、写操作 admin CSRF 和现有后台限流。落地时列表/详情/版本读取使用较宽后台读 scope，创建/更新/归档/恢复/预览使用更严格后台写 scope；预览同样保留限流。

### 管理员 SSO Client

- `GET /api/v1/admin/sso/clients` 与详情读取保持管理员鉴权、同源和读限流；落地时按 `adminSession + ip` 分桶，详情可增加 `clientId` 维度。
- 创建、更新、删除 SSO client 保持管理员鉴权、同源、admin CSRF 与独立写限流。落地时删除、secret 生成、secret 更新、启停状态变更按 `adminSession + clientId + ip` 分桶；生成 secret 和 toggle 继续走 update scope，但阈值按敏感操作设计。

### 外部 SSO

- `GET /api/v1/sso/authorize` 保持无 token CSRF，因为它是外部 client 发起的授权入口；继续使用参数校验、client/IP 限流。落地时按 `client_id + ip` 分桶，对无效 `client_id` 也按 IP 限制，减少 client 枚举。
- `POST /api/v1/sso/validate` 保持 `client_secret` 鉴权、无 CSRF 与 SSO 限流。落地时按 `client_id + ticket + ip` 分桶；ticket 或 secret 失败使用更严格失败桶，错误响应避免泄露细节。
- `POST /api/v1/sso/status` 保持 `client_secret` 鉴权、无 CSRF 与 SSO 限流。落地时按 `client_id + user_id + ip` 分桶，减少外部 client 批量探测用户状态。
- `POST /api/v1/sso/dispatch-callbacks` 保持 `x-dispatch-secret` 鉴权和 SSO 限流。落地时对 secret 失败按 IP 使用更严格限流，并尽量限制为 cron 或可信来源调用。
- `/sso/authorize` 页面内联 `agreeSsoAuthorize` / `cancelSsoAuthorize` Server Actions 保持 context transaction 校验；补 same-origin guard 与轻量限流。`agree` 按 `userId + clientId + ip` 分桶，`cancel` 按 `transactionId/clientId + ip` 分桶。

### Legacy Backup

- `POST /api/v1/backups` 保持无账号、legacy code-based、上传频率限制与 backup lock。落地时按 `ip + backupCode/createdCode` 增加分桶，失败上传也计入短期 IP 限流。
- `GET /api/v1/backups/[code]` 保持 code-based 下载、频率限制与 backup lock。落地时按 `code + ip` 分桶，避免只按 IP 误伤共享网络，也避免只按 code 放过扫号。
- `DELETE /api/v1/backups/[code]` 补与下载一致或更严格的 `code + ip` 限流，保留 backup lock；后续可评估删除 token、最近访问校验或迁移到登录态导入后的删除流程。
- `GET /api/v1/backups/[code]/metadata` 与 `fetchLegacyBackupMetadataAction` 补 `code + ip` 限流；错误响应尽量统一，减少通过 metadata 探测记录存在和时间戳。
- legacy backup Server Actions 与对应 REST 策略保持一致。上传/下载继续继承服务层限流，metadata/delete 也应走同一服务层限流，避免 route handler 与 Server Action 策略不一致。
- `DELETE /api/v1/backups/cleanup` 保持 `x-cleanup-secret` 与内部并发限制；补 IP/secret 失败限流，并限制为 cron 或可信来源调用。

### 公开统计与 OPTIONS

- `GET /api/v1/analytics/visitors` 保持公开无鉴权与 30 秒后台缓存；补边缘层或应用层低成本 IP 限流。
- `OPTIONS` 预检接口保持无鉴权、无 CSRF、简单响应；异常高频 OPTIONS 由边缘层或统一中间层限流处理，不在业务 handler 中增加复杂逻辑。
