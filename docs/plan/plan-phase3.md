# Phase 3: 业务逻辑提取 + evaluateMeal 重构 + 评级端点

_depends on Phase 1；步骤 3.10 depends on 3.2（适配度端点）+ 3.3（评级端点）；步骤 3.4 独立可选_

## 步骤

### 3.1 提取食材分数计算

新建 `app/utils/evaluators/ingredientScore.ts`，导出 `getFullIngredientScoreChange()` 函数。

当前问题：`app/(pages)/customer-rare/ingredientTabContent.tsx` L203-307 有 ~105 行分数计算逻辑嵌入组件，`customer-normal/ingredientTabContent.tsx` L210-240 有 ~30 行简化版本。

需提取的完整逻辑链（以 rare 为例）：

1. `calculateIngredientTagsWithTrend()` + `composeRecipeTagsWithPopularTrend()` 准备标签（L203-216）
2. 基础 `Recipe.getIngredientScoreChange(before, after, positiveTags, negativeTags)` 调用（L218-224）
3. 大份标签（`largePartition`）对正/负顾客标签的加减分（L226-240）
4. 流行趋势 × 大份标签交互的 `popularNegative`/`popularPositive` 加减分（L242-270）
5. 彩蛋检查 `checkIngredientEasterEgg()` → 可能产生 `±Infinity`（L275-299）
6. 暗物质食材覆盖 → `-Infinity`（L301-303）
7. `isDarkMatter` 状态覆盖 → `0`（L305-307）

函数签名：

```typescript
interface IFullIngredientScoreParams {
	ingredientTags: TIngredientTag[];
	currentRecipeTagsWithTrend: TRecipeTag[];
	customerPositiveTags: ReadonlyArray<TRecipeTag>;
	customerNegativeTags?: ReadonlyArray<TRecipeTag>; // rare 有，normal 无
	customerName: TCustomerRareName | TCustomerNormalName;
	currentIngredients: TIngredientName[]; // 当前菜谱已有食材
	currentRecipeName: TRecipeName;
	popularTrend: IPopularTrend;
	isFamousShop: boolean;
	isDarkMatter: boolean;
	isDarkIngredient: boolean;
	isLargePartitionTagNext: boolean; // 加入后食材数 ≥ 5
	shouldCalculateLargePartitionTag: boolean; // 流行标签为大份且 isLargePartitionTagNext
}

interface IFullIngredientScoreResult {
	scoreChange: number; // 可为 ±Infinity
	easterEggIngredient: TIngredientName | null;
}
```

注意：`isLargePartitionTagNext` 和 `shouldCalculateLargePartitionTag` 依赖当前菜谱食材数量，仍由组件计算后传入。函数通过参数区分普通/稀有客户（是否传入 `customerNegativeTags`）。

不放在 `Recipe` 类中：因为需要调用 `CustomerRare.checkIngredientEasterEgg()`，放入 Recipe 会产生 Recipe → CustomerRare 的循环依赖（`Ingredient` 已依赖 `Recipe`）。

### 3.2 提取料理适配度计算

新建 `app/utils/evaluators/suitability.ts`，导出 `getFullRecipeSuitability()` 函数。

当前问题：`app/(pages)/customer-rare/recipeTabContent.tsx` L167-229 有 ~60 行（`composeTagsWithPopularTrend()` + `calculateTagsWithTrend()` + `checkRecipeEasterEgg()` + `getCustomerSuitability()` 串联）嵌入组件。`customer-normal/recipeTabContent.tsx` L152-257 有类似但有差异的版本（使用 `checkEasterEgg` 而非 `checkRecipeEasterEgg`，不传 `customerNegativeTags`）。

函数签名：

```typescript
interface IFullRecipeSuitabilityParams {
	recipeName: TRecipeName;
	recipeIngredients: ReadonlyArray<TIngredientName>;
	recipePositiveTags: ReadonlyArray<TRecipeTag>;
	customerName: TCustomerRareName | TCustomerNormalName;
	customerPositiveTags: ReadonlyArray<TRecipeTag>;
	customerNegativeTags?: ReadonlyArray<TRecipeTag>; // rare 有，normal 无
	customerType: 'rare' | 'normal';
	popularTrend: IPopularTrend;
	isFamousShop: boolean;
}

interface IFullRecipeSuitabilityResult {
	matchedNegativeTags: TRecipeTag[];
	matchedPositiveTags: TRecipeTag[];
	suitability: number; // 可为 ±Infinity（彩蛋时）
	recipeTagsWithTrend: TRecipeTag[];
}
```

不放在 `Recipe` 类中的原因：需要调用 `CustomerRare.checkRecipeEasterEgg()` / `CustomerNormal.checkEasterEgg()`，放入 Recipe 会产生循环依赖。

提取后：组件 useMemo 只调用此函数。API 的适合度端点同样调用此函数。

### 3.3 提取完整套餐评估函数

新建 `app/utils/evaluators/meal.ts`，导出 `buildFullMealEvaluation()` 函数。

当前问题：`app/stores/customer-rare.ts` 的 `evaluateSavedMealResult`（L997-1072）和 `customer-normal.ts` 的 `evaluateSavedMealResult`（L857-893）各自包含 ~30 行数据查找与组装逻辑（查客户标签、查酒水/菜谱属性、计算暗物质、组合趋势标签等），这些逻辑是 API 评级端点和 store 都需要的。

稀有客户版签名：

```typescript
interface IBuildMealEvaluationRareParams {
	customerName: TCustomerRareName;
	customerOrder: ICustomerOrder; // { beverageTag, recipeTag }
	hasMystiaCooker: boolean;
	beverageName: TBeverageName;
	recipeName: TRecipeName;
	extraIngredients: TIngredientName[];
	popularTrend: IPopularTrend;
	isFamousShop: boolean;
}

interface IMealEvaluationResult {
	rating: TRatingKey | null;
	isDarkMatter: boolean;
	price: number;
}
```

内部流程（对齐现有 store 的 `evaluateSavedMealResult`）：

1. `CustomerRare.getPropsByName(customerName)` → `beverageTags`, `negativeTags`, `positiveTags`
2. `Beverage.getPropsByName(beverageName)` → `price`, `tags`
3. `Recipe.getPropsByName(recipeName)` → `ingredients`, `negativeTags`, `positiveTags`, `price`
4. `Recipe.checkDarkMatter({ extraIngredients, negativeTags })` → `isDarkMatter`, `extraTags`
5. `Recipe.composeTagsWithPopularTrend(ingredients, extraIngredients, positiveTags, extraTags, popularTrend)`
6. `Recipe.calculateTagsWithTrend(composedTags, popularTrend, isFamousShop)` → `recipeTagsWithTrend`
7. `CustomerRare.evaluateMeal({ ... 11 个参数 })` → `rating`
8. 计算 `price = beveragePrice + (isDarkMatter ? DARK_MATTER_META_MAP.price : recipePrice)`

普通客户版签名：

```typescript
interface IBuildMealEvaluationNormalParams {
	customerName: TCustomerNormalName;
	recipeName: TRecipeName;
	extraIngredients: TIngredientName[];
	popularTrend: IPopularTrend;
	isFamousShop: boolean;
}
```

注意：普通客户的 `evaluateMeal` **不接收酒水参数**（评级只看菜谱 + 额外食材 + 流行趋势 + 名店）。

内部流程：

1. `CustomerNormal.getPropsByName(customerName)` → `positiveTags`
2. `Recipe.getPropsByName(recipeName)` → 完整 `TRecipe` 对象
3. 遍历 `extraIngredients` → `Ingredient.getPropsByName(name, 'tags')` → 展平为 `extraTags`
4. `CustomerNormal.evaluateMeal({ ... 7 个参数 })` → `rating`

### 3.4 重构 evaluateMeal 双模式输入

修改文件：

- `app/utils/customer/customer_rare/evaluateMeal.ts`
- `app/utils/customer/customer_normal/evaluateMeal.ts`

使用 TypeScript discriminated union 支持两种调用模式：

**模式 1**（已解析标签，现有前端 store 继续使用）：传入已解析的标签字段（`IParameters` 不变）。

**模式 2**（名称输入，API / `buildFullMealEvaluation` 使用）：传入名称，函数内部通过单例类只读查找数据。

**稀有客户模式 2 参数**：

```typescript
interface INameBasedParameters {
	mode: 'name-based';
	customerName: TCustomerRareName;
	recipeName: TRecipeName;
	beverageName: TBeverageName;
	extraIngredients?: TIngredientName[];
	customerOrder: ICustomerOrder; // 必传 — 来自用户选择，非静态数据
	hasMystiaCooker?: boolean; // 默认 false
	popularTrend?: IPopularTrend; // 默认 { isNegative: false, tag: null }
	isFamousShop?: boolean; // 默认 false
}
```

内部解析链：查客户标签 → 查酒水标签 → 查菜谱属性 → `checkDarkMatter` → `composeTagsWithPopularTrend` → `calculateTagsWithTrend` → 调用现有模式 1 逻辑。

关键点：`isFamousShop` **不是** `evaluateMeal` 的直接计算参数——它在调用前通过 `calculateTagsWithTrend()` 消费，用于生成 `currentRecipeTagsWithTrend`。

**普通客户模式 2 参数**：

```typescript
interface INameBasedParameters {
	mode: 'name-based';
	customerName: TCustomerNormalName;
	recipeName: TRecipeName;
	extraIngredients?: TIngredientName[];
	popularTrend?: IPopularTrend;
	isFamousShop?: boolean;
}
```

注意：普通客户**没有** `beverageName`、`customerOrder`、`hasMystiaCooker` 参数。

### 3.5 组件瘦身 — customer-rare

| 文件                                                 | 变更                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| `app/(pages)/customer-rare/ingredientTabContent.tsx` | 替换 L203-307 ~105 行为 `getFullIngredientScoreChange()` 调用 |
| `app/(pages)/customer-rare/recipeTabContent.tsx`     | 替换 L167-229 ~60 行为 `getFullRecipeSuitability()` 调用      |
| `app/(pages)/customer-rare/savedMealCard.tsx`        | 适配 `buildFullMealEvaluation` 或保持调用 store 方法          |
| `app/(pages)/customer-rare/beverageTabContent.tsx`   | 统一适配度调用方式（现有已较简洁）                            |
| `app/(pages)/customer-rare/[[...paths]]/content.tsx` | L300-343 食材过滤逻辑提取为共享函数（与 normal 完全相同）     |

同时提取 customer-rare 组件中被 customer-normal 跨目录引用的共享类型到独立位置：

| 现有跨目录引用                                                               | 提取目标                               |
| ---------------------------------------------------------------------------- | -------------------------------------- |
| `customer-rare/recipeTabContent` → `TTableColumnKey`, `TTableSortDescriptor` | `app/(pages)/customer-shared/types.ts` |
| `customer-rare/beverageTabContent` → 同上列 key/sort 类型                    | 同上                                   |
| `customer-rare/ingredientTabContent` → `IIngredientTabContentProps`          | 同上                                   |
| `customer-rare/savedMealCard` → `MoveButton`                                 | 同上或共享组件                         |

### 3.6 组件瘦身 — customer-normal

| 文件                                                   | 变更                                                      |
| ------------------------------------------------------ | --------------------------------------------------------- |
| `app/(pages)/customer-normal/ingredientTabContent.tsx` | 替换 L210-240 分数计算为 `getFullIngredientScoreChange()` |
| `app/(pages)/customer-normal/recipeTabContent.tsx`     | 替换适配度计算为 `getFullRecipeSuitability()` 调用        |
| `app/(pages)/customer-normal/savedMealCard.tsx`        | 适配 `buildFullMealEvaluation` 或保持调用 store 方法      |
| `app/(pages)/customer-normal/beverageTabContent.tsx`   | 统一过滤/适配度调用                                       |
| `app/(pages)/customer-normal/[[...paths]]/content.tsx` | L300-343 食材过滤逻辑替换为与 rare 共享的函数             |

注意：customer-normal 的组件是**独立文件**，逻辑与 customer-rare 类似但有区别：

- `getIngredientScoreChange` 只传三参（无 `customerNegativeTags`）
- `checkEasterEgg`（非 `checkRecipeEasterEgg`）的参数接收完整 `TRecipe` 对象而非 `recipeName`
- `getRatingKey` 的评级区间不同（normal: `≤0→exbad, ≤2→norm, >2→good`；rare: `0→exbad, 1→bad, 2→norm, 3→good, 4→exgood`）

`getFullIngredientScoreChange()` 和 `getFullRecipeSuitability()` 通过参数/泛型区分普通/稀有客户。

### 3.7 提取 preferences 数据管理逻辑

从 `app/(pages)/preferences/dataManager.tsx` 中提取：

- `compatibilityCustomerRareData()`（L135-157）→ `app/actions/backup/compatibility.ts`
- `deleteIndexProperty()`（L159-167）→ 同上

这两个是备份数据格式迁移/兼容性函数，仅在导入备份时使用，应与备份业务保持关联。

API 路径已在 Phase 1.5 中更新。

### 3.8 提取数据页面过滤与标签计算

| 文件                               | 内容                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `app/(pages)/recipes/page.tsx`     | L62-79 `composeTagsWithPopularTrend` + `calculateTagsWithTrend`；L81-151 过滤 |
| `app/(pages)/ingredients/page.tsx` | L57-68 趋势标签计算；L70-109 过滤                                             |
| `app/(pages)/beverages/page.tsx`   | L51-75 多维过滤（DLC/等级/标签包含/排除）                                     |
| `app/(pages)/cookers/page.tsx`     | L52-85 过滤（DLC/类型/类别含排）                                              |
| `app/(pages)/clothes/page.tsx`     | L36-46 过滤（仅 DLC）                                                         |
| `app/(pages)/ornaments/page.tsx`   | L36-46 过滤（仅 DLC）                                                         |
| `app/(pages)/partners/page.tsx`    | L36-46 过滤（仅 DLC）                                                         |
| `app/(pages)/currencies/page.tsx`  | L36-46 过滤（仅 DLC）                                                         |

提取方式：

1. 创建通用过滤函数 `filterItems<T>(data, filterOptions)` 于 `app/utils/filters.ts`（或 `app/utils/evaluators/filters.ts`），支持 DLC、等级、标签包含/排除、类型包含/排除等组合条件
2. 同时供 Phase 2 的 API 列表端点复用

与现有 `app/hooks/useFilteredData.ts` 的关系：`useFilteredData` 已封装了全局 DLC 隐藏逻辑（`globalStore.hiddenDlcs`）和 SSR 跳过处理（`useSkipProcessItemData`），在 13 个组件中使用。本步骤提取的 `filterItems` 是 **`useFilteredData` 的 `filterData` 回调内部**的过滤谓词，两者互补而非替代。

注意：10 个 store 中有重复的 DLC 可选值计算模式（`instance.getValuesByProp('dlc', true).filter(({ value }) => ...)`），可进一步统一为 store utils 中的共享 helper，但不属于本阶段硬性范围。

### 3.9 Store 层适配

- `app/stores/customer-rare.ts`：
    - `evaluateSavedMealResult()`（L997-1072）→ 调用 `buildFullMealEvaluation`，移除内联的数据查找/标签组合逻辑
    - `evaluateMealResult()`（L947-995）→ 保持调用模式 1（store 内已有解析后的标签数据）
    - 修复 `savedMealRatingCache` 的类型安全：当前 `rating` 类型为 `TRatingKey`（不含 null），但 `evaluateMeal` 返回 `TRatingKey | null`，L1069 用 `as ISavedMealRatingResult` 强制断言——需增加 null 检查或显式类型处理
- `app/stores/customer-normal.ts`：
    - `evaluateSavedMealResult()`（L857-893）→ 同上重构
    - `evaluateMealResult()`（L820-855）→ 保持模式 1
    - 修复 `savedMealRatingCache` 的类型断言：L891 的 `as TRatingKey` 需处理 null 情况
- 确保 `savedMealRatingCache` 缓存逻辑保持兼容

### 3.10 评级 API 端点（depends on 3.2 + 3.3）

| 端点                                   | 方法 | 说明                                             |
| -------------------------------------- | ---- | ------------------------------------------------ |
| `/api/v1/evaluate/rare`                | POST | 稀有客户套餐评级，调用 `buildFullMealEvaluation` |
| `/api/v1/evaluate/normal`              | POST | 普通客户套餐评级，调用 `buildFullMealEvaluation` |
| `/api/v1/recipes/[name]/suitability`   | GET  | 料理适合度（见下方参数说明）                     |
| `/api/v1/beverages/[name]/suitability` | GET  | 酒水适合度（见下方参数说明）                     |

**料理适合度端点查询参数**：

| 参数              | 必填 | 说明                                                     |
| ----------------- | ---- | -------------------------------------------------------- |
| `customer`        | 是   | 顾客名称                                                 |
| `type`            | 是   | `rare` 或 `normal`                                       |
| `popularTag`      | 否   | 流行标签名，影响 `recipeTagsWithTrend` 的计算            |
| `popularNegative` | 否   | 流行趋势是否负向                                         |
| `isFamousShop`    | 否   | 名店状态，影响 `calculateTagsWithTrend` 中的招牌标签加成 |

注意：`hasMystiaCooker` 不影响适合度计算（适合度只看标签匹配，不涉及评级评分规则），故此端点不支持该参数。

**酒水适合度端点查询参数**：

| 参数       | 必填 | 说明               |
| ---------- | ---- | ------------------ |
| `customer` | 是   | 顾客名称           |
| `type`     | 是   | `rare` 或 `normal` |

注意：酒水标签不受流行趋势影响（UI 层也不做变换），故无趋势参数。

**稀有客户评级 POST 请求体**：

```json
{
	"customerName": "河城荷取",
	"recipeName": "黄瓜沙拉",
	"beverageName": "水獭祭",
	"extraIngredients": ["黄瓜"],
	"customerOrder": { "beverageTag": "清酒", "recipeTag": "凉爽" },
	"hasMystiaCooker": false,
	"popularTrend": { "isNegative": false, "tag": null },
	"isFamousShop": false
}
```

**普通客户评级 POST 请求体**（无 `beverageName`、`customerOrder`、`hasMystiaCooker`）：

```json
{
	"customerName": "月人",
	"recipeName": "蜜桃红烧肉",
	"extraIngredients": [],
	"popularTrend": { "isNegative": false, "tag": null },
	"isFamousShop": false
}
```

**成功响应**：

```json
{
	"data": { "rating": "good", "isDarkMatter": false, "price": 250 },
	"status": "ok"
}
```

注意：`rating` 可能为 `null`（输入不完整时）。响应不包含 `matchedTags`——`evaluateMeal` 不暴露此信息，如需扩展需修改 `evaluateMeal` 返回值结构。

## 新建文件

- `app/utils/evaluators/ingredientScore.ts` — `getFullIngredientScoreChange()`
- `app/utils/evaluators/suitability.ts` — `getFullRecipeSuitability()`
- `app/utils/evaluators/meal.ts` — `buildFullMealEvaluation()`
- `app/utils/evaluators/index.ts` — barrel export
- `app/utils/filters.ts` — `filterItems<T>()` 通用过滤函数
- `app/(pages)/customer-shared/types.ts` — 从 customer-rare 组件提取的共享类型
- `app/actions/backup/compatibility.ts` — 备份数据兼容性函数
- `app/api/v1/evaluate/rare/route.ts`
- `app/api/v1/evaluate/normal/route.ts`
- `app/api/v1/recipes/[name]/suitability/route.ts`
- `app/api/v1/beverages/[name]/suitability/route.ts`

## 修改文件

- `app/utils/customer/customer_rare/evaluateMeal.ts` — 双模式输入重构
- `app/utils/customer/customer_normal/evaluateMeal.ts` — 双模式输入重构
- `app/(pages)/customer-rare/ingredientTabContent.tsx`
- `app/(pages)/customer-rare/recipeTabContent.tsx`
- `app/(pages)/customer-rare/savedMealCard.tsx`
- `app/(pages)/customer-rare/beverageTabContent.tsx`
- `app/(pages)/customer-rare/[[...paths]]/content.tsx`
- `app/(pages)/customer-normal/ingredientTabContent.tsx`
- `app/(pages)/customer-normal/recipeTabContent.tsx`
- `app/(pages)/customer-normal/savedMealCard.tsx`
- `app/(pages)/customer-normal/beverageTabContent.tsx`
- `app/(pages)/customer-normal/[[...paths]]/content.tsx`
- `app/(pages)/preferences/dataManager.tsx`
- `app/(pages)/recipes/page.tsx`
- `app/(pages)/ingredients/page.tsx`
- `app/(pages)/beverages/page.tsx`
- `app/(pages)/cookers/page.tsx`
- `app/(pages)/clothes/page.tsx`
- `app/(pages)/ornaments/page.tsx`
- `app/(pages)/partners/page.tsx`
- `app/(pages)/currencies/page.tsx`
- `app/stores/customer-rare.ts`
- `app/stores/customer-normal.ts`

## 验证

- 评级 API 返回正确评分（对比前端 store 计算结果）
- 黑暗物质组合返回 `isDarkMatter: true` + `rating: 'exbad'`
- 稀有客户彩蛋组合正确触发：
    - 河城荷取+黄瓜 → 食材彩蛋 `score ≥ 3`
    - 古明地恋+无意识妖怪慕斯 → 菜谱彩蛋 `score = 0`
    - 蕾米莉亚+猩红恶魔蛋糕 → `score = 4`
    - 梅蒂欣+黑暗物质 → `score = 3`
- 普通客户彩蛋：月人+蜜桃红烧肉 → `score = 0`
- 适合度端点返回正确的 `suitability`、`matchedPositiveTags`、`matchedNegativeTags`
- `savedMealRatingCache` 类型断言消除，null 情况正确处理
- 组件瘦身后前端功能无回归
- `pnpm tsc --noEmit` + `pnpm build` 通过
