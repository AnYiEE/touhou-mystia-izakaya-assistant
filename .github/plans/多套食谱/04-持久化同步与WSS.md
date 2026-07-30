# 持久化、同步与 WSS

## 一、持久套餐契约

普通顾客、稀有顾客、营业预设和推荐缓存统一使用：

```ts
interface IMealRecipe {
	name: TRecipeName;
	recipeId: number;
	extraIngredients: TIngredientName[];
}
```

`recipeId` 是必填字段。基础食材、厨具与烹饪时间不冗余写入套餐；读取时通过料理名称和 `recipeId` 解析。这样游戏数据修订某套食谱时，保存套餐会采用同一稳定 ID 下的新权威制作属性。

以下边界必须验证名称与 ID 成对匹配：

- 本地持久化迁移后的数据。
- 账号同步上传、下载、冲突快照和备份导入。
- 推荐持久缓存。
- WSS V1 入站固定料理。
- 营业预设和推荐结果缓存。

运行时未知 ID、料理与 ID 不匹配或食谱制作属性非法时，不得回退到默认食谱。

## 二、本地持久化和跨标签页

### 版本

当前基线：

- 普客 `CUSTOMER_NORMAL_STORE_VERSION.availabilityDlcFilter = 17`。
- 稀客 `CUSTOMER_RARE_STORE_VERSION.availabilityDlcFilter = 25`。

实施时分别新增命名清晰的 `mealRecipeId` 迁移节点：

- 普客持久化版本提升到 `18`。
- 稀客持久化版本提升到 `26`。

对应 store/persistence store 的 `version` 改为引用新的 `mealRecipeId` 节点，不能继续停留在 `availabilityDlcFilter`。

迁移器遍历 `persistence.meals`，为每个旧 `meal.recipe` 根据料理名称把 `recipes[0].id` 写入引用字段 `recipeId`。迁移必须保留：

- 顾客 key、套餐顺序和重复套餐。
- 酒水、价格、评分等料理外字段。
- `extraIngredients` 的顺序和重复项。
- 无关的表格、筛选、教程和营业预设状态。

只有版本迁移器可以补默认 ID。若旧数据中的料理名称已经无法解析，沿用当前损坏持久状态的防御策略，不凭猜测绑定其他料理。

当前套餐选择不是持久事实时不新增持久字段。`persistence.meals` 已由跨标签页中间件监听；新结构纳入该对象后应继续自动广播，不增加第二套广播状态。验证时必须让两个标签页同时保持可见。

### 相等和删除

套餐签名、相等判断、删除和重复计数纳入 `recipeId`。同料理、同额外食材但食谱 ID 不同的两项套餐可以并存；删除其中一项不能误删另一项。

## 三、账号同步

### Schema 版本

两个 meals namespace 同步升级：

| Namespace               | 当前版本 | 目标版本 | 最低可读版本 |
| ----------------------- | -------- | -------- | ------------ |
| `customer_normal.meals` | 1        | 2        | 1            |
| `customer_rare.meals`   | 1        | 2        | 1            |

V1 payload 没有 `recipeId`，V2 payload 必须包含。serializer 负责：

1. 读取 V1 时按料理名称把默认 `recipes[0].id` 写入 `recipeId`。
2. 读取 V2 时严格验证 `recipeId` 为安全整数且属于对应料理。
3. 规范化和序列化时复制 `recipeId`。
4. 为客户端默认值和空快照生成当前 V2 形状。
5. 保留不支持的未来 schema 原始数据，不降级写回。

具体 namespace serializer 位于：

- `app/features/account/sync/serializers/customerNormalMeals.ts`
- `app/features/account/sync/serializers/customerRareMeals.ts`

共享的套餐验证、规范化和合并能力继续位于 `app/features/account/sync/serializers/meals.ts`。不要让共享 `validateMealRecipe` 同时猜测 V1/V2；由 namespace serializer 根据 schema 版本选择明确的旧/新 validator，再统一迁移到当前形状。

`app/features/account/sync/validation.ts` 的服务端请求与备份校验要按 schema 版本区分精确 key：

- V1 recipe：`name`、`extraIngredients`。
- V2 recipe：`name`、`recipeId`、`extraIngredients`。

同步注册、容量核算、用户可见 namespace 标签和冲突展示一起复核。JSON 记录增加一个整数通常不要求数据库迁移，但容量检查必须基于新的序列化字节数。

### 合并

现有 meals 合并通过稳定 JSON 签名判断删除、重排和新增。V2 规范化后 `recipeId` 自然进入签名，因此：

- 不同食谱不再被视为同一套餐。
- V1 base、local 或 cloud 在参与合并前统一迁移为 V2。
- `requiresConfirmation` 语义保持不变；不能因为能够产出 `merged` 就跳过人工确认。
- 失败或过期的尝试继续保留手动处理所需证据。

必须覆盖 base、local、cloud 混合处于 V1/V2 的升级期，避免仅一端迁移后产生虚假删除或重复新增。

## 四、旧备份导入

旧版备份没有 `recipeId`，以下入口都要显式迁移：

- `app/features/legacyBackup/legacyPayload.ts`
- `app/features/account/sync/server/importLegacyBackup.ts`

导入器按料理名称把当前默认 `recipes[0].id` 绑定到套餐的 `recipeId`，然后生成当前 V2 同步数据。未知料理不映射到相近名称，不删除整份备份中的其他合法 namespace。

## 五、WSS V1 消息

### 版本决定

桥接尚未对外发布且没有使用方。多套食谱直接修订 `protocol_version: 1`，不新增 V2，也不保留缺少 `recipe_id` 的旧 V1 兼容分支。修订后的契约完成实现、fixture 和参考 Mod 验收后，才作为首个公开 V1 冻结。

### 固定料理请求

`recommendation.request.payload.selection.recipe` 改为：

```json
{ "name": "桃花羹", "recipe_id": 39, "extra_ingredients": ["蜂蜜"] }
```

规则：

- `recipe_id` 在 `recipe` 非空时必填，必须是 JSON 安全整数。
- `name` 和 `recipe_id` 必须解析到同一道料理下的同一套食谱。
- 槽位、基础食材可获取性、隐藏食材和彩蛋校验全部使用该食谱。
- 固定料理时，`options.cooker` 继续要求省略或为 `null`；厨具由所选食谱推导。未固定料理时，非空 `options.cooker` 过滤具体食谱候选。
- 基础食材、厨具和时间不从 Mod 传入，避免双重事实源。

四种现有请求模式保持不变：

| 模式 | 料理 | 酒水 | 食谱 ID    |
| ---- | ---- | ---- | ---------- |
| A    | 固定 | 固定 | 必填并校验 |
| B    | 自动 | 固定 | 由站点选择 |
| C    | 固定 | 自动 | 必填并校验 |
| D    | 自动 | 自动 | 由站点选择 |

### 推荐结果

`recommendation.result.meals[].recipe` 改为：

```json
{ "name": "桃花羹", "recipe_id": 39, "extra_ingredients": ["蜂蜜"] }
```

每个结果必须返回真实采用的 `recipe_id`。Mod 以料理名和食谱 ID 解析基础食材、厨具与烹饪时间；响应不重复发送这些派生字段。套餐去重身份包含 `recipe_id`，`extra_ingredients` 仍按现有无序语义处理。

### 边界与错误

需要新增或调整的拒绝用例：

- 缺少、非整数或不安全的 `recipe_id`。
- 未知 `recipe_id`。
- 已知料理和已知 ID 互不归属。
- 固定料理时仍提供非空 `options.cooker`。
- 具体食谱基础食材不可用、被隐藏或占满槽位。
- 严格对象 key 中出现旧字段名、重复制作属性或额外未知字段。

错误码集合不因多食谱新增值；继续使用 `invalid-request`，并用稳定的 `details.reason` 与 `details.path` 区分原因。不得记录请求原文、配对密钥或用户 payload。

### 实现触点

- `app/features/recommendations/client/bridge/v1/protocol.ts`
- `app/features/recommendations/client/bridge/v1/requestAdapter.ts`
- `app/features/recommendations/client/bridge/v1/responseSerializer.ts`
- `app/features/recommendations/client/cache/validation.ts`
- `.github/plans/猜您想要/recommendation-bridge-reference/fixtures.v1.json`
- `.github/plans/猜您想要/recommendation-bridge-reference/cases.v1.json`
- `.github/plans/猜您想要/recommendation-bridge-reference/Program.cs`
- `.github/plans/猜您想要/recommendation-bridge-reference/README.md`
- [稀客套餐推荐本地 WSS 桥接协议](../猜您想要/稀客套餐推荐本地WSS桥接协议.plan.md)

以仓库中的实际 fixture 与参考 Mod 路径为准；实施前再次用 `rg --files` 核对。参考实现的 JSON DTO、严格校验和套餐身份必须同步加入 `recipe_id`；实际游戏 Mod 再用该 ID 解析游戏侧食谱属性。

## 六、运行生命周期

本次不改变：

- 启动描述符仍只接受带显式端口的 WSS。
- descriptor 仍在 URL 规范化、hydration、分析和账号初始化前同步捕获并清除。
- 推荐 client 继续独立拥有连接 generation、调度、取消和重连。
- 离线替换继续丢弃 descriptor，不启动桥。
- 不新增站点 API、持久 bridge 状态或跨标签页桥接。

协议字段改变不应扩大连接生命周期或隐私边界。
