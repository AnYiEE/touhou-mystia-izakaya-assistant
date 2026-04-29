# CodeRabbitAI 复审（2026-04-29）

## 范围

- 复审对象：PR #30 `Dev/UI logic decoupling` 中 CodeRabbitAI 的报告。
- 数据来源：VS Code GitHub PR 工具拉取的 active PR 数据。
- 排除规则：已被手动 resolve 的 CodeRabbitAI review threads 不纳入处理清单。
- 本轮纳入：未 resolved CodeRabbitAI review threads 13 条；另有 timeline 中 1 条 outside-diff actionable comment 因不在 reviewThreads 中、无 resolved 状态可读，按未处理意见单独纳入复核。
- 初版只做审查与记录；随后已按用户要求处理“建议采纳”和“可选采纳”中的修复项。

## 总结

- 建议采纳或按调整版采纳：8 条。
- 可选采纳：1 条。
- 不建议采纳或当前无需处理：5 条。
- 其中明确属于当前分支行为/健壮性风险的主要问题：`infoButtonBase` 的 render-time DOM 访问、禁用移动按钮仍触发点击路径、bounded cache 对 `undefined` key 的淘汰缺陷、无顾客/无标签分支绕过 hidden/table filters、非法顾客路径首屏重定向被跳过。

## 本轮追加处理状态

- 已处理建议采纳项：#2、#3、#5、#7、#9、#10、#12、#14。
- 已处理可选采纳项：#4。
- 保持不处理项：#1、#6、#8、#11、#13，理由见下方“不建议采纳或当前无需处理”。
- 本轮代码修复覆盖：client-side modal portal 获取、disabled move button 点击保护、document title 前缀保护、bounded cache 淘汰判断、recipe/beverage table helper 统一过滤、SortDescriptor 类型表达、saved meal 交换索引校验、rare/normal 非法顾客路径首屏回退。

## 建议采纳

| #   | 位置                                                                                 | CodeRabbitAI 观点                                                                                     | 判断                                                                                                                                                              | 建议动作                                                                                                                               |
| --- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 2   | `app/(pages)/customer-shared/infoButtonBase.tsx`                                     | 缺少 `use client`，且 JSX 中直接 `document.querySelector(...)`                                        | 部分正确且需要处理。缺少 `use client` 不一定单独导致当前页面崩溃，因为上层可能已经处在 client boundary；但 render 路径直接访问 `document` 是真实 SSR/预渲染风险。 | 采纳调整版：给 shared entry 补 `use client` 更稳；把 portal container 改为受保护的 client-side 值，避免 JSX render 直接读 `document`。 |
| 3   | `app/(pages)/customer-shared/moveButton.tsx`                                         | `isDisabled` 只是视觉禁用，点击仍执行                                                                 | 正确。当前无效移动最终会被 `swapSavedMeals` 拦住，但仍会触发点击路径和上层 `vibrate()`，禁用语义不完整。                                                          | 采纳：禁用时阻止 `onClick`，并补 `aria-disabled` / disabled class 语义。                                                               |
| 5   | `app/hooks/useDocumentTitle.ts`                                                      | `pathnamePrefix` 未保护首次标题写入                                                                   | 正确。observer 内有前缀保护，但 effect 入口仍立即写 `document.title`，路由切换边界可能短暂覆盖其他页面标题。                                                      | 采纳：effect 开头先判断 `pathnamePrefix`，不匹配时直接返回。                                                                           |
| 7   | `app/utilities/createBoundedRuntimeCache.ts`                                         | `oldestKey !== undefined` 会误处理合法的 `undefined` key                                              | 正确。当前实际 cache key 多为 string，但 helper 是泛型，`Map` 合法支持 `undefined` key；现实现会在最老 key 为 `undefined` 时跳过淘汰。                            | 采纳：使用 iterator result 的 `done` 判断，而不是用 key 值判断。                                                                       |
| 9   | `app/utils/customer/shared/buildBeverageSuitabilityRows.ts`                          | `customerBeverageTags == null` 分支绕过 hidden/search/DLC/tag filters                                 | 正确，但属于行为修正而非相对 `master` 的单纯回归。`master` 在无顾客时也基本直接返回 DLC 过滤后的全量 rows；不过 hidden beverages 和表格筛选不应依赖顾客是否存在。 | 建议采纳：suitability 可保持 0，但 hidden/table filters 应统一执行。若目标是严格保持 `master` 的无顾客行为，则需产品侧确认后再改。     |
| 10  | `app/utils/customer/shared/buildRecipeSuitabilityRows.ts`                            | `customerPositiveTags == null` 分支绕过 hiddenIngredients/hiddenRecipes/search/DLC/cooker/tag filters | 正确，判断同 #9。hidden recipes/ingredients 与表格筛选是 table-layer 语义，不应被无顾客分支跳过。                                                                 | 建议采纳：先构造 suitability=0 rows，再统一执行 hidden/table filters。若担心改变无顾客页行为，应作为有意识行为修正记录。               |
| 12  | `app/utils/customer/shared/types.d.ts`                                               | `ITableSortDescriptor<T>` extends `SortDescriptor` 后把 required `column/direction` 改成 optional     | 正确。实际安装的 `@react-types/shared` 中 `SortDescriptor` 的 `column` 和 `direction` 是必填；当前项目因 `skipLibCheck`/d.ts 检查口径未报错，但类型表达不干净。   | 采纳：用 `Omit<SortDescriptor, ...>` 去掉原 `column/direction` 后再重加可选字段。                                                      |
| 14  | `app/(pages)/customer-normal/[[...paths]]/content.tsx` timeline outside-diff comment | `isFirstRendering` 首帧 return 可能跳过非法顾客路径 redirect                                          | 正确。当前 rare/normal 两侧都有同样结构：首次渲染直接 return；若从非法路径直达且 store 初值已为 `null`，后续可能没有第二次触发 redirect。                         | 采纳并扩大到 rare/normal 两侧：非法路径回退逻辑不应被首帧 guard 跳过，只跳过真正需要延迟的副作用。                                     |

## 可选采纳

| #   | 位置                                            | CodeRabbitAI 观点                                                              | 判断                                                                                                                        | 建议动作                                                          |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 4   | `app/(pages)/customer-shared/swapSavedMeals.ts` | 用元素值是否为 `undefined` 判断 dataIndex 有效性，可能误伤 `TMeal = undefined` | 部分正确。当前业务保存套餐数组不应包含 `undefined` meal，因此没有实际行为风险；但作为泛型 helper，按 index 边界判断更准确。 | 可选采纳：改成 dataIndex 范围校验，再交换元素。低风险、低优先级。 |

## 不建议采纳或当前无需处理

| #   | 位置                                                     | CodeRabbitAI 观点                                     | 判断                    | 理由                                                                                                                                                                                                                                                                           |
| --- | -------------------------------------------------------- | ----------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `app/(pages)/customer-rare/savedMealCard.tsx`            | 空数组会渲染空白卡片，应检查 `length === 0`           | 误判/已由当前代码兜住。 | `savedCustomerMealsWithEvaluation` 在可见保存套餐为空时返回 `null`；组件入口已检查 `savedCustomerMeals === null`，所以 `currentCustomerMeals=[]` 或全部被 hidden DLC 过滤时不会进入空卡片分支。normal 侧同理。                                                                 |
| 6   | `app/hooks/useSuggestedMealsViewModel.ts`                | `currentRecipeData` 依赖会在加减配料时重置建议厨具    | 当前无需处理。          | `currentRecipeData !== null` 时厨具选择控件本身不显示；effect 把推荐厨具保持为当前料理默认厨具，符合既有行为，且 `master` 也是按整个 `currentRecipeData` 依赖。把依赖收窄到 recipe name 可减少无意义写入，但不是必要修复。                                                     |
| 8   | `app/utils/customer/customer_rare/index.ts`              | `places`/`price` 缺少运行时校验                       | 当前无需处理。          | `price` 类型已是 `[number, number]` tuple；数据源是受控静态数据。`places` 若要强化，应优先从数据类型约束为非空数组，而不是在 display meta 层临时兜底。                                                                                                                         |
| 11  | `app/utils/customer/shared/getIngredientScoreChanges.ts` | 流行修正重复计算                                      | 不建议在本 PR 采纳。    | 当前实现基本继承 `master` 中 rare ingredient tab 的计算链；改变这条链会影响评分变化、order tag 和 large partition 判定，属于算法语义变更，不应在逻辑解耦收尾中无测试地改。若怀疑原算法有领域 bug，应另开专项对照 evaluate/suggest/table 三条链。                               |
| 13  | `app/utils/food/recipes.ts`                              | `easterEggScore === 0` 应视为中立，而不是 `-Infinity` | 不建议采纳当前方向。    | `master` 的 recipe table 也是 `easterEggScore > 0 ? Infinity : -Infinity`；`evaluateMeal` 中 score 0 会映射到最低评级。这里保持“固定最低评级”语义更符合现有表格/评级链。CodeRabbit 指出的 `suggestMeals.ts` 与此不一致值得另行核查，但不应反向把 table/evaluate 语义改成中立。 |

## 需要注意的差异点

- #9/#10 如果采纳，会改变无顾客状态下表格过滤行为。这个变化从产品语义上更合理，但不是 `master` 到当前分支的纯回归修复，实施时应在提交说明或复审记录里标注。
- #13 暴露的是“建议菜算法”和“表格/评级算法”对 score 0 彩蛋语义不一致。当前更可信的基线是表格和 evaluate 链，建议不要按 CodeRabbit 的方向直接改 `recipes.ts`。
- #14 来自 timeline outside-diff comment，不在 reviewThreads 中，因此无法读取 GitHub resolved 状态。本报告因其仍出现在 CodeRabbit actionable summary 且当前代码仍存在同构风险，将其纳入待处理建议。

## 建议后续处理顺序

1. 先处理真实运行时/交互风险：#2、#3、#5、#7、#14。
2. 再处理 table-layer 一致性：#9、#10，并明确是否接受无顾客状态行为变化。
3. 再处理类型/泛型卫生：#12，按需要附带 #4。
4. 暂不处理 #1、#6、#8、#11、#13；其中 #11/#13 若要继续，需要单独算法回归设计。

## 验证建议

- 代码修复后至少运行 `pnpm exec tsc --noEmit` 和针对改动文件的 ESLint。
- 若采纳 #9/#10，手工核对顾客未选中与已选中两种状态下的 recipe/beverage hidden item、搜索、DLC、tag/cooker 筛选。
- 若采纳 #14，手工直达 `/customer-rare/<非法名>` 与 `/customer-normal/<非法名>`，确认首屏会回退列表页。
- 若未来重访 #11/#13，需要补一组领域对照用例：普通彩蛋、score 0 彩蛋、Dark Matter、large partition、popular trend、suggested meals。

## 本轮验证结果

- `pnpm exec tsc --noEmit --pretty false`：通过。
- 定向 ESLint：通过，覆盖本轮修改的 TS/TSX 文件。
- `pnpm lint`：通过，0 errors / 10 warnings；warnings 均为既有 `onClick` deprecated 项。
- `pnpm build`：通过，静态页面生成 `137/137`；仍保留既有 Sass `@import` deprecation 与同类 `onClick` warnings。
- `git diff --check`：无空白错误，仅 Git 的 LF 到 CRLF 提示。
- Markdown diagnostics：本报告无错误；表格列数已复查。
