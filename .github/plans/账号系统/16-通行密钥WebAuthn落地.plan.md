---
name: 通行密钥WebAuthn落地
overview: 为账号系统新增 WebAuthn 通行密钥能力的方案、设计决策、数据模型、API、客户端接入与账号生命周期联动的实施清单。
isProject: false
---

# 通行密钥（WebAuthn / Passkey）落地

> 日期：2026-06-26
> 来源：账号系统在用户名口令之外补充无密码强认证的需求评估结论。
> 依赖：账号系统服务端已落地（见 [01-服务端与数据库落地.plan.md](01-服务端与数据库落地.plan.md)、[02-认证会话与管理员落地.plan.md](02-认证会话与管理员落地.plan.md)、[13-账号系统本体补强实施清单.plan.md](13-账号系统本体补强实施清单.plan.md)）。

## 一、范围与目标

| 编号 | 能力                                      | 定位   | 说明                                                                                                   |
| ---- | ----------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| P1   | 已注册用户新建/删除通行密钥               | 核心   | 登录态下在账号窗口管理自己的通行密钥，可命名、可删除                                                   |
| P2   | 免用户名通行密钥登录                      | 核心   | 使用 discoverable credential（resident key），登录时不输入用户名，浏览器/系统直接出示可用通行密钥      |
| P3   | 口令登录继续可用                          | 不回退 | 通行密钥是口令之外的“附加凭证”，不替换现有口令登录                                                     |
| P4   | 用户主动删除账号时正确处理通行密钥        | 核心   | 账号逻辑删除时清除其全部通行密钥，删除后这些凭证不可再用于登录                                         |
| P5   | 未注册用户仍走现有注册流程                | 边界   | 通行密钥不是注册手段；口令为必填项，注册流程不变                                                       |
| P6   | 管理员可见相关审计                        | 核心   | 通行密钥注册、删除、登录成功/失败、管理员吊销均写入 `scope=account` 审计，复用 `/admin/audit` 查询     |
| P7   | 管理员重置密码/禁用账号时正确处理通行密钥 | 核心   | 重置密码视为凭证吊销场景，连同通行密钥一并吊销；禁用账号在认证期按状态拦截                             |
| P8   | SSO 登录支持通行密钥                      | 核心   | 外部客户端引导到主站登录时，登录界面同样提供通行密钥登录；成功后照常 302/`redirect_to` 进入 SSO 授权页 |

非目标（见“暂不纳入”）：通行密钥作为唯一凭证、注册即创建通行密钥、跨设备 QR 引导自定义、MFA 分级、attestation 厂商白名单。

## 二、现有能力与可复用点

- 账号能力运行门禁与动态导入：账号服务端、SQLite、Argon2 仅在 `SELF_HOSTED` 为真且非 Vercel/offline、SQLite 可写时启用并动态加载（见 [app/lib/account/server/environment.ts](../../../app/lib/account/server/environment.ts)、[app/lib/account/server/db.ts](../../../app/lib/account/server/db.ts)）。通行密钥服务端模块沿用同一门禁与动态导入约束。
- 会话与 Cookie：[app/lib/account/server/auth.ts](../../../app/lib/account/server/auth.ts) 的 `createAccountSessionForActiveUser`、`setAccountSessionCookie`、`createAccountCsrfToken`，以及 [app/lib/account/server/session.ts](../../../app/lib/account/server/session.ts) 的 token/HMAC/cookie 选项，**通行密钥登录直接复用**，产出与口令登录完全一致的 `mystia-session` 会话与 CSRF。
- 登录收尾：[app/api/v1/auth/login/route.ts](../../../app/api/v1/auth/login/route.ts) 中“建会话 → SSO context 重定向或 JSON 返回 → 写 cookie”这一段需抽取为共享收尾函数，供口令登录与通行密钥登录复用。
- 审计：[app/lib/account/server/accountAuditService.ts](../../../app/lib/account/server/accountAuditService.ts) 的 `ACCOUNT_AUDIT_ACTION_MAP`、`createAccountUserAuditLogInput`、`createAccountAdminAuditLogInput`、`writeAccountAuditLogInTransaction`、`writeAccountAuditLogBestEffort`，新增动作常量即可接入既有 `/admin/audit`。
- 凭证锁定/限流：[app/lib/account/server/repositories/credentials.ts](../../../app/lib/account/server/repositories/credentials.ts) 的失败计数与锁定仅作用于口令；通行密钥认证使用请求维度限流，不复用口令的 `failed_attempts`（见“安全与边界”）。
- 迁移与表名：[app/lib/db/migrations/account.ts](../../../app/lib/db/migrations/account.ts) 的 Kysely `createTable().ifNotExists()` + 索引幂等 + 列补齐 + 结构断言（主键/外键/唯一索引）；[app/lib/db/constant.ts](../../../app/lib/db/constant.ts) 的 `TABLE_NAME_MAP`；[app/lib/db/types.d.ts](../../../app/lib/db/types.d.ts) 的 `ITable*` 与 `TDatabase`。
- 账号生命周期仓储：[app/lib/account/server/repositories/users.ts](../../../app/lib/account/server/repositories/users.ts) 的 `setUserStatusAndDeleteSessionsWithAudit`（删除账号）、`disableUserAndDeleteSessionsWithSsoCallbacksAndAudit`（禁用），以及 [credentials.ts](../../../app/lib/account/server/repositories/credentials.ts) 的 `updateCredentialAndDeleteSessionsWithAudit`（管理员重置密码），均在事务内补一条“删除该用户通行密钥”的语句即可联动。
- 客户端状态与广播：[app/stores/account.ts](../../../app/stores/account.ts)（davstack store）、[app/lib/account/client/broadcast.ts](../../../app/lib/account/client/broadcast.ts)（broadcast-channel 多标签页）、[app/lib/account/client/api.ts](../../../app/lib/account/client/api.ts)、[app/lib/account/client/components/accountManager.tsx](../../../app/lib/account/client/components/accountManager.tsx) 复用为通行密钥管理与登录入口。
- SSO 登录流程：登录界面即 [accountManager.tsx](../../../app/lib/account/client/components/accountManager.tsx)（无独立 SSO 登录页，仅有 [(pages)/sso/authorize](<../../../app/(pages)/sso/authorize/page.tsx>) 授权确认页）。[login/route.ts](../../../app/api/v1/auth/login/route.ts) 已据 `getSsoContextCookie` 处理：top-level 导航请求 302 到授权页，fetch/JSON 请求在响应体返回 `redirect_to` 由客户端导航。通行密钥登录复用同一登录界面与同一 SSO 收尾逻辑（P8）。

## 三、关键设计决策

1. **附加凭证，不替换口令**：通行密钥与口令并存。注册仍要求口令（P5），通行密钥只能由已登录用户为自己添加（P1）。这样设备丢失时仍可用口令登录，避免单凭证锁死账户。
2. **免用户名登录采用 discoverable credential**（P2）：注册时 `residentKey: 'required'`、`userVerification: 'preferred'`、`user.id` 作为 WebAuthn user handle。认证 options 的 `allowCredentials` 留空，浏览器据 RP ID 直接列出本机可用通行密钥；verify 时根据断言返回的 `credentialId` 反查 `user_id`，无需用户名输入。
3. **WebAuthn user handle = `users.id`（UUID）**：UUID 是随机非 PII，长度 < 64 字节，且账号主键稳定。**好处**：用户改用户名/昵称（见 [13](13-账号系统本体补强实施清单.plan.md) C/D 项）不影响已注册通行密钥。
4. **RP ID 取可注册父域，与 `ACCOUNT_COOKIE_DOMAIN` 对齐**：本项目以 `ACCOUNT_COOKIE_DOMAIN=.izakaya.cc` 做子域会话共享，并计划让子域（如 `app.izakaya.cc`）**自行弹出**通行密钥登录框（而非一律重定向回主站）。WebAuthn 规则要求 RP ID 必须是“仪式所在 origin 的域名本身或其可注册父域”，浏览器只允许向父域收敛、不允许挑子域/兄弟域。因此 `rpID` **必须取父域 `izakaya.cc`**（即 `ACCOUNT_COOKIE_DOMAIN` 去前导点），保证“会话跨子域共享”与“通行密钥跨子域共享”的边界一致：在 `izakaya.cc` 或任一子域注册/登录的通行密钥都通用。配置缺省时回退到 `baseOrigin` 的 host（本地 `localhost`）。**严禁**按各页面自身 host 推导 `rpID`，否则子域注册的凭证在主站不可用。SSO 外部客户端（loopback/custom-scheme/外站 https 回调）与 RP ID 无关，仍无感。
   4a. **双子域反代同一实例下的 origin 归属**：`izakaya.cc` 与 `assistant-bff.izakaya.cc` 是**同一个 Next.js 实例**，经同机 nginx 用两个子域反代——前者走 CDN（静态资源），后者直连绕开 CDN 缓存（账号/同步等 API）。浏览器页面在 `https://izakaya.cc`，通过 `assistant-bff.izakaya.cc` 跨子域（same-site）带 credentials 调 API。**WebAuthn 的 `rpID` 与 `expectedOrigin` 只取决于浏览器页面所在的前端 origin，与 API 子域无关**：`assistant-bff.izakaya.cc` 永远不是 `rpID`，也永远不进 `expectedOrigin`，它只是 options/verify 的请求地址。页面在 `izakaya.cc`、请求 `rpID=izakaya.cc` 浏览器放行；API 经哪个子域反代不影响该判断。因同属一实例，`webauthn_challenges` 落库与消费命中同一 SQLite，挑战与限流天然单实例一致。
   4b. **`expectedOrigin` 复用 `SERVICE_ALLOWED_ORIGINS`**：允许承载仪式的前端 origin 集合，正是已维护的 `SERVICE_ALLOWED_ORIGINS`（当前 `https://izakaya.cc`）。`getWebAuthnRelyingParty()` 返回 `expectedOrigin: string[]` 即解析自该 env，无需新增 origin 白名单 env。将来上线 `app.izakaya.cc` 前端时把它加入 `SERVICE_ALLOWED_ORIGINS`（本就为跨子域调 BFF 所必需），WebAuthn 自动随之放行。simplewebauthn 的 `verifyRegistrationResponse`/`verifyAuthenticationResponse` 原生支持 `expectedOrigin: string | string[]`。`rpID` 取这些 origin 的公共可注册父域并须与 `ACCOUNT_COOKIE_DOMAIN` 去点后一致（`izakaya.cc`），启动时校验每个允许 origin 的 host 都是 `rpID` 的同域/子域，否则 `server-misconfigured`。
5. **挑战服务端存储 + 短期 cookie 句柄**：仿 `sso_tickets` 落一张 `webauthn_challenges` 临时表（带 `expires_at`），ceremony 期间用一枚 httpOnly、`SameSite=Lax`、短 TTL 的 `mystia-webauthn` cookie 携带挑战行 id；verify 时一次性消费（取出即删，校验过期与用途）。避免把挑战暴露在客户端可篡改处。
6. **通行密钥认证不走口令锁定**：通行密钥是强抗钓鱼凭证，不存在口令暴力破解面；认证端点使用请求维度（IP/全局）限流，不读写 `user_credentials.failed_attempts`，也不因口令被锁而拒绝通行密钥登录。但**始终校验 `users.status === 'active'`**。
7. **生命周期联动以“吊销”为安全默认**（P4/P7）：
    - 用户删除账号（status→`deleted`）：事务内删除其全部通行密钥（与删除 sessions 并列）。
    - 管理员重置密码（含强制改密弹窗交互）：视为凭证吊销/疑似失陷场景，事务内删除全部通行密钥（与现有“删除全部 sessions + `password_must_change=1`”并列）。完整时序：吊销通行密钥 + 删除会话 + 置强制改密 → 用户用新临时口令登录（此时已无通行密钥可用，且口令登录响应 `password_must_change: true` 触发[强制改密弹窗](../../../app/lib/account/client/components/accountPasswordMustChangeModal.tsx)）→ **强制改密未完成前不允许新增通行密钥**（注册端点走 `authenticateAccountFromRequest(request)` 默认 `allowPasswordMustChange=false`，被守卫 `403 password-must-change` 自动拦截，无需额外判断）→ 用户完成强制改密（`change-password` 轮换会话并清 `password_must_change`）后方可重新添加通行密钥。详见第七节阶段 F 与第九节。
    - 管理员禁用账号：保留通行密钥行（禁用可逆），但认证期按 `status` 拦截，禁用期间通行密钥不可登录；启用后恢复可用。
    - 用户自助改密：**明确不**吊销通行密钥（用户本人知悉其设备，与管理员重置的疑似失陷场景本质不同）；改密只轮换会话，通行密钥保持可用。仅**管理员手动重置密码**才连带吊销通行密钥。

## 四、数据模型

### 4.1 新增表 `user_webauthn_credentials`

| 字段            | 类型    | 约束/说明                                                        |
| --------------- | ------- | ---------------------------------------------------------------- |
| `id`            | text    | 主键，内部 UUID                                                  |
| `user_id`       | text    | NOT NULL，FK → `users.id`，`ON DELETE CASCADE`                   |
| `credential_id` | text    | NOT NULL，base64url 的 authenticator credential ID，**唯一索引** |
| `public_key`    | text    | NOT NULL，base64url 的 COSE 公钥                                 |
| `counter`       | integer | NOT NULL，默认 0，签名计数器                                     |
| `transports`    | text    | NOT NULL，默认 `'[]'`，JSON 数组（如 `["internal","hybrid"]`）   |
| `device_type`   | text    | NOT NULL，默认 `'singleDevice'`，`singleDevice`/`multiDevice`    |
| `backed_up`     | integer | NOT NULL，默认 0，0/1                                            |
| `aaguid`        | text    | 可空，认证器型号标识                                             |
| `name`          | text    | 可空，用户自定义名称（trim 后空串存 `null`）                     |
| `created_at`    | integer | NOT NULL                                                         |
| `last_used_at`  | integer | 可空                                                             |

索引：`credential_id` 唯一索引；`user_id` 普通索引。

### 4.2 新增表 `webauthn_challenges`

| 字段         | 类型    | 约束/说明                                                                       |
| ------------ | ------- | ------------------------------------------------------------------------------- |
| `id`         | text    | 主键，UUID，对应 cookie 中携带的句柄                                            |
| `challenge`  | text    | NOT NULL，base64url 随机挑战                                                    |
| `purpose`    | text    | NOT NULL，`registration`/`authentication`                                       |
| `user_id`    | text    | 可空（注册时为发起用户；认证时为 `null`），FK → `users.id`，`ON DELETE CASCADE` |
| `created_at` | integer | NOT NULL                                                                        |
| `expires_at` | integer | NOT NULL，建议 TTL 5 分钟                                                       |

索引：`expires_at` 普通索引（供过期清理）。一次性消费：verify 成功或失败都删除该行；低频 best-effort 清理过期行（复用既有审计/票据清理风格）。

### 4.3 类型与常量

- [app/lib/db/constant.ts](../../../app/lib/db/constant.ts) `TABLE_NAME_MAP` 增加：`userWebauthnCredential: 'user_webauthn_credentials'`、`webauthnChallenge: 'webauthn_challenges'`。
- [app/lib/db/types.d.ts](../../../app/lib/db/types.d.ts) 新增 `ITableUserWebauthnCredential`、`ITableWebauthnChallenge`，对应 `T*`/`T*New`/`T*Update`，并注册进 `TDatabase`。
- [app/lib/account/shared/constants.ts](../../../app/lib/account/shared/constants.ts)：`ACCOUNT_COOKIE_NAME_MAP` 增加 `webauthnChallenge: 'mystia-webauthn'`；新增 `WEBAUTHN_CHALLENGE_TTL_MS`（5 分钟）、`WEBAUTHN_CREDENTIAL_NAME_MAX_LENGTH`（如 50）、`WEBAUTHN_MAX_CREDENTIALS_PER_USER`（如 20）。
- RP 配置走服务端 env（复用 `SERVICE_ALLOWED_ORIGINS` 作 `expectedOrigin`、`ACCOUNT_COOKIE_DOMAIN` 推 `rpID`、可选 `WEBAUTHN_RP_ID` 覆盖），不进 `shared/constants.ts`，避免泄露到客户端打包；客户端无需知道 `rpID`，由服务端下发的 options 自带。

## 五、依赖与配置

1. 新增运行依赖 `@simplewebauthn/server`（服务端，纯 JS，无原生编译，**不需要**加入 `pnpm.onlyBuiltDependencies`）。
2. 新增客户端依赖 `@simplewebauthn/browser`。
3. 服务端封装（`generateRegistrationOptions`/`verifyRegistrationResponse`/`generateAuthenticationOptions`/`verifyAuthenticationResponse`）只在账号 feature gate 通过后**动态导入**，与 Argon2 同等约束，禁用环境不得静态引入。
4. RP 配置 helper：新增 `app/lib/account/server/webauthn.ts` 导出 `getWebAuthnRelyingParty()`，返回 `{ rpID, rpName, expectedOrigin: string[] }`。`rpID` 由 `ACCOUNT_COOKIE_DOMAIN` 去前导点推导（缺省回退 `baseOrigin` host）；`expectedOrigin` 解析自 `SERVICE_ALLOWED_ORIGINS`（缺省回退 `baseOrigin`）。**不**把 BFF 主机 `SERVICE_API_ORIGIN`（`assistant-bff.izakaya.cc`）放入 `expectedOrigin`。
5. 无需新增 origin 白名单 env：复用现有 `SERVICE_ALLOWED_ORIGINS` 作为允许承载仪式的前端 origin 来源（与跨子域调 BFF 的 CORS 白名单天然一致）。可选 `WEBAUTHN_RP_ID` 显式覆盖（仍须为各允许 origin 的可注册父域）。仅服务端读取，无需经 [next.config.ts](../../../next.config.ts) `env` 暴露给客户端。

## 六、新增与修改文件

### 新增

| 文件                                                         | 作用                                                                                    |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `app/lib/db/migrations/account.ts`（修改）                   | 新增两表的建表、索引、列补齐与结构断言                                                  |
| `app/lib/account/server/repositories/webauthnCredentials.ts` | 通行密钥仓储：列出、按 credentialId 查、创建、删除单个/全部、更新计数与 last_used、计数 |
| `app/lib/account/server/repositories/webauthnChallenges.ts`  | 挑战仓储：创建、一次性消费、清理过期                                                    |
| `app/lib/account/server/webauthn.ts`                         | 封装 simplewebauthn server + RP 配置 + 编解码 helper                                    |
| `app/api/v1/account/webauthn/registration/options/route.ts`  | 已登录用户：生成注册 options（排除已有凭证），落挑战                                    |
| `app/api/v1/account/webauthn/registration/verify/route.ts`   | 已登录用户：校验 attestation，落库，审计                                                |
| `app/api/v1/account/webauthn/credentials/route.ts`           | GET 列出本人通行密钥                                                                    |
| `app/api/v1/account/webauthn/credentials/[id]/route.ts`      | DELETE 删除单个、（可选 PATCH 重命名），审计                                            |
| `app/api/v1/auth/webauthn/authentication/options/route.ts`   | 匿名：生成免用户名认证 options（allowCredentials 空），落挑战，限流                     |
| `app/api/v1/auth/webauthn/authentication/verify/route.ts`    | 匿名：校验断言、反查用户、校验状态、更新计数、建会话、SSO 收尾、审计                    |

### 修改

| 文件                                                                                                                  | 修改点                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [app/lib/db/constant.ts](../../../app/lib/db/constant.ts)                                                             | `TABLE_NAME_MAP` 增表名                                                                                                                               |
| [app/lib/db/types.d.ts](../../../app/lib/db/types.d.ts)                                                               | 新增两表类型并注册 `TDatabase`                                                                                                                        |
| [app/lib/account/shared/constants.ts](../../../app/lib/account/shared/constants.ts)                                   | cookie 名、TTL、名称长度、单用户上限                                                                                                                  |
| [app/lib/account/shared/types.ts](../../../app/lib/account/shared/types.ts)                                           | 新增通行密钥列表项、注册/认证 options 与 verify 的请求/响应类型；登录成功响应可加 `method` 提示（可选）                                               |
| [app/lib/account/server/auth.ts](../../../app/lib/account/server/auth.ts)                                             | 抽取共享“登录收尾”函数（建会话已在，重点抽 SSO context 重定向/JSON 返回/写 cookie），新增 `authenticateAccountByWebAuthnAssertion` 编排或在路由内编排 |
| [app/api/v1/auth/login/route.ts](../../../app/api/v1/auth/login/route.ts)                                             | 改用共享登录收尾函数；`loginSucceeded` metadata 增加 `method: 'password'`                                                                             |
| [app/lib/account/server/accountAuditService.ts](../../../app/lib/account/server/accountAuditService.ts)               | `ACCOUNT_AUDIT_ACTION_MAP` 增加通行密钥相关动作                                                                                                       |
| [app/lib/account/server/repositories/users.ts](../../../app/lib/account/server/repositories/users.ts)                 | `setUserStatusAndDeleteSessionsWithAudit`：status→deleted 时事务内删除该用户通行密钥                                                                  |
| [app/lib/account/server/repositories/credentials.ts](../../../app/lib/account/server/repositories/credentials.ts)     | `updateCredentialAndDeleteSessionsWithAudit`（管理员重置密码路径）：事务内删除该用户通行密钥                                                          |
| [app/lib/account/server/request.ts](../../../app/lib/account/server/request.ts) 或限流配置                            | 新增限流动作：`webauthnRegisterOptions`、`webauthnRegisterVerify`、`webauthnAuthOptions`、`webauthnAuthVerify`                                        |
| [app/lib/account/client/api.ts](../../../app/lib/account/client/api.ts)                                               | 新增 6 个客户端函数（见第八节）                                                                                                                       |
| [app/lib/account/client/components/accountManager.tsx](../../../app/lib/account/client/components/accountManager.tsx) | 账号窗口新增“通行密钥”区块；登录区新增“使用通行密钥登录”入口                                                                                          |
| `package.json`                                                                                                        | 增加 `@simplewebauthn/server`、`@simplewebauthn/browser`                                                                                              |

## 七、服务端实施步骤

### 阶段 A：数据与配置

1. `package.json` 增依赖；`pnpm install`。
2. `TABLE_NAME_MAP`、`types.d.ts`、`shared/constants.ts` 增表名/类型/常量。
3. `migrations/account.ts`：按既有风格 `createTable().ifNotExists()` 创建两表（CASCADE 外键），追加唯一索引/普通索引到索引幂等列表，加入列补齐映射，并在结构断言中校验主键与 `user_id` 外键 CASCADE。迁移顺序置于 `users` 之后。

### 阶段 B：仓储

4. `webauthnCredentials.ts`：`listCredentialsByUserId`、`getCredentialByCredentialId`、`countCredentialsByUserId`、`createCredential`、`deleteCredentialByIdForUser`（按 `id` + `user_id` 双条件，防越权）、`deleteCredentialsByUserId`、`updateCredentialOnUse(counter,last_used_at)`。删除全部需提供“可在外部事务内执行”的变体（供生命周期联动复用）。
5. `webauthnChallenges.ts`：`createChallenge`、`consumeChallenge(id, purpose)`（取出并删除、校验过期与用途、返回 `challenge`/`user_id`）、`deleteExpiredChallenges`。

### 阶段 C：WebAuthn 封装

6. `webauthn.ts`：`getWebAuthnRelyingParty()`；`buildRegistrationOptions(user, existingCredentials)`（`residentKey:'required'`、`userVerification:'preferred'`、`excludeCredentials`、`user.id` 作 handle）；`verifyRegistration({response, expectedChallenge})`；`buildAuthenticationOptions()`（`allowCredentials:[]`、`userVerification:'preferred'`）；`verifyAuthentication({response, expectedChallenge, credential})`；以及 credentialId/publicKey 的 base64url 编解码 helper。

### 阶段 D：注册与管理 API（登录态）

7. `registration/options`：feature gate → same-origin → cookie 安全 → 会话校验 → CSRF → 限流；读取本人已有凭证作 `excludeCredentials`；超过单用户上限拒绝；生成 options，落 `webauthn_challenges`（purpose=registration、user_id=本人），下发 `mystia-webauthn` cookie，返回 options JSON。**会话校验调用 `authenticateAccountFromRequest(request)` 保持默认 `allowPasswordMustChange=false`**，使强制改密期（如管理员刚重置密码）自动被守卫 `403 password-must-change` 拦截，禁止此时新增通行密钥；`registration/verify` 同此约束。不为通行密钥端点放开 `allowPasswordMustChange`。
8. `registration/verify`：同前置校验；从 cookie 取挑战句柄并一次性消费；`verifyRegistration`；通过则 `createCredential`，best-effort 审计 `passkeyRegistered`（metadata：credential 名称、aaguid、device_type、backed_up，不记录公钥原文以外的敏感项即可）；清除挑战 cookie；返回更新后的列表或成功态。
9. `credentials`（GET）：返回本人通行密钥安全摘要（`id`、`name`、`created_at`、`last_used_at`、`device_type`、`backed_up`；**不返回** `public_key`、`credential_id` 原文，必要时返回截断指纹）。
10. `credentials/[id]`（DELETE）：双条件删除本人凭证；审计 `passkeyDeleted`；Next 15 动态参数 `{ params: Promise<{ id: string }> }`。

### 阶段 E：免用户名登录 API（匿名）

11. `authentication/options`：feature gate → same-origin → cookie 安全 → **请求维度限流**（无用户名）；`buildAuthenticationOptions`（allowCredentials 空，开启 discoverable）；落挑战（purpose=authentication、user_id=null），下发 `mystia-webauthn` cookie，返回 options。**只设置挑战 cookie，绝不清除/覆盖 `mystia-sso-context` cookie**，以保证 SSO 登录上下文在 ceremony 期间存活（P8）。
12. `authentication/verify`：取并消费挑战；据断言 `credentialId`（base64url）`getCredentialByCredentialId` → 取 `user_id`；查 `users`，**校验 `status==='active'`**（disabled/deleted 一律拒绝且不泄露存在性）；`verifyAuthentication`（带 `counter`）；通过则 `updateCredentialOnUse`（新计数、last_used_at）；调用**共享登录收尾**：`createAccountSessionForActiveUser`（事务内写 `loginSucceeded`，metadata `method:'passkey'`）→ 读取 `getSsoContextCookie` → `setAccountSessionCookie`；失败 best-effort 审计 `loginFailed`（metadata `method:'passkey'`、reason，不扩大用户枚举面）。**SSO 收尾（P8）**：通行密钥 verify 始终是 fetch/JSON 请求，故走 JSON 分支——SSO context 存在时在响应体返回 `redirect_to: ssoAuthorizeUrl`（与口令登录 JSON 分支一致），由客户端导航到授权页；无 SSO context 则普通成功响应。不需要 302 分支。**响应须与口令登录一致地携带 `password_must_change`**（读取该用户 `user_credentials.password_must_change`）：通行密钥登录**不**因强制改密被拒（登录本身放行），而是返回 `password_must_change: true` 由客户端弹出强制改密弹窗，与口令登录行为一致；正常情况下管理员重置密码已吊销通行密钥故此分支少见，仍按此实现以防自助改密未吊销等场景。共享收尾函数统一产出 `IAuthLoginSuccessResponse`（含 `csrf_token`、`password_must_change`、`user`、可选 `redirect_to`）。

### 阶段 F：账号生命周期联动

13. 用户删除账号：在 `setUserStatusAndDeleteSessionsWithAudit` 的 `status==='deleted'` 分支事务内追加 `deleteFrom user_webauthn_credentials where user_id`（P4）。
14. 管理员重置密码：在 `updateCredentialAndDeleteSessionsWithAudit` 事务内追加删除该用户全部通行密钥（P7）；审计补 `adminRevokePasskeys` 或在 `adminResetPassword` metadata 标注 `revoked_passkeys: n`。该路径同时已置 `password_must_change=1`，故吊销后用户只能用临时口令登录并进入强制改密；强制改密期由阶段 D 第 7 步的会话守卫拦截新增通行密钥，完成改密后方可重新添加（与决策 7、第九节一致，本步无需额外开关）。
15. 管理员禁用账号：不删凭证；依赖阶段 E 第 12 步的 `status` 拦截（P7）。复核 `disableUserAndDeleteSessionsWithSsoCallbacksAndAudit` 无需改库，仅确认认证期状态校验到位。

### 阶段 G：审计动作

16. `ACCOUNT_AUDIT_ACTION_MAP` 增加：`passkeyRegistered: 'user-register-passkey'`、`passkeyDeleted: 'user-delete-passkey'`、`adminRevokePasskeys: 'admin-revoke-user-passkeys'`；通行密钥登录复用 `loginSucceeded`/`loginFailed` 并以 metadata `method:'passkey'` 区分，管理端 `/admin/audit?scope=account` 即可筛选（P6）。

## 八、客户端实施步骤

17. [api.ts](../../../app/lib/account/client/api.ts) 新增：
    - `startWebAuthnRegistration(csrfToken)`：POST options → `@simplewebauthn/browser` `startRegistration` → POST verify。
    - `listWebAuthnCredentials()`、`deleteWebAuthnCredential(id, csrfToken)`、（可选 `renameWebAuthnCredential`）。
    - `startWebAuthnLogin()`：POST authentication/options → `startAuthentication` → POST verify，返回与口令登录一致的成功数据（含 `redirect_to`）。
18. [accountManager.tsx](../../../app/lib/account/client/components/accountManager.tsx)：
    - 账号资料区新增“通行密钥”区块：列表（名称/添加时间/最近使用/设备类型）、添加按钮、删除确认、空态/加载/错误态；列表刷新跟随窗口打开与增删事件，不轮询。
    - 登录区新增“使用通行密钥登录”按钮；成功后与口令登录同路径更新 [account store](../../../app/stores/account.ts) 并 `postAccountSyncBroadcastMessage` 通知多标签页；**响应含 `redirect_to` 时导航到 SSO 授权页**，与口令登录的 `redirect_to` 处理完全一致。该登录界面同时用于普通登录与 SSO 登录（无独立 SSO 登录页），故通行密钥按钮在 SSO 引导登录时自动出现（P8）。
    - 能力探测：`browserSupportsWebAuthn()` 为假或账号 feature 未启用或非安全上下文时，隐藏通行密钥入口；可选用 `browserSupportsWebAuthnAutofill()` 做条件式自动填充（本期可不做，仅保留按钮触发）。
    - 强制改密态：`accountStore.shared.passwordMustChange` 为真（如管理员刚重置密码）时，强制改密弹窗优先，隐藏/禁用通行密钥管理区块，避免用户点击后撞 `403 password-must-change`；服务端已强制拦截，此处仅为体验一致。

## 九、安全与边界

- **RP ID/Origin（双子域反代同一实例）**：仪式只发生在前端 origin（`SERVICE_ALLOWED_ORIGINS`，当前 `https://izakaya.cc`），API 子域 `assistant-bff.izakaya.cc`（同实例、绕 CDN 的反代入口）既非 `rpID` 也不在 `expectedOrigin`。`rpID` 取可注册父域并与 `ACCOUNT_COOKIE_DOMAIN` 去点对齐（`izakaya.cc`），**不**按页面/BFF host 推导。`SERVICE_ALLOWED_ORIGINS` 中任一 host 不是 `rpID` 的同域/子域、或缺失必要配置时按 `server-misconfigured` 处理。子域注册的凭证与主站通用，反之亦然。
- **挑战 cookie 与跨子域调用**：`mystia-webauthn` 挑战 cookie 复用 `createAccountCookieDomainOptions()`，与 `mystia-session` 同样带 `.izakaya.cc` 域；前端 `izakaya.cc` 跨子域（same-site）credentialed 调 BFF 时该 cookie 照常发送，options 与 verify 共享同一挑战。通行密钥四个路由是 BFF 上的账号路由，自动继承现有 `SERVICE_ALLOWED_ORIGINS`/`checkServiceAllowedOrigin` 跨子域处理，不放开通配 CORS。
- **挑战一次性**：verify 无论成败都消费挑战行并清 cookie，过期挑战拒绝；防重放。
- **计数器回退**：`verifyAuthentication` 校验 `newCounter > storedCounter`（计数器为 0 的平台凭证除外，按库行为处理）；异常计数视为可疑，拒绝并审计。
- **越权防护**：删除/查询通行密钥一律以 `(id, user_id)` 双条件；认证按 `credential_id` 唯一反查，绝不接受客户端直传 `user_id`。
- **强制改密（`password_must_change`）交互**：通行密钥**管理**端点（注册 options/verify、删除）经 `authenticateAccountFromRequest(request)` 默认 `allowPasswordMustChange=false`，强制改密期被 `403 password-must-change` 拦截，杜绝“管理员重置密码后、用户改密前”窗口里新增或改动通行密钥；通行密钥**登录**端点不受此拦截（它产出会话而非受保护写操作），但响应须携带 `password_must_change` 触发强制改密弹窗，且不为通行密钥端点放开 `allowPasswordMustChange`。客户端在强制改密弹窗未完成前不展示/不可用通行密钥管理区块（服务端已强制，UI 仅为体验）。
- **状态拦截**：disabled/deleted 用户的通行密钥认证一律失败，且响应不区分“凭证无效/账号禁用/账号不存在”，避免账号枚举。
- **限流**：四个端点接入请求维度限流；认证端点尤其需防匿名刷挑战。通行密钥认证**不**触碰口令 `failed_attempts`/`locked_until`。
- **同源/CSRF/Cookie 安全/no-store**：沿用账号 route 既有约束（`runtime='nodejs'`、`dynamic='force-dynamic'`、`Cache-Control: no-store`、`Vary: Cookie`、same-origin、登录态写接口校验 CSRF）。
- **隐私**：审计 metadata 不落公钥以外可关联的敏感原文，不落完整 UA/IP 原文（沿用既有摘要策略）；通行密钥摘要接口不外泄 `credential_id`/`public_key` 原文。
- **离线/静态导出**：账号 feature 未启用时，前端不展示通行密钥入口、不请求相关 API，与现有账号能力一致。

## 十、验证清单

- 已登录用户可添加通行密钥，列表出现新项；超过单用户上限被拒。
- 退出后用“使用通行密钥登录”免输用户名登录成功，得到与口令登录一致的会话/CSRF。
- **SSO 登录（P8）**：外部客户端引导到主站登录时，登录界面出现通行密钥按钮；用通行密钥登录成功后，verify 响应含 `redirect_to`，客户端导航到 SSO 授权页，授权后正常回调外部客户端；ceremony 期间 `mystia-sso-context` cookie 未丢失。
- 删除某通行密钥后，该凭证无法再登录；不能删除他人凭证。
- 同一账号口令登录仍正常；改用户名/昵称后原通行密钥仍可登录（handle 稳定）。
- **双子域反代同一实例**：前端 `izakaya.cc` 经 `assistant-bff.izakaya.cc` 调 API，注册/登录全程通；`expectedOrigin` 取 `https://izakaya.cc` 而非 API 子域，verify 不因 API 子域不匹配而失败。
- **跨子域**：将来在 `izakaya.cc` 注册的通行密钥可在 `app.izakaya.cc` 直接弹框登录，反之亦然（前提是 `app.izakaya.cc` 已加入 `SERVICE_ALLOWED_ORIGINS`）；未列入的子域 origin verify 被拒。
- 用户删除账号后，其通行密钥行被清除且无法登录（P4）。
- 管理员重置密码后，该用户全部通行密钥失效，须新口令登录后重新添加（P7）。
- **强制改密交互**：管理员重置密码 → 用临时口令登录得 `password_must_change: true` 并弹强制改密窗 → 弹窗期间调用注册 options/verify 返回 `403 password-must-change`（无法新增通行密钥）→ 完成强制改密后可正常添加；若仍存在通行密钥（如自助改密未吊销场景），通行密钥登录也返回 `password_must_change` 并弹窗。
- 管理员禁用账号后，通行密钥登录被拒；启用后恢复可用（P7）。
- `/admin/audit?scope=account` 可见通行密钥注册、删除、登录成功/失败、管理员吊销事件（P6）。
- 挑战过期或重放被拒；计数器回退被拒。
- 不支持 WebAuthn 的浏览器、非安全上下文、账号 feature 未启用时不展示入口、不报错。
- `tsc --noEmit` 与 `pnpm lint` 通过（容许仓库既有 `onClick` deprecated 警告）。
- Vercel/offline/static export 构建不静态导入 WebAuthn 服务端模块；Service Worker 不缓存相关 `/api/`。

## 十一、任务清单

| 状态   | 编号 | 任务                       | 验收标准                                                                                                   |
| ------ | ---- | -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 完成   | A1   | 依赖与表名/类型/常量       | 两表名、Kysely 类型、cookie/TTL/上限常量就绪，`tsc` 通过                                                   |
| 完成   | A2   | 迁移与索引                 | 重复启动幂等创建两表与索引；结构断言校验主键与 CASCADE 外键                                                |
| 完成   | B1   | 通行密钥仓储               | 列出/反查/创建/删除单个与全部/更新计数，删除全部可在外部事务执行                                           |
| 完成   | B2   | 挑战仓储                   | 创建/一次性消费/清理过期；过期与用途校验生效                                                               |
| 完成   | C1   | WebAuthn 封装与 RP 配置    | options/verify 四函数与 RP 推导可用，仅动态导入                                                            |
| 完成   | D1   | 注册 options/verify API    | 登录态可注册，排除已有凭证，挑战一次性，落库成功                                                           |
| 完成   | D2   | 列表/删除 API              | 仅返回安全摘要；按双条件删除，防越权                                                                       |
| 完成   | E1   | 共享登录收尾抽取           | 口令登录改用共享收尾，行为不变                                                                             |
| 完成   | E2   | 免用户名认证 API           | discoverable 登录成功，状态拦截与限流生效，SSO 收尾正确                                                    |
| 完成   | E3   | SSO 通行密钥登录           | SSO 引导登录界面含通行密钥按钮；verify 返回 `redirect_to`，授权页正常回调；sso-context cookie 不丢失       |
| 完成   | F1   | 删除账号联动               | status→deleted 事务内清除通行密钥                                                                          |
| 完成   | F2   | 管理员重置密码联动         | 事务内吊销通行密钥，`adminResetPassword` metadata 记 `revoked_passkeys`                                    |
| 完成   | F2a  | 强制改密期拦截通行密钥管理 | 注册/删除经默认守卫，强制改密期返回 `403 password-must-change`；登录响应携带 `password_must_change` 弹窗   |
| 完成   | F3   | 禁用/启用拦截确认          | 禁用期认证被拒，启用后恢复                                                                                 |
| 完成   | G1   | 审计动作接入               | 注册/删除写 `passkeyRegistered`/`passkeyDeleted`，登录 metadata `method:'passkey'`，重置 metadata 记吊销数 |
| 完成   | H1   | 客户端 API                 | 注册/列表/删除/登录函数封装 `@simplewebauthn/browser`                                                      |
| 完成   | H2   | 账号窗口通行密钥区块       | 增删与列表 UI、空/加载/错误态、能力探测隐藏                                                                |
| 完成   | H3   | 通行密钥登录入口           | 登录区免用户名登录，成功后状态与多标签页同步                                                               |
| 完成   | V1   | 自动验证                   | `tsc --noEmit` 通过；`pnpm lint` 0 error（仅仓库既有 onClick 警告）                                        |
| 待手测 | V2   | 手测回归                   | 第十节验证清单逐项通过（需 `SELF_HOSTED=true` + `localhost` + 虚拟认证器本地手测）                         |

## 十二、建议实施顺序

1. A → B → C：先把数据、仓储与封装打通，纯服务端、易自测。
2. D：登录态注册与管理 API，先让“能加能删能看”跑通。
3. E：抽取共享登录收尾，再落免用户名认证（最核心、风险最高的一段）。
4. F → G：生命周期联动与审计，保证 P4/P6/P7。
5. H：客户端 API 与 UI。
6. V：自动与手测回归。

## 十三、进度

| 日期       | 进度                                                | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-06-26 | 已创建实施清单文档                                  | 完成方案、设计决策、数据模型、API、客户端接入与生命周期联动的拆解，任务清单待开始                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-06-26 | 已按子域共享场景修订 RP 设计                        | 确认 `ACCOUNT_COOKIE_DOMAIN=.izakaya.cc` 下需让子域自弹登录框，明确 `rpID` 取父域 `izakaya.cc`、`expectedOrigin` 用允许清单，挑战 cookie 与 same-origin 须放行同父域子域                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-06-26 | 已按双子域反代同一实例修订 origin 来源              | 据生产架构（`izakaya.cc` 与 `assistant-bff.izakaya.cc` 为同一 Next.js 实例、双子域反代绕 CDN）明确仪式 origin 仅看前端、API 子域不入 `rpID`/`expectedOrigin`，`expectedOrigin` 复用 `SERVICE_ALLOWED_ORIGINS`，取消新增 origin 白名单 env；挑战与限流确认单实例一致                                                                                                                                                                                                                                                                              |
| 2026-06-26 | 已补强强制改密交互处理                              | 据 `authenticateAccountFromRequest` 默认 `allowPasswordMustChange=false` 守卫，明确强制改密期注册/删除通行密钥被 `403 password-must-change` 拦截、登录响应携带 `password_must_change` 触发弹窗；补充管理员重置密码完整时序、客户端弹窗期隐藏管理区块、验证清单与任务 F2a                                                                                                                                                                                                                                                                         |
| 2026-06-26 | 已明确自助改密不吊销并新增 SSO 通行密钥登录         | 收紧决策 7：自助改密**不**吊销通行密钥，仅管理员重置才吊销；新增 P8——SSO 引导登录复用同一登录界面与登录收尾，通行密钥 verify（fetch/JSON）走 `redirect_to` 分支进入授权页，options 端点不得清除 `mystia-sso-context` cookie；补验证项与任务 E3                                                                                                                                                                                                                                                                                                   |
| 2026-06-26 | 阶段 A 完成                                         | 装 `@simplewebauthn/server@13.3.2`、`@simplewebauthn/browser@13.3.0`；`TABLE_NAME_MAP`、`types.d.ts`、`shared/constants.ts` 增两表名/类型/cookie/TTL/上限/名称校验；`migrations/account.ts` 幂等创建两表（CASCADE 外键）、索引（credential_id 唯一、user_id、expires_at）与结构断言；`tsc --noEmit` 通过                                                                                                                                                                                                                                         |
| 2026-06-26 | 阶段 B–G 服务端完成                                 | 仓储（`webauthnCredentials`/`webauthnChallenges`）、封装（`webauthn.ts` RP/options/verify/挑战 cookie）、4+2 路由（`account/webauthn/*` 注册列删、`auth/webauthn/*` 免用户名认证）、共享登录收尾 `loginResponse.ts`（口令登录改用之并加 `method`）、生命周期联动（删除账号/管理员重置事务内删通行密钥）、审计动作接入；`WEBAUTHN_RP_ID` 入 env 声明；逐阶段 `tsc --noEmit` 通过                                                                                                                                                                  |
| 2026-06-26 | 阶段 H 客户端完成                                   | `client/api.ts` 增注册/列表/删除/免用户名登录函数（封装 `@simplewebauthn/browser`，处理用户取消）；`accountManager.tsx` 登录区加“使用通行密钥登录”按钮、账号设置加“通行密钥”区块（列表/添加/删除确认/能力探测/强制改密期隐藏）；成功后复用既有 store + 广播 + `redirect_to` 跳转                                                                                                                                                                                                                                                                 |
| 2026-06-26 | 阶段 V 自动验证通过                                 | 全量 `tsc --noEmit` exit 0；`pnpm lint` 0 error（仅 5 文件既有 `onClick` deprecated 警告）；新增/改动文件经 prettier 格式化。V2 手测回归待本地执行（决策：通行密钥仪式只在 `localhost`，不用 `127.0.0.1`）                                                                                                                                                                                                                                                                                                                                       |
| 2026-06-26 | 体验补强完成（命名/重命名、文案、管理端、跨标签页） | 1) 通行密钥可命名（注册输入框）与重命名（新增 `PATCH /credentials/[id]` + `renameCredentialForUser` + 客户端 + 行内编辑 UI）；2) 用户侧 webauthn 错误码补中文文案（`errorMessage.ts`，保持 `sort-keys`）；3) 管理端审计动作中文标签 `user-register-passkey`/`user-delete-passkey`（筛选 popover 自动派生）；4) 管理端用户详情新增"通行密钥"指标与只读列表（GET 路由 + SSR + `IAdminUserDetailData` 扩展 `passkeys`）；5) 新增 `account-webauthn` 广播频道，增删/重命名后跨标签页刷新列表（按 tabId 过滤自身）；`tsc` exit 0、`pnpm lint` 0 error |

## 十四、暂不纳入

- 通行密钥作为唯一/首要凭证、注册阶段即创建通行密钥（P5 明确口令必填）。
- 自助改密吊销通行密钥（**明确不做**：自助改密不影响通行密钥，仅管理员手动重置密码才吊销，见决策 7）。
- attestation 厂商白名单/企业认证、AAGUID 黑白名单策略。
- 跨设备混合（hybrid/QR）自定义引导、条件式自动填充的完整体验打磨（本期仅按钮触发，autofill 可选）。
- MFA 分级、把通行密钥作为 SSO 授权的二次确认/强度提升（step-up）策略（通行密钥**登录**本身已支持 SSO 流程，见 P8；此处不做的是授权环节的额外强度校验）。
- 多实例共享的通行密钥认证限流（沿用现有单实例内存限流口径）。

## 十五、后续补充：通行密钥优先登录/注册

> 日期：2026-06-26
> 性质：后续增量方案。前文记录的是已执行的原始落地范围，本节不回改历史计划与完成记录；实施新一轮改造时，以本节覆盖“注册阶段不创建通行密钥”的旧边界。

### 15.1 目标

| 编号 | 能力                       | 定位 | 说明                                                                                                                             |
| ---- | -------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------- |
| R1   | 通行密钥优先入口           | 核心 | 支持 WebAuthn 的匿名设备上，登录弹窗默认显示主按钮“使用通行密钥登录/注册”。                                                      |
| R2   | 保留传统表单入口           | 核心 | 同一界面提供“使用用户名密码登录或注册”切换入口；不支持 WebAuthn、非安全上下文或账号服务不可用时沿用传统表单。                    |
| R3   | 避免已有账号误注册         | 核心 | 主按钮先尝试通行密钥登录；登录未完成、用户取消或无可用凭证时，不自动创建新账号，只显示“创建新账号并添加通行密钥”的明确确认入口。 |
| R4   | 通行密钥注册自动分配用户名 | 核心 | 用户确认创建新账号后，服务端自动生成唯一用户名，`nickname` 存 `null`；注册表单无需用户输入用户名、昵称或密码。                   |
| R5   | 注册后复用账号详情设置     | 核心 | 注册成功后直接进入已登录账号详情；不额外弹引导。用户可在账号详情内按既有能力修改用户名、设置/修改密码、管理通行密钥。            |
| R6   | 不支持通行密钥设备仍可登录 | 核心 | 通行密钥注册创建的账号必须可通过后续设置的用户名密码在不支持 WebAuthn 的设备上登录；不做永久 passkey-only 账号。                 |
| R7   | SSO 场景保持一致           | 核心 | SSO 引导登录时同样展示通行密钥优先入口；通行密钥登录或注册成功后仍按既有 `redirect_to` 流程进入授权页。                          |

### 15.2 交互方案

匿名状态下的登录弹窗分为两种模式：

1. **通行密钥优先模式**：当 `browserSupportsWebAuthn()` 为真且账号服务可用时默认展示。主按钮文案为“使用通行密钥登录/注册”。按钮点击后先发起现有免用户名通行密钥登录 ceremony。
2. **传统表单模式**：用户点击“使用用户名密码登录或注册”后展示现有登录/注册表单；不支持 WebAuthn 时直接进入该模式。

通行密钥优先模式的失败/取消处理：

- 登录成功：沿用现有登录成功处理，更新账号状态，响应含 `redirect_to` 时跳转。
- 用户取消、无可用凭证、认证器不可用、验证失败：不自动注册，不展示用户名/密码错误；在主按钮下方显示注册确认区。
- 注册确认区包含按钮“创建新账号并添加通行密钥”，并显示提示：“如果您已有账号，请使用用户名密码登录后再绑定通行密钥。”
- 用户点击注册确认按钮后才发起新账号通行密钥注册 ceremony。

注册成功后的落点：

- 直接进入账号详情，不弹额外引导。
- 因系统已自动分配用户名、昵称为空，账号详情中的“当前账号”和“账号设置”自然暴露用户名修改、昵称设置、密码设置入口。
- 通行密钥注册产生的通行密钥可继续在账号详情中命名、重命名或删除。

### 15.3 账号与凭据策略

1. **自动用户名**：新增服务端 helper，例如 `createAutoAccountUsername()`，生成满足 `checkUsernamePolicy()` 的唯一用户名。建议格式为 `mystia_${短随机串}` 或 `user_${短随机串}`，总长度不超过 32，全部使用 ASCII 小写字母与数字，避免大小写归一化冲突。
2. **唯一性处理**：生成后使用 `username_normalized` 唯一索引落库；冲突时有限次数重试，超过重试次数返回 `username-conflict` 或内部注册失败错误。
3. **昵称为空**：通行密钥注册创建用户时 `nickname=null`，不自动写“夜雀助手用户”等占位昵称，避免用户误以为这是自己设置过的资料。
4. **WebAuthn 显示名**：注册 options 中 `user.id` 仍使用内部 UUID；`user.name` 使用自动用户名；`user.displayName` 可使用自动用户名或固定文案“夜雀助手用户”。认证只依赖内部 user handle 与 credentialId，用户日后改用户名不影响登录。
5. **口令兜底**：不创建永久 passkey-only 账号，但也不在注册后立刻触发 `password_must_change`。`password_must_change` 表示“已有密码但必须更换”，需要输入当前密码；通行密钥注册用户没有可输入的旧密码，不能复用该语义。
6. **未设置密码状态**：由于现有 `user_credentials.password_hash` 为必填，通行密钥注册时仍创建一个不可见的高熵随机口令哈希，但新增独立状态（建议 `user_credentials.password_set`，0/1，既有账号默认 1）。通行密钥注册账号写入 `password_set=0`、`password_must_change=0`。
7. **设置初始密码**：`password_set=0` 时账号详情显示“设置登录密码”入口，调用专用“设置初始密码”接口，只要求当前登录会话、CSRF 和新密码规则，不要求 `current_password`。设置成功后更新 `password_hash`、`password_set=1`，之后改密码恢复既有“输入当前密码”流程。
8. **未设置密码期间行为**：未设置密码不应阻塞登录后的账号详情、同步和 SSO 授权，否则“一键注册”会被打断。它只影响“不支持通行密钥设备的兜底登录能力”和需要当前密码验证的操作；相关 UI 用非阻断提示提醒用户设置登录密码。

### 15.4 服务端改造步骤

1. **自动用户名生成**：在账号服务端新增自动用户名 helper，并补单元级约束说明：满足用户名规则、归一化后唯一、冲突可重试。
2. **密码状态迁移**：给 `user_credentials` 新增 `password_set integer not null default 1`；结构断言与类型同步更新；既有账号默认视为已设置密码。共享响应类型增加 `has_password` 或同等布尔字段，客户端可据此显示“设置登录密码”。
3. **新注册挑战用途**：扩展 `webauthn_challenges.purpose` 或新增用途常量 `account_registration`，用于区分“已登录用户添加通行密钥”和“匿名用户创建账号并注册通行密钥”。现表为 text 字段，不需要迁移结构。
4. **注册 options 路由**：新增匿名端点 `POST /api/v1/auth/webauthn/registration/options`。该端点只生成新账号注册 options 与挑战，不创建用户；challenge 行记录用途为 `account_registration`，`user_id=null`，并通过 challenge cookie 绑定 verify。
5. **注册 verify 路由**：新增 `POST /api/v1/auth/webauthn/registration/verify`。一次性消费 `account_registration` challenge；生成 `userId`、自动用户名和临时高熵口令哈希；在同一事务中创建 `users`、`user_credentials(password_set=0,password_must_change=0)`、`user_webauthn_credentials`、会话与审计。
6. **共享登录收尾复用**：注册 verify 成功后复用现有登录收尾函数，返回与口令/通行密钥登录一致的 `csrf_token`、`password_must_change:false`、`has_password:false`、`user` 和可选 `redirect_to`。
7. **设置初始密码 API**：新增专用端点（如 `POST /api/v1/auth/set-password` 或 `POST /api/v1/account/password/initial`）。该端点要求已登录、CSRF、新密码符合规则，且 `password_set=0`；不要求 `current_password`。成功后写入新哈希、`password_set=1`、清失败计数并保留当前会话。
8. **既有改密 API 保持严格**：`change-password` 继续要求 `current_password`，只处理 `password_set=1` 的账号或管理员强制改密场景；避免把“免旧密码设置初始密码”的权限扩散到普通改密。
9. **用户名/资料修改**：当前修改用户名需要 `current_password`。未设置密码账号若需要立即改用户名，应二选一：先设置密码后改用户名，或新增“无密码账号修改用户名无需当前密码/需通行密钥重新验证”的独立规则。为保持实现简单，建议 UI 引导先设置登录密码再修改用户名。
10. **审计**：新增或复用审计动作。建议新增 `passkeyAccountRegistered: 'user-register-account-with-passkey'` 和 `passwordInitialized: 'user-set-initial-password'`，metadata 标注 `method:'passkey'`、`auto_username:true`、`credential_name`、`device_type`、`backed_up`，不记录公钥、credentialId 原文或临时口令信息。
11. **限流与安全**：匿名 registration options/verify、设置初始密码接口接入请求维度限流；verify 失败同样消费 challenge 并清 cookie；不得清除 `mystia-sso-context` cookie。
12. **错误语义**：将“无可用通行密钥/用户取消/认证失败”与“可以注册新账号”在客户端区分，服务端保持不泄露账号存在性。

### 15.5 客户端改造步骤

1. **API 封装**：在 `client/api.ts` 增加 `startWebAuthnAccountRegistration()`，流程为匿名 registration options → `startRegistration` →匿名 registration verify，返回统一登录成功响应。
2. **认证模式状态**：在 `accountManager.tsx` 匿名态新增 UI 状态，例如 `authEntryMode: 'passkey' | 'password'` 与 `isPasskeyRegistrationPromptVisible`。WebAuthn 支持时默认 `passkey`，否则默认 `password`。
3. **主按钮行为**：通行密钥优先模式下，主按钮“使用通行密钥登录/注册”调用现有 `startWebAuthnLogin()`。成功即登录；取消/无凭证/失败时显示注册确认区，不自动注册。
4. **注册确认行为**：注册确认按钮“创建新账号并添加通行密钥”调用 `startWebAuthnAccountRegistration()`；成功后复用 `applyAccountAuthSuccessResponse`、`refreshAccountState`、`redirect_to` 处理。
5. **传统表单入口**：保留“使用用户名密码登录或注册”切换按钮；切换后展示现有登录/注册分段控件和表单。传统表单内现有通行密钥登录按钮可隐藏或改为回到通行密钥优先模式，避免重复入口。
6. **提示文案**：注册确认区显示“如果您已有账号，请使用用户名密码登录后再绑定通行密钥。”该提示只在用户准备创建新账号时出现，降低已有账号误注册风险。
7. **初始密码设置 UI**：当响应或账号状态显示 `has_password=false` 时，账号详情的密码区显示“设置登录密码”，仅展示新密码输入框与确认按钮，不展示“当前密码”。设置成功后切回现有“修改密码”表单。
8. **资料修改提示**：如果无密码状态下仍沿用“修改用户名需要当前密码”的规则，用户名输入区应提示“请先设置登录密码后再修改用户名”；昵称可继续按现有规则修改。
9. **焦点与可访问性**：主按钮、传统表单切换入口、注册确认按钮均为真实可聚焦控件；WebAuthn ceremony 取消后焦点回到主按钮或注册确认区首个按钮。

### 15.6 验证清单

- 支持 WebAuthn 的匿名设备默认看到“使用通行密钥登录/注册”，仍能切换到用户名密码表单。
- 已有通行密钥账号点击主按钮可直接登录；SSO 场景登录后按 `redirect_to` 进入授权页。
- 无可用通行密钥或用户取消时不创建账号，只显示注册确认区。
- 点击“创建新账号并添加通行密钥”后创建账号、保存通行密钥、创建会话；用户名由系统分配，昵称为空。
- 新账号进入账号详情后可看到自动用户名和“设置登录密码”入口；设置初始密码不要求当前密码。
- 新账号设置密码后，可在不支持 WebAuthn 的设备上使用用户名密码登录。
- 未设置正式密码前，不触发 `password_must_change` 强制改密弹窗；账号详情、同步和 SSO 授权保持连贯。
- 未设置正式密码前，若用户名修改仍需要当前密码，UI 应要求先设置登录密码；设置密码后可正常修改用户名。
- 已有口令账号用户不会因主按钮登录失败而被自动注册新账号。
- 匿名通行密钥注册 options/verify 不清除 SSO context cookie；注册成功响应含 `redirect_to` 时客户端正常跳转。
- 审计中可区分“添加通行密钥”和“使用通行密钥注册账号”。
- `tsc --noEmit` 与 `pnpm lint` 通过；本地虚拟认证器手测覆盖登录、取消、注册、SSO、设置密码回归。

### 15.7 增量任务清单

| 状态   | 编号 | 任务                         | 验收标准                                                                                  |
| ------ | ---- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| 完成   | R-A1 | 自动用户名 helper            | 生成值满足用户名规则；归一化唯一；冲突重试有上限                                          |
| 完成   | R-B1 | 匿名通行密钥注册 options API | 生成 `account_registration` challenge；不创建用户；不清除 SSO context                     |
| 完成   | R-A2 | 密码设置状态迁移             | `user_credentials.password_set` 默认 1；共享响应暴露 `has_password`；既有账号行为不变     |
| 完成   | R-B2 | 匿名通行密钥注册 verify API  | 同事务创建用户、`password_set=0` 临时口令凭据、通行密钥、会话和审计；返回统一登录成功响应 |
| 完成   | R-B3 | 设置初始密码 API             | `password_set=0` 时可用；只要求登录态、CSRF 和新密码；成功后 `password_set=1`             |
| 完成   | R-B4 | 注册审计与限流               | 新增审计动作或 metadata；匿名 options/verify 与设置初始密码接入请求维度限流               |
| 完成   | R-C1 | 客户端注册 API               | `startWebAuthnAccountRegistration()` 封装 options/startRegistration/verify                |
| 完成   | R-C2 | 登录弹窗通行密钥优先入口     | 支持设备默认主按钮；传统表单可切换；失败不自动注册                                        |
| 完成   | R-C3 | 注册确认区                   | 无凭证/取消/失败后显示明确创建按钮与已有账号提示；点击后才创建账号                        |
| 完成   | R-C4 | 初始密码设置 UI              | `has_password=false` 时显示免当前密码的“设置登录密码”；设置后切回现有“修改密码”           |
| 完成   | R-V1 | 自动验证                     | `tsc --noEmit` 与 `pnpm lint` 通过                                                        |
| 待手测 | R-V2 | 手测回归                     | 通行密钥登录、取消后确认注册、自动用户名、昵称为空、设置密码、传统表单、SSO 流程逐项通过  |
