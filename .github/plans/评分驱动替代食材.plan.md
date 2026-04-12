---
name: 评分驱动替代食材
overview: 将替代食材查找从"同标签替代"升级为"评分驱动替代"，通过完整评分管道筛选出所有能保持或提升套餐评分的替代食材，解决当前仅在同标签范围内搜索的局限性。
todos:
    - id: score-alternative-fn
      content: '§1 新增 getScoreBasedAlternatives 函数（独立 .ts 文件）：批量计算所有替换位置，使用增量标签计算 + 候选预过滤'
      status: completed
    - id: integrate-ui
      content: '§2 整合到 UI：替换现有 getAlternativeIngredients 调用，首次打开 Popover 时触发批量计算并缓存，不修改 UI 结构'
      status: completed
isProject: false
---

# 评分驱动替代食材

## 问题分析

### 现状

当前 `getAlternativeIngredients`（[suggestedMealCard.tsx#L60-L109](<app/(pages)/customer-rare/suggestedMealCard.tsx>)）使用**同标签替代**策略：

```
1. usefulTags = intersection(ingredient.tags, customerPositiveTags)
2. 候选必须与原食材共享至少一个 usefulTag
```

### 局限性

1. **搜索范围受限于原食材标签**：如果顾客有正面标签 `[甜, 果味, 素, 和风]`，而推荐食材仅贡献 `[甜, 果味]`，则只搜索含「甜」或「果味」的替代品，忽略大量含「素」或「和风」的可用食材。

2. **不考虑标签覆盖链**：替代食材可能通过覆盖负面标签（`重油→清淡`、`肉→素`）间接提升评分，但因不共享原食材标签而被过滤。

3. **不考虑组合效应**：替代后与其他已选食材的标签组合可能产生更好的覆盖/得分，但纯标签匹配无法评估。

4. **无法发现"换道提分"的替代品**：通过完全不同的标签路径满足顾客其他正面偏好的食材不会出现在替代列表中。

### 根本原因

`getAlternativeIngredients` 是**标签保持替代**（tag-preserving substitution），不是**评分保持替代**（score-preserving substitution）。

## 方案设计

### 核心思路

对每个推荐套餐的所有额外食材，批量遍历可用食材作为候选替代，使用增量标签计算 + 完整评分管道筛选保分或提分的替代品。

### §1 新增 `getScoreBasedAlternatives` 函数

**文件**：~~`app/utils/customer/customer_rare/getScoreBasedAlternatives.ts`~~（已合并至 `app/utils/customer/customer_rare/suggestMeals.ts`，见"实现后修正记录"）。

**签名**：

```typescript
export function getScoreBasedAlternatives({
	instance_ingredient,
	instance_recipe,
	extraIngredients, // 所有额外食材（批量计算所有替换位置）
	recipeIngredients,
	recipeName,
	recipePositiveTags,
	recipeNegativeTags,
	beverageTags,
	customerName,
	customerPositiveTags,
	customerNegativeTags,
	customerBeverageTags,
	customerOrder,
	customerDlc,
	popularTrend,
	isFamousShop,
	hasMystiaCooker,
	baseRating, // 原推荐的评分
}: IScoreBasedAlternativesParams): Map<TIngredientName, TIngredientName[]>;
```

返回 `Map<食材名, 排序后替代品列表>`，一次调用覆盖所有替换位置。

**实现要点**：

1. **共享基础过滤**：一次性筛除不可用候选（DLC、封禁、标签预过滤），所有替换位置共享过滤结果。标签预过滤条件：通过 `buildRelevantTagSet` 构建保留标签集（包含顾客正面标签、点单料理标签、以及通过 `tagCoverMap` 与顾客负面标签相关的覆盖/被覆盖标签），与 `filterRelevantIngredients` 共享同一函数。

2. **预计算基础标签集**：每个替换位置预计算 `baseTagSet[pos] = toSet(recipePositiveTags, otherExtraTags)`。遍历候选时仅 clone 并增量添加候选标签，随后调用 `Recipe.applyLargePartition` + `Recipe.applyTagCovers`。与 beam search（推荐算法改进计划 §2.3）同一优化思路。

3. **暗物质检查**：每个候选 + 其余额外食材的组合需通过 `checkDarkMatter`，暗物质候选直接跳过。

4. **完整评分管道**：增量标签集 → `calculateTagsWithTrend` → `evaluateMeal`。仅保留 `SCORE_MAP[rating] >= baseScore` 的候选。

5. **全量计算 + 排序**：遍历所有候选后按评分降序 + 食材获取难度升序排列。不提前终止，确保排在前面的替代品是最优选项。由 UI 层控制显示数量。

**完整伪代码**：

```typescript
const baseScore = SCORE_MAP[baseRating];
const result = new Map<TIngredientName, TIngredientName[]>();

// 共享标签集构建（与 filterRelevantIngredients 共用 buildRelevantTagSet）
const keepTags = buildRelevantTagSet(
	customerPositiveTags,
	customerNegativeTags,
	customerOrder.recipeTag
);

// 共享基础过滤
const filteredCandidates = instance_ingredient.data.filter(
	(item) =>
		(item.dlc === 0 || item.dlc === customerDlc) &&
		!instance_ingredient.blockedIngredients.has(item.name) &&
		!instance_ingredient.blockedLevels.has(item.level) &&
		!item.tags.some((tag) => instance_ingredient.blockedTags.has(tag)) &&
		item.tags.some((tag) => keepTags.has(tag as string))
);

// 预计算基础标签集
const baseTagSets: Set<string>[] = [];
for (let pos = 0; pos < extraIngredients.length; pos++) {
	const otherExtras = extraIngredients.filter((_, i) => i !== pos);
	const otherTags = otherExtras.flatMap((e) =>
		instance_ingredient.getPropsByName(e, 'tags')
	);
	baseTagSets[pos] = toSet(recipePositiveTags, otherTags as TRecipeTag[]);
}

const totalIngredientCount = recipeIngredients.length + extraIngredients.length;

// 批量遍历：替换位置 × 候选
for (let pos = 0; pos < extraIngredients.length; pos++) {
	const targetName = extraIngredients[pos];
	const otherExtras = extraIngredients.filter((_, i) => i !== pos);
	const candidates: Array<{ name: TIngredientName; score: number }> = [];

	for (const item of filteredCandidates) {
		if (item.name === targetName || otherExtras.includes(item.name)) {
			continue;
		}

		const replacedExtras = [...otherExtras, item.name];
		const { isDarkMatter } = instance_recipe.checkDarkMatter({
			extraIngredients: replacedExtras,
			negativeTags: recipeNegativeTags,
		});
		if (isDarkMatter) continue;

		// 增量标签计算
		const tagSet = new Set(baseTagSets[pos]);
		for (const tag of item.tags) tagSet.add(tag as string);
		Recipe.applyLargePartition(tagSet, totalIngredientCount, popularTrend);
		Recipe.applyTagCovers(tagSet as Set<TRecipeTag>, popularTrend);

		const tagsWithTrend = instance_recipe.calculateTagsWithTrend(
			toArray(tagSet) as TRecipeTag[],
			popularTrend,
			isFamousShop
		);

		const rating = evaluateMeal({
			currentBeverageTags: beverageTags,
			currentCustomerBeverageTags: customerBeverageTags,
			currentCustomerName: customerName,
			currentCustomerNegativeTags: customerNegativeTags as TRecipeTag[],
			currentCustomerOrder: customerOrder,
			currentCustomerPositiveTags: customerPositiveTags as TRecipeTag[],
			currentIngredients: union(
				recipeIngredients as TIngredientName[],
				replacedExtras
			),
			currentRecipeName: recipeName,
			currentRecipeTagsWithTrend: tagsWithTrend,
			hasMystiaCooker,
			isDarkMatter,
		});

		if (rating !== null && SCORE_MAP[rating] >= baseScore) {
			candidates.push({ name: item.name, score: SCORE_MAP[rating] });
		}
	}

	candidates.sort((a, b) => b.score - a.score);
	result.set(
		targetName,
		candidates.map((c) => c.name)
	);
}

return result;
```

**预估计算量**：~60-120 个有效候选（预过滤后） × 1-5 个替换位置 ≈ 60-600 次评分管道。每次评分主要是 Set 操作 + 数组交集，预计耗时 < 5ms。

### §2 整合到 UI

**替换** `suggestedMealCard.tsx` 中现有的 `getAlternativeIngredients` 调用。评分驱动的结果严格优于标签匹配——所有保分的同标签替代品也会通过评分筛选。因此同时移除 `getAlternativeIngredients` 函数和 `requiredTag`/`orderTagCoveredByOthers` 逻辑（评分管道天然覆盖点单标签保护）。

**延迟批量计算**：首次打开任一额外食材 Popover 时触发 `getScoreBasedAlternatives` 批量计算，返回所有替换位置的替代品 Map。后续打开其他食材 Popover 直接从 Map 中读取。推荐结果 `suggestions` 变化时重置缓存。

```typescript
// 所有推荐方案共享一个二级替代品缓存：外层 key 为推荐索引 loopIndex，内层为每个食材的替代品 Map
const [alternativesMap, setAlternativesMap] = useState(
    () => new Map<number, Map<TIngredientName, TIngredientName[]>>()
);

// suggestions 变化时通过 derived state 模式重置（非 useEffect，在渲染期间执行）
const [prevSuggestions, setPrevSuggestions] = useState(suggestions);
if (prevSuggestions !== suggestions) {
    setPrevSuggestions(suggestions);
    setAlternativesMap(new Map());
}

// 食材 Popover onOpenChange 回调中按需触发批量计算
onOpenChange={(isOpen) => {
    if (isOpen && !alternativesMap.has(loopIndex)) {
        setAlternativesMap((prev) => {
            const next = new Map(prev);
            next.set(loopIndex, getScoreBasedAlternatives({ ... }));
            return next;
        });
    }
}, [alternativesMap, /* ...deps */]);

// 读取：alternativesMap?.get(ingredientName) ?? []
```

**不修改 UI 结构**：Popover 的展示方式、文案、交互行为保持不变。

## 依赖关系

- `getScoreBasedAlternatives.ts` 导入 `evaluateMeal`（从 `./evaluateMeal`，已是 `export` 函数）
- 导入 `Recipe` 的 `checkDarkMatter`、`calculateTagsWithTrend`、静态方法 `applyLargePartition`、`applyTagCovers`
- 评分参数（`recipePositiveTags`、`recipeNegativeTags`、`beverageTags` 等）在 UI 层通过 `instance_recipe.getPropsByName()` 和 `instance_beverage.getPropsByName()` 获取，不扩展 `ISuggestedMeal` 接口

## 不需要修改的部分

- `suggestMeals.ts`
- `evaluateMeal.ts`
- Store 结构
- UI 结构和展示方式

## 风险与注意事项

1. **替代品数量变化**：评分驱动方案返回的替代品数量与同标签方案不同（通常更多），由 UI 层截断显示。
2. **缓存失效**：推荐结果变更时必须重置 `alternativesMap`，通过 `useEffect` 监听 `suggestions` 实现。

## 实现后修正记录

### 修正：`useRef` → `useState`（重渲染问题）

**问题**：初始实现使用 `useRef` 存储 `alternativesMap`。在 Popover 的 `onOpenChange` 回调中通过 `alternativesMapRef.current.set()` 写入缓存后，React 不会触发重渲染，导致首次打开 Popover 时 `alternatives` 读取为空数组（`[]`），UI 显示"无可用替换"。关闭并重新打开才能看到结果（因为其他状态变更触发了重渲染）。

**修复**：将 `useRef<Map<...>>` 替换为 `useState<Map<...>>`，写入时使用函数式更新 `setAlternativesMap(prev => new Map(prev).set(loopIndex, ...))` 保证状态不可变性并触发重渲染。

**影响范围**：仅 `suggestedMealCard.tsx`，5 处引用从 `alternativesMapRef.current` 改为 `alternativesMap` / `setAlternativesMap`。

**注意**：§2 中的缓存设计伪代码已相应更新为 `useState` 方案。

### 修正：合并至 `suggestMeals.ts`（消除重复）

**问题**：独立的 `getScoreBasedAlternatives.ts` 与 `suggestMeals.ts` 存在多处重复：

- `SCORE_MAP` 常量完全相同
- 食材候选过滤逻辑（DLC/blocked/blockedLevels/blockedTags）基本一致
- Tag 计算管线（`applyLargePartition` → `applyTagCovers` → `calculateTagsWithTrend`）本质相同
- `evaluateMeal` 调用模式、暗物质检查、评分比较排序模式相似

**修复**：将 `getScoreBasedAlternatives` 函数及 `IScoreBasedAlternativesParams` 接口移入 `suggestMeals.ts`，删除独立文件。函数直接复用已有的 `SCORE_MAP`、已导入的模块（`evaluateMeal`、`Recipe`、`Ingredient`、`toArray`、`toSet`、`union` 等），无需新增任何 import。

**影响范围**：

- `suggestMeals.ts`：新增 `export function getScoreBasedAlternatives` + `IScoreBasedAlternativesParams` 接口
- `suggestedMealCard.tsx`：导入路径从 `@/utils/customer/customer_rare/getScoreBasedAlternatives` 改为 `@/utils/customer/customer_rare/suggestMeals`
- 删除 `app/utils/customer/customer_rare/getScoreBasedAlternatives.ts`

**注意**：§1 中描述的文件位置已过时，实际函数位于 `suggestMeals.ts` 中。
