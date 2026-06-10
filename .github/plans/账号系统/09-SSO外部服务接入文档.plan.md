---
name: SSO 外部服务接入文档
overview: 面向外部服务说明夜雀助手轻量 SSO 能力、接口契约、接入流程和外部服务需要配合实现的改造。
isProject: false
---

# SSO 外部服务接入文档

> 日期：2026-06-10
> 前置方案：[08-轻量SSO票据方案.plan.md](08-轻量SSO票据方案.plan.md)
> 目标读者：需要接入夜雀助手账号身份的外部服务后端、游戏客户端和皮肤站点开发者。

## 一、能力边界

夜雀助手 SSO 是一个轻量账号身份入口，用于让外部服务确认“当前用户是谁”。它不是完整 OAuth2/OIDC 授权服务器，也不负责外部服务自己的业务权限。

夜雀助手提供：

- 浏览器顶层跳转授权入口。
- 一次性短期 SSO ticket 签发。
- 服务端到服务端 ticket 校验接口。
- 服务端到服务端用户状态查询接口。
- 用户禁用或删除后的状态变更回调。
- 管理员后台配置 SSO client、redirect URI、client secret 和状态回调地址。

外部服务仍需自行负责：

- 业务账号、角色、联机权限、皮肤权限、封禁状态和会员状态。
- 外部服务自己的 session、JWT、access token 或其它业务凭证。
- 小助手用户 ID 与外部业务用户 ID 的映射关系。
- 外部 token 的过期、刷新、撤销和密钥轮换。
- 状态回调验签、幂等处理和主动状态复核。

## 二、先选择接入形态

同一个 SSO client 可以同时配置外部网站 HTTPS 回调、本地 loopback 回调和 custom scheme 回调。管理员不需要为“同一外部服务的网站端”和“同一外部服务的桌面端”拆成两个 client；每次授权请求会按本次传入的 `redirect_uri` 匹配对应白名单。

| 接入形态             | 适用场景                         | 管理员配置                    | 回调落点                             | 谁保存 `code_verifier` 和校验 `state`               |
| -------------------- | -------------------------------- | ----------------------------- | ------------------------------------ | --------------------------------------------------- |
| 外部网站统一登录     | 皮肤站、联机官网、Web 管理后台   | `https_redirect_uris`         | 外部网站后端 HTTPS callback          | 外部网站后端                                        |
| 本地客户端 loopback  | 桌面启动器、游戏客户端           | `loopback_redirect_paths`     | 本机 `127.0.0.1` 或 `[::1]` 临时端口 | 本地客户端生成，外部服务后端换票时提交并最终校验    |
| 本地客户端自定义协议 | 无法稳定监听本地端口的桌面客户端 | `custom_scheme_redirect_uris` | 操作系统注册的 custom scheme         | 本地客户端生成，外部服务后端换票时提交并最终校验    |
| 状态变更通知         | 用户禁用或删除后的近即时撤销     | `status_callback_url`         | 外部服务后端状态回调接口             | 不参与登录；用于撤销外部服务自己的 session 或 token |

浏览器、小助手账号 Cookie、`client_secret` 三者不要混用：外部前端和本地客户端不得保存 `client_secret`，也不得尝试读取或转发夜雀助手账号 Cookie。

## 三、接入流程总览

### 外部网站统一登录

1. 外部网站后端创建登录会话，生成 `state` 和 `code_verifier`。
2. 外部网站后端计算 `code_challenge`，并把浏览器重定向到夜雀助手 `/api/v1/sso/authorize`。
3. 用户在夜雀助手登录并确认授权。
4. 夜雀助手重定向回 `https_redirect_uris` 白名单中的 HTTPS callback，并携带 `ticket` 与原始 `state`。
5. 外部网站后端校验 `state`，用 `ticket`、`code_verifier`、`client_id`、`client_secret` 调用 `/api/v1/sso/validate`。
6. 外部网站根据返回的小助手用户 ID 查找或创建自己的业务用户，并建立自己的网站登录态。

### 本地客户端登录

1. 本地客户端生成 `state` 和 `code_verifier`，计算 `code_challenge`。
2. 本地客户端启动 loopback HTTP server，或准备 custom scheme 回调。
3. 本地客户端打开系统浏览器访问夜雀助手 `/api/v1/sso/authorize`。
4. 用户在夜雀助手登录并确认授权。
5. 夜雀助手回调到本机 loopback 或 custom scheme，并携带 `ticket` 与原始 `state`。
6. 本地客户端校验 `state`，再把 `ticket` 与 `code_verifier` 交给外部服务后端。
7. 外部服务后端调用 `/api/v1/sso/validate`，建立自己的业务登录态或返回自己的业务 token。

夜雀助手只在 `validate` 成功时证明小助手账号身份。是否允许进入联机服务器、是否允许上传皮肤、是否需要封禁或限流，均由外部服务自己的数据库和规则决定。

## 四、管理员配置

接入前，需要由夜雀助手管理员在后台创建 SSO client。

需要配置：

| 字段                          | 说明                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| `id`                          | 外部服务的 client ID，最长 128 字符，可使用英文字母、数字、点、下划线、冒号和短横线。  |
| `name`                        | 授权确认页展示给用户看的外部服务名称。                                                 |
| `loopback_redirect_paths`     | 允许的本地 loopback 回调 path 列表，例如 `/callback`。                                 |
| `custom_scheme_redirect_uris` | 允许的自定义协议回调 URI 列表，例如 `mystia-game://sso/callback`。                     |
| `https_redirect_uris`         | 允许的外部网站 HTTPS 登录回调 URI 列表，例如 `https://game.example.com/sso/callback`。 |
| `status_callback_url`         | 可选，用户禁用或删除时夜雀助手主动通知外部服务的 HTTPS URL。                           |
| `cancel_redirect_uri`         | 可选，用户取消授权后跳转的地址。                                                       |

管理员也可以在后台禁用或重新启用某个 SSO client。禁用不会删除配置、secret hash 或历史授权记录，但会暂停该 client 的授权、换票、状态查询和状态回调投递；禁用期间不能新增或删除 secret hash。外部服务会在公开接口中收到 `client-disabled`。

外部服务接入方应在创建 SSO client 前，向夜雀助手管理员提供以下配置单：

| 提供项              | 必填     | 管理员配置字段                | 说明                                                                                                                 |
| ------------------- | -------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 服务展示名称        | 是       | `name`                        | 授权确认页展示给用户看的名称，应能让用户识别正在授权给哪个服务。                                                     |
| 稳定 client ID      | 是       | `id`                          | 建议使用服务级稳定 ID，例如 `mystia-online-client`；创建后不应频繁变更。                                             |
| loopback 回调 path  | 条件必填 | `loopback_redirect_paths`     | 使用本地 HTTP 回调时提供 path 列表，只填 path，不填 host 和 port，例如 `/sso/callback`。动态端口由客户端运行时选择。 |
| 自定义协议回调 URI  | 条件必填 | `custom_scheme_redirect_uris` | 使用 custom scheme 时提供完整 URI，例如 `mystia-online://sso/callback`。必须精确匹配。                               |
| 网站 HTTPS 回调 URI | 条件必填 | `https_redirect_uris`         | 外部网站统一登录时提供完整 HTTPS URI，例如 `https://game.example.com/auth/mystia/callback`。必须精确匹配。           |
| 状态回调 URL        | 推荐     | `status_callback_url`         | 外部服务后端接收用户禁用/删除事件的 HTTPS URL，例如 `https://api.example.com/mystia/sso/status-callback`。           |
| 取消授权跳转 URI    | 可选     | `cancel_redirect_uri`         | 用户点取消后的跳转地址。必须是合法 SSO redirect URI；如果桌面客户端使用动态 loopback 且没有稳定取消 URI，可以留空。  |

`loopback_redirect_paths`、`custom_scheme_redirect_uris` 和 `https_redirect_uris` 至少需要提供一种，否则 client 配置无效。三者可以同时配置在同一个 client 中：例如同一个“夜雀联机服务”既有网页登录页，又有桌面启动器，就可以共用同一个 `client_id` 和 `client_secret`，分别把网站 HTTPS callback、本地 loopback path 和 custom scheme URI 加入白名单。

管理员创建 client 后，需要回给接入方：

- `client_id`。
- 创建 client 或生成新 secret 时返回的原始 `client_secret`。
- 已保存的 redirect 白名单，便于接入方和线上配置核对。
- 如已配置 `status_callback_url`，还应告知接入方状态回调会使用当前首位 active secret hash 作为 HMAC key。

登录回调配置只写“回调入口本身”，不要预先填写 `ticket`、`state` 或 `code_verifier` 参数：

- `loopback_redirect_paths` 只填 path，例如 `/sso/callback`。客户端发起授权时再拼成完整 `redirect_uri`，例如 `http://127.0.0.1:52173/sso/callback`。
- `https_redirect_uris` 填完整 HTTPS URI，例如 `https://online.example.com/auth/mystia/callback`。
- `custom_scheme_redirect_uris` 填完整 custom scheme URI，例如 `mystia-online://sso/callback`。
- 用户同意授权后，夜雀助手会在回跳时向本次 `redirect_uri` 自动写入 `ticket` 和 `state` query 参数。外部服务不需要、也不应该把这两个参数预置到管理员配置里。

### 配置单示例：同一服务同时支持网站和桌面客户端

外部服务提供给管理员：

```yaml
name: 夜雀联机服务
id: mystia-online
https_redirect_uris:
	- https://online.example.com/auth/mystia/callback
loopback_redirect_paths:
	- /sso/callback
custom_scheme_redirect_uris:
	- mystia-online://sso/callback
status_callback_url: https://online.example.com/api/mystia/sso/status-callback
cancel_redirect_uri: https://online.example.com/login?cancelled=mystia
```

同一个 client 下，网站端发起授权时使用 HTTPS 回调：

```text
redirect_uri=https://online.example.com/auth/mystia/callback
```

桌面端发起授权时可以使用 loopback 或 custom scheme：

```text
redirect_uri=http://127.0.0.1:52173/sso/callback
redirect_uri=mystia-online://sso/callback
```

### 配置单示例：外部网站统一登录

外部服务提供给管理员：

```yaml
name: 夜雀联机网站
id: mystia-online-web
loopback_redirect_paths: []
custom_scheme_redirect_uris: []
https_redirect_uris:
	- https://online.example.com/auth/mystia/callback
status_callback_url: https://online.example.com/api/mystia/sso/status-callback
cancel_redirect_uri: https://online.example.com/login?cancelled=mystia
```

该配置下，授权成功只能跳转到白名单中的完整 HTTPS URI：

```text
redirect_uri=https://online.example.com/auth/mystia/callback
```

外部网站应由后端生成 `state` 和 `code_verifier`，保存在网站自己的登录会话中；浏览器只负责跳转到夜雀助手授权入口。夜雀助手回跳后，外部网站后端校验 `state`，再用 `ticket`、`code_verifier` 和后端保存的 `client_secret` 调用 `/api/v1/sso/validate`。

### 配置单示例：桌面联机客户端

外部服务提供给管理员：

```yaml
name: 夜雀联机客户端
id: mystia-online-client
loopback_redirect_paths:
	- /sso/callback
custom_scheme_redirect_uris:
	- mystia-online://sso/callback
https_redirect_uris: []
status_callback_url: https://api.online.example.com/mystia/sso/status-callback
cancel_redirect_uri: mystia-online://sso/cancel
```

管理员后台填写后，外部客户端实际发起授权时可使用任意本地端口，只要 path 匹配：

```text
redirect_uri=http://127.0.0.1:52173/sso/callback
```

若同一客户端也支持 custom scheme，可使用精确白名单 URI：

```text
redirect_uri=mystia-online://sso/callback
```

### 配置单示例：只使用 custom scheme 的启动器

外部服务提供给管理员：

```yaml
name: 夜雀皮肤启动器
id: mystia-skin-launcher
loopback_redirect_paths: []
custom_scheme_redirect_uris:
	- mystia-skin://auth/callback
https_redirect_uris: []
status_callback_url: https://skin.example.com/api/mystia/sso/status-callback
cancel_redirect_uri: mystia-skin://auth/cancel
```

该配置下，授权成功只能跳转到：

```text
redirect_uri=mystia-skin://auth/callback
```

如果外部服务暂时没有状态回调接口，可以先将 `status_callback_url` 留空，但仍建议尽快补齐；否则用户被禁用或删除后，只能依赖外部服务主动调用 `/api/v1/sso/status` 兜底发现。

创建 client 或生成新 secret 后，接口会返回一次原始 `client_secret`。外部服务调用 `/api/v1/sso/validate` 和 `/api/v1/sso/status` 时提交的就是这个原始 secret。后台右侧 Secrets 区域展示的是 `SHA-256(client_secret).hex()` 后的 secret hash，用于识别、复制 hash 和删除 active secret，不能把右侧 hash 当作 `client_secret` 交给外部服务调用接口。

如果原始 `client_secret` 丢失，管理员不能从右侧 hash 还原，只能生成新 secret，把新原始 secret 交给外部服务后端；确认外部服务切换完成后，再删除旧 hash。

这套轻量 SSO 的密钥安全边界是：

- 原始 `client_secret` 是外部服务后端持有的服务端凭证，不能交给外部前端、本地客户端或用户设备。
- `/validate` 和 `/status` 是 HTTPS server-to-server 调用，传输安全依赖 TLS、后端出站链路和日志脱敏。
- 本项目数据库不保存原始 `client_secret`，只保存 hash；因此数据库或管理页泄露时，攻击者不能直接拿右侧 hash 作为 `client_secret` 调接口。
- hash 存库不是为了让网络请求里完全不出现 secret；如果后续需要避免请求体出现原始 secret，需要升级为请求签名、mTLS 或公私钥认证等更重的方案。

secret 轮换规则：

- 一个 client 可同时保留多个 active secret hash。
- `validate` 和 `status` 会用请求中的原始 `client_secret` 计算 SHA-256 hex，并遍历所有 active hash。
- 状态回调签名使用第一个 active secret hash 作为 HMAC key。
- 新生成 secret 会追加到列表末尾，不会立即改变状态回调签名 key。
- 若要切换回调签名 key，管理员需要在确认外部服务已接受新 secret 后，移除旧的首位 secret 并保存。

## 五、外部开发实施步骤

接入方可以先按本节完成业务接入，再回头查阅后面的 API 细节。

### 外部网站接入步骤

1. 在后端配置 `client_id`、`client_secret`、夜雀助手基础 URL 和网站 HTTPS callback URI。
2. 用户点击“使用夜雀助手登录”时，由网站后端生成 `state` 和 `code_verifier`，保存到网站自己的登录会话。
3. 网站后端计算 `code_challenge`，把浏览器重定向到 `/api/v1/sso/authorize`。
4. HTTPS callback 收到 `ticket` 和 `state` 后，先校验 `state` 是否属于当前登录会话。
5. 网站后端调用 `/api/v1/sso/validate` 换取小助手用户资料。
6. 根据小助手 `user.id` 查找或创建外部业务用户，建立网站自己的 session 或 token。
7. 后续业务请求只使用外部网站自己的登录态，不依赖夜雀助手 Cookie。

### 本地客户端接入步骤

1. 客户端启动登录流程时生成 `state` 和 `code_verifier`。
2. 客户端计算 `code_challenge`，并启动 loopback HTTP server 或准备 custom scheme。
3. 客户端打开系统浏览器访问 `/api/v1/sso/authorize`。
4. 收到 loopback 或 custom scheme 回调后，客户端校验 `state`。
5. 客户端把 `ticket` 和 `code_verifier` 交给外部服务后端。
6. 外部服务后端调用 `/api/v1/sso/validate`，再把自己的业务 token 返回给客户端。
7. 客户端后续访问外部业务 API 时只携带外部服务 token。

### 状态撤销接入步骤

1. 外部服务提供 `status_callback_url`，并在管理员后台配置。
2. 回调接口读取原始 body 和 `X-Sso-Signature`，先验签再解析 JSON。
3. 收到 `user_disabled` 或 `user_deleted` 后，按 `user_id` 撤销该用户在外部服务内的所有 session 或 token。
4. 外部服务定期调用 `/api/v1/sso/status` 作为回调投递失败时的兜底。

## 六、API 参考：授权入口

### `GET /api/v1/sso/authorize`

浏览器顶层导航接口，不提供 CORS，不应由外部前端 AJAX 调用。

请求示例：

```text
GET https://izakaya.cc/api/v1/sso/authorize?client_id=game-client&redirect_uri=http%3A%2F%2F127.0.0.1%3A52173%2Fcallback&state=STATE&code_challenge=CHALLENGE
```

外部网站统一登录请求示例：

```text
GET https://izakaya.cc/api/v1/sso/authorize?client_id=mystia-online-web&redirect_uri=https%3A%2F%2Fonline.example.com%2Fauth%2Fmystia%2Fcallback&state=STATE&code_challenge=CHALLENGE
```

Query 参数：

| 参数             | 必填 | 说明                                                                       |
| ---------------- | ---- | -------------------------------------------------------------------------- |
| `client_id`      | 是   | 管理员创建的 SSO client ID。                                               |
| `redirect_uri`   | 是   | 授权成功后的回调地址，必须匹配该 client 的白名单。                         |
| `state`          | 是   | 外部客户端生成的随机值，夜雀助手原样带回。最长 1024 字符，不允许控制字符。 |
| `code_challenge` | 是   | `base64url(SHA-256(code_verifier))`，固定 43 字符。                        |

成功行为：

- 若用户未登录，夜雀助手会引导登录或注册，登录完成后继续授权流程。
- 若用户已登录，夜雀助手展示授权确认页。
- 用户同意后，夜雀助手生成一次性 ticket，并重定向到 `redirect_uri`。
- 用户取消时，夜雀助手跳转到 client 配置的 `cancel_redirect_uri`；未配置时展示取消状态页。

成功回调示例：

```text
http://127.0.0.1:52173/callback?ticket=TICKET&state=STATE
https://online.example.com/auth/mystia/callback?ticket=TICKET&state=STATE
```

错误响应：

| HTTP | `message`                  | 说明                                    |
| ---- | -------------------------- | --------------------------------------- |
| 400  | `invalid-object-structure` | 参数缺失或格式错误。                    |
| 400  | `invalid-redirect-uri`     | `redirect_uri` 不在白名单内。           |
| 403  | `client-disabled`          | 该 SSO client 已被管理员禁用。          |
| 404  | `feature-disabled`         | 账号功能未启用，或没有可用 SSO client。 |
| 429  | `too-many-requests`        | 请求被限流。                            |
| 500  | `server-misconfigured`     | 服务端账号或数据库配置异常。            |

## 七、Redirect URI 规则

夜雀助手当前支持三类 `redirect_uri`。三类白名单互不排斥，可以同时配置在同一个 client 中；授权时只校验本次请求传入的那个 `redirect_uri`。

### Loopback redirect

格式示例：

```text
http://127.0.0.1:52173/callback
http://[::1]:52173/callback
```

规则：

- scheme 必须是 `http`。
- host 只能是 `127.0.0.1`、`[::1]` 或 `::1`。
- path 必须在 `loopback_redirect_paths` 白名单中。
- port 可由外部客户端每次动态选择。
- 不允许用户名、密码和 hash fragment。

推荐桌面客户端优先使用 loopback redirect：授权前临时启动本地 HTTP server，收到回调后立即关闭。

### HTTPS website redirect

格式示例：

```text
https://online.example.com/auth/mystia/callback
```

规则：

- URI 必须精确匹配 `https_redirect_uris` 白名单。
- scheme 必须是 `https`。
- 必须是外部网站后端可处理的登录回调地址。
- 不允许用户名、密码和 hash fragment。
- 可以包含固定 query，但白名单和请求中的完整 URI 必须一致；夜雀助手会在回跳时追加或覆盖 `ticket` 和 `state` query 参数。不要把 `ticket`、`state` 或 `code_verifier` 写进白名单。

推荐外部网站使用 HTTPS website redirect：网站后端生成并保存 `state`、`code_verifier`，浏览器完成跳转，回调落到网站后端后再换票建立网站自己的登录态。

### Custom scheme redirect

格式示例：

```text
mystia-game://sso/callback
```

规则：

- URI 必须精确匹配 `custom_scheme_redirect_uris` 白名单。
- scheme 必须是合法自定义协议，不能是 `http`、`https`、`file`、`data`、`javascript` 等危险协议。
- 不允许用户名、密码和 hash fragment。
- 自定义协议可能被同机其它程序抢占，因此必须配合 PKCE-like 校验。

## 八、PKCE-like 要求

外部网站前端和本地客户端都不能保存 `client_secret`。为防止 ticket 被浏览器历史、日志、同机其它程序或错误跳转截获后直接换票，接入方必须实现 PKCE-like 校验。

发起授权的一侧：

1. 生成随机 `code_verifier`。
2. 计算 `code_challenge = base64url(SHA-256(code_verifier))`。
3. 发起 authorize 时传入 `code_challenge`。
4. 收到回调后，将 `ticket`、`state`、`code_verifier` 交给外部服务后端；外部网站场景通常由后端自己接收 HTTPS callback。

外部服务后端：

1. 校验 `state` 属于本次登录流程。
2. 调用 `/api/v1/sso/validate` 时提交 `code_verifier`。
3. validate 成功后废弃本次 `state` 和 `code_verifier`。

格式约束：

- `code_challenge` 长度固定为 43，只允许 Base64URL 字符。
- `code_verifier` 长度为 1 到 256，只允许 Base64URL 字符。

## 九、API 参考：换票接口

### `POST /api/v1/sso/validate`

服务端到服务端接口。仅供外部服务后端调用，不依赖浏览器 Cookie，不提供 CORS。

请求：

```http
POST https://izakaya.cc/api/v1/sso/validate
Content-Type: application/json

{
  "client_id": "game-client",
  "client_secret": "server-side-secret",
  "ticket": "ticket-from-callback",
  "code_verifier": "verifier-from-client"
}
```

成功响应：

```json
{
	"status": "ok",
	"data": {
		"user": {
			"id": "mystia-user-id",
			"status": "active",
			"username": "Mystia"
		}
	}
}
```

错误响应：

| HTTP | `message`                  | 说明                                                                     |
| ---- | -------------------------- | ------------------------------------------------------------------------ |
| 400  | `invalid-object-structure` | 请求体格式错误，或字段不符合格式要求。                                   |
| 401  | `invalid-client`           | `client_id` 不存在，或 `client_secret` 与所有 active secret 都不匹配。   |
| 401  | `invalid-ticket`           | ticket 不存在、过期、已使用、client 不匹配、用户不存在或 PKCE 校验失败。 |
| 403  | `client-disabled`          | 该 SSO client 已被管理员禁用。                                           |
| 403  | `user-disabled`            | 小助手账号已禁用。                                                       |
| 403  | `user-deleted`             | 小助手账号已删除。                                                       |
| 413  | `payload-too-large`        | 请求体过大。                                                             |
| 429  | `too-many-requests`        | 请求被限流。                                                             |
| 500  | `server-misconfigured`     | 服务端账号或数据库配置异常。                                             |

ticket 规则：

- ticket 由 32 字节高强度随机值生成，明文只返回给客户端一次。
- 数据库只保存 ticket 的服务端 HMAC hash，不保存明文。
- ticket 有效期为 60 秒。
- ticket 绑定 `client_id`、`redirect_uri` 和 `code_challenge`。
- validate 成功后 ticket 会立即标记为已使用，重复 validate 必须失败。

外部服务后端在 validate 成功后应：

1. 使用 `data.user.id` 查找或创建外部业务用户。
2. 更新外部业务用户保存的 `username` 和小助手账号状态。
3. 根据外部服务自己的封禁、权限、白名单等规则决定是否签发业务 token。
4. 向外部客户端返回外部服务自己的 token 或 session 信息。

## 十、API 参考：用户状态查询接口

### `POST /api/v1/sso/status`

服务端到服务端接口。用于外部服务定期复核小助手账号是否仍为 active。

请求：

```http
POST https://izakaya.cc/api/v1/sso/status
Content-Type: application/json

{
  "client_id": "game-client",
  "client_secret": "server-side-secret",
  "user_id": "mystia-user-id"
}
```

成功响应：

```json
{
	"status": "ok",
	"data": { "user": { "id": "mystia-user-id", "status": "active" } }
}
```

错误响应：

| HTTP | `message`                  | 说明                                                                   |
| ---- | -------------------------- | ---------------------------------------------------------------------- |
| 400  | `invalid-object-structure` | 请求体格式错误，或字段不符合格式要求。                                 |
| 401  | `invalid-client`           | `client_id` 不存在，或 `client_secret` 与所有 active secret 都不匹配。 |
| 403  | `client-disabled`          | 该 SSO client 已被管理员禁用。                                         |
| 403  | `user-disabled`            | 小助手账号已禁用。                                                     |
| 403  | `user-deleted`             | 小助手账号已删除。                                                     |
| 404  | `user-not-found`           | 用户不存在。                                                           |
| 413  | `payload-too-large`        | 请求体过大。                                                           |
| 429  | `too-many-requests`        | 请求被限流。                                                           |
| 500  | `server-misconfigured`     | 服务端账号或数据库配置异常。                                           |

建议外部服务：

- 不要在每次业务请求中调用本接口。
- 可在业务 token 续期、后台定时任务或高风险操作前复核。
- 状态查询只用于撤销或拒绝继续访问，不用于自动重新授权。
- 用户重新获得访问权时，应让用户重新走 authorize -> validate 流程。

## 十一、API 参考：状态变更回调

若管理员配置了 `status_callback_url`，夜雀助手会在已授权过该 client 的用户被禁用或删除时，向外部服务后端发送状态回调。client 被管理员禁用后，夜雀助手会暂停向该 client 投递状态回调；重新启用后，后续新产生的用户状态事件会继续投递。

触发事件：

| `event`         | 说明                   |
| --------------- | ---------------------- |
| `user_disabled` | 管理员禁用用户。       |
| `user_deleted`  | 用户自行逻辑删除账号。 |

回调请求：

```http
POST https://external.example.com/api/mystia/sso/status-callback
Content-Type: application/json
User-Agent: Mystia-SSO/1.0
X-Sso-Signature: t=1710000000000,v1=BASE64URL_SIGNATURE

{
  "client_id": "game-client",
  "event": "user_disabled",
  "timestamp": 1710000000000,
  "user_id": "mystia-user-id"
}
```

字段说明：

| 字段        | 说明                                |
| ----------- | ----------------------------------- |
| `client_id` | 对应的 SSO client ID。              |
| `event`     | `user_disabled` 或 `user_deleted`。 |
| `timestamp` | 状态事件发生时的毫秒时间戳。        |
| `user_id`   | 小助手用户 ID。                     |

投递行为：

- 每次回调超时时间为 5 秒。
- 外部服务返回 2xx 视为成功，夜雀助手删除队列记录。
- 非 2xx、超时或网络错误会进入重试。
- 重试退避为 1 秒、5 秒、25 秒，之后每次 60 秒。
- 最多重试 100 次；最终失败后只记录，不再重试。
- 同一 `(client_id, user_id, event)` 的待处理记录会幂等刷新。

## 十二、回调签名验证

夜雀助手使用 HMAC-SHA256 为状态回调签名。

签名头格式：

```http
X-Sso-Signature: t=1710000000000,v1=base64url(HMAC-SHA256(signing_secret, "{t}.{rawBody}"))
```

其中：

- `t` 是本次投递时间的毫秒时间戳。
- `rawBody` 是 HTTP 请求收到的原始 body 字符串。
- `signing_secret` 是当前首位 active secret hash，也就是后台 Secrets 区域展示的首个值。
- `v1` 是 HMAC digest 的 Base64URL 字符串。

外部服务验签要求：

1. 读取 `X-Sso-Signature`。
2. 解析 `t` 和 `v1`。
3. 检查 `t` 与当前时间的偏差，建议允许 ±5 分钟。
4. 使用所有仍被外部服务接受的原始 `client_secret` 计算 `SHA-256(client_secret).hex()`。
5. 对每个派生出的 signing secret 计算 `HMAC-SHA256(signing_secret, `${t}.${rawBody}`)`。
6. 使用 timing-safe compare 比对签名。
7. 验签成功后再解析 JSON body 并处理业务撤销。

TypeScript 示例：

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

	const actual = Buffer.from(parsed.signature, 'base64url');
	const message = `${parsed.timestamp}.${rawBody}`;

	return clientSecrets.some((clientSecret) => {
		const expected = createHmac('sha256', deriveSigningSecret(clientSecret))
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

- 必须使用原始 body 验签，不能先 JSON parse 后再 stringify。
- HMAC key 是 `SHA-256(client_secret).hex()`，不是原始 `client_secret`。
- secret 轮换期间，外部服务应同时接受旧 secret 和新 secret 派生出的 signing secret。
- 验签失败或时间偏差过大时，应丢弃回调并记录告警。

## 十三、外部服务实现检查项

外部开发者可以按下表确认自己是否已经接好。前面章节讲流程，本节只保留上线前需要逐项打勾的内容。

| 模块             | 必须完成的内容                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| 后端配置         | 保存 `client_id`、后端专用 `client_secret`、夜雀助手基础 URL，以及本服务实际使用的 redirect URI。       |
| 网站登录入口     | 由外部网站后端创建登录会话，保存 `state` 与 `code_verifier`，再把浏览器跳转到 `/api/v1/sso/authorize`。 |
| 本地客户端登录   | 由客户端生成 `state` 与 `code_verifier`，启动 loopback server 或准备 custom scheme，再打开系统浏览器。  |
| 授权回调处理     | 回调后先校验 `state`，再把 `ticket` 和 `code_verifier` 交给外部服务后端换票。                           |
| 后端换票         | 调用 `/api/v1/sso/validate`，用返回的 `user.id` 查找或创建外部业务用户。                                |
| 外部登录态       | 签发外部服务自己的 session、JWT 或 access token；后续业务请求不依赖夜雀助手 Cookie。                    |
| 状态撤销         | 接收并验签 `status_callback_url` 回调，撤销被禁用或删除用户的外部 token。                               |
| 主动状态复核     | 定期调用 `/api/v1/sso/status`，作为状态回调延迟或失败时的兜底。                                         |
| 外部业务权限判断 | 联机权限、皮肤权限、封禁、会员、限流等都由外部服务自己的数据库决定。                                    |

推荐用户映射表：

```sql
CREATE TABLE external_users (
    id text PRIMARY KEY,
    mystia_user_id text NOT NULL UNIQUE,
    username text NOT NULL,
    mystia_status text NOT NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL
);
```

## 十四、建议错误处理

| 场景                                                            | 外部服务建议行为                                                        |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| authorize 返回 `invalid-redirect-uri`                           | 检查管理员后台 redirect URI 白名单。                                    |
| authorize、validate 或 status 返回 `client-disabled`            | 暂停登录入口或后端重试，联系夜雀助手管理员确认是否需要重新启用 client。 |
| validate 返回 `invalid-client`                                  | 检查 `client_id` 和后端保存的 `client_secret`，必要时重新生成 secret。  |
| validate 返回 `invalid-ticket`                                  | 让用户重新发起登录；不要重试同一个 ticket。                             |
| validate 返回 `user-disabled` 或 `user-deleted`                 | 拒绝登录，并撤销该用户已有外部 token。                                  |
| status 返回 `user-disabled`、`user-deleted` 或 `user-not-found` | 撤销该用户已有外部 token，要求重新授权或联系管理员。                    |
| 返回 `too-many-requests`                                        | 遵守 `Retry-After`，降低重试频率。                                      |
| 返回 `server-misconfigured`                                     | 记录错误并联系夜雀助手维护者，不要自动放行。                            |

所有 API 响应均为 `no-store`，成功响应形如：

```json
{ "status": "ok", "data": {} }
```

错误响应形如：

```json
{ "status": "error", "message": "invalid-ticket" }
```

## 十五、安全清单

外部服务上线前应确认：

- `client_secret` 只保存在后端或服务端密钥管理系统中。
- 外部前端、本地客户端、日志、崩溃报告中不会出现 `client_secret`。
- 外部后端请求日志、反向代理日志和错误监控不会记录 `/validate`、`/status` 请求体中的 `client_secret`。
- 夜雀助手与外部服务之间的 server-to-server 调用必须走 HTTPS，不在明文 HTTP 链路上传输 `client_secret`。
- 每次授权都有随机 `state`，且回调时必须校验。
- 每次授权都有随机 `code_verifier`，且 validate 后立即废弃。
- HTTPS website redirect 必须精确配置到 `https_redirect_uris`，不允许把外部网站的任意跳转地址拼进 `redirect_uri`。
- 外部网站的 `state` 和 `code_verifier` 必须保存在后端登录会话中，不能只放在浏览器可篡改参数里。
- loopback server 只监听本地地址，收到一次回调后关闭。
- custom scheme 接入已考虑同机抢占风险，并依赖 PKCE-like 校验兜底。
- 状态回调使用原始 body 验签，并检查签名时间窗口。
- 回调处理幂等，重复事件不会重复扣费、重复封禁或产生异常副作用。
- 外部业务 token 支持按 `mystia_user_id` 批量撤销。
- 外部服务定期调用 `status` 作为回调失败时的兜底。

## 十六、联调清单

建议按以下顺序联调：

1. 管理员创建 SSO client，记录 `client_id` 和本次返回的原始 `client_secret`。
2. 按接入形态配置 `https_redirect_uris`、loopback path 或 custom scheme URI。
3. 外部网站或本地客户端发起 authorize，确认未登录时会进入登录流程。
4. 登录后确认授权页展示正确 client name。
5. 点击同意，确认回调包含 `ticket` 和原始 `state`。
6. 外部网站接入时，确认 HTTPS callback 能校验 `state` 并读取 `ticket`。
7. 外部后端调用 validate，确认返回用户 `id`、`username`、`status`。
8. 重复使用同一 ticket，确认返回 `invalid-ticket`。
9. 使用错误 `code_verifier`，确认返回 `invalid-ticket`。
10. 使用错误 `client_secret`，确认返回 `invalid-client`。
11. 管理员禁用 SSO client，确认 authorize、validate 或 status 返回 `client-disabled`；重新启用后再继续后续联调。
12. 外部服务签发自己的业务 token，并确认后续业务 API 不再依赖夜雀助手 Cookie。
13. 配置 `status_callback_url`，禁用测试用户，确认外部服务收到并验签回调。
14. 外部服务调用 status，确认 active 用户返回 ok，禁用或删除用户返回 403。

## 十七、最小接入示例

### 生成 PKCE 参数

```ts
import { createHash, randomBytes } from 'node:crypto';

export function createPkcePair() {
	const codeVerifier = randomBytes(32).toString('base64url');
	const codeChallenge = createHash('sha256')
		.update(codeVerifier)
		.digest('base64url');

	return { codeChallenge, codeVerifier };
}
```

### 生成授权 URL

```ts
export function createMystiaAuthorizeUrl({
	baseUrl,
	clientId,
	codeChallenge,
	redirectUri,
	state,
}: {
	baseUrl: string;
	clientId: string;
	codeChallenge: string;
	redirectUri: string;
	state: string;
}) {
	const url = new URL('/api/v1/sso/authorize', baseUrl);
	url.searchParams.set('client_id', clientId);
	url.searchParams.set('redirect_uri', redirectUri);
	url.searchParams.set('state', state);
	url.searchParams.set('code_challenge', codeChallenge);

	return url.toString();
}
```

### 后端换票

```ts
export async function validateMystiaTicket({
	baseUrl,
	clientId,
	clientSecret,
	codeVerifier,
	ticket,
}: {
	baseUrl: string;
	clientId: string;
	clientSecret: string;
	codeVerifier: string;
	ticket: string;
}) {
	const response = await fetch(new URL('/api/v1/sso/validate', baseUrl), {
		body: JSON.stringify({
			client_id: clientId,
			client_secret: clientSecret,
			code_verifier: codeVerifier,
			ticket,
		}),
		headers: { 'Content-Type': 'application/json' },
		method: 'POST',
	});

	const json = (await response.json()) as unknown;
	if (!response.ok) {
		throw new Error(`mystia-sso-failed:${response.status}`);
	}

	return json;
}
```
