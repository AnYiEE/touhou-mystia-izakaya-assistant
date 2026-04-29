# Phase 2: 数据查询端点

_depends on Phase 1，与 Phase 1.5 可并行_

## 过滤语义约定

所有列表端点的查询参数均支持**逗号分隔多值**（`parseCommaSeparatedParam`），匹配语义分三种：

| 语义    | 说明                                   | 对应前端匹配方式                             |
| ------- | -------------------------------------- | -------------------------------------------- |
| **in**  | 条目的字段值在所选值列表中（OR）       | `selectedValues.includes(item.field)`        |
| **all** | 条目的字段数组必须包含所选值的**全部** | `checkArraySubsetOf(selected, item.field)`   |
| **any** | 条目的字段数组与所选值列表**有交集**   | `checkArrayContainsOf(selected, item.field)` |

带 `no` 前缀的参数为**排除过滤**——逻辑取反。所有参数之间为 **AND** 关系；省略的参数视为不过滤。

## 排序约定

所有列表端点支持 `sort` 查询参数，对齐 UI 层 `useSortedData` 的三态拼音排序：

| `sort` 值 | 说明             | 对应 UI 行为                               |
| --------- | ---------------- | ------------------------------------------ |
| 省略或空  | 保持原始数据顺序 | `pinyinSortStateMap.none`                  |
| `az`      | 按名称拼音升序   | `instance.getPinyinSortedData(data).get()` |
| `za`      | 按名称拼音降序   | 同上 + `.reverse()`                        |

## 标签字段排序约定

API 返回的标签数组字段应与 UI 层展示顺序对齐：

| 实体           | 标签字段       | 排序方式                              | 对齐的 UI 行为                                                                        |
| -------------- | -------------- | ------------------------------------- | ------------------------------------------------------------------------------------- |
| Recipe         | `positiveTags` | **pinyinSort**（拼音序）              | `customer-rare/recipeTabContent.tsx` L352：`copyArray(positiveTags).sort(pinyinSort)` |
| Recipe         | `negativeTags` | **pinyinSort**                        | 与 positiveTags 保持一致                                                              |
| Beverage       | `tags`         | 按 **`Beverage.sortedTags`** 规范顺序 | 酒精度→类型→口味→风格：`无酒精,低酒精,...,提神`                                       |
| Ingredient     | `tags`         | **pinyinSort**                        | 与 recipes 保持一致                                                                   |
| CustomerRare   | `positiveTags` | **pinyinSort**                        | `customer-rare/customerCard.tsx` L453：`.sort(pinyinSort)`                            |
| CustomerRare   | `negativeTags` | **pinyinSort**                        | 同上 L519                                                                             |
| CustomerNormal | `positiveTags` | **pinyinSort**                        | `customer-normal/customerCard.tsx` L337：`.sort(pinyinSort)`                          |

实现方式：在 Phase 1 的 `app/api/v1/utils.ts` 中新增 `sortTags(tags, type)` 辅助函数，按实体类型选择排序策略。趋势变换后同样对结果标签排序。

## 游戏状态参数约定

部分端点支持可选的**游戏状态参数**，影响标签变换或评级计算：

| 参数              | 类型      | 默认值  | 影响范围          | 说明                                                     |
| ----------------- | --------- | ------- | ----------------- | -------------------------------------------------------- |
| `popularTag`      | `string`  | —       | 标签变换 + 评级   | 当前流行标签名（如 `灼热`、`大份` 等）                   |
| `popularNegative` | `boolean` | `false` | 标签变换 + 评级   | 流行趋势是否为负向                                       |
| `isFamousShop`    | `boolean` | `false` | 标签变换 + 评级   | 是否为名店状态                                           |
| `hasMystiaCooker` | `boolean` | `false` | 仅评级（Phase 3） | 是否拥有夜雀厨具（仅影响 evaluateMeal 计算，不影响标签） |

**Phase 2 数据端点**支持前三个参数（`popularTag`、`popularNegative`、`isFamousShop`），用于标签变换：

- **Recipes**：`positiveTags` 经 `composeTagsWithPopularTrend()` + `calculateTagsWithTrend()` 重写。后续的 `positiveTag`/`noPositiveTag` 过滤作用在变换后的标签上。
- **Ingredients**：`tags` 经 `calculateTagsWithTrend()` 重写。后续的 `tag`/`noTag` 过滤作用在变换后的标签上。
- **其他端点**：不支持趋势变换（UI 层也不做变换）。

不提供这些参数时，返回原始标签数据——与 UI 在"无流行趋势"状态下的展示一致。

**Phase 3 评级端点**额外支持 `hasMystiaCooker`——该参数仅影响 `evaluateMeal` 的评分计算（去除"点单标签必须匹配"的限制），不改变标签数据本身。

## 步骤

### 2.1 食物类端点（parallel）

#### `/api/v1/recipes`

| 查询参数          | 数据属性        | 匹配语义 | 说明                                     |
| ----------------- | --------------- | -------- | ---------------------------------------- |
| `dlc`             | `dlc`           | in       | 值为数字，匹配时 `dlc.toString()`        |
| `level`           | `level`         | in       | 值为数字                                 |
| `cooker`          | `cooker`        | in       | 厨具名称                                 |
| `ingredient`      | `ingredients`   | all      | 条目的食材列表必须**全部包含**所选值     |
| `noIngredient`    | `ingredients`   | 排除 any | 条目的食材列表**不能包含**任一所选值     |
| `positiveTag`     | `positiveTags`  | all      | 条目的正特性必须**全部包含**所选值       |
| `noPositiveTag`   | `positiveTags`  | 排除 any | 条目的正特性**不能包含**任一所选值       |
| `negativeTag`     | `negativeTags`  | all      | 条目的反特性必须**全部包含**所选值       |
| `noNegativeTag`   | `negativeTags`  | 排除 any | 条目的反特性**不能包含**任一所选值       |
| `name`            | `name`/`pinyin` | 模糊搜索 | 名称/拼音包含匹配                        |
| `popularTag`      | —               | 变换     | 流行标签名，触发 `positiveTags` 趋势变换 |
| `popularNegative` | —               | 变换     | 流行趋势是否负向                         |
| `isFamousShop`    | —               | 变换     | 名店状态                                 |
| `sort`            | —               | 排序     | `az`/`za`，省略为原始顺序                |

数据源：`Recipe.getInstance().data`

数据管线（对齐 UI `recipes/page.tsx`）：`data` → 名称搜索 → **趋势变换**（重写 `positiveTags`）→ 过滤 → 排序 → 输出

详情端点：`/api/v1/recipes/[name]` (GET) — `Recipe.getInstance().getPropsByName()`

#### `/api/v1/beverages`

| 查询参数 | 数据属性        | 匹配语义 | 说明                             |
| -------- | --------------- | -------- | -------------------------------- |
| `dlc`    | `dlc`           | in       | 值为数字                         |
| `level`  | `level`         | in       | 值为数字                         |
| `tag`    | `tags`          | all      | 条目的标签必须**全部包含**所选值 |
| `noTag`  | `tags`          | 排除 any | 条目的标签**不能包含**任一所选值 |
| `name`   | `name`/`pinyin` | 模糊搜索 |                                  |
| `sort`   | —               | 排序     | `az`/`za`，省略为原始顺序        |

数据源：`Beverage.getInstance().data`

数据管线（对齐 UI `beverages/page.tsx`）：`data` → 名称搜索 → 过滤 → 排序 → 输出（无趋势变换）

详情端点：`/api/v1/beverages/[name]` (GET)

#### `/api/v1/ingredients`

| 查询参数          | 数据属性        | 匹配语义 | 说明                             |
| ----------------- | --------------- | -------- | -------------------------------- |
| `dlc`             | `dlc`           | in       | 值为数字                         |
| `level`           | `level`         | in       | 值为数字                         |
| `tag`             | `tags`          | all      | 条目的标签必须**全部包含**所选值 |
| `noTag`           | `tags`          | 排除 any | 条目的标签**不能包含**任一所选值 |
| `type`            | `type`          | in       | 食材类型（海鲜/肉类/蔬菜/其他）  |
| `noType`          | `type`          | 排除 in  | 条目类型**不能是**任一所选值     |
| `name`            | `name`/`pinyin` | 模糊搜索 |                                  |
| `popularTag`      | —               | 变换     | 流行标签名，触发 `tags` 趋势变换 |
| `popularNegative` | —               | 变换     | 流行趋势是否负向                 |
| `isFamousShop`    | —               | 变换     | 名店状态                         |
| `sort`            | —               | 排序     | `az`/`za`，省略为原始顺序        |

数据源：`Ingredient.getInstance().data`

数据管线（对齐 UI `ingredients/page.tsx`）：`data` → 名称搜索 → **趋势变换**（重写 `tags`）→ 过滤 → 排序 → 输出

详情端点：`/api/v1/ingredients/[name]` (GET)

### 2.2 客户端点（parallel with 2.1）

客户的过滤参数来自 `customer-rare/[[...paths]]/content.tsx` 和 `customer-normal/[[...paths]]/content.tsx` 的 `filterCustomerData`（两者逻辑相同）。

#### `/api/v1/customers/rare` 和 `/api/v1/customers/normal`

| 查询参数  | 数据属性        | 匹配语义 | 说明                                 |
| --------- | --------------- | -------- | ------------------------------------ |
| `dlc`     | `dlc`           | in       | 值为数字                             |
| `place`   | `places`        | any      | 条目的出没地点与所选值**有交集**     |
| `noPlace` | `places`        | 排除 any | 条目的出没地点**不能包含**任一所选值 |
| `name`    | `name`/`pinyin` | 模糊搜索 |                                      |
| `sort`    | —               | 排序     | `az`/`za`，省略为原始顺序            |

注意：前端的 `includes`（名称白名单）和 `excludes`（名称黑名单）是页面交互概念，API 不需要对应参数——`name` 模糊搜索已覆盖查找需求。

详情端点：

- `/api/v1/customers/rare/[name]` (GET)
- `/api/v1/customers/normal/[name]` (GET)

### 2.3 其他实体端点（parallel with 2.1）

#### `/api/v1/cookers`

| 查询参数     | 数据属性        | 匹配语义 | 说明                                          |
| ------------ | --------------- | -------- | --------------------------------------------- |
| `dlc`        | `dlc`           | in       | 值为数字                                      |
| `category`   | `category`      | in       | 系列名称                                      |
| `noCategory` | `category`      | 排除 in  | 条目系列**不能是**任一所选值                  |
| `type`       | `type`          | any      | `type` 可为数组，条目与所选值**有交集**即匹配 |
| `noType`     | `type`          | 排除 any | 条目类型与所选值**不能有交集**                |
| `name`       | `name`/`pinyin` | 模糊搜索 |                                               |
| `sort`       | —               | 排序     | `az`/`za`，省略为原始顺序                     |

数据源：`Cooker.getInstance().data`

详情端点：`/api/v1/cookers/[name]` (GET)

#### `/api/v1/clothes`、`/api/v1/ornaments`、`/api/v1/partners`、`/api/v1/currencies`

| 查询参数 | 数据属性        | 匹配语义 | 说明                      |
| -------- | --------------- | -------- | ------------------------- |
| `dlc`    | `dlc`           | in       | 值为数字                  |
| `name`   | `name`/`pinyin` | 模糊搜索 |                           |
| `sort`   | —               | 排序     | `az`/`za`，省略为原始顺序 |

数据源：各 `Clothes/Ornament/Partner/Currency.getInstance().data`

详情端点：

- `/api/v1/clothes/[name]` (GET)
- `/api/v1/ornaments/[name]` (GET)
- `/api/v1/partners/[name]` (GET)
- `/api/v1/currencies/[name]` (GET)

### 2.4 实现模式

**列表端点数据管线**（对齐 UI 层处理顺序，以 recipes 为例）：

```
route.ts：
1. 导入单例 → 获取 data
2. 解析查询参数（parseCommaSeparatedParam）
3. 名称搜索（name 参数 → getSearchResult 模糊匹配）
4. 趋势变换（仅 recipes/ingredients）：
   - 有 popularTag/popularNegative/isFamousShop 时
   - recipes: composeTagsWithPopularTrend + calculateTagsWithTrend → 重写 positiveTags
   - ingredients: calculateTagsWithTrend → 重写 tags
5. 过滤（AND 组合，作用在变换后的字段上）：
   - in 语义：selectedValues.includes(item.field.toString())
   - all 语义：checkArraySubsetOf(selectedValues, item.field)
   - any 语义：checkArrayContainsOf(selectedValues, item.field)
   - 排除：对应逻辑取反
   - 省略的参数 → 跳过该条件
6. 排序（sort 参数 → getPinyinSortedData）
7. createJsonResponse(result)
```

**详情端点**（以 recipes/[name] 为例）：

```
[name]/route.ts：
1. 导入单例
2. try { getPropsByName(name) } → createJsonResponse(item)
   catch → createErrorResponse(`${name} not found`, 404)
```

注意：`Item.findIndexByName()` 在找不到时抛出 `Error`（非返回 null），所有详情端点**必须** try-catch 处理。Phase 1 中的 `getByNameOrNotFound(instance, name)` 辅助函数统一封装此逻辑。

**列表过滤**：Phase 3.8 将提取通用过滤函数 `filterItems<T>()`。若 Phase 2 先于 3.8 实现，可先在各 route.ts 内联过滤逻辑，后续统一迁移至共享函数。

**关于 UI 层的"隐藏 DLC"**：前端 `useFilteredData` 会额外过滤 `globalStore.hiddenDlcs`，但这是用户个人偏好（持久化在 localStorage），API 不做自动隐藏——调用方通过 `dlc` 参数按需过滤。

**关于屏蔽项**：`Recipe.blockedRecipes`（暗物质）和 `Ingredient.blockedIngredients`/`blockedLevels` 在独立列表页中**不会**被过滤（仅在顾客页的料理/食材 Tab 中使用），API 同样返回完整数据。

## 新建文件（20 个路由文件）

```
app/api/v1/recipes/route.ts
app/api/v1/recipes/[name]/route.ts
app/api/v1/beverages/route.ts
app/api/v1/beverages/[name]/route.ts
app/api/v1/ingredients/route.ts
app/api/v1/ingredients/[name]/route.ts
app/api/v1/customers/normal/route.ts
app/api/v1/customers/normal/[name]/route.ts
app/api/v1/customers/rare/route.ts
app/api/v1/customers/rare/[name]/route.ts
app/api/v1/cookers/route.ts
app/api/v1/cookers/[name]/route.ts
app/api/v1/clothes/route.ts
app/api/v1/clothes/[name]/route.ts
app/api/v1/ornaments/route.ts
app/api/v1/ornaments/[name]/route.ts
app/api/v1/partners/route.ts
app/api/v1/partners/[name]/route.ts
app/api/v1/currencies/route.ts
app/api/v1/currencies/[name]/route.ts
```

## 复用的关键类与方法

- `Item`（基类）— `data`, `getPropsByName(name, ...props?)`, `getValuesByProp(prop, wrap?, data?)`
- `Recipe extends Food<TRecipe[]>` — 另有 `blockedRecipes`, `blockedTags`, `getBondRecipes`, `checkDarkMatter`, `composeTagsWithPopularTrend`, `calculateTagsWithTrend`, `getCustomerSuitability`, `getIngredientScoreChange`
- `Beverage extends Food<TBeverages>` — 另有 `sortedTags`, `getCustomerSuitability(name, customerTags)`
- `Ingredient extends Food<TIngredients>` — 另有 `sortedTypes`, `blockedLevels`/`blockedIngredients`/`blockedTags`, `getRelatedRecipes`, `calculateTagsWithTrend`
- `CustomerRare`, `CustomerNormal` — 各有 `evaluateMeal`, `check*EasterEgg`
- `Cooker` — 另有 `sortedCategories`, `getBondCooker`
- `Clothes`, `Ornament`, `Partner` — 各有 `getBond*`, `getTachiePath`（部分）
- `Currency` — 仅单例 + 数据

## 验证

- 每个列表端点返回正确数据和过滤结果
- 每个详情端点按名称返回单项
- 不存在的名称返回 404（`{ message: '...', status: 'error' }`）
- 无效或缺失的过滤参数不报错（视为不过滤）
- 过滤参数组合测试（多参数 AND 组合）
- 排除过滤测试（`noTag`、`noIngredient` 等）
- 模糊搜索测试（`name` 参数支持中文名和拼音）
- 排序测试：`sort=az` 返回拼音升序，`sort=za` 返回拼音降序
- 趋势变换测试（recipes/ingredients）：
    - 提供 `popularTag=灼热` 时 `positiveTags`/`tags` 包含 `流行厌恶`/`流行喜好`
    - 提供 `isFamousShop=true` 时含「招牌」标签的条目增加 `流行喜好`
    - 趋势变换后的过滤正确作用于变换后的标签字段
- 屏蔽项（暗物质等）在列表端点中**不被过滤**，完整返回
