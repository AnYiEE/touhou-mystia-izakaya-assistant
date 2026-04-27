# 阶段 1：state 与 view-model 承接

## 目标

- 基于阶段 0 已下沉的纯函数，建立稳定的派生承接层。
- 把适合长期停留在 store 的数据派生收敛到 customer rare / normal store computed。
- 把依赖 throttle、skip-process、DOM 副作用或跨 store 组合的节点，先收敛为业务 hook。

## 非目标

- 不在本阶段直接做大规模 JSX 削薄。
- 不把 route 级业务 hook 强行推进 store computed。
- 不为了稀客 / 普客对称，提前合并本来就不等价的派生节点。

## 当前状态

- 状态：已完成
- 已完成：PR-1.1、PR-1.2、PR-1.3、PR-1.4、PR-1.5
- 下一步：阶段 2
- 当前基线验证：`pnpm exec tsc --noEmit` 通过；`pnpm lint` 0 error / 12 warnings（现有 `onClick` deprecation warnings，非本轮新增）；`pnpm build` 通过，静态页 `137/137`

## 承接原则

### 进入 store computed 的条件

- 输入完全来自当前 customer store 已有状态或可稳定注入的纯数据。
- 输出主要是“表格行 / 评分结果 / 套餐评估结果 / 展示元数据”这类可复用派生值。
- 不依赖 DOM、副作用、节流计时器或 `useSkipProcessItemData`。
- 单次重算复杂度可控（需明确依赖面与触发频率），避免把高成本流水线直接推进全局 computed。

### 先做业务 hook 的条件

- 仍依赖 `useThrottle`、`useSearchResult`、`useFilteredData`、`useSortedData`、`useSkipProcessItemData`。
- 或者同时跨读多个 store、持有局部 transient state、维护副作用。
- 或者只应服务 route 容器和页面壳组件，而不是全局派生节点。
- 或者属于高频交互 + 大列表场景，优先在 hook 层保持可控重算和局部缓存策略。

## 推荐顺序

1. PR-1.1：`recipeTableSortedRows` / `recipeTablePagedRows` + `beverageTableSortedRows` / `beverageTablePagedRows`
2. PR-1.2：`ingredientScoreChanges` + `savedCustomerMealsWithEvaluation` + `currentMealPrice`
3. PR-1.3：`unsatisfiedSelectionTip` + `bondRewards` + `useSuggestedMealsViewModel`
4. PR-1.4：`useCustomerRouteData` + `useIngredientRouteData`
5. PR-1.5：`useDocumentTitle`

## 阶段 1 统一实施约束

> 除本阶段文档外，统一参考 [08-实施风格与约定.md](08-实施风格与约定.md)。若二者冲突，以“阶段 1 先稳定派生承接层，不提前做大规模视图削薄”的边界约束优先。

### 实施前检查

1. 当前节点是否真的适合进入 store computed；如果它仍依赖节流、跨 store 组合、浏览器副作用、局部 transient state 或 `useSkipProcessItemData`，则应先停在业务 hook。
2. 当前节点是否会因为“追求 rare / normal 对称”而把本来就不等价的派生逻辑硬揉到一起？若会，应保留分叉实现。
3. 若准备落到 computed，是否已经明确依赖面、重算频率和消费者范围，避免把高成本流水线直接推进全局 store？
4. 若准备落到 hook，是否已经明确它服务的是 route 容器 / 页面壳，而不是再次长成半页面半 store 的混合层？

### 编码中约束

1. store computed 只产出可复用数据派生、table rows、展示元数据或稳定读写包装，不承接 JSX、事件处理器、Tooltip / Popover 配置和 DOM 结构。
2. 业务 hook 继续使用 `use*` 命名与命名导出；若 hook 使用 client hooks、浏览器 API 或 DOM 访问，文件应显式保留 `use client`。
3. 新增 store helper、view-model helper 与共享派生函数时，优先走现有 alias 与统一出口；不要通过新的 normal -> rare 或 rare -> normal 页面横向 import 组织复用。
4. 若 store 当前仍依赖 `app/(pages)/**` 中的类型、常量或排序描述符，应先提升这些依赖到稳定层，再继续推进 computed 与 store helper，避免层次继续倒挂。
5. 若一个 helper 已具备跨 customer store 复用价值，优先放到 `app/stores/utils/`、`app/hooks/` 或既定 shared surface，而不是继续塞回某个页面文件。
6. 对象键、解构键、import 组内成员顺序应一开始就满足 lint；派生节点命名延续 `available*`、`current*`、`*Table*`、`use*ViewModel` 等现有习惯。
7. 编码过程中继续匹配当前仓库格式输出：tabs、单引号、无分号、`import type` / inline `type` 区分、Tailwind class 顺序交给 Prettier。
8. 若节点仍需兼容旧消费面，应优先通过薄包装或兼容导出过渡，而不是在首版同时改写所有消费者。

### 提交前检查

1. 新增 computed 是否没有把缓存策略、浏览器副作用和局部 UI 状态直接耦进 store 语义内部？
2. 新增 hook 是否没有重新拼回大量页面级 view-model、重复过滤流水线或 store 已可稳定承接的派生？
3. 是否没有继续引入 store / stores utils / global 对 page 层的反向依赖；若已抽出稳定类型与常量，旧依赖是否同步收口？
4. 是否满足当前 TS 严格门槛，没有留下未使用参数、未使用变量和不必要的 side-effect import？
5. 是否没有新增跨页面目录横向 import，也没有为 `@/components` 人工制造新的总 barrel？
6. rare / normal 已有行为差异是否保持不退化，例如彩蛋钳制、Dark Matter、保存套餐映射、推荐逻辑激活条件等？
7. 若引入新 Web API 或浏览器能力，是否确认过 compat 与 polyfill 约束？
8. 若新增 shared surface、store helper 或业务 hook 出口，是否同步更新 barrel、阶段文档与后续消费者说明？

## PR-1.1：表格类 computed

### 节点

- `recipeTableSortedRows`
- `recipeTablePagedRows`
- `beverageTableSortedRows`
- `beverageTablePagedRows`

### 来源

- `app/(pages)/customer-rare/recipeTabContent.tsx`
- `app/(pages)/customer-normal/recipeTabContent.tsx`
- `app/(pages)/customer-rare/beverageTabContent.tsx`
- `app/(pages)/customer-normal/beverageTabContent.tsx`

### 未来消费者

- 两个 recipeTabContent
- 两个 beverageTabContent

### 承接层

- 进入 customer rare / normal store computed。

### 边界

- 只承接表格行构建、业务过滤、排序、分页前后的数据派生。
- 表头列、toolbar、pagination 组件配置仍留在页面组件。

### rare / normal 差异

- recipe：必须保留稀客 `checkRecipeEasterEgg` 与普客 `checkEasterEgg` 的差异。
- recipe：必须保留稀客正负标签双向计算，普客仅正标签。
- beverage：计算层基本可共用，差异主要留在渲染层标签样式。

### 建议输入

- 当前顾客上下文。
- 隐藏项、搜索条件、过滤条件、排序参数、分页参数。
- 阶段 0 输出的 rows 构建纯函数。

### 建议输出

- `recipeTableSortedRows`
- `recipeTablePagedRows`
- `beverageTableSortedRows`
- `beverageTablePagedRows`
- 需要时可配套 `recipeTableTotalPages` / `beverageTableTotalPages` 一类附属派生，但不强制在首版落地。

### 必须保留的行为

- 无顾客时仍返回全量数据，`suitability = 0`。
- recipe 行上的 trend 标签仍按现状覆盖到行数据中。
- `Infinity` / `-Infinity` 继续用于彩蛋评级钳制。

### 执行约束

- 如果把 UI 结构一起卷进 computed，会让 store 节点重新长成 JSX 配置仓库。
- 如果 recipe 与 beverage 一次改太多，四个 TabContent 难以同时回归。

### 非目标

- 不在这一步处理 route 容器的搜索节流。

### 本轮落地记录

- `getSearchResult` 已稳定下沉到 `app/utilities/getSearchResult.ts`，`useSearchResult` 改为复用该纯函数，避免 store 反向依赖 hook 模块。
- `customer-rare` / `customer-normal` store 已新增 `recipeTableSortedRows`、`recipeTablePagedRows`、`beverageTableSortedRows`、`beverageTablePagedRows`，内部复用阶段 0 的 shared rows builder。
- 四个 TabContent 已切到消费 store computed；页面仍保留 toolbar、列定义、排序交互与 pagination 组件责任。
- 本轮没有强行加入 `recipeTableTotalPages` / `beverageTableTotalPages` 等附属派生，保持 PR-1.1 为最小可验证切口。

## PR-1.2：评分、保存套餐与套餐展示派生

### 节点

- `ingredientScoreChanges`
- `savedCustomerMealsWithEvaluation`
- `currentMealPrice`
- `currentMealDisplayMeta` 作为同线增强项，不阻塞首版

> 规划备注（当前未实施）：`currentMealDisplayMeta` 暂定为可选增强项，不阻塞 `currentMealPrice` 首版落地；是否继续推进为 store computed，待阶段 2 实际改造后再决策。

### 来源

- `app/(pages)/customer-rare/ingredientTabContent.tsx`
- `app/(pages)/customer-normal/ingredientTabContent.tsx`
- `app/(pages)/customer-rare/savedMealCard.tsx`
- `app/(pages)/customer-normal/savedMealCard.tsx`
- `app/(pages)/customer-rare/resultCard.tsx`
- `app/(pages)/customer-normal/resultCard.tsx`
- `app/stores/customer-rare.ts`
- `app/stores/customer-normal.ts`

### 未来消费者

- 两个 ingredientTabContent
- 两个 savedMealCard
- 稀客 resultCard
- 如有需要，稀客 savedMealCard 可复用 `currentMealDisplayMeta`

### 承接层

- 进入 customer rare / normal store computed。

### 边界

- `ingredientScoreChanges` 只承接评分 Map，不连带可见食材列表。
- `savedCustomerMealsWithEvaluation` 同时承接可见性、评估结果与索引映射。
- `currentMealPrice` 先单独落地；`currentMealDisplayMeta` 作为稀客 resultCard 的增强展示元数据后置。

### rare / normal 差异

- `ingredientScoreChanges`：rare 保留 dark ingredient、彩蛋、Dark Matter 钳制；normal 仅消费评分结果，继续维持当前 dark ingredient 显示策略在组件层。
- `savedCustomerMealsWithEvaluation`：rare 和 normal 必须分叉实现。rare 带 `price`、`isDarkMatter`、点单与夜雀厨具相关状态；normal 更轻且 `beverage` 可为 `null`。
- `currentMealPrice`：稀客价值更高；普客侧暂不要求阶段 1 对称落地。

### 建议输入

- 当前顾客上下文。
- 当前料理 / 酒水 / 额外食材状态。
- hiddenDlcs、hiddenItems 与保存套餐数组。
- 阶段 0 纯函数输出。

### 建议输出

- `ingredientScoreChanges: Map<name, result>`
- `savedCustomerMealsWithEvaluation: Array<{ meal, dataIndex, visibleIndex, evaluation }>`
- `currentMealPrice`
- 可选：`currentMealDisplayMeta`

### 必须保留的行为

- `savedCustomerMealsWithEvaluation` 必须保留 `dataIndex` / `visibleIndex`。
- 普客保存套餐不强行引入 beverage 语义。
- 当前已存在的 saved meal 缓存问题不应在新承接面继续复制；若阶段 1 继续依赖缓存包装，应同步锁定 bounded cache 方案，并保持上限策略位于纯函数包装层而不是 computed 语义内部。

### 执行约束

- 如果把 visible meals 与 evaluation 拆成两个互不感知的 computed，容易丢失重排索引映射。
- 如果 `currentMealDisplayMeta` 先于 `currentMealPrice` 落地，容易把阶段 1 推成 resultCard 大改造。

### 非目标

- 不在这一步调整 ingredient route 过滤。
- 不强行给普客 resultCard 补一套与稀客对称的 display meta。

### 本轮落地记录

- `customer-rare` / `customer-normal` store 已新增 `ingredientScoreChanges`，页面只保留可见列表、点击行为与普客 dark ingredient 分区展示。
- `customer-rare` / `customer-normal` store 已新增 `savedCustomerMealsWithEvaluation`，两个 savedMealCard 已切到消费 store computed，并继续保留 `dataIndex` / `visibleIndex` 语义用于移动与删除。
- 稀客 store 已新增 `currentMealPrice`，稀客 resultCard 的保存套餐价格改为直接读取 computed。
- 本轮直接复用阶段 0 的 `getIngredientScoreChanges`、`getVisibleSavedMeals`、`evaluateRareSavedMeal` 与 `evaluateNormalSavedMeal`，没有把 route 过滤、排序、节流链路一起下沉。

## PR-1.3：稀客专属派生与推荐 view-model

### 节点

- `unsatisfiedSelectionTip`
- `bondRewards`
- `useSuggestedMealsViewModel`

> 规划补充节点（当前未实施）：若阶段 2 推进过程中发现文案派生复用度高，可补充 `unsatisfiedRatingTip` / `unsatisfiedSaveTip` 等细粒度 computed；对外仍以稳定扁平 key 暴露。

### 来源

- `app/(pages)/customer-rare/customerCard.tsx`
- `app/(pages)/customer-rare/resultCard.tsx`
- `app/(pages)/customer-rare/infoButton.tsx`
- `app/(pages)/customer-rare/suggestedMealCard.tsx`

### 未来消费者

- 稀客 customerCard
- 稀客 resultCard
- 稀客 infoButton
- 稀客 suggestedMealCard

### 承接层

- `unsatisfiedSelectionTip`：进入稀客 store computed。
- `bondRewards`：进入稀客 store computed。
- `useSuggestedMealsViewModel`：先做业务 hook，不直接推进 computed。

### 边界

- `unsatisfiedSelectionTip` 只负责“当前还缺什么选择”的文本派生。
- `bondRewards` 只负责羁绊奖励聚合与 `hasBondRewards`。
- `useSuggestedMealsViewModel` 负责推荐卡片的跨 store 输入组合、局部状态、副作用与可见性联动。

### useSuggestedMealsViewModel 应负责

- 读取 `customerRareStore` 与 `globalStore` 中当前推荐所需输入。
- 计算 `isActive`。
- 组织 `suggestions` 数据。
- 维护 `visibility`。
- 处理 `currentRecipe -> default cooker` 同步。
- 维护 `alternativesMap` 这类局部 transient state。
- 保持与 resultCard 占位布局的联动。

### rare / normal 差异

- 这三个节点都先只做稀客，不为普客补对称实现。
- 普客当前只保留简单静态文案与轻量 defaultExpandedKeys 逻辑。

### 建议输入 / 输出

- `unsatisfiedSelectionTip`：输入当前酒水、料理、顾客点单状态、`hasMystiaCooker`、`isDarkMatter`；输出稳定文案结构，至少覆盖 rating / save 两个消费面。
- `bondRewards`：输入当前顾客名、collection 与 bond getters；输出聚合奖励结构与 `hasBondRewards`。
- `useSuggestedMealsViewModel`：输出至少包含 `isActive`、`suggestions`、`visibility`、`alternativesMap`、默认厨具同步结果。

### 必须保留的行为

- `useSuggestedMealsViewModel` 必须继续保留推荐卡与 resultCard 的布局联动。
- `unsatisfiedSelectionTip` 的目标顺序保持“酒水、料理、顾客点单需求”。
- `bondRewards` 继续把当前顾客 collection 视作奖励来源的一部分。

### 执行约束

- 如果把 `useSuggestedMealsViewModel` 强行推进 store computed，会把跨 store 输入、局部状态和副作用全部搅在一起。
- 如果 `bondRewards` 同时卷入 `defaultExpandedKeys`，computed 会掺入 UI 行为判断。

### 非目标

- 不在这一步补普客版 `unsatisfiedSelectionTip`、`bondRewards` 或推荐 view-model。

### 本轮落地记录

- `customer-rare` store 已新增 `unsatisfiedSelectionTip` 与 `bondRewards`，分别复用阶段 0 的 `buildSelectionTip` 与 `getBondRewards`，没有把 tooltip 控制、`defaultExpandedKeys` 等 UI 行为混入 computed。
- `customerCard`、`resultCard`、`infoButton` 已切到消费新派生值，原本页面内联的缺项文案与 bond reward 聚合逻辑已收口。
- 新增 `app/hooks/useSuggestedMealsViewModel.ts`，把 `suggestedMealCard` 顶部的推荐输入组合、默认厨具同步、`visibility` 写回、`alternativesMap` 与懒加载 handler 收口为业务 hook。
- `suggestedMealCard` 仍保留 JSX、选择按钮行为与展示细节；`suggestMeals` 算法本体未改动，resultCard 联动继续依赖 `shared.suggestMeals.visibility`。

## PR-1.4：route 业务 hook

### 节点

- `useCustomerRouteData`
- `useIngredientRouteData`

### 来源

- `app/(pages)/customer-rare/[[...paths]]/content.tsx`
- `app/(pages)/customer-normal/[[...paths]]/content.tsx`

### 未来消费者

- 两个 route content 文件

### 承接层

- 业务 hook，不进入 store computed。

### 边界

- `useCustomerRouteData`：封装顾客 route 页的 throttle、search、过滤、排序与附加包含 / 排除逻辑。
- `useIngredientRouteData`：封装食材 route 页的过滤、排序与 trend 标签增强链路。

### rare / normal 差异

- hook 骨架可共享。
- 注入的数据源、当前 store 与 route 解析上下文分 rare / normal 两套。

### 方案选择建议

- `useIngredientRouteData` 可优先尝试通过 `{ store }` 参数实现 rare/normal 共用，落地在 `app/hooks/`。
- `useCustomerRouteData` 可先保留 rare/normal 各自实现，待差异面稳定后再决定是否上提到 `app/hooks/`。

### 建议输入

- route 参数、当前搜索值、筛选值、排序值。
- 当前数据源。
- 阶段 0 的过滤纯函数。

### 建议输出

- 顾客列表 hook：搜索结果、过滤结果、排序结果、当前节流值或对外只暴露最终结果。
- 食材列表 hook：过滤结果、排序结果，以及必要时对外暴露增强标签链路的中间结果。

### 必须保留的行为

- 顾客路由搜索继续只节流顾客名称，不节流食材。
- 搜索匹配规则保持现有名称 / 去空格名称 / 拼音全串 / 拼音首字母四条路径。
- `useSkipProcessItemData` 在 preview / select 模式下的跳过处理语义不能变。
- `hiddenDlcs` 继续由现有 route 过滤链统一处理，不新增第三套来源。

### 执行约束

- 如果把 route 结果直接推进 store，容易破坏 throttle 与 skip-process 语义。
- 如果 hook 输入输出定义不稳定，后面 route 容器会继续积累临时变量。

### 非目标

- 不在这一步处理 `document.title`。

### 本轮落地记录

- 新增共享 `app/hooks/useIngredientRouteData.ts`，内部继续组合 `useFilteredData`、`useSortedData` 与阶段 0 的 `filterIngredientData`，统一承接 rare / normal route 的食材过滤、排序与 trend 标签增强链路。
- 在 `app/(pages)/customer-rare/[[...paths]]/useCustomerRouteData.ts` 与 `app/(pages)/customer-normal/[[...paths]]/useCustomerRouteData.ts` 分别新增薄业务 hook，继续复用 `useThrottle`、`useSearchResult`、`useFilteredData`、`useSortedData` 与 `filterCustomerData`，只收口顾客搜索、过滤、排序链路。
- rare / normal 两个 `content.tsx` 已切到消费新 hook，原本内联的顾客与食材 route 数据流水线已移出页面容器。
- 路径解析、顾客同步、`document.title` / `MutationObserver`、Tabs 结构、SideButton 配置与右侧卡片组合均保持在容器层，未越界推进到 PR-1.5 或阶段 2。

## PR-1.5：useDocumentTitle

### 节点

- `useDocumentTitle`

### 来源

- `app/(pages)/customer-rare/[[...paths]]/content.tsx`
- `app/(pages)/customer-normal/[[...paths]]/content.tsx`

### 未来消费者

- 两个 route content 文件

### 承接层

- 业务 hook。

### 边界

- 只负责标题更新与 `MutationObserver` 修正。
- 如后续需要，可再补 `useCustomerRouteSync()` 承接路径校验与顾客同步，但不在本节点首版内实现。

### 输入

- 页面标题。
- 可选的路径前缀（决定 `MutationObserver` 仅在该路径下生效，避免离开该 route 后误改标题）。

### 建议签名

- 建议签名为 `useDocumentTitle(title: string, pathnamePrefix?: string)`：通过可选 `pathnamePrefix` 限制修正生效范围，避免离开当前 route 后误改标题。

### 建议输出

- 无需业务数据返回，负责副作用生命周期即可。

### 必须保留的行为

- 继续覆盖第三方或其他逻辑对 `document.title` 的重写。
- rare / normal 两边都维持当前标题修正时机。

### 执行约束

- 如果把路径同步、顾客校验和标题逻辑一次捆死，hook 会重新变厚。

### 非目标

- 不在首版中合并路径解析与顾客同步。

### 本轮落地记录

- 新增共享 `app/hooks/useDocumentTitle.ts`，签名保持为 `useDocumentTitle(title, pathnamePrefix?)`，只承接标题更新与 `MutationObserver` 修正，不混入路径解析或顾客同步。
- `customer-rare/[[...paths]]/content.tsx` 与 `customer-normal/[[...paths]]/content.tsx` 已改为在容器层计算 `title` 并调用 `useDocumentTitle`，原有标题副作用逻辑不再散落在页面中。
- 路径解析、`validateName`、`customerStore.shared.customer.name.set(...)` 与空顾客 redirect 逻辑仍保留在 route content，保持 PR-1.5 与 PR-1.4 的边界分离。

## 稀客 / 普客共用与分叉规则

### 可共用骨架

- recipe / beverage 表格的 filter / sort / page 骨架
- `useCustomerRouteData`
- `useIngredientRouteData`
- `useDocumentTitle`
- saved meal 的可见性与索引映射结构

### 必须保留分叉

- recipe easter egg 判定方式
- ingredient dark item 策略
- saved meal rating / price / dark matter 评估
- `unsatisfiedSelectionTip`
- `bondRewards`
- `useSuggestedMealsViewModel`

## 验收标准

- 每个 store computed 节点都只承接纯数据派生，不含 DOM、副作用或 UI 结构配置。
- route 语义仍由业务 hook 保留：throttle、search、skip-process、hiddenDlcs 不变。
- 稀客专属复杂节点不被写成伪通用接口。
- `savedCustomerMealsWithEvaluation` 保留 `dataIndex` / `visibleIndex`。
- `currentMealDisplayMeta` 若落地，不阻塞 `currentMealPrice` 的首版收敛。

## 当前落地顺序

1. 先做表格类 computed，给四个 TabContent 建稳定消费面。
2. 再做 ingredient / saved meal / current meal 这条数据派生链。
3. 然后只处理稀客专属的 tip、bond rewards、recommendation view-model。
4. 最后再收 route hooks 与标题副作用，避免过早改动容器层语义。
