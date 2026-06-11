# SSO 本地联调测试

这份指南用于在本地完整跑通轻量 SSO：小助手作为 SSO provider，`scripts/mockSsoClient.ts` 作为外部服务后端和回调接收方。

## 1. 启动小助手

本地 `.env.local` 至少需要启用账号能力：

```env
SELF_HOSTED=1
APP_SECRET=replace-with-at-least-32-bytes-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin-password
DISPATCH_SECRET=local-dispatch-secret
```

启动开发服务：

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
pnpm dev
```

默认访问地址为 `http://localhost:3000`。

> `NODE_TLS_REJECT_UNAUTHORIZED=0` 仅测试状态回调时需要，允许 Next.js 服务端信任自签名 HTTPS 证书。

### 1.1 生成自签名证书（可选，测试状态回调需要）

状态回调要求 `https:`，可以用 openssl 生成一份自签名证书供 mock client 使用：

```powershell
openssl req -x509 -newkey rsa:2048 `
  -keyout scripts/certs/mock-key.pem `
  -out scripts/certs/mock-cert.pem `
  -days 365 -nodes `
  -subj "/CN=127.0.0.1"
```

如果没有 openssl，也可以用 PowerShell：

```powershell
$cert = New-SelfSignedCertificate -DnsName "127.0.0.1" -CertStoreLocation "cert:\CurrentUser\My"
$cert | Export-Certificate -FilePath scripts\certs\mock-cert.cer -Type CERT
# 私钥需要额外导出，推荐使用 openssl 方案
```

## 2. 创建 SSO client

打开管理员 SSO 页面：

```text
http://localhost:3000/admin/sso
```

新建 client 时建议填写：

```text
名称: Local Mock Client
Loopback Redirect Paths: /callback
HTTPS Redirect URIs: https://127.0.0.1:4443/callback
Custom Scheme Redirect URIs: 留空
Cancel Redirect URI: http://127.0.0.1:4000/cancel
Status Callback URL: https://127.0.0.1:4443/status-callback
```

> - **Loopback Redirect Paths**：只允许 `127.0.0.1` / `::1` 的 HTTP 回调，仅填路径部分（如 `/callback`）。
> - **HTTPS Redirect URIs**：支持外部 HTTPS 网站通过 SSO 登录，需填完整 URL（如 `https://127.0.0.1:4443/callback`）。如果跳过 HTTPS 测试，留空即可。
> - **Status Callback URL**：只接受 `https:`。如果跳过状态回调测试，留空即可。

不要填 `localhost`，否则会得到 `invalid-redirect-uri`。保存后记录页面返回的 `client_id` 和一次性 `client_secret`。

## 3. 启动 mock SSO client

在另一个终端中设置 client 信息并启动：

```powershell
$env:SSO_CLIENT_ID="填入 client_id"
$env:SSO_CLIENT_SECRET="填入 client_secret"
$env:MYSTIA_ORIGIN="http://localhost:3000"
$env:SSO_MOCK_ORIGIN="http://127.0.0.1:4000"

# 以下三行仅测试状态回调时需要
$env:SSO_MOCK_HTTPS_KEY="scripts/certs/mock-key.pem"
$env:SSO_MOCK_HTTPS_CERT="scripts/certs/mock-cert.pem"
$env:SSO_MOCK_HTTPS_PORT="4443"

pnpm sso:mock
```

启动后控制台会打印 mock 客户端的地址。如果设了 HTTPS，dashboard 和所有路由均可通过 HTTPS 访问。

打开：

```text
http://127.0.0.1:4000/
```

如果配置了 HTTPS 且 SSO client 填了 `HTTPS Redirect URIs`，dashboard 会额外显示 `Start normal SSO (HTTPS)` 链接。点击后会使用 `https://127.0.0.1:4443/callback` 作为 `redirect_uri`，测试外部 HTTPS 网站的 SSO 登录流程。

## 4. 正常授权流程

### 4a. Loopback 模式（本地应用模拟）

在 mock 页面点击 `Start normal SSO (loopback)`。

预期流程：

1. 浏览器跳到 `http://localhost:3000/api/v1/sso/authorize?redirect_uri=http://127.0.0.1:4000/callback&...`。
2. 未登录时，小助手的 `/sso/authorize` 页面会自动打开现有账号登录弹窗。
3. 登录后进入 SSO 授权确认页。
4. 点击 `同意并继续` 后，小助手回调 `http://127.0.0.1:4000/callback?ticket=...&state=...`。
5. mock client 后端自动调用 `POST /api/v1/sso/validate`。
6. 页面显示 `HTTP 200` 和小助手用户资料。

### 4b. HTTPS 模式（外部网站模拟）

> **前置条件**：已按 1.1 节生成自签名证书，SSO client 填了 `HTTPS Redirect URIs: https://127.0.0.1:4443/callback`，mock client 已配置 HTTPS 环境变量。

在 mock 页面点击 `Start normal SSO (HTTPS)`。

预期流程：

1. 浏览器跳到 `http://localhost:3000/api/v1/sso/authorize?redirect_uri=https://127.0.0.1:4443/callback&...`。
2. 登录并授权后，小助手把浏览器 302 重定向到 `https://127.0.0.1:4443/callback?ticket=...&state=...`。
3. 浏览器会因自签名证书弹出安全警告，点击「继续访问」即可。
4. mock client 的 HTTPS server 接收回调，自动 validate ticket。
5. 页面显示 `HTTP 200` 和小助手用户资料。

> HTTPS 模式的 `/start` 会使用 `redirect=https` 参数，mock client 将 `redirect_uri` 设为 `https://127.0.0.1:4443/callback`，由 SSO provider 的 `https_redirect_uris` 精确匹配。

## 5. 强制改密流程

用管理员后台把某个用户重置密码，使该用户进入 `password_must_change=1` 状态，然后用该用户走第 4 步。

预期结果：

1. SSO 流程停留在 `/sso/authorize`。
2. 全局强制改密弹窗自动出现。
3. 未完成改密前不会签发 ticket。
4. 改密成功后回到 `/sso/authorize` 授权确认页。
5. 同意后 mock client 能成功 validate。

## 6. 负向用例

完成一次正常授权后，在 mock 页面继续点击：

- `Validate last ticket with correct PKCE`：预期 `HTTP 401`，消息为 `invalid-ticket`，因为正常流程已经消费过 ticket。
- `Validate last ticket with bad PKCE`：预期也是 `HTTP 401 invalid-ticket`，用于确认已消费 ticket 不会再次被接受。
- `Check last user status`：预期 `HTTP 200`，返回 `{ id, status: "active" }`。

要单独验证“ticket 未消费时 PKCE 不匹配”的情况，在 mock 页面点击 `Start SSO with bad PKCE first`。该流程会在 `/callback` 首次调用 validate 时故意提交错误 `code_verifier`，预期得到 `HTTP 401 invalid-ticket`；随后点击 `Validate last ticket with correct PKCE`，预期得到 `HTTP 200`，证明错误 PKCE 不会消费 ticket，而正确 PKCE 仍可完成兑换。

## 7. 状态回调测试

> **前置条件**：按 1.1 节生成自签名证书，小助手 dev server 和 mock client 均已按 HTTPS 模式启动。SSO client 的 `Status Callback URL` 填了 `https://127.0.0.1:4443/status-callback`。

mock client 已实现 `POST /status-callback`，会读取原始 body，并按本项目约定验签：

```text
X-Sso-Signature: t=<timestamp>,v1=<base64url-hmac>
message = "<timestamp>.<rawBody>"
signing_secret = sha256(client_secret).hex()
```

端到端回调步骤：

1. 先完成一次正常 SSO validate，确保系统写入 `sso_user_client_grants`。
2. 在管理员后台禁用或删除该用户。
3. 调用调度接口：

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/v1/sso/dispatch-callbacks" `
  -Headers @{ "x-dispatch-secret" = "local-dispatch-secret" }
```

4. 回到 `http://127.0.0.1:4000/` 查看 `Last status callback`，应显示收到的回调内容和 `"verification": { "valid": true }`。

## 8. 推荐验证命令

```powershell
pnpm exec tsc --noEmit --incremental false --pretty false
pnpm exec eslint scripts/mockSsoClient.ts
pnpm lint
pnpm build
git -c core.quotepath=false diff --check dev/account
```
