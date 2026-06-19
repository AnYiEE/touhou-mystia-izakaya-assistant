---
name: 轻量 SSO 票据方案
overview: 基于现有账号系统为外部服务提供一次性登录票据，外部服务后端换票后自行建立业务账号和授权。
isProject: false
---

# 轻量 SSO 票据方案

> 日期：2026-06-09
> 基准方案：[账号系统方案与接入报告.plan.md](账号系统方案与接入报告.plan.md)
> 范围：面向外部游戏联机客户端、皮肤网站等服务提供小助手账号统一身份入口。外部服务具备自己的后端和数据库，负责业务账号、权限、封禁、皮肤和联机凭证管理。

## 一、设计目标

- 本项目作为身份提供方，只负责确认浏览器当前登录的小助手用户身份。
- 外部服务作为业务方，负责将小助手用户映射到自己的业务用户，并签发自己的联机或皮肤服务凭证。
- 外部服务浏览器前端和本地客户端不直接调用本项目 SSO 服务端换票 API；授权入口只使用顶层导航跳转，不共享账号 Cookie，不暴露 `mystia-session`。
- 支持外部服务部署在不同服务器上，不依赖同一 nginx、同一 CDN 或同一父域 Cookie。
- 复用现有小助手账号、普通 session、用户状态、禁用/删除、Cookie 安全、同源校验和 SQLite 迁移体系。
- 采用一次性短期 ticket，避免外部网站前端或本地客户端保存跨系统长期密钥。
- 保持实现小于完整 OAuth2/OIDC；后续如需开放给不完全可信第三方，再升级为标准 OAuth2/OIDC。

## 二、非目标

- 不实现 OAuth2/OIDC 的完整授权服务器能力。
- 不实现 refresh token、scope、discovery、JWKS、标准 userinfo 或第三方开放平台管理后台。
- 不让外部服务直接访问本项目数据库。
- 不把本项目 session token、CSRF token 或 Cookie 传递给外部服务。
- 不为外部服务维护联机权限、皮肤权限、封禁状态、会员状态或业务角色。
- 不自动按 email、昵称或其它外部资料合并账号。
- SSO 浏览器流程不处理跨域 AJAX；所有浏览器侧交互只使用顶层导航跳转。

## 三、参与方与职责

| 参与方         | 职责                                                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| 本项目         | 提供现有账号登录、注册和 session；签发一次性 SSO ticket；校验 ticket 并返回小助手用户资料。                          |
| 外部网站       | 使用 HTTPS redirect 接收授权回调；校验网站自己的登录会话 state；由后端换票并建立网站自己的登录态。                   |
| 外部客户端     | 打开浏览器发起授权；接收 loopback 或自定义协议回调；把 ticket 交给外部服务后端。                                     |
| 外部服务后端   | 保存 SSO client secret；调用本项目 validate 接口换取小助手用户资料；维护自己的业务用户和权限；签发自己的业务 token。 |
| 外部服务数据库 | 保存小助手用户 ID 与外部业务用户的映射、皮肤数据、联机权限、封禁状态等业务数据。                                     |

本地 loopback 与 custom scheme 接入按 public client 处理：本项目只校验 loopback host、白名单 path 或精确 custom scheme URI，不把“某个本机进程收到了 ticket”视为可信客户端证明。外部服务后端必须继续校验自己的登录事务 state、`code_verifier`/`code_challenge` 绑定和服务端保存的 `client_secret`；ticket 只表示浏览器中的小助手用户同意授权，不表示接收 ticket 的本地进程可信。

### 部署域名与请求边界

SSO 协议允许浏览器授权入口和服务端 API 使用不同公开 origin。生产自托管中可以按网络拓扑拆成两个配置项：

| 配置项               | 示例                               | 用途                                                                   |
| -------------------- | ---------------------------------- | ---------------------------------------------------------------------- |
| `sso_browser_origin` | `https://izakaya.cc`               | 只供浏览器顶层导航访问 `/api/v1/sso/authorize`，复用小助手账号登录态。 |
| `sso_api_origin`     | `https://assistant-bff.izakaya.cc` | 只供外部服务后端调用 `/api/v1/sso/validate` 和 `/api/v1/sso/status`。  |

`sso_api_origin` 可以通过反向代理、BFF 域名、内网解析或 hosts 映射路由到同一个小助手应用实例；实现语义仍是同一组 SSO API。`validate` 和 `status` 是 HTTPS server-to-server JSON 请求，不依赖 `Cookie`、`Origin`、`Referer`、CSRF token 或浏览器同源策略，也不会因为请求的 Host 与浏览器授权域名不同而改变 ticket、client secret 或用户状态校验语义。部署层必须确保该 API origin 的 Host/SNI/反向代理规则最终落到同一个启用账号系统的应用，并由可信代理正确覆盖或清洗 `X-Forwarded-For`、`X-Real-IP` 等来源头。

## 四、总体流程

```text
外部网站或本地客户端 -> 浏览器打开小助手 authorize
浏览器 -> 小助手登录或复用已有登录态
小助手 -> 展示授权确认页
用户同意授权 -> 小助手通过 HTTPS、loopback 或 custom scheme 回调一次性 ticket
外部网站后端或本地客户端 -> 外部服务后端提交 ticket
外部服务后端 -> 小助手 validate 换取用户资料
外部服务后端 -> 建立或更新自己的业务用户
外部服务后端 -> 签发外部服务自己的业务 token
本地客户端/皮肤网站 -> 使用外部服务 token 访问外部业务接口
```

本项目只在 `validate` 阶段返回小助手账号身份。外部服务是否允许进入联机服务器、是否允许上传皮肤、是否已被封禁，均由外部服务根据自己的数据库决定。

## 五、用户交互流程

### 未登录小助手账号

1. 用户在外部网站或本地游戏联机客户端点击“使用小助手账号登录”。
2. 外部网站后端或本地客户端生成 `state`、`code_verifier`，计算 `code_challenge`。
3. 浏览器访问本项目 `GET /api/v1/sso/authorize`。
4. 本项目校验 SSO client、redirect URI 和授权参数。
5. 本项目发现用户没有有效 `mystia-session`，展示现有登录或注册界面。
6. 用户完成登录或注册。
7. 本项目继续当前 SSO 流程，展示授权确认页。
8. 用户同意授权后，本项目生成一次性 ticket。
9. 本项目通过 redirect URI 回调外部网站 HTTPS 地址、本地 loopback 地址或 custom scheme。
10. 外部网站后端直接处理回调；本地客户端把 ticket、state、code verifier 交给外部服务后端。
11. 外部服务后端完成换票和业务登录，外部网站或客户端进入已登录状态。

### 已登录小助手账号

1. 用户在外部网站或本地客户端点击登录。
2. 浏览器打开 `authorize`。
3. 本项目识别已有有效登录态，不再要求输入密码。
4. 本项目展示授权确认页。
5. 用户同意授权后，本项目生成 ticket 并回调客户端。
6. 外部网站或客户端通过外部服务后端完成业务登录。

### 退出

- 外部服务退出只清理外部服务自己的 session 或 token，不影响小助手登录态。
- 全局退出小助手账号仍由本项目账号窗口处理，不作为本方案 MVP 的联动能力。

## 六、接口规格

### `GET /api/v1/sso/authorize`

浏览器顶层导航接口，不提供 CORS。

#### Query 参数

| 参数             | 必填 | 说明                                                 |
| ---------------- | ---- | ---------------------------------------------------- |
| `client_id`      | 是   | 外部服务客户端 ID                                    |
| `redirect_uri`   | 是   | 外部客户端回调地址，必须匹配白名单                   |
| `state`          | 是   | 外部客户端生成的随机状态值，本项目原样带回           |
| `code_challenge` | 是   | `code_verifier` 的挑战值，建议使用 SHA-256 Base64URL |

其中 `redirect_uri` 为授权成功后的回调地址，必须匹配 client 白名单；`cancel_redirect_uri`（client 配置）为授权确认页点"取消"后的跳转地址，按同一 URI 格式与安全规则校验，但不要求同时出现在登录回调白名单中。

#### 成功响应

用户已登录时，`authorize` 路由返回 `303` 到本项目授权确认页：

```text
/sso/authorize
```

用户未登录时，展示或跳转到现有账号登录/注册 UI。登录成功后继续原授权上下文。

SSO 授权上下文通过以下机制保持：authorize 路由在发起登录前，将 `client_id`、`redirect_uri`、`state`、`code_challenge` 存入短期 HttpOnly Cookie（`mystia-sso-context`，有效期 10 分钟）。登录或注册接口在处理完成后检查该 Cookie：若存在，不返回 JSON 登录成功响应，改为跳转到授权确认页。登录接口在 SSO 上下文中调用 `authenticateAccountFromRequest` 时传入 `allowPasswordMustChange=true`，允许管理员重置密码后尚未改密的用户进入 SSO 授权确认流程。

运行时加载边界已拆分：`ssoValidation.ts` 承载 client id、redirect URI、state、PKCE、ticket、client 配置等纯校验；`ssoContext.ts` 承载短期 SSO context cookie、transaction id 和 redirect URL 工具；`sso.ts` 保留 DB、ticket、grant、callback dispatch 等重逻辑。`authorize`、`validate`、`status`、`dispatch-callbacks` 路由和 `/sso/authorize` 页面均先静态使用轻量模块完成参数、cookie context、限流和账号状态校验，再动态加载 `sso.ts`。

#### 授权确认页

用户已登录时，本项目展示授权确认页而非直接发 ticket。无论是本次会话已登录还是刚刚完成登录，均展示确认页。页面包含：

- 目标 client 的 `name`（如"联机客户端"）。
- 简要说明：该外部服务将获取您的小助手账号身份。
- "同意并继续"和"取消"两个按钮。

点击"同意并继续"后本项目生成 ticket 并回调；"取消"或关闭页面则不生成 ticket，并重定向到 client 配置的 `cancel_redirect_uri`（如有），否则展示取消提示页。

此设计确保用户明确知晓自己的账号身份正在被哪个外部服务使用。

#### 错误响应

- `400 invalid-object-structure`：参数缺失或格式错误。
- `400 invalid-redirect-uri`：redirect URI 不在白名单。
- `403 client-disabled`：SSO client 已被管理员禁用。
- `404 feature-disabled`：账号或 SSO 功能未启用。
- `500 server-misconfigured`：SSO client 配置、密钥或 SQLite 状态异常。

错误页不得跳转到未校验的 redirect URI。

### `POST /api/v1/sso/validate`

服务端到服务端接口。仅供外部服务后端调用，不依赖浏览器 Cookie，不提供给外部前端跨域 AJAX 使用。外部服务可通过 `sso_api_origin` 调用该接口，即使浏览器授权入口位于另一个 origin。

推荐请求头：`Host`、`Content-Type: application/json`、`Accept: application/json` 和明确的外部服务 `User-Agent`。不应发送 `Cookie`、`Origin`、`Referer` 或 `X-CSRF-Token`。请求体上限为 128 KiB；如发送 `Content-Length`，必须是合法数字且不超过该上限。

#### 请求体

```ts
interface ISsoValidateBody {
	client_id: string;
	client_secret: string;
	ticket: string;
	code_verifier: string;
}
```

#### 成功响应

```json
{
	"status": "ok",
	"data": {
		"user": {
			"id": "mystia-user-id",
			"nickname": "夜雀",
			"username": "用户名",
			"status": "active"
		}
	}
}
```

`nickname` 为展示字段，可为 `null`；外部服务可用于界面展示，但不得用它绑定、合并或查找业务账号。外部服务账号映射必须继续以 `user.id` 为唯一稳定标识，`username` 也只作为登录名展示或运维检索字段。

#### 错误响应

- `400 invalid-object-structure`：请求体格式错误。
- `401 invalid-client`：client_id 不存在或所有 active secret 均校验失败。
- `401 invalid-ticket`：ticket 不存在、已过期、已使用或 PKCE 校验失败。
- `403 client-disabled`：SSO client 已被管理员禁用。
- `403 user-disabled`：用户已禁用。
- `403 user-deleted`：用户已删除。
- `429 too-many-requests`：限流。
- `500 server-misconfigured`：服务端配置或数据库异常。

成功 validate 后必须立即标记 ticket 为已使用。重复 validate 同一 ticket 必须失败。

validate 校验必须包含：ticket 存储的 `client_id` 与请求中的 `client_id` 一致。

### `POST /api/v1/sso/status`

服务端到服务端接口。供外部服务后端定期检查用户状态，确认其小助手账号未被禁用或删除，不依赖浏览器 Cookie，不提供给外部前端跨域 AJAX 使用。请求头、body 大小和代理来源头要求与 `validate` 相同。

#### 请求体

```ts
interface ISsoStatusBody {
	client_id: string;
	client_secret: string;
	user_id: string;
}
```

#### 成功响应

```json
{
	"status": "ok",
	"data": { "user": { "id": "mystia-user-id", "status": "active" } }
}
```

#### 错误响应

- `400 invalid-object-structure`：请求体格式错误。
- `401 invalid-client`：client_id 不存在或所有 active secret 均校验失败。
- `403 client-disabled`：SSO client 已被管理员禁用。
- `403 user-disabled`：用户已禁用。
- `403 user-deleted`：用户已删除。
- `404 user-not-found`：用户不存在、该 client 对此用户无授权、或授权已被撤销/从未授予；外部服务应按“不可继续访问”处理，避免区分账号存在性和授权存在性。
- `429 too-many-requests`：限流。
- `500 server-misconfigured`：服务端配置或数据库异常。

返回值仅包含 `id` 和 `status`，不返回昵称、用户名等额外资料。外部服务根据 `status` 决定是否继续允许该用户访问自己的业务接口。建议外部服务在签发短期 token 后每隔数小时调用一次本接口复核用户状态，而非在每次业务请求时调用。外部服务需要刷新昵称或用户名展示时，应通过用户重新授权后的 validate 响应或后续单独资料同步机制处理，不应把 status 轮询当作资料同步接口。

### 状态变更回调

除被动查询外，本项目在用户授权、用户状态、client 状态或 secret 状态发生关键变更时主动向外部服务发送回调通知，实现近即时撤销和配置收敛。

回调触发事件：

- 用户自助或管理员撤销授权：`grant_revoked`。
- 管理员禁用用户：`user_disabled`。
- 用户自行逻辑删除账号：`user_deleted`。
- 用户修改用户名或昵称：`user_profile_updated`。
- 管理员禁用 client：`client_disabled`。
- 管理员删除 client：`client_deleted`。
- 管理员创建、启用/禁用或撤销 secret：`secret_rotated`。

管理员启用用户或恢复已删除用户时，用户仍未变为 active（恢复后为 disabled），不触发回调。

回调方式：本项目服务端向外部服务配置的 `status_callback_url` 发起 `POST` 请求。

#### 回调请求体

```json
{
	"client_id": "game-client",
	"event": "user_disabled",
	"metadata": {},
	"timestamp": 1710000000000,
	"user_id": "mystia-user-id"
}
```

字段：

| 字段        | 说明                                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `client_id` | 发起回调的本项目 client ID                                                                                                        |
| `event`     | `grant_revoked`、`user_disabled`、`user_deleted`、`user_profile_updated`、`client_disabled`、`client_deleted` 或 `secret_rotated` |
| `metadata`  | 事件附加信息，只包含安全的 string/number/boolean/null 字段；未知字段应忽略                                                        |
| `timestamp` | 事件发生时的毫秒时间戳                                                                                                            |
| `user_id`   | 用户级事件为小助手用户 ID；client 级事件为 `null`                                                                                 |

`user_profile_updated` 的 `metadata` 包含最新展示资料快照：`username` 和 `nickname`，其中 `nickname` 可为 `null`。外部服务只能用这些字段更新展示缓存，账号绑定仍必须使用 `user_id`。

#### 签名验证

回调请求附带 HMAC-SHA256 签名头：

```http
X-Sso-Signature: t=1710000000000,v1=base64url(HMAC-SHA256(signing_secret, "{t}.{body}"))
```

其中签名头中的 `t` 是本次投递时间；`body.timestamp` 是用户状态事件发生时间。`signing_secret` 为当前首位 active secret hash，也就是原始 `client_secret` 经 `SHA-256` 后得到的 64 位 hex 字符串；运行时优先由 `sso_client_secrets` 按 `position` 排序得到，并同步到 legacy `secret_hashes` 兼容字段。外部服务收到回调后必须使用该派生签名密钥重新计算 HMAC 并与请求头比对。签名有效且投递时间 `t` 在允许的时间偏差内（建议 ±5 分钟），方可采信回调内容。

TypeScript/JavaScript 校验示例：

```ts
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

function deriveSigningSecret(clientSecret: string) {
	return createHash('sha256').update(clientSecret).digest('hex');
}

function parseSsoSignatureHeader(header: string) {
	const parts = Object.fromEntries(
		header.split(',').map((part) => {
			const [key, value] = part.split('=', 2);

			return [key, value];
		})
	);
	const timestamp = Number.parseInt(parts.t ?? '', 10);
	const signature = parts.v1 ?? '';

	return Number.isSafeInteger(timestamp) && signature.length > 0
		? { signature, timestamp }
		: null;
}

export function verifySsoCallbackSignature({
	clientSecrets,
	header,
	now = Date.now(),
	rawBody,
}: {
	clientSecrets: string[];
	header: string;
	now?: number;
	rawBody: string;
}) {
	const parsed = parseSsoSignatureHeader(header);
	if (parsed === null || Math.abs(now - parsed.timestamp) > 5 * 60 * 1000) {
		return false;
	}

	const message = `${parsed.timestamp}.${rawBody}`;
	const actual = Buffer.from(parsed.signature, 'base64url');

	return clientSecrets.some((clientSecret) => {
		const signingSecret = deriveSigningSecret(clientSecret);
		const expected = createHmac('sha256', signingSecret)
			.update(message)
			.digest();

		return (
			actual.length === expected.length &&
			timingSafeEqual(actual, expected)
		);
	});
}
```

注意事项：

- `rawBody` 必须是 HTTP 请求收到的原始 body 字符串，不能用重新序列化后的 JSON 替代。
- HMAC key 是 `SHA-256(client_secret).hex()`，不是原始 `client_secret`。
- secret 轮换期间，外部服务应同时接受所有当前仍有效的 `client_secret` 派生出的签名密钥；旧 secret 从本项目移除并确认不再投递后，再停止接受对应派生密钥。

#### 外部服务处理要求

- 收到 `grant_revoked`：立即撤销该用户在本 client 下签发的业务 token。
- 收到 `user_disabled`：立即撤销该用户在本服务内签发的所有业务 token。
- 收到 `user_deleted`：同 `user_disabled` 处理。
- 收到 `user_profile_updated`：按 `user_id` 更新外部服务保存的 `username`、`nickname` 等展示缓存；不得撤销 token、重新授权或改动外部业务用户绑定。
- 收到 `client_disabled`：暂停登录入口或拒绝新建会话，必要时撤销该 client 下所有业务 token。
- 收到 `client_deleted`：清理该 client 的外部映射或进入不可用状态，必要时撤销该 client 下所有业务 token。
- 收到 `secret_rotated`：尽快同步外部服务保存的 secret 配置；轮换窗口内同时接受新旧 secret 派生出的 callback signing secret。
- 签名无效或时间戳偏差过大：丢弃回调，可记录告警。
- 回调处理应为幂等：重复收到同一事件不应产生副作用。建议以 `client_id + event + (user_id ?? "client") + timestamp` 或外部服务保存的最新处理时间戳去重。

#### 本项目建设要求

状态变更时，本项目不直接发起 HTTP 回调，而是将回调任务写入持久化队列表，由定时调度器统一发送。这确保服务重启或外部服务临时不可达时不丢失通知。

回调队列表：

```sql
CREATE TABLE sso_callback_queue (
    id integer PRIMARY KEY AUTOINCREMENT,
	client_id text NOT NULL REFERENCES sso_clients(id) ON DELETE CASCADE,
	user_id text REFERENCES users(id) ON DELETE CASCADE,
    event text NOT NULL,
	generation integer NOT NULL DEFAULT 0,
	lease_token text,
	lease_expires_at integer,
	metadata_json text NOT NULL DEFAULT '{}',
    timestamp integer NOT NULL,
    attempts integer NOT NULL DEFAULT 0,
    last_error text,
    next_retry_at integer NOT NULL,
    created_at integer NOT NULL
);

CREATE UNIQUE INDEX sso_callback_queue_user_event_unique_index
	ON sso_callback_queue(client_id, user_id, event)
	WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX sso_callback_queue_client_event_unique_index
	ON sso_callback_queue(client_id, event)
	WHERE user_id IS NULL;

CREATE INDEX sso_callback_queue_client_event_index
	ON sso_callback_queue(client_id, event);

CREATE INDEX sso_callback_queue_next_retry_at_index
    ON sso_callback_queue(next_retry_at);
```

流程：

1. 用户授权撤销、用户禁用/自删、用户资料更新、client 禁用/删除或 secret 轮换时插入一条 `sso_callback_queue` 记录，`next_retry_at` 设为当前时间（立即重试）。用户级事件只面向该用户已授权、client 仍启用且配置了 `status_callback_url` 的 client；client 级事件在禁用或软删除后仍可投递。
2. 回调投递由同一 `dispatchSsoCallbacks` 服务函数处理，可通过两类入口触发：兼容内部 cron 的 `POST /api/v1/sso/dispatch-callbacks` 使用请求头 `x-dispatch-secret` 与环境变量 `DISPATCH_SECRET` 做 timing-safe 比对；管理员后台的 `POST /api/v1/admin/sso/callbacks/dispatch` 使用管理员 session 和 CSRF，并写入管理员审计。每次调用处理一批到期回调（建议单次最多 20 条，避免单次调用耗时过长），外部 cron 间隔建议 30 秒。
3. 派发时如果用户级事件对应的 client 已删除、已禁用或已清空 `status_callback_url`：直接删除该队列记录，不再投递。`client_disabled`、`client_deleted`、`secret_rotated` 这类 client 级事件允许在禁用或软删除后继续投递，只要仍保留 callback URL 和 active secret。
4. 回调成功（外部服务返回 `2xx`）：删除该队列记录
5. 回调失败：递增 `attempts`，记录 `last_error`，将 `next_retry_at` 推迟。退避策略：前 3 次为 1s、5s、25s；之后每次 +60s，最多重试 100 次（约 100 分钟覆盖）。超过最大重试次数后标记为最终失败，仅记录告警日志，不再重试。
6. 同一 `(client_id, user_id, event)` 的用户级事件去重：数据库层使用 `user_id is not null` 的 partial unique index。若已存在同 client、同用户、同事件且尚未成功的记录，新的状态事件刷新该记录的 `timestamp`、`attempts`、`last_error`、`metadata_json`、`generation`、租约字段和 `next_retry_at`，避免真实后续状态变化被旧 pending 记录吞掉。client 级事件 `user_id` 为 `null`，由 `user_id is null` 的 `(client_id, event)` partial unique index 保留最新待处理记录。

回调请求本身的要求不变：超时 5 秒、`User-Agent: Mystia-SSO/1.0`、HMAC 签名头。签名头中的 `t` 使用每次投递的当前时间；请求 body 中的 `timestamp` 使用回调记录中的事件发生时间，确保外部服务既能做新鲜度校验，也能幂等处理事件。

生产定时调度器可复用现有 `/api/v1/backups/cleanup` 的 cron 调用模式，通过独立内部端点 `/api/v1/sso/dispatch-callbacks` 由外部 cron 触发；管理员需要临时补投递时，可在后台通过 `/api/v1/admin/sso/callbacks/dispatch` 立即触发同一批处理逻辑。

#### 与主动状态查询的关系

状态变更回调和外部服务的主动 `/api/v1/sso/status` 查询是互补机制，不会冲突：

- **回调**是事件驱动的推送：本项目在授权撤销、用户状态、用户资料、client 状态或 secret 状态变化时立即通知，实现近即时撤销、展示资料更新和配置收敛。外部服务收到后按事件撤销用户 token、更新展示缓存、暂停 client 或处理 secret 轮换。
- **状态查询**是周期性的拉取：外部服务按固定间隔（如每小时）复核用户状态，作为回调投递延迟或临时失败时的兜底保障。
- 两者操作均为幂等：撤销一个已被撤销的 token 是空操作，不会产生副作用。
- 外部服务不应根据状态查询结果**重新授权**用户：重新授权只能通过用户主动的 `authorize` → `validate` 流程完成。状态查询仅为用户 token 撤销提供依据；client 或 secret 状态仍以后台配置和 callback 事件为准。

简单来说：回调是主要的撤销信号，状态查询是保险绳。外部服务不需要在两者之间做互斥或去重。

## 七、Redirect URI 策略

SSO client 可同时配置多种 redirect 白名单。同一个 client 既可以服务外部网站，也可以服务同一外部服务的桌面客户端；每次授权请求实际使用哪一种，由本次 `redirect_uri` 决定。

当前支持三类 redirect URI。

### HTTPS Website Redirect

```text
https://online.example.com/auth/mystia/callback
```

限制：

- scheme 必须为 `https`。
- URI 必须精确匹配 `https_redirect_uris` 白名单。
- 必须是外部网站后端可处理的登录回调地址。
- 不允许用户名、密码和 hash fragment。
- 可以包含固定 query，但白名单和请求中的完整 URI 必须一致；本项目回调时会追加或覆盖 `ticket` 和 `state` query 参数。白名单不应预置 `ticket`、`state` 或 `code_verifier`。

外部网站统一登录应优先使用 HTTPS website redirect：外部网站后端生成 `state` 和 `code_verifier`，浏览器跳转到本项目授权入口，回调落到外部网站后端后再换票建立网站自己的登录态。

### Loopback Redirect

```text
http://127.0.0.1:{port}/callback
http://[::1]:{port}/callback
```

限制：

- scheme 必须为 `http`。
- host 只能是 `127.0.0.1`、`[::1]` 或 `::1`。
- path 必须在 client 配置白名单内。
- port 可由客户端动态选择。
- 不允许普通公网 `http://` redirect URI。

本地客户端应临时启动 loopback HTTP server，收到回调后立即关闭。

### Custom Scheme Redirect

```text
mystia-game://sso/callback
```

限制：

- URI 必须精确匹配白名单。
- 需要客户端在操作系统注册自定义协议。
- 自定义协议存在同机程序抢占风险，因此仍必须使用 `code_challenge` / `code_verifier`。

本地客户端通常优先实现 loopback redirect；无法稳定监听本地端口或需要更深系统集成时，再补 custom scheme redirect。两者可以和 HTTPS website redirect 配在同一个 client 中。

## 八、Ticket 数据结构

新增 SQLite 表：

```sql
CREATE TABLE sso_tickets (
    ticket_hash text PRIMARY KEY,
    client_id text NOT NULL,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    redirect_uri text NOT NULL,
    code_challenge text NOT NULL,
    created_at integer NOT NULL,
    expires_at integer NOT NULL,
	used_at integer,
	revoked_at integer,
	revoked_reason text
);

CREATE INDEX sso_tickets_expires_at_index ON sso_tickets(expires_at);
CREATE INDEX sso_tickets_user_id_index ON sso_tickets(user_id);
```

规则：

- ticket 明文只返回给客户端一次。
- 数据库只保存 ticket hash，不保存明文 ticket。
- ticket 使用高强度随机值生成。
- ticket 有效期建议 60 秒，最大不超过 5 分钟。
- ticket 绑定 `client_id`、`redirect_uri` 和 `code_challenge`。
- ticket validate 成功后写入 `used_at`。
- 管理员撤销授权、按 client/user 批量撤销或手动撤销未消费 ticket 时写入 `revoked_at` 和安全的 `revoked_reason`。
- 过期 ticket 可由 cleanup 或独立清理任务删除。建议在现有 `/api/v1/backups/cleanup` 定时任务中增加按 `expires_at` 清理过期 ticket 的逻辑。

新增 `sso_tickets`、`sso_clients` 和 `sso_callback_queue` 表后，需同步更新 `ensureAccountTableStructure`：为 `sso_tickets` 校验 `(ticket_hash)` 主键和 `REFERENCES users(id) ON DELETE CASCADE` 外键；为 `sso_clients` 校验 `(id)` 主键；为 `sso_callback_queue` 校验 `(id)` 主键。

## 九、SSO Client 管理

SSO client 配置存储于 SQLite 数据库，并通过管理员页面管理。

### 数据库表

```sql
CREATE TABLE sso_clients (
    id text PRIMARY KEY,
    name text NOT NULL,
	secret_hashes text NOT NULL,
    loopback_redirect_paths text NOT NULL DEFAULT '[]',
	custom_scheme_redirect_uris text NOT NULL DEFAULT '[]',
	https_redirect_uris text NOT NULL DEFAULT '[]',
    disabled_at integer,
	deleted_at integer,
	deleted_by_admin text,
    status_callback_url text,
    cancel_redirect_uri text,
    created_at integer NOT NULL,
    updated_at integer NOT NULL
);

CREATE TABLE sso_client_secrets (
	id text PRIMARY KEY,
	client_id text NOT NULL REFERENCES sso_clients(id) ON DELETE CASCADE,
	secret_hash text NOT NULL,
	label text,
	position integer NOT NULL DEFAULT 0,
	created_at integer NOT NULL,
	created_by_admin text,
	last_used_at integer,
	disabled_at integer,
	revoked_at integer
);

CREATE UNIQUE INDEX sso_client_secrets_client_hash_unique_index
	ON sso_client_secrets(client_id, secret_hash);
```

- `secret_hashes`：legacy 兼容字段，保存 active secret hash 的 JSON 字符串数组；运行时优先读取 `sso_client_secrets` 中未禁用、未撤销的记录，再同步维护该字段用于旧数据兼容。
- `sso_client_secrets`：per-secret 元数据主表，保存 `SHA-256(client_secret)` 的 hex、标签、创建人、排序、最后使用时间、禁用时间和撤销时间。后台响应只展示 hash 前缀和元数据，新 secret 明文只在创建时返回一次。
- `loopback_redirect_paths`、`custom_scheme_redirect_uris` 和 `https_redirect_uris`：JSON 字符串数组，存储 redirect URI 白名单；三者可同时配置，至少需要有一种非空。
- `disabled_at`：可选禁用时间戳。为 `NULL` 时 client 启用；非空时 client 保留配置和历史授权记录，但 `authorize`、`validate`、`status` 均返回 `client-disabled`；禁用动作本身仍会尽量投递 `client_disabled` callback。
- `deleted_at` / `deleted_by_admin`：软删除标记。软删除后公开协议不可再使用该 client，但 `client_deleted` callback、审计和历史记录仍可追踪。
- `status_callback_url`：可选，配置后授权撤销、用户状态、client 状态或 secret 变化时本项目主动回调。
- `cancel_redirect_uri`：可选，用户在授权确认页点击取消后跳转的地址。

SSO 功能不设独立环境变量开关。SSO 跟随账号功能启用：当 `SELF_HOSTED` 满足且 `APP_SECRET` 有效时，SSO 接口即可用。SSO client 的创建、编辑、禁用、启用和删除均通过管理员页面操作，若无已注册 client 则 authorize 返回 `feature-disabled`。

### 管理员页面

在现有管理员后台新增"SSO 客户端"管理页，提供：

- 查看已注册 client 列表，显示名称、ID、创建时间、是否有 status callback。
- 新建 client，输入名称后自动生成 client ID 和初始 secret；原始 secret 只在生成响应中展示，Secrets 区域展示 secret hash 前缀、标签、创建人、最后使用时间和状态。
- 管理 secret：添加新 secret、重命名、禁用/启用或撤销旧 secret；最后一个 active secret 不可禁用或撤销，secret 变更会触发 `secret_rotated` callback。
- 编辑 HTTPS、loopback、custom scheme redirect URI 白名单、status callback URL、cancel redirect URI。
- 禁用或启用 client。禁用不删除配置、secret hash 或历史授权记录，用于临时暂停外部服务接入。
- 删除 client（需确认，内部为软删除）。

## 十、PKCE-like 校验

外部网站前端和本地客户端都不能安全保存 `client_secret`。为降低 ticket 被浏览器历史、日志、同机程序或错误跳转截获后的风险，本方案要求所有接入形态都使用 PKCE-like 校验。

流程：

1. 外部网站后端或本地客户端生成随机 `code_verifier`。
2. 发起方计算 `code_challenge = base64url(sha256(code_verifier))`。
3. `authorize` 保存 `code_challenge`。
4. `validate` 要求外部服务后端提交 `code_verifier`。
5. 本项目重新计算 challenge 并比对。

即使其它程序或错误页面截获 redirect URI 中的 ticket，没有 `code_verifier` 也无法完成 validate。

## 十一、外部服务后端职责

外部服务后端必须实现自己的业务登录接口，例如：

```text
GET /auth/mystia/callback
POST /api/auth/mystia/callback
```

职责：

- 外部网站接收 HTTPS callback 中的 `ticket` 和 `state`；本地客户端接收 loopback 或 custom scheme callback 后提交 `ticket`、`state`、`code_verifier`。
- 校验 `state` 是否与本次客户端登录流程匹配。
- 使用 `client_id` 和 `client_secret` 调用本项目 `/api/v1/sso/validate`。
- 读取返回的小助手 `user.id`，并保存 `username`、`nickname` 等展示字段。
- 在自己的数据库中查找或创建业务用户映射。
- 根据自己的封禁、白名单、皮肤权限和联机规则决定是否签发业务 token。
- 将外部服务自己的 token 返回给客户端。

推荐外部服务数据库至少保存：

```sql
CREATE TABLE external_users (
    id text PRIMARY KEY,
    mystia_user_id text NOT NULL UNIQUE,
    username text NOT NULL,
	nickname text,
    status text NOT NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL
);
```

外部服务可另行维护封禁、皮肤、角色、联机权限等业务表。

注意：`mystia_user_id UNIQUE` 意味着每个小助手用户在该外部服务中唯一映射。如果同一个外部服务有多个 client 接入，建议由外部服务的统一用户表管理映射，而非每个 client 独立建表。

## 十二、外部业务 Token

本项目不签发外部联机 token。外部服务应在 validate 成功后签发自己的业务凭证。

可选形式：

- 外部服务数据库 session。
- 外部服务签名 JWT。
- 短期 access token + 外部服务自己的刷新机制。

业务 token 建议包含：

```json
{
	"sub": "external-user-id",
	"mystia_user_id": "mystia-user-id",
	"aud": "game-service",
	"iat": 1710000000,
	"exp": 1710007200
}
```

外部服务负责 token 撤销、封禁、过期和密钥轮换。本项目不参与外部 token 的验证。

## 十三、安全规则

- `authorize` 只能跳转到已配置的 redirect URI。
- `validate` 必须校验 client secret，不接受浏览器端无密钥调用。
- client secret 是外部服务后端凭证，`validate` 和 `status` 通过 HTTPS server-to-server 请求提交原始 secret；本项目数据库只保存 `SHA-256(client_secret).hex()`，用于降低数据库或管理页泄露后的直接可用性风险。
- hash 存库不等于请求体不出现 secret；若未来需要避免原始 secret 出现在请求体，应改为请求签名、mTLS 或公私钥认证等更强协议。
- ticket 必须短期、一次性、只存 hash。
- ticket 必须绑定 client、redirect URI 和 PKCE challenge。
- `state` 由外部客户端或外部服务生成，本项目原样带回，不负责解释其内容。
- SSO 授权入口仅面向顶层导航；`validate` 和 `status` 仅面向外部服务后端，不把 CORS 作为安全边界，也不允许浏览器端携带 `client_secret` 直接调用。
- 本项目账号 Cookie 继续使用 HttpOnly、SameSite=Lax、Secure 生产约束。
- 所有 SSO API 响应必须 `Cache-Control: no-store` 和 `Vary: Cookie`。
- `validate` 应纳入限流，限流维度包括 client ID、请求 IP 和 ticket hash。
- 用户为 `disabled` 或 `deleted` 时，不得签发有效 SSO 身份。
- 外部服务不得把小助手用户 ID 当作业务权限本身；业务准入必须由外部服务自己的数据库决定。
- `/api/v1/sso/dispatch-callbacks` 作为 cron 兼容内部端点，必须通过 `x-dispatch-secret` 请求头与环境变量 `DISPATCH_SECRET` 做 timing-safe 比对鉴权，与 `/api/v1/backups/cleanup` 的 `x-cleanup-secret` 模式一致；管理员即时投递入口 `/api/v1/admin/sso/callbacks/dispatch` 使用管理员 session、CSRF 和审计日志保护。

## 十四、本项目最小改动清单

新增文件：

- `app/api/v1/sso/authorize/route.ts`
- `app/api/v1/sso/validate/route.ts`
- `app/api/v1/sso/status/route.ts`
- `app/api/v1/sso/dispatch-callbacks/route.ts`：回调队列调度端点，由外部 cron 定时触发。
- `app/api/v1/admin/sso/callbacks/dispatch/route.ts`：管理员后台即时投递回调队列端点，复用同一调度逻辑并写审计。
- `app/lib/account/server/repositories/sso.ts`：client CRUD、secret 生成、回调队列写入与幂等刷新。
- `app/lib/account/server/sso.ts`：redirect URI 校验、PKCE 校验、ticket 签发/校验、回调 HMAC 签名与调度。
- `app/lib/db/migrations/sso.ts`：SSO 表、索引、外键、约束和旧表结构升级。
- `app/(pages)/sso/authorize/page.tsx`：授权确认页。
- `app/(pages)/sso/authorize/page.offline.tsx`：离线授权提示页。
- `app/(pages)/admin/sso/page.tsx`：SSO client 列表页。
- `app/(pages)/admin/sso/new/page.tsx`：SSO client 新建页。
- `app/(pages)/admin/sso/[id]/page.tsx`：SSO client 编辑页。
- `app/(pages)/admin/sso/clientForm.tsx`：SSO client 表单。
- `app/api/v1/admin/sso/clients/route.ts`、`app/api/v1/admin/sso/clients/[id]/route.ts`、`app/api/v1/admin/sso/clients/utils.ts`：管理员 SSO client CRUD API。

修改文件：

- [app/lib/db/constant.ts](../../../app/lib/db/constant.ts)：新增 `ssoTicket`、`ssoClient`、`ssoCallbackQueue` 表名。
- [app/lib/db/types.d.ts](../../../app/lib/db/types.d.ts)：新增 `ITableSsoTicket`、`ITableSsoClient`、`ITableSsoCallback` 等类型。
- [app/lib/db/migrations/account.ts](../../../app/lib/db/migrations/account.ts)：接入 SSO 表迁移。
- [app/api/v1/auth/login/route.ts](../../../app/api/v1/auth/login/route.ts) 与 [app/api/v1/auth/register/route.ts](../../../app/api/v1/auth/register/route.ts)：登录/注册完成后如存在 SSO 授权上下文，则跳转到授权确认页。
- [app/(pages)/admin/page.tsx](<../../../app/(pages)/admin/page.tsx>)：新增 SSO 客户端管理入口。
- [app/lib/account/client/api.ts](../../../app/lib/account/client/api.ts)：新增管理员 SSO client API 调用封装。
- [app/lib/account/shared/constants.ts](../../../app/lib/account/shared/constants.ts) 与 [app/lib/account/shared/types.ts](../../../app/lib/account/shared/types.ts)：新增 SSO cookie 名称与 API 类型。
- [app/api/v1/admin/users/[id]/disable/route.ts](../../../app/api/v1/admin/users/[id]/disable/route.ts) 等管理员用户操作路由：用户状态变更后触发 SSO 回调。

## 十五、外部服务接入示例

### 客户端发起授权

```text
GET https://izakaya.cc/api/v1/sso/authorize
  ?client_id=game-client
  &redirect_uri=http%3A%2F%2F127.0.0.1%3A52173%2Fcallback
  &state=state-value
  &code_challenge=challenge-value
```

### 外部服务后端换票

```http
POST https://assistant-bff.izakaya.cc/api/v1/sso/validate
Content-Type: application/json

{
  "client_id": "game-client",
  "client_secret": "server-side-secret",
  "ticket": "ticket-from-callback",
  "code_verifier": "verifier-from-client"
}
```

### 本项目返回

```json
{
	"status": "ok",
	"data": {
		"user": {
			"id": "mystia-user-id",
			"nickname": "夜雀",
			"username": "Mystia",
			"status": "active"
		}
	}
}
```

### 外部服务返回客户端

```json
{ "access_token": "external-service-token", "expires_in": 7200 }
```

## 十六、风险

| 风险                                | 说明                                             | 缓解                                                                                                                          |
| ----------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| 回调被同机程序截获                  | loopback 或自定义协议存在本地竞争                | 使用 PKCE-like `code_challenge` / `code_verifier`                                                                             |
| 外部服务 token 无法被本项目撤销     | 外部 token 属于外部服务                          | 外部服务使用短过期 token，并通过 `/api/v1/sso/status` 定期复核；重新登录需发起新的 authorize -> validate 流程                 |
| redirect URI 开放跳转               | 未严格校验 redirect URI 会造成钓鱼或 ticket 泄露 | 精确白名单；HTTPS URI 精确匹配；loopback 仅允许固定 path 与本地 host                                                          |
| client secret 泄露                  | 外部后端密钥泄露可换票                           | 外部服务保存密钥在后端和密钥管理系统；server-to-server 调用必须走 HTTPS；请求日志不记录 secret；支持多 active secret 无缝轮换 |
| 数据库或管理页 hash 泄露            | 攻击者拿到 secret hash                           | validate/status 只接受原始 client secret，不接受 hash；泄露 hash 后仍应尽快轮换对应 secret                                    |
| 用户被禁用后外部 token 仍可短期使用 | 外部 token 已签发后由外部服务控制                | 外部服务使用短过期；通过 `/api/v1/sso/status` 定期复核或接收状态变更回调即时撤销                                              |
| 方案非标准协议                      | 不适合开放平台生态                               | 仅用于可信合作服务；开放第三方前升级 OAuth2/OIDC                                                                              |

## 十七、后续扩展

- 升级到 OAuth2/OIDC 授权服务器。
