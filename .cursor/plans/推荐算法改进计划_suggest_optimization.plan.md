---
name: 推荐算法改进计划
overview: 针对 suggestMeals.ts 的架构、算法精度、性能三个维度的改进方案，按优先级分为近期（低成本高收益）、中期（中等复杂度）、远期（架构级重构）三个阶段。
todos:
    - id: tag-prefilter
      content: '§1.1 标签预过滤：filterRelevantIngredients 实现精确版本'
      status: completed
    - id: beam-search
      content: '§2.1 Beam Search：tryAddExtraIngredients 使用 BEAM_WIDTH=3'
      status: completed
    - id: beverage-dedup
      content: '§2.2 酒水标签去重：buildBeverageTagGroups 按标签签名分组'
      status: completed
    - id: incremental-tags
      content: '§2.3 增量标签计算：内联 compose + calculate 逻辑，预计算 beam 状态基础标签集'
      status: completed
    - id: shared-tag-pipeline
      content: '§2.4 标签管道共享函数提取：将内联标签管道步骤提取为 Recipe 静态方法，与 beam search 共用'
      status: completed
    - id: budget-constraints
      content: '§2.5 预算约束：硬过滤超预算候选 + 软权重降权超软预算候选'
      status: completed
    - id: alt-ingredient-order-tag
      content: '§2.6 替代食材点单标签保护：替代品需保留点单标签（除非已被其他来源覆盖）'
      status: completed
    - id: popular-tag-ui-guard
      content: '§2.7 流行标签 UI 守卫：点单含流行标签但未设置流行趋势时显示提醒'
      status: completed
isProject: false
---

# 推荐算法改进计划

## 现状概要

- 文件：[`app/utils/customer/customer_rare/suggestMeals.ts`](app/utils/customer/customer_rare/suggestMeals.ts)
- 4 种推荐模式：D（全量搜索）、A（固定料理）、B（固定酒水）、C（固定料理+酒水）
- 额外食材搜索使用 Beam Search（`BEAM_WIDTH=3`），配合 `negativeTagSet` 预过滤暗物质候选
- 标签预过滤：`filterRelevantIngredients` 在进入 beam search 前筛除无关食材，通过 `buildRelevantTagSet` 构建保留标签集（包含顾客正面标签、点单料理标签、以及通过 `tagCoverMap` 与顾客负面标签相关的覆盖/被覆盖标签），与 `getScoreBasedAlternatives` 共用同一函数
- 酒水标签去重：`buildBeverageTagGroups` 按标签签名分组，每组仅评估一次
- 缓存：模块级 `Map`，`buildCacheKey` 手动拼接键，LRU 淘汰，上限 `CACHE_MAX_SIZE=200`

## 阶段一：近期优化

### 1.1 标签预过滤：减少候选食材的无效评估 ✅ 已实现

> 已通过 `filterRelevantIngredients` 实现。标签集构建逻辑提取为 `buildRelevantTagSet` 共享函数，保留顾客正面标签、点单料理标签（`orderRecipeTag`）、以及 `tagCoverMap` 中与顾客负面标签相关的覆盖/被覆盖标签的食材。`getScoreBasedAlternatives` 同样使用此函数。

## 阶段二：中期优化（中等复杂度）

### 2.1 Beam Search 替代贪心 ✅ 已实现

> 已在 `tryAddExtraIngredients` 中实现，`BEAM_WIDTH=3`，`globalBest` 跨槽位追踪，`score >= 4` 早期终止。排序策略 `score 降序 + penalty 升序`。

以下为原始设计分析，保留供参考。

**问题**：贪心逐槽位选最优，可能错过需要"先牺牲再提升"的全局最优组合。

#### 为什么贪心会失效

`evaluateMeal` 的评分存在**非线性交互**，使得"当前最优"≠"全局最优"：

1. **标签互斥覆盖**：`composeTagsWithPopularTrend` 中存在覆盖规则（`重油→清淡`、`肉→素`、`灼热→凉爽`、`昂贵→实惠`、`大份→小巧`）。食材 A 可能引入 `重油` 覆盖掉对顾客有害的 `清淡` 标签，但自身不直接贡献正面标签 → 贪心认为 A"无用"跳过。后续食材 B 在 `清淡` 被移除后才能发挥正面效果。
2. **MaxScore 封顶解锁**：`calculateMaxScore` 根据点单标签匹配情况封顶评分。某些食材组合能通过改变 `recipeTagsWithTrend` 使其包含 `customerOrderRecipeTag`，从而将 `maxScore` 从 3 提升至 4。贪心在第一步可能选了"立即得分高但不解锁封顶"的食材，错过"先解锁封顶再提分"的路径。

#### 具体失效案例

假设顾客正面标签 `[甜,凉爽]`，负面 `[重油]`，点单料理标签 `和风`：

- 当前料理标签 `[清淡,灼热]`（`清淡` 匹配正面，`灼热` 不匹配）
- 食材 A：标签 `[重油]` → 覆盖 `清淡`，净变化 -1（移除一个正面标签）→ 贪心跳过
- 食材 B：标签 `[甜,和风]` → 加 `甜`(正面) + `和风`(匹配点单) → 净变化 +2
- 食材 C：标签 `[凉爽]` → 覆盖 `灼热`，加 `凉爽`(正面) → 净变化 +1

贪心选择：B(+2) → C(+1) = 得分提升 3
最优选择：A(-1) → B(+2) → C(+1) → **但 A 覆盖 `清淡` 后 `重油` 成为新标签**，而 `重油` 是负面标签 → 实际此例 A 会降分。需要更精确的标签模拟才知道效果。

实际失效率取决于游戏数据中标签覆盖的频率，预估 < 5% 的顾客-料理组合会受影响。

#### 方案对比

| 算法                  | 单次搜索复杂度           | I=200, S=3       | 精度               |
| --------------------- | ------------------------ | ---------------- | ------------------ |
| 贪心                  | $O(I \times S)$          | 600 次评估       | 可能遗漏标签覆盖链 |
| **Beam Search (K=3)** | $O(I \times S \times K)$ | **1,800 次评估** | 覆盖大部分多步路径 |
| Beam Search (K=5)     | $O(I \times S \times K)$ | 3,000 次评估     | 接近最优           |
| 穷举                  | $O\binom{I}{S}$          | 1,313,400 次评估 | 精确最优           |

Beam Search 是性价比最高的中间方案：耗时仅比贪心多 2-4×，但覆盖了绝大多数"先退后进"的搜索路径。

#### 实现方案

```typescript
interface IBeamState {
    extras: TIngredientName[];
    extraTags: TIngredientTag[];
    score: number;
    rating: TRatingKey;
    penalty: number;
}

function tryAddExtraIngredientsBeam({
    ...,
    beamWidth = 3,
}: { ...; beamWidth?: number }) {
    let beam: IBeamState[] = [{ extras: [], extraTags: [], score: 0, rating: 'exbad', penalty: 0 }];
    let globalBest: IBeamState = beam[0]!;

    for (let slot = 0; slot < extraSlots; slot++) {
        const nextBeam: IBeamState[] = [];

        for (const state of beam) {
            for (const ingredientItem of baseGameIngredients) {
                if (state.extras.includes(ingredientItem.name)) continue;

                // 暗物质检查、标签计算、evaluateMeal（与现有逻辑相同）
                const candidateExtras = [...state.extras, ingredientItem.name];
                // ...checkDarkMatter, composeTagsWithPopularTrend, evaluateMeal...

                if (rating === null) continue;

                const score = SCORE_MAP[rating];
                const penalty = state.penalty + getIngredientLocationPenalty(...);
                nextBeam.push({ extras: candidateExtras, score, rating, penalty });
            }
        }

        if (nextBeam.length === 0) break;

        // 按分数降序、惩罚升序排序，保留 top-K
        nextBeam.sort((a, b) => b.score - a.score || a.penalty - b.penalty);
        beam = nextBeam.slice(0, beamWidth);

        // 更新全局最优
        if (beam[0]!.score > globalBest.score) {
            globalBest = beam[0]!;
        }

        if (globalBest.score >= 4) break;
    }

    if (globalBest.extras.length === 0) return null;

    return {
        extraIngredients: globalBest.extras,
        ingredientPenalty: globalBest.penalty,
        rating: globalBest.rating,
        score: globalBest.score,
    };
}
```

**关键设计决策**：

- `globalBest` 跨槽位追踪：即使后续槽位无法提升，仍保留中间步骤的最优解（与现有贪心行为一致）
- `beamWidth` 可配置：默认 3，可根据性能预算调整
- 排序使用 `score` 降序 + `penalty` 升序：相同分数优先选获取成本低的组合
- 接口兼容：返回类型与现有 `tryAddExtraIngredients` 完全一致，可无缝替换

**在 `computeSuggestions` 场景下的总复杂度影响**：

$$R \times B \times (I \times S \times K) = 200 \times 50 \times (200 \times 3 \times 3) = 18{,}000{,}000 \text{ 次评估}$$

对比现有贪心的 6,000,000 次，增加 3×。配合阶段一的标签预过滤（减少 50-70% 候选）和早期终止（减少 60-90% 搜索），实际增量可忽略。

### 2.2 酒水标签去重 ✅ 已实现

> 已通过 `buildBeverageTagGroups` 实现。按标签签名（`[...tags].sort().join(',')`）分组酒水，每组仅对代表性标签调用一次 `evaluateMeal`，然后将评分结果分发给组内所有酒水。在 `computeSuggestions` 和 `suggestForRecipe` 中均已使用。

### 2.3 增量标签计算 ✅ 已实现

> 已在 `tryAddExtraIngredients` 中实现。内联了 `composeTagsWithPopularTrend` 和 `calculateTagsWithTrend` 的逻辑，主要优化点：
>
> 1. **预计算 beam 状态基础标签集**：每个 beam state 只构建一次 `stateTagBase = Set(recipeTagsBase ∪ state.extraTags)`，候选食材仅在副本上增量添加标签
> 2. **消除中间数组分配**：跳过 `compose → toArray → calculate → toSet` 中间转换，全程用 Set 操作
> 3. **预计算食材集合**：每个 beam state 只构建一次 `baseIngredientSet`，候选食材增量添加
> 4. **预提取不变量**：`tagCoverEntries`、`popularTrend` 解构、流行标签字符串在循环外计算一次
> 5. **`instance_recipe` 参数已移除**：不再需要传入 Recipe 实例

### 2.4 标签管道共享函数提取 ✅ 已实现

> §2.3 将标签管道内联到 beam search 中，导致与 `Recipe.composeTagsWithPopularTrend` 和 `Recipe.calculateTagsWithTrend` 中的同名逻辑产生隐性耦合——二者各自维护一份相同的管道步骤代码。
>
> 已将 4 个管道步骤提取为 `Recipe` 类的公开静态方法，供 beam search 内联逻辑和 Recipe 实例方法共用：
>
> | 静态方法                                                                 | 对应管道步骤                   | 调用者                                                  |
> | ------------------------------------------------------------------------ | ------------------------------ | ------------------------------------------------------- |
> | `Recipe.applyLargePartition(tagSet, totalIngredientCount, popularTrend)` | 食材数 ≥ 5 时添加大份标签      | `composeTagsWithPopularTrend`, `tryAddExtraIngredients` |
> | `Recipe.applyTagCovers(tagSet, popularTrend)`                            | tagCoverMap 互斥覆盖           | 同上                                                    |
> | `Recipe.applyFamousShop(tagSet, isFamousShop)`                           | 名店效果（+招牌 -昂贵）        | `calculateTagsWithTrend`, `tryAddExtraIngredients`      |
> | `Recipe.applyPopularTrend(tagSet, popularTrend)`                         | 流行趋势标签（+流行喜爱/厌恶） | 同上                                                    |
>
> - `composeTagsWithPopularTrend` 内部原有的 `largePartition` / `tagCover` 逻辑替换为 `applyLargePartition` + `applyTagCovers` 调用
> - `tryAddExtraIngredients` beam search 中原有的内联管道逻辑替换为 4 个静态方法调用
> - 文件修改：[recipes.ts](app/utils/food/recipes.ts)（新增静态方法 + 重构 compose）、[suggestMeals.ts](app/utils/customer/customer_rare/suggestMeals.ts)（重构 beam search 内联管道）

### 2.5 预算约束 ✅ 已实现

> 推荐结果现在考虑顾客预算。预算模型来自稀客数据：`price: [number, number]`（预算范围）、`enduranceLimit: number`（容忍系数，如 1.2 = 可超 20%）。
>
> **硬过滤**：总价超过 `budgetMax = Math.ceil(price[1] × enduranceLimit)` 的候选直接跳过，不进入评分。
>
> **软权重**：总价超过 `budgetSoftMax = price[1]` 但未超 `budgetMax` 时，扣除 `BUDGET_OVER_PENALTY = 500` 权重分。
>
> **权重公式变更**：
>
> ```
> weight = score × 10000 + acquisitionWeight − ingredientPenalty − budgetPenalty
> ```
>
> 4 条输出路径均已覆盖：`computeSuggestions`（模式 D）、`suggestForBeverage`（模式 A）、`suggestForRecipe`（模式 B）、`suggestIngredients`（模式 C 的两个返回点）。其中 `suggestIngredients` 仅实施硬过滤（超过 `budgetMax` 时返回 `[]`），不应用软权重惩罚，因为模式 C 最多返回 1 个结果，无需排序/权重比较。
>
> - 文件修改：[suggestMeals.ts](app/utils/customer/customer_rare/suggestMeals.ts)

### 2.6 替代食材点单标签保护 ✅ 已实现（已被评分驱动替代方案取代）

> ~~`getAlternativeIngredients` 原本仅要求替代品与原食材共享任意有用标签，不检查点单标签。~~ 此优化已被「评分驱动替代食材」计划中的 `getScoreBasedAlternatives` 完全取代。评分驱动方案通过完整评分管道筛选保分或提分的替代品，天然覆盖了点单标签保护的需求。`getAlternativeIngredients` 函数和 `requiredTag`/`orderTagCoveredByOthers` 逻辑已移除。

### 2.7 流行标签 UI 守卫 ✅ 已实现

> 当点单需求标签为「流行喜爱」或「流行厌恶」，但用户尚未在设置中指定流行趋势（`popularTrend.tag === null`）时，算法仍会执行但点单标签匹配永远无法生效（bonus 恒为 0），输出结果具有误导性。
>
> 已在 UI 层添加前置检查 `hasUnsetPopularOrderTag`：当条件成立时不展示推荐，改为显示提示信息「选定的点单需求包含流行趋势标签 / 请您先在设置中指定「流行趋势」」。
>
> - 文件修改：[suggestedMealCard.tsx](<app/(pages)/customer-rare/suggestedMealCard.tsx>)

## 阶段三：远期优化（架构级变更）

### 3.1 `suggestIngredients` 替换路径的多位置替换 ✅ 已实现

> 已在 `tryIngredientReplacements` 中实现单替换和双替换（当 `currentExtras.length >= 2` 且单替换未达满分时）。`bestReplacementScore >= 4` 提前终止。

**问题**：当前替换路径仅尝试替换单个额外食材。当需要同时替换 2 个食材才能达到更高评分时会遗漏。

**方案**：允许 2-位置同时替换（在食材槽满且额外食材 ≥ 2 时）：

```typescript
// 单位置替换（现有）
for (let i = 0; i < extras.length; i++) { ... }

// 双位置替换（新增，仅当单位置替换无满分结果时执行）
if (bestReplacementScore < 4 && extras.length >= 2) {
    for (let i = 0; i < extras.length; i++) {
        for (let j = i + 1; j < extras.length; j++) {
            const remaining = extras.filter((_, k) => k !== i && k !== j);
            for (const ing1 of baseGameIngredients) {
                for (const ing2 of baseGameIngredients) {
                    // 评估 remaining + [ing1, ing2]
                }
            }
        }
    }
}
```

**复杂度**：$C(E,2) \times I^2 = 10 \times 40000 = 400K$ 评估（E=5, I=200）。可接受。

**预期收益**：覆盖需要同时替换两个食材的边缘场景。
