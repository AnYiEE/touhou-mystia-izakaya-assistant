---
name: 稀客套餐推荐本地 WSS 桥接协议与实施计划
overview: 由游戏 Mod 拉起已登录的夜雀助手网页，网页直接连接 Mod 的本地 WSS 服务，在浏览器中计算推荐并把 JSON 结果回传给 Mod。
todos:
    - id: architecture
      content: 确认 Mod 拉起网页、本地 WSS 直连和浏览器本地计算架构
      status: completed
    - id: login-boundary
      content: 确认登录门禁、未登录启动后的自动连接及同源跳转续接
      status: completed
    - id: launch-contract
      content: 确认动态 WSS endpoint、fragment 启动描述和内存生命周期
      status: completed
    - id: multi-tab
      content: 确认启动标签页独占连接及同一 Mod 实例的新连接替换规则
      status: completed
    - id: message-contract
      content: 冻结握手、推荐、取消、结果、错误和心跳消息
      status: completed
    - id: recommendation-prerequisites
      content: 完成异步推荐入参快照、领域类型下沉和 host-task 调度预备改造
      status: completed
    - id: recommendation-plan-loop
      content: 收紧营业预设完整结果缓存并用循环替代批处理 Promise 递归链
      status: completed
    - id: browser-client
      content: 实现无 UI 的账号门禁、本地 WSS 客户端和连接生命周期
      status: completed
    - id: validation
      content: 完成协议、登录、多标签页、安全、取消、性能和浏览器验证
      status: pending
    - id: publication
      content: 将协议状态更新为已上线并记录首个兼容 Mod 版本
      status: pending
isProject: false
---

# 稀客套餐推荐本地 WSS 桥接协议与实施计划

> 当前状态：设计中，桥接功能尚未上线。
>
> 当前实现基线：夜雀助手 `v2.5.8-development`；首个对外兼容 Mod 版本未定。
>
> 文档日期：2026-07-15
>
> 目标读者：游戏 Mod 开发者、协议调用方和本项目维护者。
>
> 推荐算法前置方案：[精确异步推荐算法.plan.md](精确异步推荐算法.plan.md)

本文档前半部分是待发布的 V1 接入协议，后半部分记录本项目的实施任务和验收进度。连接方向、登录边界、启动方式、多标签页行为、消息字段和错误码已经冻结；真实 WSS 发布门槛尚未完成。

## 一、用途和边界

该桥接让游戏 Mod 使用夜雀助手现有的精确推荐算法，但不把游戏状态或推荐结果发送到夜雀助手服务端。

参与方只有两个：

- Mod 在用户电脑上启动 WSS 服务，并拉起夜雀助手网页。
- 夜雀助手网页作为 WSS 客户端，在浏览器本地计算推荐并把 JSON 结果回传给 Mod。

夜雀助手服务端只承担现有账号登录、会话刷新和账号状态检查。它不接受推荐请求，不转发 WSS 消息，不执行推荐算法，也不保存 Mod 数据。

使用限制：

- 用户必须已经登录夜雀助手。未登录页面不会连接 Mod，也不会计算或返回推荐。
- 不新增桥接页面、按钮、弹窗、状态提示或设置项。
- 只有带有效启动 fragment 的标签页才启动桥接，普通浏览标签页不连接 Mod。
- 账号 Cookie、CSRF token、用户 ID、用户名和同步数据都不会发送给 Mod。
- 当前登录要求只约束夜雀助手提供的正式桥接入口。Mod 暂时无法通过密码学凭证独立证明用户已经登录。
- 推荐算法仍在公开的浏览器代码中运行；登录门禁不是代码加密或算法授权机制。

不包含：

- 夜雀助手服务端 WSS endpoint。
- 公共 HTTP 推荐 API。
- Mod 账号登录、设备码、API key、OAuth token 或服务端签名票据。
- 普客套餐、营业预设批量生成或替代食材独立接口。
- 推荐算法、排序权重、游戏数据或用户持久化格式调整。
- Mod 本地 HTTPS 服务、证书或域名解析的安装程序。

## 二、整体流程

```text
Mod 启动本地 WSS 服务
    ↓
Mod 生成 instance_id 和 pairing_token
    ↓
Mod 拉起带 game-bridge fragment 的夜雀助手网页
    ↓
网页读取并立即清除 fragment，只在内存中保留启动描述
    ↓
网页等待现有账号状态确认登录
    ↓
网页连接 Mod 提供的动态 wss:// endpoint 并完成握手
    ↓
Mod 发送 recommendation.request
    ↓
网页在浏览器本地运行 suggestMeals
    ↓
网页发送 recommendation.result 或 recommendation.error
```

整个推荐数据流是：

```text
Mod ⇄ 已登录网页
```

不是：

```text
Mod ⇄ 夜雀助手服务端 ⇄ 网页
```

## 三、Mod 拉起网页

### 3.1 启动 URL

Mod 使用系统默认浏览器打开夜雀助手站点，并在 fragment 中提供启动描述：

```text
https://izakaya.cc/#game-bridge=<base64url-encoded-json>
```

站点 origin 以实际部署地址为准。fragment 不会随 HTTP 请求发送到夜雀助手服务端。

fragment 的语法固定为单个 `game-bridge=<value>`：不允许重复键、其他 fragment 字段、空值或后缀内容。`game-bridge` 的值是 UTF-8 JSON 经无填充 base64url 编码后的字符串，不使用 `URLSearchParams` 的宽松 `+` 或 percent-decoding 语义。解码后的完整示例：

```json
{
	"endpoint": "wss://mod-local.example.net:38421/bridge",
	"instance_id": "S3v0Y6j7Hf2f2O5TK5o0bQ",
	"pairing_token": "Kf3g-vAdYQpzzDxPrM7jS0tGpQqKaB0MpfF7brwGh5A",
	"protocol_version": 1
}
```

| 字段               | 类型      | 要求                                                            |
| ------------------ | --------- | --------------------------------------------------------------- |
| `endpoint`         | `string`  | Mod 本地 WSS 完整地址；域名、端口和路径由 Mod 决定。            |
| `instance_id`      | `string`  | 本次 Mod 进程的随机标识，使用 16 字节随机数的无填充 base64url。 |
| `pairing_token`    | `string`  | 本次页面启动的配对密钥，使用 32 字节随机数的无填充 base64url。  |
| `protocol_version` | `integer` | 桥接消息协议版本，首版固定为 `1`。                              |

`protocol_version` 是跨应用消息协议版本，与推荐算法的进程内缓存无关。缓存仍然不使用版本号，页面刷新后自然失效。

### 3.2 启动描述校验

网页把 fragment 视为不可信外部输入，只接受满足以下条件的描述：

- 解码后的 JSON 必须是 object，且只能包含上表四个字段；同一 object 中不允许重复成员名。
- `endpoint` 必须是可由 `URL` 解析的 `wss:` 地址。正式代码不包含 WS 降级分支。
- endpoint 不得包含用户名、密码、query 或 fragment。
- endpoint 必须在原始 authority 中显式提供 `1～65535` 的端口；不能只依赖 `URL.port` 判断，因为显式 `:443` 会被 URL 标准化为空字符串。路径最长 256 个字符。
- endpoint 总长度不得超过 2048 个字符。
- `instance_id` 必须是 22 个 base64url 字符。
- `pairing_token` 必须是 43 个 base64url 字符。
- `protocol_version` 必须是网页支持的版本。
- 整个编码后 fragment 不得超过 4096 个字符。

浏览器客户端模块加载时先同步复制原始 fragment，并在解析、账号初始化、React effect 和 Analytics 之前用 `history.replaceState` 清除 `game-bridge`。清除时保留现有 `history.state`、pathname 和 query，不能破坏 Next.js 路由状态；解析失败也必须清除。有效描述只保存在当前标签页的模块内存中，不写入 Store、`globalThis`、localStorage、sessionStorage、IndexedDB 或 Cookie，也不广播到其他标签页。

无效描述会被清除并终止桥接，不打开 UI、不连接 endpoint，也不回退到宽松解析。

fragment 解析发生在建立反向通道之前，因此网页无法把“启动描述无效、账号能力关闭或浏览器尚未允许连接”主动报告给 Mod。Mod 必须在拉起前按本节相同规则自校验描述，并把“等待用户登录/等待连接”作为自己的可取消状态；不能把页面未立即连接一律解释为协议失败，也不能依赖项目新增 UI 说明原因。

### 3.3 动态本地域名

WSS 域名不由本协议固定。Mod 可以为不同安装或运行实例使用不同域名、端口和路径，但必须自行满足以下条件：

- 域名在连接时只解析到 `127.0.0.1` 和/或 `::1`。
- 本地服务只监听 loopback socket，不监听 `0.0.0.0`、局域网地址或公网地址。
- TLS 证书链和域名必须被用户浏览器信任。
- 不依赖用户跳过证书警告；浏览器不会为失败的 WSS 握手提供这种降级路径。
- Mod 必须校验 WebSocket 握手的 `Origin`，只允许其明确支持的夜雀助手站点 origin。匹配值是启动页 URL 的 `scheme://host[:port]`，必须逐字精确匹配，不能使用通配符、字符串后缀或只比较 hostname。

浏览器 JavaScript 无法可靠确认任意域名最终解析到了 loopback，也不能完整防御 DNS rebinding。因此“域名只指向本机”是 Mod 的安全责任。网页侧的严格 URL 校验不能替代 DNS、监听地址和证书配置。

## 四、登录门禁

桥接复用本项目现有账号状态，不新增登录协议。

### 4.1 连接前状态机

`launchDescriptor.ts` 在浏览器模块求值时同步捕获并清除启动 fragment，不等待组件挂载或账号初始化。随后由现有 `startAccountFeatureClients()` 生命周期启动无 UI 连接器，根据账号状态决定下一步：

| 状态            | 条件                                                           | 行为                                          |
| --------------- | -------------------------------------------------------------- | --------------------------------------------- |
| `idle`          | 没有有效启动描述                                               | 不订阅连接，不创建 WebSocket。                |
| `waiting-login` | 有描述，但账号尚未初始化、未登录或正在强制修改密码             | 保留内存描述，等待账号 Store 更新。           |
| `connecting`    | 登录条件全部满足                                               | 创建一条 WSS 连接并开始握手。                 |
| `connected`     | 收到 `bridge.ready`                                            | 接受推荐和取消消息。                          |
| `reconnecting`  | 可恢复连接错误且仍在 60 秒重连预算内                           | Abort 旧任务，按退避创建新 socket。           |
| `stopped`       | 登录曾经有效后失效、页面卸载、连接被替换或发生不可重连协议错误 | Abort、关闭连接并丢弃描述，本次启动不再恢复。 |

账号 bootstrap 暂时失败并进入 `error` 时保留描述，由现有 online/focus 重试路径恢复后重新判断门禁；账号能力明确为 `disabled` 时立即进入 `stopped` 并丢弃描述。这样不会把临时网络错误误当成永久不支持，也不会让静态导出或离线包等待一个永远不会出现的登录状态。

网页只有同时满足以下条件才连接 Mod：

- 账号功能已经完成初始化。
- `accountStore.shared.isBootstrapped` 为 `true`。
- `accountStore.shared.bootstrapStatus` 为 `loggedIn`。
- `accountStore.shared.isLoggedIn` 为 `true`。
- 当前用户记录存在。
- 当前账号不处于强制修改密码状态。
- 当前标签页持有有效的内存启动描述。

连接器不能在单个 Store 字段变化时立即创建 socket。它订阅上述账号字段后只安排一个 microtask，在 microtask 中重新读取完整快照，确认全部条件仍然成立，再从 `waiting-login` 转到 `connecting`。`startRecommendationBridgeClient()` 必须幂等并返回清理函数，由全局 feature-client 生命周期统一启停，不创建 React 组件或 React state。这样可以避开登录成功处理逐项写入账号字段时产生的中间状态，也能防止 React Strict Mode 的 setup—cleanup—setup 创建两条连接。

### 4.2 注册或登录后自动连接

如果 Mod 拉起网页时用户尚未登录，网页保留内存启动描述并等待用户通过现有账号 UI 登录。桥接不会自动打开登录弹窗，也不增加新的登录提示。

用户名密码注册、用户名密码登录、WebAuthn 注册和 WebAuthn 登录最终都会调用现有 `applyAccountAuthSuccessResponse`。成功响应写入完整账号状态后，桥接账号订阅重新检查快照并自动连接。失败的登录或注册不会清除启动描述，用户可以在同一标签页继续尝试。

账号要求强制修改密码时保持 `waiting-login`，不连接 Mod。密码修改成功且账号状态解除限制后，再执行相同的完整快照检查并自动连接。

如果用户在其他标签页完成登录，启动标签页通过现有账号运行时广播刷新登录状态，随后按同一规则连接；桥接不新增跨标签页消息。

### 4.3 同源整页跳转续接

正常注册和登录不会卸载当前页面，内存描述可以直接保留。现有账号流程在仍有 SSO 授权上下文时会返回同源 `redirect_to`，WebAuthn 登录、WebAuthn 注册和强制改密恢复 SSO 也可能执行 `location.assign`。整页跳转会丢失模块内存，因此这些路径必须显式续接：

1. `launchDescriptor.ts` 提供 `createRecommendationBridgeContinuationUrl(targetUrl)`。
2. 没有活动启动描述时，helper 原样返回目标 URL。
3. 有活动描述时，只允许把重新编码的 `game-bridge` fragment 附加到与当前页面同 origin、且原本没有 fragment 的目标 URL。
4. 外部 origin、无法解析的 URL 或已有 fragment 的 URL 原样返回，不能泄露或覆盖数据。
5. 新页面再次读取并立即清除 fragment。由于账号成功状态已经写入，新页面完成账号初始化后自动连接。

该续接仍然只使用 URL fragment，不写 sessionStorage 或其他持久化。`/sso/authorize` 最终跳往第三方客户端的外部 redirect 不得携带桥接 fragment。

### 4.4 登录失效

以下情况一旦被现有账号客户端或页面生命周期获知，就会立即 Abort 全部在途推荐、停止重连并关闭 WSS：

- 用户在当前或其他标签页退出登录。
- 会话过期、账号被禁用或删除。
- 用户进入强制修改密码状态。
- 账号刷新确认当前登录状态无效。
- 启动标签页卸载。
- `pagehide`、刷新或进入 BFCache。

跨标签页账号变化继续使用现有账号广播和失效处理。桥接不新增 BroadcastChannel、localStorage signal 或账号状态副本。

收到每个 `recommendation.request` 时，网页都必须重新读取一次上述完整账号门禁快照。快照已经失效时不启动新任务，并按同一路径 Abort 全部在途任务、以 `4000 login-ended` 关闭连接。该检查只读取当前 `accountStore`，复用现有账号客户端的启动刷新、focus、`pageshow`、online 和跨标签页失效机制；不得为每个推荐请求额外调用 `/me`，也不把桥接描述当成持续有效的登录证明。首版门禁不是针对每条消息的在线会话证明：如果服务端状态在后台标签页中失效但现有账号客户端尚未获知，桥接会在下一次既有刷新或失效广播后关闭，而不是额外建立一套轮询。

Mod 只会从握手结果得知“桥接当前可用”，不会收到用户身份或可复用登录凭证。首版不承诺 Mod 可以独立验证登录真实性。

普通 feature-client 清理只释放订阅、timer、socket 和在途任务；React Strict Mode 的开发期重复启停不能销毁同一 document 内的启动描述。`pagehide`、登录失效、连接被替换和不可恢复协议错误是终止事件，会同时丢弃描述。刷新或从 BFCache 返回后不会静默恢复旧连接；普通 `1000` 关闭不触发 Mod 自动拉起，之后确实需要推荐时再创建新的启动 URL。只有明确的 `client-update` 使用 6.4 节的一次性自动重拉起。

## 五、多标签页和多 Mod 实例

### 5.1 标签页所有权

只有读取到有效 `game-bridge` fragment 的标签页是桥接所有者。其他标签页即使已登录，也不会读取、接管或竞争这条连接。

桥接描述不跨标签页传递，原因是 endpoint 和配对密钥只属于 Mod 主动拉起的页面。这样可以避免普通浏览标签页产生后台连接，也避免把密钥广播到无关标签页。

### 5.2 同一 Mod 实例

同一个 `instance_id` 只允许一条已认证连接：

- Mod 首次拉起网页时，该标签页建立连接。
- Mod 再次拉起相同实例时，新标签页可以建立新连接。
- 新连接通过配对验证后，Mod 向旧连接发送以下消息，随后以 `4001` 关闭旧连接：

```json
{ "type": "bridge.replaced", "instance_id": "S3v0Y6j7Hf2f2O5TK5o0bQ" }
```

- `bridge.replaced` 只允许示例中的两个字段，`instance_id` 必须与当前连接一致。
- 旧标签页收到合法替换消息或 `4001` 后取消全部任务，丢弃描述并且不再重连；实例不匹配的替换消息按协议错误处理，不能终止其他实例。

最终仲裁由 Mod 完成，因为只有 Mod 能准确知道哪些 socket 属于同一个进程实例。

`instance_id` 在同一 Mod 进程内保持不变，`pairing_token` 则属于一次页面启动。同一启动标签页因可恢复网络故障重连时继续使用原 token；同一实例再次拉起页面时必须生成新 token。Mod 最多保留当前已认证连接使用的 token 和最新一次待认证启动使用的 token：生成更新的待认证 token 时撤销更早但尚未认证的待认证 token；只有新连接完成配对后，才撤销旧连接的 token、发送 `bridge.replaced` 并关闭旧连接。新连接未通过认证时不得影响旧连接或旧 token。

### 5.3 多个 Mod 实例

不同 `instance_id` 可以各自连接到不同启动标签页。每个标签页只管理自己的连接和任务，不共享 AbortController、缓存写入状态或 generation。

如果启动标签页被关闭，连接不会转移给普通标签页。Mod 在之后确实需要推荐时重新拉起网页即可。

| 场景                  | 行为                                   |
| --------------------- | -------------------------------------- |
| 普通打开多个网页标签  | 都不连接 Mod。                         |
| Mod 首次拉起网页      | 启动标签页独占该实例连接。             |
| 同一 Mod 再次拉起网页 | 新连接替换旧连接，旧标签页停止重连。   |
| 同时运行多个 Mod 实例 | 每个实例使用独立启动标签页和连接。     |
| 任意标签页退出账号    | 现有账号失效路径使所有启动标签页断开。 |
| 启动标签页关闭        | 不自动转移；Mod 可以重新拉起。         |

### 5.4 Service Worker、Store 同步和账号广播

WebSocket 的所有权始终属于持有启动描述的 `Window`，不属于 Service Worker、跨标签页 Store 或账号广播通道：

- 现有 Service Worker 只管理 HTTP(S) 的安装、激活、导航和静态资源缓存，不创建、拦截、代理、保活或恢复 WebSocket。桥接不使用 `ServiceWorker.postMessage`、`clients.matchAll()` 或 `WindowClient.navigate()`。
- URL fragment 不进入 HTTP 请求，因此 Service Worker 的导航缓存不会存储 endpoint、`instance_id` 或 `pairing_token`。Service Worker 激活和 `clients.claim()` 不会使当前页面新建第二条连接。
- 桥接不新增 BroadcastChannel、storage event、跨标签页锁或 leader election。现有账号运行时广播只通知账号客户端刷新本标签页的登录状态；桥接只订阅 `accountStore` 的门禁字段，不直接消费账号广播。
- 普通 Store 的跨标签页变化不参与桥接请求。每个 `recommendation.request` 只映射到该消息的独立 `ISuggestParams` 快照，不读取顾客页面 Store，因此其他标签页修改顾客、可用范围、评级上限或预设不会改变在途请求。
- 当其他标签页广播更新的应用版本时，现有 `globalStore.persistence.version` 机制会使旧版启动标签页延迟 200 ms 调用 `location.reload()`。桥接允许额外订阅该版本字段，但只用于关闭：发现更高版本后同步启动清理，不等待异步工作，立即 Abort 全部任务，尽力发送 `bridge.closing` 的 `client-update` 原因，再以 `4006` 关闭 socket。刷新后不从 Store、Service Worker 或普通标签页恢复描述。Mod 把消息和 close code 视为同一次升级事件，按 6.4 节只自动重拉起一次。如果两个信号都未到达，Mod 先按普通异常断线等待原页面的有限重连，不立即反复打开标签页；仍未恢复时再在下一次需要推荐时重新拉起。
- 复制已清除 fragment 的启动标签页时，新标签页没有启动描述，因此不连接。`visibilitychange`、focus 和普通 `pageshow` 只允许刷新账号门禁，不转移所有权或创建新描述。

## 六、WSS 握手和连接生命周期

### 6.1 建立连接

网页使用浏览器原生 `WebSocket` 连接启动描述中的 endpoint。不能附加自定义 HTTP header。Mod 必须在 HTTP Upgrade 阶段先校验浏览器自动附带的 `Origin`，通过后才接受 WebSocket；配对信息在连接建立后的第一条 JSON 消息中发送，用于第二层实例认证。

当前 Chromium 会对公共站点到 loopback 的 WebSocket 应用 Local Network Access 权限。首次连接可能显示浏览器原生权限提示；这不属于项目 UI，也不能由项目自动批准。实现时在浏览器支持的情况下查询 `loopback-network`，并兼容旧别名 `local-network-access`：明确为 `denied` 时停止自动重连，`prompt` 或无法查询时由首次 `new WebSocket` 触发浏览器行为。5 秒握手计时从 WebSocket `open` 后发送 `bridge.hello` 开始，不能在用户处理权限提示时提前超时。浏览器行为以 [Chrome 147 WebSocket LNA 说明](https://developer.chrome.com/release-notes/147)和 [Chrome 145 权限拆分说明](https://developer.chrome.com/release-notes/145)为当前验收基线。

协议不规定“Mod 拉起网页到首个 socket open”的超时，因为用户可能需要注册、登录、强制改密或处理浏览器权限。Mod 在等待期间必须保留本次 `instance_id` 和 `pairing_token`；只有 WebSocket 已经 open 后，未认证连接才受 5 秒握手超时约束。若 Mod 自己放弃等待并轮换 token，旧启动页之后尝试连接会得到 `4002 pairing-failed`，不会自动取得新 token。

网页发送：

```json
{
	"type": "bridge.hello",
	"protocol_version": 1,
	"instance_id": "S3v0Y6j7Hf2f2O5TK5o0bQ",
	"pairing_token": "Kf3g-vAdYQpzzDxPrM7jS0tGpQqKaB0MpfF7brwGh5A",
	"max_in_flight": 4,
	"client": { "name": "touhou-mystia-izakaya-assistant", "version": "2.5.8" }
}
```

`bridge.hello` 必须是 socket open 后网页发送的第一条消息，字段含义如下：

| 字段               | 要求                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| `type`             | 固定为 `bridge.hello`。                                              |
| `protocol_version` | 固定为当前消息协议版本 `1`。                                         |
| `instance_id`      | 与启动描述逐字一致。                                                 |
| `pairing_token`    | 与启动描述逐字一致；只在此消息发送一次。                             |
| `max_in_flight`    | 网页提供的正整数并发能力上限。                                       |
| `client.name`      | 固定为 `touhou-mystia-izakaya-assistant`。                           |
| `client.version`   | 当前网页的 `package.json` 版本，长度 `1～64` 的可打印 ASCII 字符串。 |

Mod 已在 Upgrade 阶段验证 `Origin`，接着在 5 秒内验证协议版本、实例标识和配对密钥，并从网页声明的上限内选择本连接的并发数，然后返回：

```json
{
	"type": "bridge.ready",
	"protocol_version": 1,
	"instance_id": "S3v0Y6j7Hf2f2O5TK5o0bQ",
	"max_in_flight": 4,
	"heartbeat_interval_ms": 30000
}
```

`bridge.hello.max_in_flight` 是网页当前实现允许的最大并发请求数，V1 冻结值为 `4`。`bridge.ready.max_in_flight` 必须是 `1～bridge.hello.max_in_flight` 的整数，表示 Mod 选择的并发上限。`heartbeat_interval_ms` 必须是 `10000～120000` 的整数，建议使用 `30000`。

`bridge.ready` 必须是 Mod 发给该 socket 的第一条消息，只允许示例中的五个字段；`protocol_version` 和 `instance_id` 必须与 hello 一致。Mod 在返回 ready 前不得发送心跳、推荐、取消或替换消息。网页收到合法 ready 后才进入 `connected`；重复 ready 或握手阶段的其他消息按握手协议错误立即关闭。

在 `bridge.ready` 到达前，网页不接受推荐请求。握手失败时 Mod 使用第十节的 close code 断开连接，网页不得把握手失败当作普通网络故障无限重试。

### 6.2 重连

非主动关闭和非协议错误可以使用内存中的启动描述重连：

- 延迟依次为 500 ms、1 s、2 s、4 s、8 s，之后以 10 s 为上限。
- 累计重连时间达到 60 s 后停止。
- socket 重新 ready 并连续稳定 30 s 后才重置重连预算，避免快速建连—断开无限循环。
- 浏览器明确 offline 时暂停 timer 和预算，收到 online 后继续；同一时刻只允许一个连接尝试和一个重连 timer。
- 登录状态失效、连接被替换、配对失败或协议版本不支持时不重连。
- 浏览器明确拒绝 loopback/local-network 权限时不重连；项目不新增权限说明弹窗。
- 重连期间不保留旧请求；所有在途任务先 Abort。

每次连接尝试递增 connection generation。socket handler、timer、任务 Promise 和发送路径都必须先确认自己仍属于当前 generation；旧 socket 的迟到 open、message、error、close 和旧任务结果不能关闭新连接、重置新预算或发送任何消息。

请求和 `request_id` 都只属于发起它们的已认证连接。断线后网页不恢复、重放或猜测旧请求是否已送达；Mod 把旧连接上尚未确认的请求视为结果未知，需要时在新连接上用新的 `request_id` 重新提交。协议首版不提供跨连接幂等键或结果确认消息。

配对密钥的有效期由对应页面启动和连接替换状态控制。为了支持同一启动标签页的短暂断线重连，Mod 在该启动仍有效且尚未被新连接替换时保留原 token；新连接认证成功后撤销旧 token，Mod 进程退出时立即丢弃全部 token。

### 6.3 心跳

浏览器 WebSocket API 不暴露协议层 ping frame，因此使用应用层消息。Mod 按 `heartbeat_interval_ms` 发送：

```json
{ "type": "bridge.ping", "timestamp": 1784102400000 }
```

网页立即返回：

```json
{ "type": "bridge.pong", "timestamp": 1784102400000 }
```

Mod 连续两个周期没有收到对应 pong 时可以用标准 code `1011` 和稳定 reason `heartbeat-timeout` 关闭连接，让仍存活的网页进入有限重连。心跳不能触发 React state 更新或 UI 重渲染。

`bridge.ping` 和 `bridge.pong` 都只允许 `type`、`timestamp` 两个字段。`timestamp` 必须是非负的 JSON 安全整数，网页原样回显，不将它作为本地时钟或权限依据。Mod 使用自己发送的 timestamp 匹配 pong；不匹配或重复的 pong 不算作对应周期的成功回应。标签页变为后台、失去焦点或最小化时不主动断开。如果浏览器冻结，Mod 可因心跳超时关闭 socket，页面恢复后按 6.2 节有限重连；如果页面被丢弃且没有恢复连接，Mod 在下一次需要推荐时重新拉起。Service Worker 不为被冻结的页面代发 pong。

### 6.4 客户端版本升级

启动标签页因跨标签页应用版本同步而即将重载时，网页在关闭 socket 前尽力发送：

```json
{ "type": "bridge.closing", "reason": "client-update" }
```

协议 v1 中 `bridge.closing` 只能包含上面两个字段，`reason` 只允许 `client-update`。Mod 收到消息或 `4006 client-update` 时只设置一次“升级后重拉起”标记；两个信号先后到达不能打开两个标签页。等旧 socket 确认关闭并再等待 1 秒后，Mod 使用相同 `instance_id` 和 endpoint、重新生成的 `pairing_token` 创建新的启动 URL，并只拉起一次浏览器。新连接 ready 并连续稳定 30 秒后才清除这次升级标记；在此之前新页面再次报告 `client-update` 时不继续自动打开标签页，只保留下一次实际需要推荐时的重试能力。网页不为这次刷新把启动描述写回 fragment 或共享存储，避免旧版缓存反复刷新时携带配对密钥循环重连。

普通关闭标签页仍尽力使用 `1000`，Mod 不应因 `1000` 自动重新拉起。未收到升级信号的异常断线无法可靠区分临时网络故障、浏览器丢弃和未及发送通知的升级重载；Mod 应先允许原页面按 6.2 节有限重连，不能立即循环拉起新标签页。若连接未恢复，Mod 可在下一次实际需要推荐时重新拉起。

升级发生在 `waiting-login` 或 socket open 之前时还没有反向通道，网页无法发送 `bridge.closing` 或 close code。此时仍坚持不持久化描述，升级重载后桥接不会恢复；Mod 只能保持“等待浏览器连接”状态并提供取消/重新拉起操作，不能声称能够自动识别这类升级。该限制必须写入对外说明和验收报告。

## 七、推荐消息协议

所有消息都必须使用 WebSocket 文本帧承载一个 UTF-8 JSON object，字段使用 `snake_case`，每一层 object 的成员名都必须唯一。Blob、ArrayBuffer 和其他二进制帧按 `invalid-message` 处理。Mod 到网页的输入消息必须严格匹配协议，重复或未知字段报错。32 KiB 上限固定为 UTF-8 编码后的 `32768` 字节，网页使用 `TextEncoder` 计算，不按 JavaScript 字符数判断。Mod 解析网页响应时必须忽略未知字段，以便协议 v1 后续增加不影响现有语义的可选响应信息。

消息方向：

| `type`                     | 方向       | 作用                               |
| -------------------------- | ---------- | ---------------------------------- |
| `bridge.hello`             | 网页 → Mod | 提交协议版本和配对信息。           |
| `bridge.ready`             | Mod → 网页 | 确认握手和连接参数。               |
| `bridge.ping`              | Mod → 网页 | 应用层存活检测。                   |
| `bridge.pong`              | 网页 → Mod | 回应对应心跳。                     |
| `bridge.closing`           | 网页 → Mod | 通知可识别的客户端主动关闭原因。   |
| `bridge.replaced`          | Mod → 网页 | 通知旧连接已被新连接替换。         |
| `bridge.error`             | 网页 → Mod | 报告无法安全关联到请求的输入错误。 |
| `recommendation.request`   | Mod → 网页 | 发起套餐推荐。                     |
| `recommendation.cancel`    | Mod → 网页 | 取消指定推荐。                     |
| `recommendation.result`    | 网页 → Mod | 返回推荐结果。                     |
| `recommendation.cancelled` | 网页 → Mod | 确认推荐已取消。                   |
| `recommendation.error`     | 网页 → Mod | 返回可关联到请求的错误。           |

### 7.1 请求

```json
{
	"type": "recommendation.request",
	"request_id": "req-01J2Y8G5VA6JZ9M3QAX0NQ8G4B",
	"payload": {
		"customer": "比那名居天子",
		"order": { "recipe_tag": "昂贵", "beverage_tag": "高酒精" },
		"selection": {
			"recipe": { "name": "桃花羹", "extra_ingredients": ["蜂蜜"] },
			"beverage": "教父"
		},
		"options": {
			"cooker": null,
			"mystia_cooker": false,
			"famous_shop": false,
			"popular_trend": { "tag": "果味", "negative": false },
			"max_extra_ingredients": 2,
			"max_rating": 4,
			"max_results": 5,
			"availability": {
				"recipes": { "include": ["桃花羹"] },
				"beverages": { "include": ["教父"] },
				"ingredients": { "include": ["蜂蜜"], "exclude": [] }
			}
		}
	}
}
```

`request_id` 由 Mod 生成，长度为 `1～128`，只允许 ASCII 字母、数字、点、下划线、冒号和连字符。Mod 应保证当前连接生命周期内不重复；网页保留所有在途 ID 和最近 `256` 个已接受并结束的 ID，不建立随连接时长无限增长的历史集合。与在途或近期 ID 重复时返回 `invalid-request`，`details.reason` 为 `duplicate-request-id`。超过窗口的旧 ID 即使被 Mod 错误复用，也只会被视为一个新请求，因此建议使用随机或单调递增 ID。

重复 ID 错误只拒绝后到的消息，不取消或改写先到任务；如果先到任务仍在运行，它之后仍会发送自己的终态。Mod 因此不能把 `duplicate-request-id` 当成原任务已经失败。

每条连接可以同时执行多个推荐请求，上限为握手协商的 `max_in_flight`。接收顺序固定为：公共消息和 `request_id` 校验、账号门禁、在途/近期 ID 重复检查、业务参数校验、容量检查，最后才创建任务。只有真正接受的请求才占用容量并记录 ID。因 `invalid-request` 或 `busy` 被拒绝的 ID 不进入近期集合，Mod 修正参数或等待容量后可以复用。网页为每个已接受的 `request_id` 建立独立的 AbortController 和任务记录，并使用同一个公平轮转 scheduler 以不同 task key 分片执行。结果可以不按请求顺序返回，Mod 必须使用 `request_id` 关联。只有超过协商上限时返回 `busy`，不会隐式取消或替换现有任务。

### 7.2 取消

```json
{
	"type": "recommendation.cancel",
	"request_id": "req-01J2Y8G5VA6JZ9M3QAX0NQ8G4B"
}
```

对于一个已接受的任务，网页只允许 `recommendation.result`、`recommendation.cancelled` 或 code 为 `recommendation-failed` 的 `recommendation.error` 三种任务终态之一赢得竞态。取消处理先把仍为 `running` 的任务同步改成 `cancelling`，再调用该 `request_id` 独立的 `AbortController.abort()`；任务 Promise 确认结束后返回：

```json
{
	"type": "recommendation.cancelled",
	"request_id": "req-01J2Y8G5VA6JZ9M3QAX0NQ8G4B"
}
```

`cancelling` 任务在 Promise 结束前仍计入 `max_in_flight`，但不能再发送结果或业务错误。结果已经提交终态时，后到的取消不能把它改成 `cancelled`；此时的 `request-not-found` 是对取消命令的拒绝，不是第二个任务终态。取消、断线或登录失效后不得继续评级、发送结果或写入共享缓存。取消未知 ID 时返回 `request-not-found` 和 `details.reason: unknown-request-id`；取消近期已结束 ID 时返回同一错误码和 `details.reason: already-finished`，均不影响其他任务。

### 7.3 成功结果

```json
{
	"type": "recommendation.result",
	"request_id": "req-01J2Y8G5VA6JZ9M3QAX0NQ8G4B",
	"meals": [
		{
			"beverage": "教父",
			"price": 235,
			"rating": "exgood",
			"recipe": { "name": "桃花羹", "extra_ingredients": ["蜂蜜"] }
		}
	]
}
```

示例只说明字段结构，不表示示例请求一定产生该组合。没有合法推荐时返回空 `meals`，不视为错误。

| 字段                               | 类型       | 说明                                             |
| ---------------------------------- | ---------- | ------------------------------------------------ |
| `request_id`                       | `string`   | 与请求相同。                                     |
| `meals`                            | `array`    | 按现有规则稳定排序，第一项是最高优先结果。       |
| `meals[].beverage`                 | `string`   | 酒水标准名称。                                   |
| `meals[].price`                    | `integer`  | 非负整数；当前业务语义下料理价格与酒水价格之和。 |
| `meals[].rating`                   | `string`   | `exbad`、`bad`、`norm`、`good` 或 `exgood`。     |
| `meals[].recipe.name`              | `string`   | 料理标准名称。                                   |
| `meals[].recipe.extra_ingredients` | `string[]` | 固定和本次新增额外食材的完整列表。               |

`meals` 的数组顺序表示推荐优先级。`extra_ingredients` 在业务上是无重复集合，数组顺序只要求同一网页构建、同一输入下保持稳定，不表示食材之间的推荐优先级。Mod 比较套餐身份时不能依赖额外食材的排列顺序。

### 7.4 错误分层

```json
{
	"type": "recommendation.error",
	"request_id": "req-01J2Y8G5VA6JZ9M3QAX0NQ8G4B",
	"code": "invalid-request",
	"details": {
		"path": "payload.options.max_rating",
		"reason": "out-of-range"
	}
}
```

只在消息已有合法 `type` 和合法 `request_id`、因而能够可靠关联一个请求时使用 `recommendation.error`：

| `code`                  | 适用消息                 | 说明                                              |
| ----------------------- | ------------------------ | ------------------------------------------------- |
| `invalid-request`       | `recommendation.request` | 参数类型、名称、范围、模式组合或请求 ID 重复。    |
| `busy`                  | `recommendation.request` | 当前连接的运行中和取消中任务已达协商上限。        |
| `request-not-found`     | `recommendation.cancel`  | 请求未知或已经结束；`details.reason` 可提供诊断。 |
| `recommendation-failed` | `recommendation.request` | 已接受的推荐发生非取消内部异常。                  |

`details` 是可选的诊断 object，目前只允许 `path` 和 `reason` 两个短字符串。`path` 使用从消息根开始的点号路径；数组元素只报告数组字段，不回显下标对应的用户值。只有 `code` 是 Mod 可以用于业务分支的稳定错误标识；`path`、`reason` 及其具体取值只用于日志和开发诊断，Mod 不得依赖它们控制重试或业务流程。错误不得回显完整请求、堆栈、账号状态或内部评分。

无法解析为单个 JSON object、`type` 缺失、字段结构不合法、`request_id` 不合法，或者消息在当前握手状态下不允许时，不得猜测请求归属，使用 `invalid-message`。`type` 是合法字符串但协议 v1 不认识时使用 `unsupported-message`。两者都属于连接级错误：

```json
{ "type": "bridge.error", "code": "invalid-message" }
```

连接级 `code` 只允许：

| `code`                | 说明                                               |
| --------------------- | -------------------------------------------------- |
| `invalid-message`     | 帧类型、JSON、公共信封、字段或当前连接状态不合法。 |
| `unsupported-message` | JSON 信封合法，但 `type` 不是协议 v1 支持的消息。  |

错误处理顺序固定为：先按 UTF-8 字节数检查上限，再解析 JSON 和公共信封，之后按连接状态校验消息类型，最后校验请求业务参数。握手完成前，任何不是当前状态所期待的消息或任何非法 `bridge.ready` 都立即以 `4005` 关闭，避免在未认证状态继续交互。握手完成后，单个未超限的连接级错误发送一次 `bridge.error` 并增加连续协议错误计数；连续 `3` 条时以 `4005 invalid-message` 关闭。任何合法且在当前连接状态下允许的 Mod→网页消息都会把连续协议错误计数归零，包括 `bridge.ping`、`bridge.replaced`、合法推荐请求和合法取消；请求最终返回 `invalid-request`、`busy` 或 `request-not-found` 也不改变其“合法消息”的性质。任何超过 32 KiB 的消息立即以 `4005` 关闭，不解析、不发送 `bridge.error`，也不回显内容。

`bridge.error` 只用于网页报告 Mod 输入，不设计 Mod→网页的错误回环。Mod 如果发现网页输出缺少必填字段、类型错误或超过上限，应记录不含载荷的本地诊断并以 `4005` 关闭；对网页输出新增的未知可选字段仍必须忽略。

## 八、推荐请求参数

`recommendation.request.payload` 是一个 JSON object，顶层只接受 `customer`、`order`、`selection` 和 `options`。

| 字段        | 类型     | 必填 | 说明                                     |
| ----------- | -------- | ---- | ---------------------------------------- |
| `customer`  | `string` | 是   | 稀客的简体中文标准名称。                 |
| `order`     | `object` | 条件 | 本次点单的料理标签和酒水标签。           |
| `selection` | `object` | 否   | Mod 已经固定的料理、酒水和额外食材。     |
| `options`   | `object` | 否   | 厨具、趋势、评级上限、结果数和可用范围。 |

未知字段和未知标准名称都返回 `invalid-request`，不能静默忽略。

本协议直接复用游戏数据中的简体中文标准名称和标签，不维护第二份对外数据目录。顾客、料理、酒水、食材、厨具名称以及标签都是大小写敏感、按 UTF-8 字符逐字匹配的协议 token，不是可以独立修改的展示文案；V1 发布后，已经公开的 token 不得改名、复用或改变含义。网页当前内置的游戏数据是合法值和可用范围的校验来源，后续新增游戏内容可以增加新 token；Mod 使用自身游戏数据构造请求，遇到网页尚未收录、生产代码禁用或不符合当前顾客 DLC 范围的内容时处理 `invalid-request`。

### 8.1 `order`

```json
{ "recipe_tag": "昂贵", "beverage_tag": "高酒精" }
```

两项类型都是 `string` 或 `null`。未提供 `order` 时按两项都为 `null` 处理：

- 普通厨具语义下，两项都必须是有效标签。
- `mystia_cooker` 为 `true` 且至少固定了一种料理或酒水时，允许其中一项或两项为 `null`。
- 从零推荐完整套餐时，两项都必须提供，且 `mystia_cooker` 必须为 `false`。
- 动态流行标签必须同时提供具体 `popular_trend`。

`order` 存在时必须同时包含 `recipe_tag` 和 `beverage_tag`，不能通过省略其中一项表达 `null`。

### 8.2 `selection`

```json
{
	"recipe": { "name": "桃花羹", "extra_ingredients": ["蜂蜜"] },
	"beverage": "教父"
}
```

- `recipe.name` 和 `beverage` 使用标准名称。
- `recipe.extra_ingredients` 默认空数组，不得重复或包含基础食材。
- 基础食材与全部额外食材的总数不得超过 5。
- 固定项必须符合稀客 DLC 范围和生产代码中的禁用数据规则。
- 固定料理和酒水必须位于各自类别的最终可用范围内。
- 固定料理的基础食材不受 `availability.ingredients` 限制；固定的额外食材必须位于最终食材可用范围内。
- 固定项不会被算法替换。

显式提供空 `selection` object 与完全省略 `selection` 等价，均表示没有固定料理或酒水。`selection.recipe` 存在时，`extra_ingredients` 可以省略并按空数组处理。

### 8.3 `options`

| 字段                    | 类型                | 默认值  | 说明                                          |
| ----------------------- | ------------------- | ------- | --------------------------------------------- |
| `cooker`                | `string` 或 `null`  | `null`  | 未固定料理时按厨具过滤；`null` 表示不限。     |
| `mystia_cooker`         | `boolean`           | `false` | 是否按夜雀厨具语义评级。                      |
| `famous_shop`           | `boolean`           | `false` | 是否应用名店标签规则。                        |
| `popular_trend`         | `object` 或 `null`  | `null`  | `{ "tag": string, "negative": boolean }`。    |
| `max_extra_ingredients` | `integer` 或 `null` | `null`  | 额外食材总数上限，合法值为 `0～4` 或 `null`。 |
| `max_rating`            | `integer`           | `4`     | 评级硬上限，合法值为 `0～4`。                 |
| `max_results`           | `integer`           | `5`     | 返回结果数，合法值为 `1～10`。                |
| `availability`          | `object`            | 不限制  | 按料理、酒水和食材声明白名单与黑名单。        |

已固定料理时，`cooker` 必须省略或为 `null`，厨具由料理数据推导。`max_extra_ingredients` 包含已经固定的额外食材，不是“本次最多再加几个”。

`availability` 可以包含 `recipes`、`beverages` 和 `ingredients`，每个类别都是只允许 `include`、`exclude` 两个标准名称数组的 object。缺少整个 `availability`、缺少某个类别或显式空类别 object 均表示不限制该类别。类别中缺少 `include` 时以当前顾客 DLC 和生产数据规则允许的全部项目为初始集合；显式 `include: []` 表示该类别没有可用项。缺少 `exclude` 或显式 `exclude: []` 表示不额外排除。

每个类别的最终可用集合固定为 `include（缺省为全集）− exclude`。同一名称可以同时出现在两个数组中，此时黑名单优先且该名称不可用；单个数组内部不得重复。所有名称仍必须是网页已收录、符合当前顾客 DLC 且未被生产规则禁用的标准名称。

未固定料理时，候选料理本身必须位于最终料理集合内，其全部基础食材和所选额外食材必须位于最终食材集合内；候选酒水必须位于最终酒水集合内。已固定料理时，料理本身仍必须位于最终料理集合内，但其基础食材不受最终食材集合限制，只有固定或算法添加的额外食材受限。已固定酒水必须位于最终酒水集合内。固定项违反这些边界时返回 `invalid-request`；没有固定项时，空最终集合是合法输入并可以正常返回空结果。

评级值：

| 值  | 评级键   | 中文显示 |
| --- | -------- | -------- |
| `0` | `exbad`  | 极度不满 |
| `1` | `bad`    | 不满     |
| `2` | `norm`   | 普通     |
| `3` | `good`   | 满意     |
| `4` | `exgood` | 完美     |

`max_rating` 是搜索过程中的硬约束。上限为 `3` 时不得返回 `exgood`，也不能先选出 `exgood` 再在响应层过滤。

## 九、四种推荐模式

协议不接受单独的 `mode` 字段，根据 `selection` 自动推断：

| `selection.recipe` | `selection.beverage` | 模式           | 算法补全内容             |
| ------------------ | -------------------- | -------------- | ------------------------ |
| 未提供             | 未提供               | 完整套餐       | 料理、酒水和额外食材     |
| 已提供             | 未提供               | 固定料理       | 酒水和可能需要的额外食材 |
| 未提供             | 已提供               | 固定酒水       | 料理和可能需要的额外食材 |
| 已提供             | 已提供               | 固定料理和酒水 | 只补额外食材             |

四种最小 payload：

```json
{
	"customer": "比那名居天子",
	"order": { "recipe_tag": "昂贵", "beverage_tag": "高酒精" }
}
```

```json
{
	"customer": "比那名居天子",
	"order": { "recipe_tag": "昂贵", "beverage_tag": "高酒精" },
	"selection": { "recipe": { "name": "桃花羹", "extra_ingredients": [] } }
}
```

```json
{
	"customer": "比那名居天子",
	"order": { "recipe_tag": "昂贵", "beverage_tag": "高酒精" },
	"selection": { "beverage": "教父" },
	"options": { "cooker": "油锅" }
}
```

```json
{
	"customer": "比那名居天子",
	"order": { "recipe_tag": "昂贵", "beverage_tag": "高酒精" },
	"selection": {
		"recipe": { "name": "桃花羹", "extra_ingredients": ["蜂蜜"] },
		"beverage": "教父"
	}
}
```

## 十、连接关闭和协议错误

自定义 close code 连续使用 `4000～4006`：

| code   | reason                 | 发起方 | 当前网页自动重连 | 说明                                    |
| ------ | ---------------------- | ------ | ---------------- | --------------------------------------- |
| `4000` | `login-ended`          | 网页   | 否               | 登录失效、退出或强制修改密码。          |
| `4001` | `connection-replaced`  | Mod    | 否               | 同一实例的新连接替换旧连接。            |
| `4002` | `pairing-failed`       | Mod    | 否               | 配对密钥或实例标识不正确。              |
| `4003` | `unsupported-protocol` | 任一方 | 否               | 不支持对方的协议版本。                  |
| `4004` | `handshake-timeout`    | 任一方 | 是               | socket open 后 5 秒未完成握手。         |
| `4005` | `invalid-message`      | 任一方 | 否               | 握手非法、消息超限或连续 3 条协议错误。 |
| `4006` | `client-update`        | 网页   | 否               | 旧版页面即将因应用更新而重载。          |

标准 close code 的处理规则：网页主动正常结束时尽力发送 `1000` 并停止；Mod 计划重启服务时应发送 `1012`，对端离开 `1001`、网络异常 `1006`、临时服务异常 `1011`、`1012` 和 `1013` 在登录与描述仍有效时进入 6.2 节有限重连；策略或载荷错误 `1008`、`1009` 不重连。HTTP Upgrade、TLS、DNS、CSP 或 LNA 在 socket open 前失败时没有可用的 WebSocket close code，只按连接失败进入有限重连；明确检测到 LNA 权限为 `denied` 时例外停止。

自定义 code 的表格只表示当前网页是否使用同一份内存描述自动重连，不限制 Mod 在 `client-update` 后创建新启动 URL。close reason 必须与表中 ASCII 字符串完全一致，不发送用户可控内容，并保持在 WebSocket 规定的 123 个 UTF-8 字节以内。未知的 `4xxx` code 默认不重连，避免新版协议错误在旧网页上形成循环。

推荐在用户浏览器本地执行，首版不设每分钟请求数限流。资源边界由握手协商的有界在途数、32 KiB 消息上限、严格业务参数上限、公平时间片调度和独立 Abort 共同控制。Mod 可在未超过 `max_in_flight` 时继续发送请求，不必等待前一个请求结束。

## 十一、安全和隐私

### Mod 负责

- 使用受浏览器信任的 TLS 证书。
- 本地域名只解析到 loopback，并只监听 loopback socket。
- 为每个进程生成不可预测的 `instance_id`，为每次页面启动生成新的 32 字节 `pairing_token`。
- 对 pairing token 使用恒定时间比较（如果所用语言或库支持）。
- 校验 WebSocket `Origin`，不接受 `null` 或未配置来源。
- 限制消息大小、连接数和握手超时。
- 新连接完成验证后再替换旧连接，防止未认证连接踢掉有效连接。

### 网页负责

- 严格解析并立即清除启动 fragment。
- 在 Analytics 或其他读取 `location.href` 的代码运行前清除 fragment，任何日志和统计都不能观察到配对信息。
- 只在确认登录后连接，不把账号凭证放入 endpoint 或消息。
- 把全部 WSS 消息解析为 `unknown` 后逐字段验证。
- 只调用现有 `suggestMeals`，不允许消息指定任意函数、模块或 URL。
- 对每次请求使用独立 generation 和 AbortController。
- 连接关闭、替换、取消、失败或登录失效时阻止晚到结果发送和半成品缓存写入。
- 不把 endpoint、token、请求或结果写入日志、分析、持久化或错误上报。

由于 endpoint 域名是动态的，网页无法从 JavaScript 内证明它属于本地进程。协议依靠用户主动从 Mod 拉起页面、TLS、随机配对密钥和 Mod 的 Origin 校验建立本机连接边界。如果以后需要让 Mod 独立验证登录，必须另行设计短期签名凭证；不能复用 Cookie 或把账号 session token 交给 Mod。

## 十二、兼容性和运行模式

### 12.1 V1 永久兼容规则

V1 一旦对外发布，账号功能可用的正式网页入口必须永久保留 V1 支持，不能要求外部 Mod 跟随网页发布同步升级。未来存在破坏性需求时新增并行的 V2；Mod 继续在启动描述中显式选择版本，网页不能把 V1 请求静默升级到 V2，也不能用最新版本校验器直接解释旧版本消息。

实现时每个已发布版本都有独立的外部消息校验和响应序列化边界：V1 原始 JSON 先经过 V1 validator 和 V1 adapter 映射为当前内部 `ISuggestParams`，内部推荐结果再经过 V1 serializer 和 V1 error mapper 输出。内部算法、数据结构或最新协议发生变化时，通过适配器维持 V1 的既有契约，而不是修改 V1 的外部含义。

V1 发布后禁止：

- 删除或重命名字段，改变字段类型、必填性、`null`/省略语义或默认值。
- 缩小合法范围，改变名称、标签、评级、消息类型、错误码或 close code 的既有含义。
- 为已有请求增加新的必做步骤、确认消息、重试义务或不同的终态规则。
- 复用已公开的名称、标签、错误码、close code 或消息 `type` 表示其他含义。
- 改变 `max_rating` 硬约束、第一项为首选、结果无重复、取消不产生晚到结果以及断线不自动重放等可观察语义。

V1 发布后允许：

- 优化算法、缓存、调度、取消和内部数据结构，只要保持 V1 可观察契约。
- 更新网页内置游戏数据或在游戏新增内容时接受新的标准名称和标签；已经公开的 token 保持原含义。
- 修复偏离本文档既有约束的实现错误。
- 在网页→Mod 消息中增加不改变既有字段含义的可选诊断字段；V1 Mod 必须递归忽略未知响应字段。新的 Mod→网页输入字段、模式或行为必须使用新协议版本。

推荐结果不按协议版本冻结为一组永久不变的套餐。相同请求在不同网页发布版本中可以因游戏数据、算法正确性修复或排序优化产生不同结果，但仍必须满足 V1 规定的硬约束、评级语义、排序含义和结果结构。`client.version` 用于记录产生结果的网页版本，不是要求 Mod 匹配的最低版本。

V1 对外发布前必须消除规范部分的“草案”、待定值和相互矛盾描述，并用长期保留的 V1 合法/非法消息 fixture 与参考 Mod 验证当前网页。以后每次修改桥接或推荐边界，都必须重新执行 V1 fixture 和真实参考连接；通过 V2 验收不能替代 V1 回归。

### 12.2 运行模式

- 桥接使用浏览器原生 `WebSocket`、`AbortController`、`URL`、TextEncoder/TextDecoder 和 base64url 边界工具，不新增运行时依赖。
- 页面必须通过 HTTPS 打开，本地连接必须使用 WSS，避免 mixed content 拦截。
- 新版 Chromium 可能为 loopback WebSocket 显示 Local Network Access 浏览器权限提示；拒绝权限时连接不可用，但项目不增加可见 UI。
- 当前仓库不设置限制 WebSocket 的 Content Security Policy；部署方若额外设置 `connect-src`，必须允许实际动态 WSS endpoint，否则浏览器会在创建连接前阻止访问。
- 账号功能可用且用户登录时才能连接。静态导出和离线包没有账号服务，因此不提供桥接。
- 账号功能关闭或服务端配置不完整时，启动描述会被清除，但不会连接 Mod。
- 推荐消息不经过 `/api/v1`，不使用 CORS、CSRF、HTTP `Retry-After` 或服务端 rate limit。
- 账号成功流程需要整页跳转时，只在同源 URL 上用 fragment 续接启动描述；第三方 redirect 永远不携带该信息。
- Service Worker 和跨标签页 Store 不持有桥接描述或 socket，不提供后台代理、保活、接管或恢复。
- Mod 只需实现自己选择的 `protocol_version`，不需要跟随网页支持的最新版本升级。

## 十三、本项目实施结构

### WSS 实施前预备改造

以下改造不依赖 WSS 协议，本身也能提高现有“猜您想要”和营业预设推荐的异步边界可靠性，因此先于桥接客户端完成：

- `suggestMeals` 在任何异步让出和缓存读取前建立本次调用的完整参数快照。快照复制 `customerOrder`、`popularTrend`、固定料理及其额外食材数组，以及三个隐藏项 Set；缓存键、搜索上下文和实际计算只使用同一份快照。调用方在 Promise 完成前继续修改原对象时，不得改变本次结果，也不得使缓存键和缓存内容不一致。
- `ISuggestParams` 顶层字段声明为只读，明确一次调用对应一个不可替换的参数集合。`AbortSignal`、scheduler 和 task key 仍属于执行选项，不进入业务参数快照。
- `ICustomerOrder` 从页面 Store 模块下沉到 `app/types/customerOrder.d.ts`，由 `app/types/index.ts` 统一导出。评级、推荐、已保存套餐评估和 React hook 只依赖领域类型；Store 继续持有实际状态，不改变字段、默认值、持久化或同步格式。
- 推荐内核新增私有 host-task 队列。浏览器优先使用 `MessageChannel` 安排下一轮任务，无法使用时回退到 `setTimeout(0)`；默认 scheduler 和公平轮转 scheduler 复用该队列。公共 `ISuggestMealsYieldScheduler` 接口、默认 6 ms 时间片、task key、公平顺序和 Abort 行为保持不变。

本阶段明确不提前创建 fragment parser、WSS 类型、消息 validator、账号连接组件或其他尚无生产调用方的桥接代码；不合并并发 Promise，不增加缓存版本、持久化、依赖、环境变量、Web Worker 或 UI。

预备改造验收：

- 临时确定性脚本证明：外部在首次让出时修改原入参，不影响本次结果；快照前后的普通调用结果逐项一致。
- 默认和公平调度器在浏览器环境走 host-task 队列，频繁与稀疏时间片结果一致，Abort 后不再计算或写缓存。
- 公平轮转仍按 task key 逐轮恢复，不产生饥饿。
- 真实浏览器 Performance 中计算保持分片，交互、动画和滚动不因调度方式调整而退化。

### 新建文件

- `app/lib/recommendations/bridge/protocol.ts`
    - 定义跨版本启动/握手边界、消息大小、close code 和按 `protocol_version` 分派的入口。
    - 在 `JSON.parse` 丢失重复键证据前校验原始文本的 object 成员唯一性，再把 `unknown` 交给对应版本 validator；不能用最新协议 validator 解释旧版本消息。
- `app/lib/recommendations/bridge/shared.ts`
    - 提供不依赖领域数据的协议版本常量和重复 JSON 成员检查，使 `instrumentation-client.ts` 可以在 Next App Router 读取初始 URL 前加载启动描述模块。
- `app/lib/recommendations/bridge/v1/protocol.ts`
    - 冻结 V1 消息常量、公共 TypeScript 类型和严格 validator。
- `app/lib/recommendations/bridge/v1/requestAdapter.ts`
    - 把已经通过 V1 校验的名称、默认值和四种模式映射为当前内部 `ISuggestParams`，不复制游戏数据或推荐规则。
- `app/lib/recommendations/bridge/v1/responseSerializer.ts`
    - 把当前内部结果和错误映射回永久兼容的 V1 JSON；内部类型变化不能直接改变 V1 输出。
- `app/lib/recommendations/bridge/launchDescriptor.ts`
    - 在浏览器模块首次求值时同步捕获原始 `game-bridge` fragment，保留 `history.state` 后立即清除，再执行包含重复键检测的严格解析；服务端求值只返回无描述，不能访问 DOM。
    - 返回仅存在于当前模块内存中的启动描述。
    - 为无账号能力的运行模式提供只清除并丢弃描述的入口。
    - 提供 `createRecommendationBridgeContinuationUrl(targetUrl)`，只为同源、无 fragment 的整页跳转续接描述。
- `app/lib/recommendations/bridge/client.ts`
    - 导出幂等的 `startRecommendationBridgeClient()`，管理账号订阅、只用于升级关闭的应用版本订阅、WebSocket、LNA 权限状态、`pagehide`、握手、心跳、重连、连接 generation、在途请求 Map、公平 scheduler、AbortController 和消息发送。
    - 不依赖 React，不读写 UI 或持久化 Store。
- `.github/plans/猜你想要/recommendation-bridge-reference/`
    - 与本文档同目录长期保留可运行的本地 Mod 服务端参考、语言无关流程说明和四种业务请求样例。
    - 保留 V1 合法/非法消息、默认值、错误、取消和终态竞态 fixture；不复制顾客、料理、酒水、食材、厨具或标签等游戏数据目录。
    - 参考实现可以选用一种自带 HTTP/WebSocket 能力的独立工具链，但不是 Mod 接入前提，也不加入本项目生产依赖；其他语言以协议状态机和 JSON 样例为准。

### 修改文件

- `instrumentation-client.ts`
    - 在 Next App Router 建立初始 `canonicalUrl` 前静态导入启动描述模块。真实浏览器验证表明，只从 feature-client 导入会被 App Router 随后的 history 更新恢复原 fragment。
- `app/lib/account/client/featureClient.tsx`
    - 保留启动描述模块的静态导入，并在现有全局 feature-client 生命周期中启动和清理桥接客户端。
    - 在现有 `startAccountFeatureClients()` 生命周期中启动并清理无 UI 桥接客户端。
    - 不改变 `AccountFeatureModals` 的现有可见 UI、overlay 或交互。
- `app/lib/account/client/featureClient.offline.tsx`
    - 顶层静态导入清除入口，在模块求值时同步清除并丢弃 `game-bridge` fragment，避免等到 `startAccountFeatureClients()` effect 才处理。
    - 不启动桥接，不解析为可连接描述。
    - 保持账号状态为 `disabled`，不增加连接、账号能力或 UI。
- `app/lib/account/client/components/accountManager.tsx`
    - 三处用户名密码/WebAuthn 登录注册成功的 `redirect_to` 调用统一经过续接 helper。
    - 不改变登录、注册、SSO 授权或账号弹窗的可见行为。
- `app/lib/account/client/components/accountPasswordMustChangeModal.tsx`
    - 强制改密完成后恢复 SSO 的同源跳转经过续接 helper。
    - 不改变强制改密判断、弹窗内容或阻塞语义。
- `.github/plans/猜你想要/稀客套餐推荐本地WSS桥接协议.plan.md`
    - 协议冻结和实现完成后更新状态、版本、错误码及验证记录。

### 保持不变

- `app/providers.tsx` 页面结构和可见组件顺序不变。
- `app/(pages)/sso/authorize/authorizeControls.tsx` 的第三方 redirect 保持原样，不能附带桥接信息。
- `app/utils/customer/customer_rare/suggestMeals.ts` 继续作为唯一生产推荐入口；本次只收紧其异步入参和调度边界。
- `app/utils/customer/customer_rare/evaluateMeal.ts` 继续作为唯一评级语义来源。
- 不新增 API route、数据库表、环境变量、依赖、Store 字段、持久化或跨标签页消息。

## 十四、实施任务与进度

### Task 0：完成 WSS 前置内核优化

- [x] `suggestMeals` 在缓存键和首次异步让出前复制全部可变业务参数。
- [x] 缓存键、上下文和搜索计算使用同一份参数快照。
- [x] `ISuggestParams` 顶层字段改为只读，不改变调用方协议或结果结构。
- [x] `ICustomerOrder` 下沉到共享 types，全部调用方不再从 Store 导入该类型。
- [x] 默认和公平调度器复用浏览器 `MessageChannel` 优先、timer 回退的私有 host-task 队列。
- [x] 临时验证脚本完成红—绿验证后删除，不新增测试基础设施或测试文件。
- [x] 算法结果、缓存、Abort、公平轮转、静态检查和真实浏览器 Performance 验证通过。

完成标准：预备改造对现有 UI 和推荐结果透明，异步调用不再观察到调用方后续修改，推荐领域层不再依赖 Store，调度器仍可取消且不会把搜索重新变成同步长任务。

### Task 0A：收紧营业预设批处理和缓存语义

修改文件：

- `app/(pages)/customer-rare/useCustomerRarePlanRecommendations.ts`
    - 把最多 280 个组合形成的异步递归 Promise 链改成逐批循环；每一批仍先通过共享公平调度器让出，再调用 `resolveRecommendedCustomerRarePlanMealBatch`。
    - 共享 LRU 缓存只保存已经完成的 `meals` 数组。部分结果、`nextIndex` 和完成状态只属于当前 hook 实例，不进入共享缓存。
- `.github/plans/猜你想要/稀客套餐推荐本地WSS桥接协议.plan.md`
    - 记录二次审计发现的同步 fragment 清理、离线丢弃、账号全局生命周期、本地网络权限和页面卸载边界，但不创建任何 WSS 生产代码。

执行步骤：

- [x] 先记录四种推荐模式、全部评级上限、Abort 后重试和多个营业预设顾客列的当前基线。
- [x] 将缓存值改为完整 `meals` 数组；缓存命中即表示完成，缓存未命中才从索引 `0` 开始。
- [x] 将 `runBatch` 自递归改为循环，保持每批大小 `1`、task key、generation、Abort、状态发布和完整结果写缓存时机不变。
- [x] 验证折叠后恢复继续使用 hook 实例的 `nextIndexRef`，切换缓存键或卸载不会把部分结果写入共享缓存。
- [x] 运行确定性算法检查、`pnpm lint`、`pnpm exec tsc --noEmit`、focused Prettier 和 `git diff --check`。
- [ ] 使用真实浏览器验证多个顾客列展开/折叠、切换预设和条件、控制台、Network、Performance；React Profiler 确认单列进度不引发全部顾客列重渲染。

完成标准：结果和 UI 状态与修改前一致；循环中每批仍可取消且公平让出；共享缓存只能包含完整、成功、与完整缓存键对应的结果。

### Task 1：冻结外部协议

- [x] 确认 Mod 是本地 WSS 服务端，网页是客户端。
- [x] 确认 Mod 使用 fragment 提供动态 endpoint 和配对信息。
- [x] 确认只允许已登录网页使用，不向 Mod 发送登录凭证。
- [x] 确认不新增 UI。
- [x] 确认启动标签页独占及同实例新连接替换旧连接。
- [x] 确认第六、七和十节的消息字段、超时及 close code。
- [x] 冻结 V1 永久兼容规则、版本分派、V1 adapter/serializer 边界和禁止变更清单。
- [x] 确认游戏标准名称与标签直接作为永久协议 token，不创建或维护第二份外部游戏数据目录。
- [x] 冻结 `instance_id` 属于 Mod 进程、`pairing_token` 属于单次页面启动，以及新连接认证后才撤销旧 token 的交接规则。
- [x] 用真实浏览器并发压测确认 `bridge.hello.max_in_flight` 的首版上限，确保多请求公平分片且不破坏交互响应性。
- [x] 冻结最近 `256` 个终态请求 ID、连续 `3` 条无效消息和 32 KiB UTF-8 字节上限，并在参考 Mod 中验证边界。
- [x] 用至少一种目标 Mod 语言验证 base64url、JSON 和 close code 可实现性。

完成标准：Mod 开发者只阅读本文档即可生成启动 URL、完成握手、请求和取消推荐，并正确处理全部结果、错误和关闭路径。

### Task 2：验证启动描述解析

在仓库临时目录 `.tmp-recommendation-bridge-validation/` 先编写确定性校验脚本，覆盖：

- [x] 合法的动态 WSS 域名、端口和路径。
- [x] 全部 WS、缺少显式端口、凭证、query、fragment 和超长 URL；显式 `:443` 不能因 `URL.port` 为空被误拒绝。
- [x] fragment 精确语法拒绝重复键、其他字段、空值、后缀、percent encoding 和非 base64url 字符。
- [x] 非 object JSON、重复/未知字段、错误 base64url、错误随机值长度和协议版本。
- [x] fragment 在 React effect 和 Analytics 前同步清除，保留 `history.state`、pathname 和 query，且不进入任何存储或 `globalThis`。
- [x] 无描述和无效描述时不创建 WebSocket。
- [x] 账号关闭、静态导出和离线替换清除并丢弃描述，不创建 WebSocket。
- [x] 同源且无 fragment 的跳转正确续接描述，新页面读取后再次清除。
- [x] 外部 origin、非法 URL 和已有 fragment 的跳转不附加描述。

完成后删除临时目录，不提交验证脚本。

### Task 3：验证请求协议和领域映射

- [x] 四种合法模式及省略/显式默认值。
- [x] 全部 `max_rating`、`max_extra_ingredients` 和 `max_results` 合法值。
- [x] 空 `selection`、部分/空 `availability`、省略/空 `include` 与 `exclude`、省略 `extra_ingredients`、`order` 两字段必备和全部 `null` 边界。
- [x] 各层 JSON object 重复/未知字段、类型、名称、重复数组项、白名单减黑名单、槽位超限和固定项可用范围冲突。
- [x] 错误严格分层：可关联业务错误使用 `recommendation.error`，不可关联协议错误使用 `bridge.error`，握手非法、超限或连续 3 条协议错误使用 `4005`。
- [x] `invalid-request`、`busy` 和 `request-not-found` 重置协议错误计数，不把被拒绝的请求 ID 写入近期终态集合。
- [x] 合法 `bridge.ping` 和其他当前状态允许的输入同样重置协议错误计数；`details` 只用于诊断，参考 Mod 不按 `reason` 分支。
- [x] 服务层结果与直接调用 `suggestMeals` 逐项一致。
- [x] 不复制评分、排序、缓存或食材权重实现。
- [x] 冷缓存和热缓存产生相同 JSON。

### Task 4：实现无 UI 的连接生命周期

- [x] 从账号在线 `startAccountFeatureClients()` 启动幂等的 `startRecommendationBridgeClient()`，不创建 React 组件或 state。
- [x] 只在启动标签页且登录有效时连接。
- [x] 连接门禁只订阅 `accountStore` 字段，不直接订阅账号 BroadcastChannel、storage event、页面业务 Store 或 Service Worker 消息。唯一例外是读取并订阅 `globalStore.persistence.version`，且只能在发现更高版本时触发关闭，不能触发连接。
- [x] 未登录时等待现有登录流程，不自动打开账号 UI。
- [x] 账号字段变化经单个 microtask 合并后重新读取包含 `isBootstrapped` 的完整快照，避免逐项写入和 Strict Mode 造成提前或重复连接。
- [x] 用户名密码注册/登录和 WebAuthn 注册/登录成功后自动连接且只连接一次。
- [x] 强制改密期间不连接，修改成功后自动连接。
- [x] 所有同源 `redirect_to` 和强制改密恢复 SSO 路径使用续接 helper。
- [x] SSO 授权完成后的第三方 redirect 不附带桥接 fragment。
- [x] 实现握手超时、心跳、有限重连和明确不重连的 close code。
- [x] 5 秒握手超时从 socket `open` 并发送 hello 后开始，不把浏览器权限等待计入握手时间。
- [x] 每次连接尝试使用独立 generation；旧 socket 的全部迟到事件、timer 和旧任务不得影响新连接。
- [x] 重连同时只有一个 socket 和 timer，offline 暂停预算，ready 稳定 30 秒后才重置预算。
- [x] 登录失效、`pagehide`、刷新、BFCache、连接替换和协议错误统一取消任务并释放 socket。
- [x] 发现跨标签页更高应用版本时，在现有 200 ms 刷新延迟内 Abort 全部任务，尽力发送 `bridge.closing/client-update`，以 `4006` 关闭且丢弃描述。
- [x] `bridge.closing` 和 `4006` 在 Mod 端合并为一次升级事件，旧 socket 关闭 1 秒后只重新拉起一个带新 `pairing_token` 的页面；新页 ready 稳定 30 秒前不重复自动拉起。
- [x] 普通生命周期清理允许同 document 的 Strict Mode 重启；终止事件丢弃描述且不静默恢复。
- [x] 离线替换、普通标签页和无效 fragment 不启动桥接；离线替换仍清除 fragment。

### Task 5：实现可取消推荐任务

- [x] 严格校验每条消息和 32 KiB 上限。
- [x] 握手协商有界 `max_in_flight`，允许多个请求并发；只有超出协商上限才返回 `busy`。
- [x] 用 Map 为每个 `request_id` 创建独立任务记录、generation 和 AbortController，有界保留近期完成 ID。
- [x] 所有桥接请求复用同一个公平轮转 scheduler，使用包含连接 generation 和 `request_id` 的 task key，并将各自 `signal` 传给 `suggestMeals`。
- [x] 每个请求开始前重新读取完整账号 Store 门禁；失效时不启动任务，统一 Abort 并以 `4000` 关闭，不额外逐请求调用 `/me`。
- [x] 取消完成返回 `recommendation.cancelled`。
- [x] 取消只影响指定 `request_id`；断线、替换和登录失效会 Abort Map 中全部任务，晚到 Promise 不发送结果或错误。
- [x] 取消或失败的半成品不写共享缓存。

### Task 6：多标签页和多实例验收

- [ ] 普通标签页不连接。
- [ ] 启动标签页连接且不向其他标签页广播描述。
- [ ] 复制已清除 fragment 的启动标签页不会连接，focus、`visibilitychange`、普通 `pageshow` 和 Service Worker `clients.claim()` 不会创建新连接或转移所有权。
- [ ] 其他标签页的普通 Store 广播不改变连接或在途推荐快照；账号广播只在刷新后的门禁状态真正变化时连接或断开。
- [ ] 同一实例的新连接认证成功后替换旧连接。
- [ ] 未认证的新连接不能替换旧连接。
- [ ] 同一启动重连复用原 token；同实例新启动只保留最新待认证 token，新连接认证成功后才撤销旧连接 token。
- [ ] 不同实例可以同时工作且请求、取消和缓存生命周期互不串线。
- [ ] 在其他标签页退出、注销全部会话或触发账号失效时全部连接停止。
- [ ] 其他标签页广播更高应用版本导致启动标签页刷新时，Mod 先收到 `bridge.closing/client-update` 或 `4006`，任务和 socket 终止，刷新后不自动恢复，由 Mod 重新拉起；同时验证未及发送通知时的异常断线兜底。
- [ ] 在 `waiting-login` 和 socket open 前触发版本升级，确认页面不持久化描述、不虚构关闭通知，Mod 端仍可取消并手动重新拉起。
- [ ] 关闭启动标签页后无静默领导权转移。

### Task 7：真实浏览器、安全和性能验收

- [x] 在本文档同目录编写并长期保留一个可运行的 Mod 本地服务端参考实现，使用 `ws://localhost:<port>` 与本地 HTTP 页面完成真实 WebSocket 端到端联调。联调前临时、不提交地把网页 endpoint 校验改为只接受 `ws://localhost:<port>`，联调完成后立即还原；最终生产代码和 diff 中不得存在 `NODE_ENV`、本地 WS 白名单或任何降级开关。参考实现既要展示 localhost 监听、Origin 校验、配对握手、同实例连接替换、并发上限、心跳、`bridge.closing`/`4006` 去重重拉起和断线清理，也要内置至少四个可直接执行的业务套餐推荐案例，分别覆盖完整套餐、固定料理、固定酒水、固定料理和酒水四种模式，并横跨不同顾客或点单条件。每个案例完整展示 `recommendation.request` 构造、`request_id` 关联、返回套餐列表解析、首选与候选结果读取，另提供取消及业务错误响应案例。实现语言和工具链不是 Mod 的接入前提；C# 及其他语言的 Mod 可依据相同状态机、消息流程和业务案例移植。
- [x] 还原临时 WS 联调补丁后，再次验证正式 endpoint parser 只接受 WSS 并拒绝全部 WS。本阶段不配置受信任证书；真实 WSS、TLS 和公网 HTTPS 到 loopback 的 LNA 联调留到首个外部 Mod 集成前完成，当前验收报告必须明确列为未验证。
- [ ] 首个外部 Mod 集成前，在支持 LNA 的 Chromium 中用真实 HTTPS + WSS 验证 `prompt`、`granted`、`denied` 和旧权限别名路径；浏览器拒绝后不循环重连。该项不属于本阶段免证书 WS 功能验收。
- [ ] 首个外部 Mod 集成前，验证 IPv4/IPv6 loopback、错误证书、错误 Origin 和非本地监听配置。本阶段参考 WS 服务端仍需验证 localhost 监听和 Origin，但不声称已覆盖 TLS 失败路径。
- [x] V1 不得在上述真实 HTTPS + WSS、TLS、Origin、IPv4/IPv6 loopback 和 LNA 验收完成前从“设计中”更新为“已上线”，本地 WS 联调不能替代对外发布门槛。
- [ ] 验证未登录、登录后连接、强制修改密码、会话过期、账号禁用和删除。
- [ ] 验证登录失败后重试、注册、用户名密码登录、WebAuthn 注册和 WebAuthn 登录。
- [ ] 验证有 SSO 上下文时同源整页跳转续接，跳往第三方客户端时不泄露 fragment。
- [ ] 验证快速请求/取消、多请求并发和乱序返回、超出 `max_in_flight`、断线重连、旧 Promise 晚到和连接替换。
- [x] 验证连接建立后、请求到达前登录门禁失效时，请求不启动且全部在途任务以 `4000` 路径终止。
- [ ] 验证最近请求 ID 窗口、连续无效消息计数重置、超限消息立即关闭和 UTF-8 多字节消息大小边界。
- [x] 验证四种模式及全部评级上限。
- [ ] 在动画、滚动、Tab 切换和其他弹窗期间运行重请求，页面保持响应。
- [x] Performance 中没有被单次推荐包住的明显主线程长任务。
- [ ] React Profiler 确认心跳和计算进度不触发页面或顾客列表重渲染。
- [x] Network 中桥接新增流量只有本地 WS/WSS；页面原有的静态资源、账号、站点状态和可选分析请求可以保留，但不得新增推荐服务端请求或转发。
- [ ] 在已激活 Service Worker 的生产页面验证建立连接、Service Worker 更新/激活、多标签页版本刷新和断网恢复，确认 Service Worker 不接管 socket 且启动描述不进入 Cache Storage。
- [ ] 在后台、失去焦点、最小化和浏览器丢弃标签页场景验证心跳和断线处理；页面可用时不因可见性变化主动断开，原页面未恢复连接时由 Mod 在下一次需要推荐时重新拉起。
- [ ] 部署方 CSP 允许 endpoint 时正常连接，`connect-src` 拒绝时只产生稳定连接失败且不泄露 endpoint。
- [ ] 成功路径的控制台没有新增错误或未解释警告；错误证书、CSP/LNA 拒绝等负向场景产生的浏览器网络错误逐项记录为预期现象，且没有未捕获异常、未处理 Promise rejection 或敏感信息日志。

### Task 8：静态和构建验收

- [x] 运行 `pnpm lint`，区分既有 `onClick` 弃用警告和新增问题。
- [x] 运行 `pnpm exec tsc --noEmit`。
- [x] 运行 `pnpm exec prettier --check` 检查全部修改文件和本文档。
- [x] 运行 `git diff --check`。
- [x] 用开发数据库运行自托管 `pnpm build`。
- [x] 运行 `pnpm build:offline`，确认离线替换不启动桥接。
- [x] 删除临时验证目录和浏览器产物。
- [x] 更新本文档顶部状态和首个兼容 Mod 版本。
- [x] 确认规范部分没有“草案”、待定值或未冻结语义，并用当前网页重放长期保留的全部 V1 fixture。

## 十五、验证矩阵

| 场景                   | 断言                                                   |
| ---------------------- | ------------------------------------------------------ |
| 无启动 fragment        | 不创建 WebSocket。                                     |
| fragment 无效          | 清除 fragment，不连接、不持久化。                      |
| 正式 parser 收到 WS    | 拒绝启动描述，不包含环境分支或降级开关。               |
| 临时 WS 联调补丁       | 只用于 localhost 验收，完成后还原且不提交。            |
| 离线包收到 fragment    | 清除并丢弃，不连接且不保留配对信息。                   |
| 有效 fragment、未登录  | 等待登录，不连接、不自动打开 UI。                      |
| 登录或注册失败         | 保留内存描述，允许继续尝试。                           |
| 用户名密码登录或注册   | 成功后当前启动标签页连接且只连接一次。                 |
| WebAuthn 登录或注册    | 成功后当前启动标签页连接且只连接一次。                 |
| 强制修改密码           | 修改期间不连接，完成后自动连接。                       |
| 同源账号整页跳转       | 用 fragment 续接，新页面读取后立即清除。               |
| 第三方 SSO redirect    | 不附带 endpoint、实例标识或配对密钥。                  |
| 普通已登录标签页       | 不连接。                                               |
| 复制启动标签页         | 新标签页没有 fragment，不连接。                        |
| 普通 Store 跨标签变化  | 不影响 socket 或在途请求快照。                         |
| Service Worker 激活    | 不新建、接管、保活或恢复 socket。                      |
| 其他标签页退出         | 启动标签页 Abort 并断开。                              |
| 跨标签应用版本升级     | 关闭信号按事件去重，延迟 1 秒且最多自动拉起一次。      |
| 建连前发生版本升级     | 无反向通知；描述丢弃，Mod 保持可取消等待并允许重拉起。 |
| 同实例第二条已认证连接 | 新连接生效，旧连接停止且不重连。                       |
| 同实例第二条未认证连接 | 旧连接保持。                                           |
| 同一启动发生短暂重连   | 继续使用该启动的原 token，不生成新启动身份。           |
| 同实例重新拉起页面     | 使用新 token；认证成功后才撤销旧连接 token。           |
| 两个不同实例           | 各自独立请求和取消。                                   |
| 协商上限内的并发请求   | 公平分片，按 `request_id` 独立返回和取消。             |
| 超出 `max_in_flight`   | 返回 `busy`，不取消已在途任务。                        |
| 请求前登录门禁已失效   | 不启动新任务，Abort 全部任务并以 `4000` 关闭。         |
| 最近请求 ID 重复       | 返回 `duplicate-request-id`，不重复执行。              |
| 超过 32 KiB 的消息     | 不解析内容，立即以 `4005` 关闭。                       |
| 握手阶段非法消息       | 不累计三次，立即以 `4005` 关闭。                       |
| 单个连接级协议错误     | 返回一次 `bridge.error`，连接保持。                    |
| 连续三个协议错误       | 以 `4005` 关闭；中间合法消息会清零计数。               |
| 协议错误之间收到心跳   | 合法 `bridge.ping` 清零计数，不误判为连续错误。        |
| 业务参数错误或繁忙     | 返回请求级错误，不增加协议错误计数。                   |
| 取消与结果同时到达终态 | 只发送一个终态消息，晚到路径不再发送。                 |
| 四种推荐模式           | 结果与直接 `suggestMeals` 完全一致。                   |
| 评级上限 `0～4`        | 结果不超过上限，且是上限内最高可达评级。               |
| 请求取消               | 停止计算，不发送晚到结果，不写半成品缓存。             |
| 可恢复异常中断         | Abort 在途任务，按有限退避重连。                       |
| offline 后恢复 online  | 离线期间暂停，恢复后只有一个连接尝试。                 |
| 旧 socket 事件晚到     | generation 拦截，不影响当前连接。                      |
| 连接被替换             | Abort 在途任务，关闭且不重连。                         |
| LNA 权限待确认         | 由浏览器显示权限提示，不提前触发握手超时。             |
| LNA 权限被拒绝         | 不连接、不循环重连、不新增项目 UI。                    |
| 标签页后台或最小化     | 不主动断开，继续处理浏览器实际调度的心跳。             |
| 浏览器冻结或丢弃页面   | 先允许原页有限重连；未恢复时按需重新拉起。             |
| 刷新或 BFCache         | Abort 并丢弃描述，普通关闭不自动重拉起。               |
| endpoint 域名变化      | 只要 URL、DNS、TLS 和 Origin 均合法即可连接。          |
| 静态导出或离线包       | 不连接，因为账号能力不可用。                           |
| 旧 V1 Mod 连接新网页   | 始终走 V1 validator、adapter 和 serializer。           |
| 网页同时支持 V1/V2     | 按启动版本分派，V1 不被静默升级或最新 schema 解释。    |

## 十六、进度记录

| 日期       | 状态   | 记录                                                                                         |
| ---------- | ------ | -------------------------------------------------------------------------------------------- |
| 2026-07-15 | 已完成 | 精确异步推荐算法以提交 `273a2e89` 落地，可作为浏览器本地推荐核心。                           |
| 2026-07-15 | 已确认 | 放弃夜雀助手服务端 HTTP/WSS 推荐接口，改为网页直连 Mod 本地 WSS。                            |
| 2026-07-15 | 已确认 | Mod 拉起网页并通过 fragment 提供动态 endpoint、实例标识和配对密钥。                          |
| 2026-07-15 | 已确认 | 使用桥接需要登录，但首版不向 Mod 提供可验证的账号凭证。                                      |
| 2026-07-15 | 已确认 | 不修改 UI；普通标签页不连接，启动标签页独占，同实例新连接替换旧连接。                        |
| 2026-07-15 | 已确认 | 未登录启动页在注册、登录或强制改密完成后自动连接。                                           |
| 2026-07-15 | 已确认 | 同源账号整页跳转通过 fragment 续接，第三方 SSO redirect 不携带描述。                         |
| 2026-07-15 | 已完成 | 完成异步入参快照、领域类型下沉和 host-task 调度三项内核优化。                                |
| 2026-07-15 | 已通过 | 四种模式乘全部评级上限共 20 组频繁/稀疏时间片结果逐项一致。                                  |
| 2026-07-15 | 已通过 | Abort 后未写缓存；公平轮转顺序、浏览器 MessageChannel 路径均通过。                           |
| 2026-07-15 | 已通过 | 受控浏览器计算无长任务，301 帧最大间隔 17.75 ms，控制台无错误警告。                          |
| 2026-07-15 | 已审计 | 桥接改为全局 feature-client 生命周期，不再计划非可视 React 组件。                            |
| 2026-07-15 | 已审计 | fragment 必须在 Analytics 前清除，离线模式清除后直接丢弃。                                   |
| 2026-07-15 | 已审计 | 后续实现纳入 Chromium LNA 权限、pagehide、BFCache 和 CSP 验证。                              |
| 2026-07-15 | 已审计 | Service Worker 不管理 socket；Store 同步不传递描述或请求。                                   |
| 2026-07-15 | 已确认 | 本地处理不设每分钟限流，支持协商上限内的多请求公平并发。                                     |
| 2026-07-15 | 已确认 | 已连接时升级用 `client-update`/`4006` 去重通知，由 Mod 只重拉起一次。                        |
| 2026-07-15 | 已确认 | 建连前升级没有反向通道，不持久化描述，由 Mod 保持可取消等待。                                |
| 2026-07-15 | 已审计 | 错误分为请求级、连接级和 fatal close；自定义 code 连续为 `4000～4006`。                      |
| 2026-07-15 | 已确认 | V1 使用游戏简体中文标准名称和标签，不复制外部游戏数据目录。                                  |
| 2026-07-15 | 已确认 | V1 发布后永久兼容；破坏性变更通过并行新版本，不静默升级旧请求。                              |
| 2026-07-15 | 已审计 | token 改为单次页面启动所属，新连接认证后才撤销旧连接 token。                                 |
| 2026-07-15 | 已审计 | 所有合法输入均清零连续协议错误；错误 details 只用于诊断。                                    |
| 2026-07-15 | 已完成 | V1 validator、adapter、serializer、fragment parser 和无 UI 客户端已实现。                    |
| 2026-07-15 | 已通过 | 严格 fragment fixture 覆盖重复键、显式端口、凭证、query、fragment、版本和 WS 拒绝。          |
| 2026-07-15 | 已通过 | 本地 WS 临时补丁下，未登录不连接；注册后自动连接，退出后立即关闭。                           |
| 2026-07-15 | 已通过 | 参考 Mod 完成四种模式并发、乱序结果、取消和业务错误；网页未发出推荐 HTTP 请求。              |
| 2026-07-15 | 已通过 | 参考 Mod 使用 .NET 自带 WebSocket 能力编译，结果为 0 警告、0 错误。                          |
| 2026-07-15 | 已修复 | 启动清理由 feature-client 前移到 instrumentation-client，避免 Next hydration 恢复 fragment。 |
| 2026-07-15 | 已修复 | 参考 Mod 首次心跳不再误计丢失，单独收到 `4006` 时也进入去重升级重拉起路径。                  |
| 2026-07-15 | 已通过 | 真实 Store 门禁临时验证覆盖未登录等待、单次建连、强制改密、pagehide、ping 重置与版本关闭。   |
| 2026-07-15 | 未验证 | 真实 HTTPS + WSS、受信任 TLS、IPv4/IPv6、LNA 与 CSP 发布门槛尚未完成。                       |

## 十七、完成前复审

- 文档不再宣传夜雀助手服务端推荐 API 或固定 Mod 域名。
- 普通标签页、静态导出和离线包不会创建桥接连接。
- Service Worker、Store 同步、账号广播和跨标签锁不持有、代理、恢复或转移桥接连接。
- 账号广播只经现有账号客户端刷新 Store 门禁；桥接不直接订阅广播或保存账号副本。
- 普通 Store 跨标签变化不能改变由请求消息生成的 `ISuggestParams` 快照。
- 跨标签应用版本升级只能触发 `client-update` 关闭，不能赋予其他标签页连接资格。
- 在线和离线入口都在 React effect、Analytics 和账号初始化前清除桥接 fragment，并保留现有 `history.state`。
- 登录只是网页门禁，不被描述成 Mod 可验证的授权证明。
- 启动描述只在当前标签页内存中存在，读取后立即清除。
- 未登录、注册/登录成功、强制改密和账号刷新使用同一完整状态快照门禁。
- 登录字段逐项写入和 React Strict Mode 不会制造提前或重复连接。
- 账号连接器由全局 feature-client 幂等启停，不创建非可视 React 组件或并行生命周期。
- 同源整页跳转可以续接，外部 redirect 和已有 fragment 的 URL 不泄露或覆盖数据。
- 动态 endpoint 不绕过 WSS、端口、长度和凭证校验。
- 显式 `:443` 使用原始 authority 校验，不能因标准 URL 归一化被误判为缺少端口。
- Mod 明确承担 loopback DNS、监听地址、TLS 和 Origin 校验责任。
- 同实例连接替换由 Mod 在新连接认证后执行。
- `instance_id` 属于 Mod 进程，`pairing_token` 属于单次页面启动；同一启动重连复用原 token，新启动认证成功后才撤销旧 token。
- Chromium LNA 权限等待不计入握手超时，明确拒绝权限后不循环重连。
- `pagehide`、刷新和 BFCache 统一 Abort、断开并丢弃描述；普通关闭只按需重拉起，只有明确升级信号自动一次。
- Abort 与 generation 同时阻止过期结果发送和半成品缓存写入。
- 多个在途 `request_id` 各自持有任务记录和 AbortController，公平分片，取消不串扰，超出协商上限才返回 `busy`。
- 请求级错误、连接级错误和 fatal close 不混用；无法安全取得 ID 时不发送 `recommendation.error`。
- 所有合法且当前状态允许的输入都清零连续协议错误；`details` 不承担 Mod 业务分支语义。
- 自定义 close code 从 `4000` 连续到 `4006`，标准 code、自动重连和 Mod 重拉起语义互不混淆。
- 已连接升级的消息与 close code 在 Mod 端只触发一次重拉起；建连前升级明确承认无法反向通知。
- 请求校验完整覆盖四种模式、名称、评级上限、固定项和 `availability` 白名单减黑名单语义。
- 游戏简体中文标准名称和标签直接作为永久 V1 token，不创建第二份外部游戏数据目录，也不允许已公开 token 改名、复用或改变含义。
- V1 validator、adapter、serializer 和 error mapper 独立保留；未来 V2 与其并行，不能用最新 schema 解释或静默升级 V1。
- `suggestMeals` 和 `evaluateMeal` 仍是唯一生产推荐与评级实现。
- `suggestMeals` 的缓存键和计算使用同一份不可变调用快照，不读取调用方后续修改。
- 默认与公平调度器只通过统一 host-task 队列让出，Abort ticket 会被清理且公平轮转不饥饿。
- 领域评级和推荐工具从共享 types 获取 `ICustomerOrder`，不反向依赖页面 Store。
- 没有 UI、Store、持久化、账号 schema、数据库、API route、依赖或环境变量变更。
- 正式 endpoint parser 只允许 WSS；本地 WS 联调只使用验收期间的临时未提交补丁，最终 diff 不留下环境分支或降级开关。
- V1 对外发布前已经完成真实 HTTPS + WSS、TLS、Origin、IPv4/IPv6 loopback 和 LNA 验收，且规范部分不存在“草案”或待定值。
- 心跳、重连和计算过程不触发无关 React 重渲染。
- 对外示例、close code、协议版本和实际实现一致。
