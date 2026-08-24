# V1 本地 Mod 参考实现

此目录保存桥接协议 V1 的参考服务端、可执行案例和回归 fixture，不是夜雀助手的生产依赖。项目以 `.NET 6.0` 为运行时兼容下限，方便移植到使用该运行时的 BepInEx Mod；C# 语言版本不作额外限制。

参考程序使用 ASP.NET Core WebSocket，只监听 `localhost:38421`，默认要求 Origin 精确等于 `http://localhost:3000`。它提供的是本地 `ws://` 联调入口，不能直接连接正式网页。夜雀助手的生产代码只接受带显式端口的 `wss://` 地址。

## 运行参考程序

项目显式使用当前 SDK 支持的最新稳定 C# 语言版本，但只调用 `net6.0` 可用的运行时 API。构建需要能够定位 `net6.0` targeting pack 的 .NET SDK；直接运行还需要 ASP.NET Core 6.0 共享运行时，或者先发布为自包含程序。

VS Code 或 Visual Studio 可直接打开 [RecommendationBridgeReference.sln](RecommendationBridgeReference.sln)。命令行构建：

```bash
dotnet build RecommendationBridgeReference.sln --configuration Release
```

```bash
BRIDGE_ALLOWED_ORIGIN=http://localhost:3000 \
BRIDGE_PAGE_URL=http://localhost:3000 \
dotnet run --project RecommendationBridgeReference.csproj
```

程序启动时生成一个进程级 `instance_id` 和一次页面启动级 `pairing_token`，然后通过系统默认浏览器打开带 `#game-bridge=` fragment 的页面。按 Enter 会沿用当前 `instance_id`、生成新 token 并再次打开页面；输入 `q` 退出。

新连接只有在 `bridge.hello` 认证成功后才会接替旧连接。旧连接随后收到 `bridge.replaced`，并以 `4001` 关闭。token 不写入控制台。

## 可执行案例和 fixture

[cases.v1.json](cases.v1.json) 包含四种推荐模式：

- 完整套餐：`low_price`
- 固定料理：`high_price`
- 固定酒水：`material_cost_first`
- 固定料理和酒水：`availability_first`

连接 ready 后，参考程序会发送这四个显式排序案例，并额外发送一个省略 `recommendation_strategy` 的完整套餐案例，覆盖缺省为 `material_cost_first` 的语义。这五个 case 按握手协商的 `max_in_flight` 分批；前一批全部返回 `recommendation.result` 后才发送下一批，任何意外 `recommendation.error` 都会使案例序列失败，不会被当作成功推荐。随后程序再演示 `max_rating` 的全部五档取值、取消请求和可修正的业务错误。响应按 `request_id` 关联；`meals[0]` 是首选，其余项目是候选。

`options.recommendation_strategy` 只改变已经符合硬约束的推荐结果最终顺序，不改变请求模式、评级、候选资格或响应结构。可用值为 `availability_first`、`low_price`、`high_price`、`material_cost_first`，省略时为 `material_cost_first`。开发阶段使用过的 `balanced`、`save_ingredients` 以及旧字段 `sort_profile` 都不受支持。

固定 Food 直接发送安全整数 `recipe_id`，其所属 Food 由该 Recipe ID 的唯一 owner 确定。每个结果也必须返回算法实际采用的 `recipe_id`；Mod 比较套餐身份时必须包含 Recipe ID、Beverage ID 和按无序集合规范化的额外 Ingredient ID。

案例通过 `options.availability` 的 `beverages/foods/ingredients` 约束对应分类 ID。每类可以提供 `include` 白名单与 `exclude` 黑名单，最终范围为 `include（省略时为当前 SpecialGuest 可用全集）− exclude`。同一 ID 同时出现时以黑名单为准。`foods` 按整份 Food 生效，Recipe 仍由 `recipe_id` 选择；固定 Food 的基础 Ingredient 不受 Ingredient 范围限制，固定和算法新增的额外 Ingredient 仍必须在最终范围内。

[fixtures.v1.json](fixtures.v1.json) 固定 V1 的合法和非法边界，包括字段省略、空集合、白名单减黑名单、重复 ID、未知或不可用 ID、和名称字段拒绝，以及固定项与可用范围冲突。fixture 不由参考程序发送。

## BepInEx 移植说明

目标运行时可以是 `.NET 6.0`，但 BepInEx 宿主通常不自带 ASP.NET Core 共享框架，因此不能假定此项目可直接作为插件加载。移植时应保留协议、状态机和安全边界，并换成 Mod 环境中实际可用的 WebSocket/TLS 服务实现。

需要保留的行为：

- 只绑定 IPv4/IPv6 loopback，不监听 `0.0.0.0`、局域网地址或公网地址。
- Origin 使用完整字符串精确匹配，不接受通配符或后缀匹配。
- `instance_id` 属于 Mod 进程；每次打开页面生成新的 `pairing_token`。
- 只有新连接认证成功后才替换旧连接，未认证连接不能影响当前连接。
- 限制握手时间、消息字节数和并发请求数；实现心跳、取消和断线清理。
- Mod 输入严格按 V1 解析；网页输出可递归忽略未知可选字段，但已知字段缺失或类型错误时以 `4005` 关闭。
- 请求只使用正确分类的 SpecialGuest、Tag、Beverage、Food、Recipe、Ingredient 和 Cooker ID，不接受名称 alias；`options.recommendation_strategy` 只接受四个规定的 snake_case 值并可省略，旧 `sort_profile` 按未知键拒绝；每个套餐结果都携带 `beverage_id` 和嵌套 `food.recipe_id/extra_ingredient_ids`，不增加 cooker 或 `food_id`。
- `pairing_token`、完整请求和结果不能写日志。

正式集成还需要浏览器信任的 TLS 证书和本地 WSS 域名，并完成主方案中的 HTTPS/WSS、LNA、IPv4/IPv6、Origin 和 CSP 验收。本目录的 localhost WS 联调不能替代这些发布门槛。

## 语言无关状态机

```text
Mod process starts
  -> create instance_id once
  -> create latest_pending pairing_token for each page launch
  -> open #game-bridge=<base64url-json>

HTTP Upgrade
  -> require exact configured Origin
  -> accept socket as unauthenticated
  -> require bridge.hello within 5 seconds
  -> validate client identity and negotiate max_in_flight
  -> constant-time compare the latest pending pairing token
  -> atomically promote this socket and token
  -> only now send bridge.replaced and close the previous connection
  -> send bridge.ready

Ready connection
  -> send bridge.ping periodically and correlate pong by timestamp
  -> send recommendation.request up to max_in_flight
  -> correlate result, error and cancelled by request_id
  -> never replay unfinished requests after reconnect

client-update
  -> merge bridge.closing and close 4006 into one upgrade event
  -> wait for close plus 1 second
  -> relaunch once with the same instance_id and a new pairing_token
  -> clear the relaunch marker after the new connection is stable for 30 seconds
```
