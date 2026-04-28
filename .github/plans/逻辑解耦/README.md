# UI 计算逻辑与视图解耦：重构计划

> 面向仓库 `touhou-mystia-izakaya-assistant` 当前 UI 层与业务/计算逻辑耦合过深的问题，给出最终的分阶段重构方案，用于把页面层中的业务计算、列表派生与副作用逐步收敛到 `utils`、store view-model 与业务 hook。

---

## 一、当前分层与职责

| 层                | 现状定位                                                                                                                                                                                     | 实际承担                                                                                                                                                                                                                                                                                                          | 备注                                                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `app/data/`       | 静态游戏数据（JSON）+ 常量表                                                                                                                                                                 | 数据 + 常量                                                                                                                                                                                                                                                                                                       | OK                                                                                                                                       |
| `app/utils/`      | 领域单例：`Beverage` / `Recipe` / `CustomerRare` / `CustomerNormal` / `Ingredient`… 以及 `customer/customer_rare/{evaluateMeal,suggestMeals}.ts`、`customer/customer_normal/evaluateMeal.ts` | 纯领域计算层                                                                                                                                                                                                                                                                                                      | `customer_normal` 无 `suggestMeals.ts`；`customer/shared/` 已开始承接稀客/普客共享算法与保存套餐评估 helper                              |
| `app/utilities/`  | 通用纯函数：`filterItems` / `pinyin` / `sort` / `array` …                                                                                                                                    | OK                                                                                                                                                                                                                                                                                                                |                                                                                                                                          |
| `app/stores/`     | `@davstack/store` 单例；`shared` / `persistence` / `instances` / `.computed(...)` / `.actions(...)`                                                                                          | `.computed(...)` 目前不只 `availableXxx`，还包含表格 rows、`ingredientScoreChanges`、`savedCustomerMealsWithEvaluation`、`currentMealPrice` 这类 view-model 节点；`.actions(...)` + `onChange(...)` 已集中维护 `shared.recipe.tagsWithTrend`、`shared.customer.rating`、`shared.customer.isDarkMatter` 等派生逻辑 | 现状问题不是“store 完全没承接派生状态”，而是仍需守住 computed / hook / 页面展示边界，避免为了共享率把 DOM 副作用或大表流水线硬塞进 store |
| `app/hooks/`      | `useFilteredData` / `useSortedData` / `useSearchResult` / `useThrottle` …                                                                                                                    | 通用列表三件套 + 节流 + `useSkipProcessItemData` 等 UI 邻近派生逻辑                                                                                                                                                                                                                                               | `customer-rare` / `customer-normal` 的路由页已经高度依赖这些 hook；后续若把列表逻辑改入 store，需要先确认是否要保留相同节流/跳过语义     |
| `app/components/` | 通用 UI（`tags` / `itemPopoverCard` / `sprite` / `sideXxx`…）                                                                                                                                | 多数 OK；`itemPopoverCard` 仍内嵌少量数据展示规则                                                                                                                                                                                                                                                                 | 稀客/普客页之间已经存在少量共享基础组件与共享片段，不是完全隔离                                                                          |
| `app/lib/`        | 仅包含 `db/`（cloud backup 用）                                                                                                                                                              | DB 工具                                                                                                                                                                                                                                                                                                           | 本计划新增聚合纯函数仍建议放 `app/utils/customer/`，不入 `app/lib/`                                                                      |
| `app/(pages)/`    | 路由页面 + 该页专属业务组件                                                                                                                                                                  | **视图与计算混合的重灾区**                                                                                                                                                                                                                                                                                        | 不只是 tab content，`[[...paths]]/content.tsx` 这种路由壳组件也承接了大量列表级派生逻辑                                                  |

---

## 二、典型耦合点清单（按严重程度排序）

### P0 — 严重：算法/派生数据写在 JSX 上下文内

#### P0-1. 食材格子内联评分计算（render 阶段执行，未 memo）

- 文件：[app/(pages)/customer-rare/ingredientTabContent.tsx](<app/(pages)/customer-rare/ingredientTabContent.tsx>)，同构于 [app/(pages)/customer-normal/ingredientTabContent.tsx](<app/(pages)/customer-normal/ingredientTabContent.tsx>)。
- 现状：在 `sortedData.map` 的 render body 内直接依次调用 `composeTagsWithPopularTrend` → `calculateTagsWithTrend` → `getIngredientScoreChange` → 多段 `scoreChange ±= Number(...)`。稀客分支还叠加 `checkIngredientEasterEgg`、`darkIngredients`、`Dark Matter` 钳制；普客分支额外在组件顶部先算一遍 `darkIngredients`，再生成一份 `data = sortedData.filter(...)`。
- 问题：
    - 业务规则（large-partition 加减、popular-trend 正负、easter-egg 钳制）混入视图。
    - 稀客/普客**显示策略也不同**：稀客保留“黑暗料理材料”并展示为受限；普客直接过滤掉这些食材。阶段 3 若要抽共享组件，必须把“显示策略”也作为差异点抽出。
- 应下沉至：
    - `app/utils/customer/shared/getIngredientScoreChanges.ts`
    - 如继续保留路由层传 `sortedData`，则 store computed 至少提供 `ingredientScoreChanges: Map<TIngredientName, number>`；如进一步下沉列表逻辑，则还需要独立抽 `visibleIngredientData` / `ingredientFilteredData`。

#### P0-2. 稀客/普客 tab 内百行级 recipe / beverage suitability 流水线

- 文件：
    - [app/(pages)/customer-rare/recipeTabContent.tsx](<app/(pages)/customer-rare/recipeTabContent.tsx>)
    - [app/(pages)/customer-rare/beverageTabContent.tsx](<app/(pages)/customer-rare/beverageTabContent.tsx>)
    - 同构：`customer-normal/recipeTabContent.tsx` / `beverageTabContent.tsx`
- 现状：单个 `useMemo` 内同时做 DLC 过滤 + suitability 计算 + easter-egg 判定 + 多维筛选 + 多维排序 + 分页切片。
- 关键差异：
    - 稀客调 `instance_customer.checkRecipeEasterEgg(...)`，普客调 `instance_customer.checkEasterEgg(...)`。
    - 标签样式常量 `CUSTOMER_RARE_TAG_STYLE` 与 `CUSTOMER_NORMAL_TAG_STYLE` 不同。
    - 稀客 suitability 计算要同时考虑正/负标签；普客更轻。
- `tableHeaderColumns`、`tableToolbar`、`tablePagination` 等仍偏 UI 结构，应保留在组件层；本阶段只抽离 suitability / filter / sort / page 流水线与行数据构建。
- 应下沉至：
    - `app/utils/customer/shared/buildRecipeSuitabilityRows.ts`
    - `app/utils/customer/shared/buildBeverageSuitabilityRows.ts`
    - store computed 暴露扁平 key：`recipeTableSortedRows` / `recipeTablePagedRows` / `beverageTableSortedRows` / `beverageTablePagedRows`

#### P0-3. `suggestedMealCard` 的推荐 view-model 已收口到 hook

- 文件：[app/(pages)/customer-rare/suggestedMealCard.tsx](<app/(pages)/customer-rare/suggestedMealCard.tsx>)。
- 现状：核心搜索算法位于 `app/utils/customer/customer_rare/suggestMeals.ts`，跨 store 输入组合、`isActive`、`visibility`、默认厨具同步与 `alternativesMap` 已由 `app/hooks/useSuggestedMealsViewModel.ts` 承接。
- 保留边界：`document` / 可见性类副作用继续停留在 hook 层；纯派生部分若继续推进 store computed，需要先确认重算触发面与性能预算。
- 已知残余风险：`alternativesMap` 仍沿用 render 阶段 reset 的旧模式，后续若再动建议菜模型，应优先把这段迁到 effect 或更稳定的状态同步方式。

### P1 — 高：列表级派生与卡片级派生遗漏较多

#### P1-4. 路由组件 `[[...paths]]/content.tsx` 里的顾客列表过滤/排序/节流流水线

- 文件：[app/(pages)/customer-rare/[[...paths]]/content.tsx](<app/(pages)/customer-rare/[[...paths]]/content.tsx>) 与 [app/(pages)/customer-normal/[[...paths]]/content.tsx](<app/(pages)/customer-normal/[[...paths]]/content.tsx>)。
- 现状：`validateName` 仍保留在路由壳，顾客列表搜索、过滤、排序与节流流水线已由 `app/hooks/useCustomerRouteData.ts` 承接，内部继续复用通用 hook 并保留当前节流与 `useSkipProcessItemData` 语义。
- 后续若继续推进 store computed，需要重新评估搜索节流与 skip-process 行为，不能直接把 hook 语义压平为同步 computed。

#### P1-5. 路由组件 `[[...paths]]/content.tsx` 里的食材过滤/排序流水线

- 文件：同上。
- 现状：带 `_tagsWithTrend` 的食材过滤纯逻辑已下沉到 shared helper，路由页食材过滤 / 排序流水线已由 `app/hooks/useIngredientRouteData.ts` 承接。
- 后续如继续下沉，应保持 hidden ingredient、trend tag、DLC / tag / level 过滤和 `useSkipProcessItemData` 的现有语义。

#### P1-6. “请选择 xx 以保存/评级” 文案只在稀客页形成了真正的复杂派生

- 文件：
    - [app/(pages)/customer-rare/resultCard.tsx](<app/(pages)/customer-rare/resultCard.tsx>)
    - [app/(pages)/customer-rare/customerCard.tsx](<app/(pages)/customer-rare/customerCard.tsx>)
    - 普客同名组件仅作对照
- 现状：
    - 稀客页两处都根据 `酒水 / 料理 / 顾客点单需求 / 是否使用夜雀厨具 / Dark Matter` 组合提示文案。
    - 普客页并不对等：`customer-normal/customerCard.tsx` 只是常量三元表达式 `请选择点单料理以评级`；`customer-normal/resultCard.tsx` 也只是 tooltip 常量 `请选择点单料理以保存`。
- 这里按真实复杂度拆分：
    - 稀客页优先抽 `buildSelectionTip.ts` 或 `unsatisfiedSelectionTip`。
    - 普客页保持简单静态文案，仅在需要统一字面时再跟进。

#### P1-7. `savedMealCard`：按隐藏 DLC 过滤可见套餐

- 文件：[app/(pages)/customer-rare/savedMealCard.tsx](<app/(pages)/customer-rare/savedMealCard.tsx>)，同构于普客同名组件。
- 现状：`useMemo` 中用 `hiddenDlcs`、`instance_beverage`、`instance_recipe`、`instance_ingredient` 做可见性判断，带 `try/catch` 容错。普客分支还要处理 `beverage: null` 的情况。
- 后续若统一成 store/hook view-model，必须保留“**可见顺序使用原始数据索引**”这一约束，否则会破坏当前上移/下移保存套餐的实现。

#### P1-8. `savedMealCard`：保存套餐评估已收口到 shared helper

- 文件：同上。
- 现状：保存套餐评估主线已改读 `savedCustomerMealsWithEvaluation`，并通过 `app/utils/customer/shared/evaluateSavedMeals.ts` 承接稀客 / 普客的评估与容量 `256` 的 runtime cache。
- 稀客 / 普客返回结构继续保持分叉；视图层拿到的数据结构保留 `dataIndex` / `visibleIndex`，用于可见顺序到原始保存数据索引的 reorder 映射。
- 原 rare / normal store 内未调用的 `evaluateSavedMealResult` action 与 store-local `savedMealRatingCache` 已清理，后续不要再把保存套餐评估逻辑放回 render action。

#### P1-9. `customerCard`：元数据展开、预算/耐性、符卡派生主要集中在稀客分支

- 文件：[app/(pages)/customer-rare/customerCard.tsx](<app/(pages)/customer-rare/customerCard.tsx>)，以及普客同名组件作对照。
- 现状：
    - 稀客分支内部展开了 `averagePrice`、`enduranceLimitPercent`、`hasNegativeSpellCards`、`placeContent` 等多组派生数据。
    - 普客分支较轻，但仍有 `placeContent` 与地精特殊展示逻辑。
- `CustomerRare` / `CustomerNormal` 可以都提供 `getDisplayMeta(name)` 一类入口，但返回结构不必完全一致，应允许稀客分支多字段。

#### P1-10. `infoButton`：羁绊奖励聚合只在稀客页是高耦合点

- 文件：[app/(pages)/customer-rare/infoButton.tsx](<app/(pages)/customer-rare/infoButton.tsx>)，以及普客同名组件作对照。
- 现状：
    - 稀客页在视图中聚合 `bondClothes / bondCooker / bondOrnaments / bondPartner / bondRecipes`，再推导 `hasBondRewards`、`hasSpellCards`、`defaultExpandedKeys`。
    - 普客页已经复用 [app/(pages)/customer-shared/infoButtonBase.tsx](<app/(pages)/customer-shared/infoButtonBase.tsx>)，且没有羁绊奖励聚合逻辑；默认展开项固定包含 `description` 与 `rating`，`chat` 非空时再追加 `chat`。
- `bondRewards` 是稀客专属派生；普客页只需清理 `defaultExpandedKeys` 等轻量逻辑，不必为了对称接入同一套奖励数据。

### P2 — 中：闭包过厚、局部字符串拼装、重复柯里化

#### P2-11. `customerCard` 的 `getTagTooltip` 文案拼装

- 文件：[app/(pages)/customer-rare/customerCard.tsx](<app/(pages)/customer-rare/customerCard.tsx>)。
- 现状：稀客分支会根据“当前 tag 是否已选中 / 是否联动筛表 / 是否使用夜雀厨具 / 是否 Dark Matter”拼出多段提示文案；普客分支也有简化版 `getTagTooltip`。
- 应下沉至：`app/utils/customer/shared/buildTagTooltip.ts`，或至少先给稀客分支下沉。

#### P2-12. `resultCard`：当前套餐总价/显示名拼装仍在 JSX 里

- 文件：[app/(pages)/customer-rare/resultCard.tsx](<app/(pages)/customer-rare/resultCard.tsx>)。
- 现状：稀客页在渲染区块里内联拼 `originalCooker / cooker / recipeName / 价格`；普客页则更轻。
- 这里建议直接抽成更完整的 meal display meta，而不是只抽单一 `currentMealPrice`。

#### P2-13. `recipeTabContent` 和 `ingredientTabContent` 都在视图层做 `curry` / `curryRight`

- 文件：
    - [app/(pages)/customer-rare/recipeTabContent.tsx](<app/(pages)/customer-rare/recipeTabContent.tsx>) / 普客同构
    - [app/(pages)/customer-rare/ingredientTabContent.tsx](<app/(pages)/customer-rare/ingredientTabContent.tsx>) / 普客同构
- 现状：`ingredientTabContent` 里同样在视图层直接 `curry(instance_recipe.composeTagsWithPopularTrend)`、`curryRight(instance_ingredient.calculateTagsWithTrend)`。
- 处理建议：把柯里化包装一起收进 `buildRecipeSuitabilityRows` / `getIngredientScoreChanges` 的内部，或者提升到 `Recipe` / `Ingredient` 单例的高层 helper。

#### P2-14. 路由组件中的 `document.title` + `MutationObserver`

- 文件：
    - [app/(pages)/customer-rare/[[...paths]]/content.tsx](<app/(pages)/customer-rare/[[...paths]]/content.tsx>)
    - [app/(pages)/customer-normal/[[...paths]]/content.tsx](<app/(pages)/customer-normal/[[...paths]]/content.tsx>)
- 现状：两边 `useEffect` 都做：路径解析 → store 设当前顾客 → 设置标题 → 启 `MutationObserver` 纠正标题。
- 已下沉至：`app/hooks/useDocumentTitle.ts`。`document.title` / `MutationObserver` 属于 DOM 副作用，继续保留在 hook 层，不推进 store computed。

### P3 — 低：可选优化

15. [app/(pages)/recipes/page.tsx](<app/(pages)/recipes/page.tsx>) 与 [app/(pages)/ingredients/page.tsx](<app/(pages)/ingredients/page.tsx>) 都存在 `dataWithTrend` 派生，适合作为低优先级同类清理项一并纳入。
16. `selectConfig`、`searchConfig`、`pinyinSortConfig` 这类 `useMemo` 配置数组冗长，但大多是 UI 配置，不应和高优先级业务解耦混做一个 PR。
17. `suggestedMealCard` 中的 `alternativesMap` 属于“派生缓存型局部状态”，可以等主路径稳定后再评估是否迁到 transient store slice。
18. `savedMealCard` / `resultCard` 内仍有不少 IIFE 仅用于拼 tooltip 和 label；这类问题可在高优先级耦合点收敛后顺手清理，不必先做大抽象。

---

## 三、根因分析

- **store 已经承接了一部分派生状态，但方式零散且偏命令式**：`shared.recipe.tagsWithTrend`、`shared.customer.rating`、`shared.customer.isDarkMatter` 已经在 store 中维护；问题在于“表格/列表 view-model 没建模成稳定派生节点”。
- **缺少业务级 view-model 层**：tab 表格直接在组件内做 suitability 流水线；路由壳组件直接做列表搜索/过滤/排序/节流；推荐卡片直接拼推荐 view-model。
- **稀客/普客只在部分区域同构**：tab 表格高度同构，但 card / info / save / suggestion / dark ingredient policy 差异明显，不能用“全量组件一把梭合并”的思路推进。
- **已有共享基础未被纳入重构策略**：`InfoButtonBase`、`Plus`、`UnknownItem`、`MoveButton`、`TagGroup`、共享 props type 已经存在，说明这套代码更适合“先提取共享子块，再考虑整组件合并”。
- **领域单例方法颗粒度偏低**：`Recipe.getCustomerSuitability` / `Ingredient.calculateTagsWithTrend` 是低层基元，缺少直接对应页面需求的中层聚合函数。
- **保存套餐评估链已收口，但仍需防回退**：运行主线使用 shared helper 与容量 `256` 的 runtime cache；不要再引入 store-local `savedMealRatingCache` 或 render 期命令式评估 action。

---

## 四、技术约束

1. **`@davstack/store` 的 computed builder 是一层扁平 key，而不是嵌套命名空间**：`recipeTablePagedRows` 这类扁平命名是合理的。这里的约束来自类型定义本身，而不是“经验建议”。
2. **`@davstack/store` 并非 action/computed 天然互斥，真正需要关注的是链式声明顺序**：当前两个 customer store 都是 `.computed(...).actions(...)`，因此 action 可以使用前面定义的 computed，但 computed 不能依赖后定义的 action。若确实想让 computed 复用 action，要么调整链顺序，要么更推荐先提纯成纯函数，避免把命令式副作用带入派生层。
3. **路由页顾客列表当前依赖 `useThrottle`、`useSearchResult`、`useFilteredData`、`useSortedData` 与 `useSkipProcessItemData`**：如果直接把 `customerFilteredData` / `customerSortedData` 改造成 store computed，默认会改变搜索节流与“跳过处理”语义。这里更适合先抽业务 hook，再决定是否继续下沉。
4. **稀客/普客差异点需要显式保留**：
    - `checkRecipeEasterEgg` ↔ `checkEasterEgg`
    - `CUSTOMER_RARE_TAG_STYLE` ↔ `CUSTOMER_NORMAL_TAG_STYLE`
    - 稀客 save/rating 依赖 order tag、`hasMystiaCooker`、`isDarkMatter`；普客分支明显更轻，且保存套餐里的 `beverage` 允许为 `null`
    - 食材页对“黑暗料理材料”的显示策略不同
    - `suggestedMealCard` 仅稀客存在
    - `bondRewards` 仅稀客 `infoButton` 明显需要
5. **推荐配置分散在两个 store**：`customerRareStore.shared.suggestMeals` 承载当前选择值与 `selectableMaxResults`；但 `selectableMaxExtraIngredients` / `selectableMaxRatings` 仍保留在 `globalStore.shared.suggestMeals`。如果要把推荐卡片 view-model 彻底推进 customer store，需要额外同步这两类配置，或保留 hook 层做跨 store 组合。
6. **保存套餐列表的 reorder 基于“可见顺序 -> 原始数据索引”映射**：后续无论 store computed 还是 hook view-model，都必须保留 `dataIndex` / `visibleIndex` 语义，不能只返回一份已经压平的新数组。
7. **`document.title` / `MutationObserver` 仍应停留在 hook 层**：这类 DOM 副作用不适合放进 computed。
8. **高成本派生默认不直接进 store computed**：`suggestedMealCard` 与 tab 大表流水线涉及多维筛选/排序与跨实例计算，若推进 computed，必须先定义重算触发面与性能预算（至少确认输入依赖最小化、列表规模与重算时机）。

---

## 五、重构计划（6 阶段，可独立 PR）

### 阶段 0：奠基（无功能变化，纯函数下沉）

> 仓库目前**没有引入测试框架**（无 `pnpm test` script、无 vitest/jest 依赖）。本计划遵循现状，不强制新增测试栈；通过 `pnpm exec tsc --noEmit` + `pnpm lint` + 人工冒烟回归来兜底。如未来引入 vitest，可补回归测试。

目标目录：`app/utils/customer/shared/`（当前已承接稀客 / 普客共享算法、保存套餐评估、可见保存套餐过滤、额外食材裁剪等 helper）

建议新增文件：

- `buildRecipeSuitabilityRows.ts`：吸收 recipe table 的 suitability + filter + sort 输入输出，但先不负责 UI column / toolbar。
- `buildBeverageSuitabilityRows.ts`
- `getIngredientScoreChanges.ts`
- `getVisibleSavedMeals.ts`
- `evaluateSavedMeals.ts`：以纯函数形式替代渲染期直接调 action。
- `buildSelectionTip.ts`：先服务稀客页。
- `buildTagTooltip.ts`
- `getBondRewards.ts`：先服务稀客页。
- `filterCustomerData.ts` / `filterIngredientData.ts`：如果阶段 1 采用业务 hook 方案，可先把纯过滤逻辑拆出来，hook 继续负责 throttle / useMemo / useSkipProcessItemData。

实现策略：

- 先把现有视图层片段“原样搬下去”，去掉 React/store 依赖，暴露纯函数签名。
- 本阶段只新增文件，不改旧调用点。
- `evaluateSavedMeals.ts` 可以直接一并引入“有 size 上限的 Map”，但先不切换调用点。

风险：低。

### 阶段 1：先建稳定的 state / view-model 载体

#### 1A. store computed：适合放进 customer store 的派生状态

在 `app/stores/customer-rare.ts` 与 `customer-normal.ts` 中新增扁平 computed key：

- 表格类：`recipeTableSortedRows` / `recipeTablePagedRows` / `beverageTableSortedRows` / `beverageTablePagedRows`
- 评分类：`ingredientScoreChanges`
- 保存类：`savedCustomerMealsWithEvaluation`
- 套餐展示类：`currentMealPrice`，必要时再补 `currentMealDisplayMeta`
- 文案类：`unsatisfiedSelectionTip` 优先落在稀客 store；普客页可后置
- 稀客专属：`bondRewards`

#### 1B. 业务 hook：适合保留在页面层的 route view-model

已新增：

- `useCustomerRouteData()`：封装 `useThrottle` + `useSearchResult` + `useFilteredData` + `useSortedData`
- `useIngredientRouteData()`：封装食材过滤/排序流水线
- `useDocumentTitle()`：抽标题与 `MutationObserver`

`customerFilteredData` / `customerSortedData` 优先抽成业务 hook，而不是直接推进 store computed；先保留当前节流与 skip-process 行为，再视收益决定是否继续下沉。

#### 1C. 推荐卡片 view-model：优先 hook，再评估是否补 store 节点

已新增 `useSuggestedMealsViewModel()`，负责：

- `isActive`
- `suggestions`
- `visibility`
- `currentRecipe -> default cooker` 同步

是否再把其中纯派生部分推进 store computed，可在该 hook 稳定后再决定。

风险：中。这里的风险主要不是类型问题，而是“改动后交互语义是否与当前页面一致”。

### 阶段 2：视图组件削薄（每文件独立 PR）

按依赖顺序：

1. `recipeTabContent.tsx` / `beverageTabContent.tsx`（稀客 + 普客 4 个文件）
    - 删除 suitability/filter/sort/page `useMemo`
    - 改读 `customerStore.recipeTablePagedRows.use()` / `beverageTablePagedRows.use()`
2. `ingredientTabContent.tsx`（2 文件）
    - render 内改为 `scoreChanges.get(name)`
    - 是否顺带把“可见食材列表”也从 prop 改为 hook/store 视阶段 1 实际落地结果决定
3. `savedMealCard.tsx`（2 文件）
    - 改读 `savedCustomerMealsWithEvaluation`
    - 删除渲染期 IIFE 调 action
    - 保留 `dataIndex` 用于移动顺序
4. `suggestedMealCard.tsx`（仅稀客）
    - 改读 `useSuggestedMealsViewModel()`
5. `resultCard.tsx` / `customerCard.tsx`
    - 稀客优先替换 `selectionTip` / `currentMealPrice` / `displayMeta`
    - 普客保留简单静态文案即可，不强行为了对称而引入额外抽象
6. `infoButton.tsx`
    - 稀客改读 `bondRewards` 或 `getBondRewards`
    - 普客仅做必要清理，不要求接 `bondRewards.use()`
7. `[[...paths]]/content.tsx`（2 文件）
    - 切换到 `useCustomerRouteData()` / `useIngredientRouteData()`
    - 切换到 `useDocumentTitle()`

### 阶段 3：沿现有共享基础继续合并

现状不是“完全没有共享”，而是“已经共享了一小部分但不成体系”。因此阶段 3 建议改为：

- 先提取共享子块，而不是直接合并整张大卡。
- 可优先考虑：
    - `RecipeTabContent` / `BeverageTabContent` 这类同构度最高的 tab body
    - `IngredientTabContent` 中共用的渲染骨架
    - `SavedMealRow` / `IngredientsList` / rating avatar 这类复用片段
- 继续复用现有：
    - `InfoButtonBase`
    - `Plus` / `UnknownItem`
    - 共享 props type

注意：`customerCard` / `resultCard` 是否要完全合并，应在阶段 2 之后重新评估。稀客/普客在 save/rating/meta 规则上的差异明显，只有在收益明确时才继续整合。

### 阶段 4：领域单例升级

- `Recipe`
    - `buildRecipeSuitabilityRows(args)`
- `Beverage`
    - `buildBeverageSuitabilityRows(args)` 仅在确认要把 `Beverage` 一并纳入领域升级时再做，否则继续保留在纯函数层
- `CustomerRare`
    - `getDisplayMeta(name)`
- `CustomerNormal`
    - 可加 `getDisplayMeta(name)`，但允许字段子集不同
- `getIngredientScoreChanges(args)`
    - 继续保留在 shared helper / ingredient scoring 层，不作为 `Recipe` 的既定升级项；这条链路同时依赖 Ingredient 趋势标签、Recipe 分差与 rare easter egg 规则，属于跨 aggregate 组合能力

旧基元方法保留，必要时标注内部用途。

### 阶段 5：清理与防退化

- 删除被新 view-model 取代的旧 `useMemo` 与渲染期 IIFE。
- 可选后续门禁：给 `app/(pages)/customer-{rare,normal}/**/*.tsx` 加 ESLint 限制（当前尚未落地，不计入阶段 5 完成态）：
    - 不允许直接调用 `instance_*.calculate*` / `compose*` / `getCustomerSuitability` / `checkIngredientEasterEgg`
    - 不允许在页面层直接 `curry` / `curryRight` 业务函数
    - 不允许在页面层直连 `suggestMeals` / `getScoreBasedAlternatives` 这类推荐算法入口
- 保存套餐评估缓存已由 `app/utils/customer/shared/evaluateSavedMeals.ts` 内的 bounded runtime cache 负责；旧 store-local `savedMealRatingCache` 已删除。
- 更新 repo memory：明确“页面优先消费 view-model；业务计算优先沉到 `utils/customer/shared`、store computed 或业务 hook”。

---

## 六、预期收益

- 稀客/普客 tab 类组件（`recipeTabContent` / `beverageTabContent` / `ingredientTabContent`）明显削薄，复杂度主要下降在 suitability 与 score change 计算层。
- 路由壳组件不再同时承担路径同步、标题副作用、顾客列表过滤/排序、食材列表过滤/排序四类职责。
- 推荐卡片从“直接调算法的视图组件”变成“消费推荐 view-model 的视图组件”。
- `savedMealCard` 不再在渲染期做评分计算，缓存也具备显式上限。
- 稀客/普客的共享会更像“共享子块 + 薄壳差异注入”，而不是过早做整组件大一统。

---

## 七、执行追踪（PR 拆分清单）

> 每条对应一个 PR；阶段 0 / 1 完成后，视图层 PR 可以并行，但建议优先吃掉 tab 表格与保存套餐链路。
>
> 本节只保留总纲级 PR 编排；各阶段内部更细的子 PR 编号、接口边界与回归点，以对应阶段子文档为准。

### 阶段 0：纯函数下沉

- [x] PR-0.1 抽 `getIngredientScoreChanges`
- [x] PR-0.2 抽 `buildRecipeSuitabilityRows`
- [x] PR-0.3 抽 `buildBeverageSuitabilityRows`
- [x] PR-0.4 抽 `getVisibleSavedMeals` + `evaluateSavedMeals`（含 size 上限缓存）
- [x] PR-0.5 抽 `buildSelectionTip` / `buildTagTooltip` / `getBondRewards`
- [x] PR-0.6 抽 `filterCustomerData` / `filterIngredientData` 纯函数（若阶段 1 采用业务 hook 方案）

### 阶段 1：state / view-model

- [x] PR-1.1 store computed：`recipeTableSortedRows` / `recipeTablePagedRows` / `beverageTableSortedRows` / `beverageTablePagedRows`
- [x] PR-1.2 store computed：`ingredientScoreChanges` / `savedCustomerMealsWithEvaluation` / `currentMealPrice`
- [x] PR-1.3 稀客派生：`unsatisfiedSelectionTip` / `bondRewards` / 推荐 view-model 第一版
- [x] PR-1.4 业务 hook：`useCustomerRouteData()` / `useIngredientRouteData()`
- [x] PR-1.5 通用副作用 hook：`useDocumentTitle()`

### 阶段 2：视图削薄

- [x] PR-2.1 改造 `recipe/beverage TabContent`（稀客 + 普客，共 4 文件）
- [x] PR-2.2 改造 `ingredientTabContent`（2 文件）
- [x] PR-2.3 改造 `savedMealCard`（2 文件）
- [x] PR-2.4 改造 `suggestedMealCard`（仅稀客）
- [x] PR-2.5 改造稀客 `resultCard` / `customerCard`，普客仅做必要清理
- [x] PR-2.6 改造稀客 `infoButton`，普客仅做必要清理
- [x] PR-2.7 改造 `[[...paths]]/content.tsx`（2 文件）

### 阶段 3：共享子块与组件合并

- [x] PR-3.1 整理 shared surface（thin re-export barrel + 切换 normal 与跨页消费方）
- [x] PR-3.2 提取稀客/普客 tab body / table shell 共享层（`CustomerTableShell` + `CustomerTablePagination`）
- [x] PR-3.3 提取当前套餐 `currentMealIngredientsList` 共享展示
- [x] PR-3.4 提取 saved meal 共享条带（`savedMealIngredientStrip` / `savedMealActionRail` / `MoveButton`）
- [x] PR-3.5 提取 ingredient tab 共享 skeleton（`IngredientTabShell` / `IngredientTabGrid` / `IngredientTabItemPresenter`）
- [x] PR-3.6 提取 `RatingAvatarShell`（rare/normal customerCard 与 savedMealCard 复用）
- [x] PR-3.7 InfoButton 低强度收口（仅抽中性 `infoButtonSectionTitle` 片段）

### 阶段 4：领域升级

- [x] PR-4.1 `Recipe` 增 `buildRecipeSuitabilityRows`
- [x] PR-4.2 `CustomerRare` 增 `getDisplayMeta`
- [x] PR-4.3 `CustomerNormal` 增 `getDisplayMeta`
- [x] PR-4.4 `Beverage` 增 `buildBeverageSuitabilityRows`（可选项）

### 阶段 5：清理与防退化

- [x] PR-5.1 删除页面层旧入口与死代码（含两个 page-local `useCustomerRouteData.ts` 死副本）
- [x] PR-5.2 切换 saved-meal 评分到 shared helper + bounded runtime cache，并清理 store-local `evaluateSavedMealResult` / `savedMealRatingCache` 遗留实现
- [x] PR-5.3 完成进度文档与 repo memory 收尾回写

### 阶段 6：阶段 5 之后的后置补遗（非主路径，详见 [07-阶段6-补遗.md](./07-阶段6-补遗.md)）

- [ ] PR-6.1 store factory（已完成排序状态机子切口；`available*` computed 当前不单列推进）
- [x] PR-6.2 customerTab 纯视图壳共享化（beverage / recipe toolbar+cell 当前跳过）
- [x] PR-6.3 resultCard / savedMealCard / customerCard 小共享（已完成 `useAutoHideTooltip` / `swapSavedMeals`；`CustomerDlcPill` 当前跳过）
- [x] PR-6.4 `useCustomerRouteData` 提升与剩余 view 派生收口（已完成 hook 上提；`currentBeverageTags` computed / `suggestMeals` 携 `isDarkMatter` 当前跳过）
- [x] PR-6.5 低优收尾（已完成 `getRatingKey` 重命名与 `getRestExtraIngredients`；`useIngredientTabPrelude` 当前跳过）

本次分支复审核对出的已知 findings 已按最小切口收口；其余低收益候选在 latest code 下复核后继续跳过。

实施参考：见 [08-实施风格与约定.md](./08-实施风格与约定.md)。

---

## 八、回归与回滚预案

- 阶段 0 仍是纯增量，回滚成本最低。
- 阶段 1 中，store computed PR 风险相对可控；业务 hook PR 需要重点确认“搜索节流”和“跳过处理”语义没有变化。
- 阶段 2 每个 PR 独立改造一个文件/组件，回滚粒度自然。建议每个 PR 至少通过：
    1. `pnpm exec tsc --noEmit`
    2. `pnpm lint`
    3. 手工冒烟测试稀客页：选稀客 → 选料理 → 选酒水 → 加额外食材 → 切换流行趋势 / 明星店 → 查看推荐套餐可见性 → 保存套餐 → 移动已保存套餐顺序 → 观察评分一致性。
    4. 手工冒烟测试普客页：选普客 → 选料理 → 可选酒水 → 加额外食材 → 保存套餐 → 移动已保存套餐顺序 → 观察评分一致性。
    5. 手工验证顾客路由页：搜索节流、额外包含/排除、隐藏 DLC、食材筛选、标题更新。
- 阶段 3 风险最高，尤其是 card 类组件。建议只在阶段 2 稳定后再判断是否继续整合。
- 阶段 5 缓存替换优先手写有上限的 Map（FIFO/LRU 二选一），避免为此引入新依赖。
