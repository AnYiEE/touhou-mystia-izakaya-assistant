# dev/account E2E 测试报告（2026-06-11）

## 结论

本轮已完成 SSO 核心正向路径、HTTPS 网站 redirect、状态查询、主动状态回调，以及补充的 5 个高风险场景测试。实测结果均符合预期：未发现会导致越权签发 ticket、错误 redirect、状态泄漏、或跨标签 consent 混淆的问题。

## 测试环境

| 项目              | 值                                       |
| ----------------- | ---------------------------------------- |
| 分支              | `dev/account`                            |
| Provider          | `http://localhost:3000`                  |
| Mock client HTTP  | `http://127.0.0.1:4000`                  |
| Mock client HTTPS | `https://127.0.0.1:4443`                 |
| SSO client        | `mock-auto-test`                         |
| Loopback redirect | `http://127.0.0.1:4000/callback`         |
| HTTPS redirect    | `https://127.0.0.1:4443/callback`        |
| Status callback   | `https://127.0.0.1:4443/status-callback` |
| Mock script       | `scripts/mockSsoClient.ts`               |
| 测试文档          | `docs/sso-local-test.md`                 |

本地测试过程中启用了 `NODE_TLS_REJECT_UNAUTHORIZED=0`，用于让 Next.js 服务端接受 mock client 的自签名 HTTPS 证书。浏览器侧 HTTPS 回调按预期出现证书警告，手动继续访问后完成测试。

## 已测试场景

### 1. Loopback HTTP SSO 正向流程

**目的**：验证本地应用型 redirect 通过 `loopback_redirect_paths` 匹配，并能完成 ticket 兑换。

**步骤**：

1. 打开 mock dashboard。
2. 点击 `Start normal SSO (loopback)`。
3. 在 `/sso/authorize` 登录/确认授权。
4. mock client 接收 `http://127.0.0.1:4000/callback?ticket=...&state=...`。
5. mock client 自动调用 `POST /api/v1/sso/validate`。

**结果**：通过。

```json
{ "status": "ok", "data": { "user": { "status": "active" } } }
```

### 2. HTTPS 网站 SSO 正向流程

**目的**：验证外部 HTTPS 网站 redirect 通过 `https_redirect_uris` 完整 URL 精确匹配，而不是走 loopback 规则。

**步骤**：

1. SSO client 配置 `HTTPS Redirect URIs: https://127.0.0.1:4443/callback`。
2. 点击 mock dashboard 的 `Start normal SSO (HTTPS)`。
3. `/api/v1/sso/authorize` 接收 `redirect_uri=https://127.0.0.1:4443/callback`。
4. 授权后浏览器跳转到 HTTPS callback。
5. 浏览器出现自签名证书警告，手动继续访问。
6. mock client 自动 validate ticket。

**结果**：通过，`POST /api/v1/sso/validate` 返回 `HTTP 200`。

### 3. Ticket 一次性消费与重放防护

**目的**：验证 ticket 兑换后不能再次使用。

**步骤**：

1. 完成一次正常授权并成功 validate。
2. 在 mock dashboard 点击 `Validate last ticket with correct PKCE`。

**结果**：通过。

```json
{ "status": "error", "message": "invalid-ticket" }
```

HTTP 状态：`401`。

### 4. Bad PKCE 不消费 ticket

**目的**：验证错误 `code_verifier` 不会消耗 ticket，后续正确 PKCE 仍可兑换。

**步骤**：

1. 点击 `Start SSO with bad PKCE first`。
2. mock client 首次在 callback 中故意使用错误 `code_verifier`。
3. 再点击 `Validate last ticket with correct PKCE`。

**结果**：通过。首次错误 PKCE 返回 `401 invalid-ticket`，随后正确 PKCE 可返回 `HTTP 200`。

### 5. SSO Status 查询

**目的**：验证 client 能通过 `POST /api/v1/sso/status` 查询已授权用户状态。

**步骤**：

1. 完成一次成功 validate，写入 user-client grant。
2. 点击 mock dashboard 的 `Check last user status`。

**结果**：通过。

```json
{ "status": "ok", "data": { "user": { "status": "active" } } }
```

### 6. 主动状态回调：`user_disabled`

**目的**：验证禁用用户后，provider 能主动向 client 推送状态回调，并且 mock client 验签通过。

**步骤**：

1. 完成一次正常 SSO validate。
2. 管理端禁用该用户。
3. 调用 `POST /api/v1/sso/dispatch-callbacks`。
4. 查看 mock dashboard 的 `Last status callback`。

**结果**：通过。

```json
{ "event": "user_disabled", "verification": { "valid": true } }
```

分发接口返回：

```json
{ "status": "ok", "data": { "failed": 0, "final_failed": 0, "succeeded": 1 } }
```

### 7. 主动状态回调：`user_deleted`

**目的**：验证用户删除后，状态查询和主动回调都能反映删除态。

**步骤**：

1. 使用测试账号完成一次 SSO validate，确保存在 grant。
2. 调用账号自删接口 `/api/v1/account/delete`。
3. 调用 `POST /api/v1/sso/status` 查询该用户。
4. 调用 `POST /api/v1/sso/dispatch-callbacks`。
5. 查看 mock dashboard 的 `Last status callback`。

**结果**：通过。

状态查询结果：

```json
{ "status": "error", "message": "user-deleted" }
```

HTTP 状态：`403`。

主动回调结果：

```json
{
	"body": "{\"client_id\":\"mock-auto-test\",\"event\":\"user_deleted\",\"timestamp\":1781146188628,\"user_id\":\"1a4670d9-f338-486c-9155-a868e9a9461d\"}",
	"verification": { "valid": true }
}
```

### 8. Dispatch secret 校验

**目的**：验证主动回调调度接口不会接受缺失或错误的 dispatch secret。

**步骤**：

1. 不带 `x-dispatch-secret` 调用 `POST /api/v1/sso/dispatch-callbacks`。
2. 使用错误 `x-dispatch-secret` 调用同一接口。
3. 使用正确 secret 调用同一接口。

**结果**：通过。

| 输入        | 结果                |
| ----------- | ------------------- |
| 缺失 header | `401 Unauthorized`  |
| 错误 secret | `401 Unauthorized`  |
| 正确 secret | `200`, 返回调度统计 |

另外，测试期间曾在缺少 `DISPATCH_SECRET` 环境变量时得到 `500 server-misconfigured`，补充本地 `.env.local` 后恢复正常。

### 9. 错误 client 凭据

**目的**：验证 validate API 不接受不存在 client 或错误 secret。

**步骤**：

1. 使用不存在的 `client_id` 调用 `POST /api/v1/sso/validate`。
2. 使用存在 client 但错误 `client_secret` 调用同一接口。

**结果**：通过。

| 场景                 | 结果                 |
| -------------------- | -------------------- |
| 不存在 `client_id`   | `401 invalid-client` |
| 错误 `client_secret` | `401 invalid-client` |

### 10. 取消授权流程

**目的**：验证用户点击“取消”时不会签发 ticket，并跳转到配置的 `cancel_redirect_uri`。

**步骤**：

1. 从 mock dashboard 点击 `Start normal SSO (loopback)`。
2. 进入 `/sso/authorize`。
3. 点击 `取消`。

**结果**：通过。

最终 URL：

```text
http://127.0.0.1:4000/cancel
```

mock 页面显示：

```text
Authorization cancelled
SSO authorization was cancelled.
```

### 11. 禁用 SSO client

**目的**：验证已禁用 client 无法发起授权，同时测试后恢复 client 状态。

**步骤**：

1. 使用管理员接口临时更新 `mock-auto-test.disabled_at` 为当前时间。
2. 调用 `/api/v1/sso/authorize`。
3. 恢复 `mock-auto-test.disabled_at = null`。

**结果**：通过。

禁用期间 authorize 返回：

```json
{ "status": "error", "message": "client-disabled" }
```

HTTP 状态：`403`。

测试结束后已恢复 `mock-auto-test` 为启用状态。

### 12. 强制改密流程

**目的**：验证 SSO 场景下 `password_must_change` 用户不会获得授权 ticket，改密完成后才允许继续授权。

**步骤**：

1. 新建测试账号。
2. 管理端调用 reset-password，将该用户置为 `password_must_change=true`。
3. 用户使用重置后的临时密码登录。
4. 发起 SSO 授权。
5. 检查 `/sso/authorize` 页面是否显示强制改密 UI，且不显示 `同意并继续`。
6. 调用改密接口完成密码更新。
7. 刷新 `/sso/authorize`，确认恢复授权确认页。
8. 点击 `同意并继续`，完成 callback validate。

**结果**：通过。

强制改密阻断状态：

| 检查项               | 结果   |
| -------------------- | ------ |
| SSO 场景强制改密文案 | 存在   |
| `同意并继续` 按钮    | 不存在 |
| ticket 是否签发      | 未签发 |

改密后：

| 检查项                 | 结果       |
| ---------------------- | ---------- |
| `password_must_change` | `false`    |
| 授权确认页             | 正常显示   |
| callback validate      | `HTTP 200` |

### 13. 跨标签 consent 混淆

**目的**：验证多个标签页同时存在授权确认页时，旧标签页不能使用被新授权请求覆盖的 SSO context cookie 签发 ticket。

**步骤**：

1. Tab A 发起 SSO，记录隐藏字段 `transaction_id = nKibB8d9E-_ShzqJa7g2RA`。
2. Tab B 再发起 SSO，记录隐藏字段 `transaction_id = 2wXhn5zyd3NPJK4qWzN0Ww`。
3. 确认两者不同。
4. 先提交 Tab A 的旧 consent 表单。
5. 再提交 Tab B 的最新 consent 表单。

**结果**：通过。

Tab A 旧表单提交结果：

```text
http://localhost:3000/sso/authorize?status=expired
```

确认项：

| 检查项                         | 结果       |
| ------------------------------ | ---------- |
| Tab A / Tab B transaction 不同 | `true`     |
| Tab A 旧表单是否签发 ticket    | `false`    |
| Tab A 是否进入 expired 状态    | `true`     |
| Tab B 是否仍能正常授权         | `true`     |
| Tab B callback validate        | `HTTP 200` |

## 测试过程中发现/处理的问题

### 1. `.env.local` 缺少 `DISPATCH_SECRET`

首次调用 `POST /api/v1/sso/dispatch-callbacks` 时返回：

```json
{ "status": "error", "message": "server-misconfigured" }
```

原因是本地 `.env.local` 未配置 `DISPATCH_SECRET`。补充测试用值后，重启 dev server，调度接口恢复正常。

### 2. Turbopack 临时 manifest 文件异常

一次测试中 Next dev server 出现 `.next/static/development/_buildManifest.js.tmp...` 文件缺失错误。清理 `.next` 并重启 dev server 后恢复。

## 尚未覆盖的场景

以下场景本轮未作为重点执行，后续可按风险继续补测：

| 场景                                    | 建议优先级 |
| --------------------------------------- | ---------- |
| 自定义 scheme redirect URI              | 中         |
| client secret 轮换，多 secret hash 验证 | 中         |
| 并发 validate 同一个 ticket             | 中         |
| callback 失败重试退避与最终失败         | 中         |
| authorize/status/validate 的 rate limit | 低         |
| 过期 ticket TTL                         | 低         |
| 过期 SSO context cookie                 | 低         |

## 总体结论

本轮实际覆盖了 SSO 的关键安全路径：授权、取消、HTTPS redirect、ticket 兑换、ticket 重放、错误 client 凭据、用户状态查询、主动状态回调、禁用 client、用户删除、强制改密、跨标签 consent 混淆。测试结果均符合预期，暂未发现需要立即修复的安全或流程缺陷。
