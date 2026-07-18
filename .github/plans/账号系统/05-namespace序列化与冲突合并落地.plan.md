---
name: Namespace 序列化与冲突合并落地
overview: 账号同步 namespace 的字段白名单、schema version、运行时校验、迁移和合并规则。
isProject: false
---

# Namespace 序列化与冲突合并落地

## 一、目标

- 只同步最终方案声明的字段。
- 每个 namespace 有 serializer、validator、migration、merge。
- 不直接上传完整 store `persistence`。
- `globalStore.persistence.donationModal` 作为账号级交互节奏同步，避免多设备重复触发捐赠提示。
- 合并优先无感，无法安全合并时进入冲突窗口。

## 二、新增文件

| 文件                                                       | 作用                                            |
| ---------------------------------------------------------- | ----------------------------------------------- |
| `app/lib/account/sync/constants.ts`                        | `SYNC_NAMESPACE_MAP`、`SYNC_SCHEMA_VERSION_MAP` |
| `app/lib/account/sync/types.ts`                            | namespace 数据类型                              |
| `app/lib/account/sync/serializers/customerNormalMeals.ts`  | 普客套餐                                        |
| `app/lib/account/sync/serializers/customerRareMeals.ts`    | 稀客套餐                                        |
| `app/lib/account/sync/serializers/customerRarePlans.ts`    | 稀客营业预设（当前 schema v3）                  |
| `app/lib/account/sync/serializers/customerRareSettings.ts` | 稀客设置                                        |
| `app/lib/account/sync/serializers/globalPreferences.ts`    | 全局设置白名单                                  |
| `app/lib/account/sync/serializers/theme.ts`                | 主题                                            |
| `app/lib/account/sync/serializers/tutorialCustomerRare.ts` | 稀客教程                                        |
| `app/lib/account/sync/index.ts`                            | 同步常量与类型统一导出（不导出 serializer）     |

## 三、namespace 清单

| namespace                | 读取来源                                  | 写回目标           | 合并规则                                           |
| ------------------------ | ----------------------------------------- | ------------------ | -------------------------------------------------- |
| `customer_normal.meals`  | `customerNormalStore.persistence.meals`   | 同左               | 纯新增自动合并；删除、排序、重复意图进入人工冲突   |
| `customer_rare.meals`    | `customerRareStore.persistence.meals`     | 同左               | 纯新增自动合并；删除、排序、重复意图进入人工冲突   |
| `customer_rare.plans`    | `customerRareStore.persistence.plans`     | 同左               | 可靠基线三方合并；虚拟默认不持久化；同组冲突确认   |
| `customer_rare.settings` | `orderLinkedFilter`、`showTagDescription` | 同左               | 字段级合并，冲突字段后提交服务端胜出               |
| `global.preferences`     | `globalStore.persistence` 白名单          | 同左               | 字段级合并，未改字段不覆盖云端                     |
| `theme`                  | `theme` localStorage                      | theme apply helper | 后提交服务端的快照胜出                             |
| `tutorial.customer_rare` | legacy `dirver`（历史拼写）映射           | `dirver` 映射      | 只同步完成状态，账号级已完成优先，不同步设备级重置 |

## 四、global.preferences 白名单

同步字段：

- `customerCardTagsTooltip`
- `donationModal.interactionCount`
- `donationModal.lastMilestoneShown`
- `donationModal.lastShown`
- `hiddenItems.dlcs`
- `suggestMeals.enabled`
- `suggestMeals.maxExtraIngredients`
- `suggestMeals.maxRating`
- `suggestMeals.maxResults`
- `table.columns.beverage`
- `table.columns.recipe`
- `table.hiddenItems.beverages`
- `table.hiddenItems.ingredients`
- `table.hiddenItems.recipes`
- `table.row`
- `famousShop`
- `popularTrend`
- `highAppearance`
- `tachie`
- `vibrate`

排除字段：

- `version`
- `userId`
- `cloudCode`
- 原始 `dirver`（历史拼写，勿改为 `driver`）

## 五、serializer 形状

```ts
export interface ISyncNamespaceSerializer<T> {
	deserialize(data: unknown): T;
	getDefaultSnapshot(): T;
	getLocalSnapshot(): T;
	merge(params: ISyncMergeParams<T>): ISyncMergeResult<T>;
	migrate(data: unknown, version: number): T;
	serialize(data: T): unknown;
	setLocalSnapshot(data: T): void;
	validate(data: unknown): data is T;
}

export interface ISyncMergeParams<T> {
	allowBaseNullAutoMerge?: boolean;
	base: T | null;
	cloud: T | null;
	local: T;
	namespace: TSyncNamespace;
}

export interface ISyncMergeResult<T> {
	conflict: ISyncConflictItem<T> | null;
	data: T;
	requiresConfirmation: boolean;
	shouldUpload: boolean;
}

export type TSyncNamespace =
	| 'customer_normal.meals'
	| 'customer_rare.meals'
	| 'customer_rare.plans'
	| 'customer_rare.settings'
	| 'global.preferences'
	| 'theme'
	| 'tutorial.customer_rare';
```

实现要求：

- `getLocalSnapshot` 只读 store 或 localStorage。
- `setLocalSnapshot` 只写白名单字段。
- `validate` 不引入大型校验库，使用项目现有类型守卫风格。
- migration 使用 `schema_version`，不复用 Zustand persist version。
- 数组处理使用 `map`、`filter`、`reduce`、`forEach`。
- 每个 serializer 提供 `getDefaultSnapshot()`，用于判断新设备默认值是否可忽略。
- `setLocalSnapshot` 在远端写回期间不触发 dirty。

## 六、套餐合并

套餐稳定签名规则：

1. 对对象 key 排序。
2. 去掉临时字段和 undefined。
3. `JSON.stringify`。
4. 按签名计数形成 multiset，用计数消耗比较重复套餐。

自动合并只处理纯新增：

- base、cloud、local 都能按顾客名定位到同一列表。
- cloud 和 local 都没有删除 base 中已有套餐。
- cloud 和 local 都没有改变 base 中已有套餐顺序。
- local 没有保存与 cloud 相同签名但位置不同的重复套餐。
- 缺少可靠 base 时，两侧都含非默认套餐只生成合并预览并要求确认，不能仅凭集合并集推断某侧没有删除；一侧为系统默认空值以及 namespace 明确的单调规则仍可静默收敛。

不满足以上条件时进入人工冲突，避免删除、排序或用户有意重复保存被自动吞掉。

## 七、字段级合并

- `global.preferences` 记录每个白名单字段的 base/cloud/local 值。
- 本地字段等于默认值且云端已有值时，不把本地默认值视为修改。
- 不同字段并发修改时自动合并。
- 同一字段并发修改时后提交服务端的快照胜出。
- `highAppearance` 远端写回时通过 store 监听立即同步 body class 和本地设置，不强制刷新页面。

## 八、主题与教程

- `theme` serializer 不直接只写 localStorage，必须调用非 hook 的 `applyTheme` helper，同步更新当前标签 DOM、React 状态和 storage。
- `theme` 在 localStorage 不可用时只做会话级同步，并在设置页显示降级提示。
- `tutorial.customer_rare` 写回时只增删 `customer_rare_tutorial` 对应 key，保留其他 tutorial/driver key。
- 教程完成状态为账号级；本地“重置教程”只影响当前设备，不上传未完成状态覆盖云端完成。

## 九、冲突窗口数据

```ts
export interface ISyncConflictItem<T = unknown> {
	cloud: T;
	local: T;
	merged: T | null;
	namespace: TSyncNamespace;
	userId?: string;
	revision: number;
}
```

客户端持久化和展示冲突时必须补齐 `userId`，用于按账号隔离冲突记录；serializer 产出的原始冲突对象可先不带该字段。

窗口按钮：

- 使用本地
- 使用云端
- 使用合并结果

选择“使用本地”或“使用合并结果”后写入 dirty queue，并按云端 revision 重试上传；选择“使用云端”只接受云端、清理对应 dirty 并更新 revision，不再重传。

## 十、验证点

- `global.preferences` 不包含 `userId`、`cloudCode`、`version` 和原始 `dirver`。
- `global.preferences` 包含 `donationModal.interactionCount`、`donationModal.lastMilestoneShown`、`donationModal.lastShown`，不包含 `shared.donationModal.isOpen`。
- 服务端同步写入和旧备份码导入均拒绝或清洗 namespace 白名单外字段。
- 普客/稀客套餐合并不产生重复套餐。
- 普客/稀客套餐删除或排序冲突会进入人工冲突，不自动复活已删除套餐。
- 有可靠 base 时，两台设备修改 `global.preferences` 不同独立字段/原子分组可自动三方合并；普通 item-level revision conflict 缺少可靠 base 时只提供合并预览，由用户确认。
- 稀客教程本地完成 + 云端未完成时上传完成状态。
- 本地重置稀客教程不会把云端完成状态改回未完成。
- 主题远端写回会更新当前标签 UI，不只写 storage。
- 写回远端状态不会触发新的 dirty。
- 无法自动合并时产生冲突项。

## 十一、`global.preferences` 假冲突优化计划

> 状态：已落地。2026-07-18 完成代码审查、方案确认、实现和确定性验证；同步 schema、服务端协议与冲突窗口接口未改变。

### 11.1 目标与当前问题

- 保持同步协议、`global.preferences` schema v1、白名单、共同基线、dirty queue、统一 merge-result 路由和冲突窗口接口不变。
- 修正 `donationModal.interactionCount` 当前在合并前被规范化为云端值的问题；自动收敛不能以丢弃较大的本地计数为代价。
- 缩小 `suggestMeals`、`table.columns` 和 `table.hiddenItems` 的原子分组，避免两个设备修改互不相关的子字段时打开阻断式冲突窗口。
- 对实际以 `Set` 读写的 DLC、表格列和隐藏项，在可靠 base 存在时按成员做三方合并，保留双方可证明无损的增加和移除操作。
- 缺少可靠 base 时不把普通集合并集当作用户意图；除 namespace 明确定义的单调或状态感知规则外，两侧非默认差异继续要求确认。

当前 `globalPreferencesSerializer` 把整个 `donationModal`、`suggestMeals`、`table.columns`、`table.hiddenItems` 和 `hiddenItems.dlcs` 分别视为单个原子组。任一组的 cloud/local 都偏离 base 且结果不同时会设置 `requiresConfirmation: true`。本轮只细化这些已确认可证明无损的情况，不放宽 `popularTrend` 等关联字段，也不改变其他 namespace。

### 11.2 捐赠提示状态合并

`donationModal` 使用专用合并函数，不再经过普通原子组选择：

| 字段                 | 合并规则                                                                                                                    | 是否允许无 base 静默收敛 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `interactionCount`   | 取 base/cloud/local 中的最大安全整数；达到 `Number.MAX_SAFE_INTEGER` 后保持饱和                                             | 是                       |
| `lastShown`          | `null` 视为小于任意时间戳，取最大非空时间戳；三侧均为 `null` 时保留 `null`                                                  | 是                       |
| `lastMilestoneShown` | 单侧变化采用变化侧；两侧相同直接采用；较新的 `lastShown` 仅保护其配套的“稍后提醒”值 `0`；其余普通关闭里程碑并发变化取较大值 | 是                       |

`lastMilestoneShown` 不能无条件取最大值。用户点击“7日内不再弹出”会把它主动重置为 `0`，并同时把 `lastShown` 写为 `Date.now()`；较新的 `lastShown + 0` 必须作为一个状态转移保留，不能被另一侧旧的较大里程碑吞掉。非零里程碑表示普通关闭，不与 `lastShown` 配套；即使某侧时间更新，只要里程碑不是 `0`，仍取双方较大里程碑，避免重新展示已经关闭的较高里程碑。

合并函数必须满足：

- 结果只由 base/cloud/local 决定，不读取当前时间、store、账号或浏览器状态。
- 交换 cloud/local 不改变最终业务值；时间戳相同的平局规则不得依赖参数顺序。
- 结果与 cloud 不同时设置 `shouldUpload: true`，通过现有 paused-conflict、journal 和自动重基路径提交，不新增旁路。
- donation-only 差异不得触发无 base 场景末尾的整份 `global.preferences` 确认保护；其他普通字段仍参与该保护。

### 11.3 独立字段与集合成员合并

`suggestMeals` 拆为四个独立原子字段：

- `suggestMeals.enabled`
- `suggestMeals.maxExtraIngredients`
- `suggestMeals.maxRating`
- `suggestMeals.maxResults`

可靠 base 存在时，不同子字段的正交修改静默合并；同一子字段被双边改为不同值时继续要求确认。无 base 时两侧非默认差异继续使用现有安全确认。

以下数组按集合语义合并：

- `hiddenItems.dlcs`
- `table.columns.beverage`
- `table.columns.recipe`
- `table.hiddenItems.beverages`
- `table.hiddenItems.ingredients`
- `table.hiddenItems.recipes`

可靠 base 存在时，对允许值全集中的每个成员分别比较 `baseHas/cloudHas/localHas`：

```ts
if (cloudHas === localHas) return cloudHas;
if (cloudHas === baseHas) return localHas;
if (localHas === baseHas) return cloudHas;
```

成员只有存在/不存在两态，因此从同一 base 出发时，双边都改变同一成员必然得到相同结果；不同成员的增加和移除可交换、可结合，不需要人工选择。输出按项目的稳定允许值顺序生成，并顺带去重，避免无业务意义的数组顺序或重复项制造 snapshot 差异。

没有可靠 base 时不执行成员级合并：某侧缺少成员可能表示主动取消，不能仅凭 cloud/local 推断。此时保持当前默认值让位和人工确认规则。

### 11.4 保持人工确认的边界

- `popularTrend.isNegative + tag` 继续作为关联状态；双边不同组合不拆分。
- `table.row`、顶层 boolean 和其他标量字段维持现有原子三方规则。
- 同一 `suggestMeals` 子字段的双边不同值继续要求确认。
- 无可靠 base 的普通集合、普通标量和非默认整份差异继续要求确认。
- 套餐的删除、重排、重复计数，营业预设同组双改和修改对删除，均不在本轮范围内。
- 主题、教程完成状态、营业预设 `updatedAt`/`activeId` 和已有可靠 base 的套餐纯新增规则保持不变。

### 11.5 文件与接口边界

**新增：**

- `app/lib/account/sync/serializers/globalPreferencesMerge.ts`：纯函数模块，承载 donation 状态、集合成员和整份 global preferences 合并；不得导入 store、React、DOM、账号客户端或运行时配置。

**修改：**

- `app/lib/account/sync/serializers/globalPreferences.ts`：保留 snapshot 获取、迁移、校验、序列化和本地写回；将 `merge()` 委托给纯合并模块，并提供 DLC、列、酒水、食材和料理的稳定允许值顺序。
- `app/lib/account/client/syncClient.ts`：旧版仅 interaction count 冲突的恢复 shim 扩展为 donation-only 自动合并；其余字段必须完全相同且不得带 `localCollision`，先以 CAS 把新 `merged`/自动决议写回 paused entry，再由现有 journal 流程执行，自动选择由新 merge result 的 `cloud`/`merged` 决定。
- `.github/plans/账号系统/05-namespace序列化与冲突合并落地.plan.md`：实现完成后把本节状态改为已落地，并记录真实验证结果。
- `.github/plans/账号系统/07-验证清单与发布回归.plan.md`：实现完成后增加 donation 状态感知、正交子字段和集合成员的多设备回归项。
- `.github/plans/账号系统/17-同步冲突语义与虚拟预设改造.plan.md`：保留原计划历史，并注明本节是后续细化的事实来源。

不修改 `ISyncMergeResult`、`SYNC_SCHEMA_VERSION_MAP`、服务端 validation、API、数据库、dirty queue 或冲突 journal。白名单 JSON 形状不变，因此不升级 schema。

### 11.6 TDD 实施步骤

#### Task 1：建立失败断言与纯合并边界

- [x] 在工作区 `.tmp/tmiaa-sync-global-preferences-merge.ts` 创建一次性断言脚本，直接导入计划新增的真实纯合并模块，不复制生产算法。
- [x] 固定 default/base/cloud/local fixture，分别断言 interaction count 不回退、最新 `lastShown`、普通里程碑、`lastShown + 0` 稍后提醒、交换 cloud/local 的结果一致性。
- [x] 断言 `suggestMeals` 不同子字段正交合并，同一子字段不同值仍要求确认。
- [x] 断言六类集合的双边不同成员增加、单边移除配合另一边增加、数组顺序差异和重复项规范化。
- [x] 断言无 base 的 donation-only 差异静默收敛，而无 base 的普通集合双非默认差异仍要求确认。
- [x] 使用项目安装的 esbuild 将脚本及真实依赖打包成 Node ESM：

```bash
pnpm exec esbuild .tmp/tmiaa-sync-global-preferences-merge.ts \
  --bundle \
  --format=esm \
  --jsx=automatic \
  --outfile=.tmp/tmiaa-sync-global-preferences-merge.mjs \
  --platform=node \
  --target=node20
```

- [x] 运行 `node .tmp/tmiaa-sync-global-preferences-merge.mjs`；RED 阶段因计划模块尚不存在而按预期失败，GREEN 阶段通过 20 个夹具、49 条断言；独立审查后另以 1 个 fixture、1 条断言复现并修正“较新非零里程碑压过更大普通里程碑”的回归。

#### Task 2：实现最小纯合并逻辑并接入 serializer

- [x] 新增 `globalPreferencesMerge.ts`，实现 donation 三字段纯合并，使对应红灯断言通过。
- [x] 实现带稳定顺序的字符串集合三方合并，使集合断言通过。
- [x] 实现整份 `global.preferences` 的分组调度：donation 专用、六类集合专用、`suggestMeals` 叶字段原子、其余现有原子组保持不变。
- [x] 修改 `globalPreferencesSerializer.merge()` 委托纯模块；删除只把 `interactionCount` 改为 cloud 的规范化 helper，不保留双重策略。
- [x] 每完成一类行为都重新打包并运行同一个临时断言脚本；未重构其他 serializer。

#### Task 3：回归同步结果路由与真实页面边界

- [x] 代码复审 `syncClient.ts`、`conflict.ts`、`doubleWrite.ts` 的 merge-result 消费点，确认新结果仍只通过 `automaticResolution`、paused conflict、journal、重基和 flush 状态机提交；同时修正旧 donation-only 冲突恢复 shim 的固定云端选择。
- [x] 临时断言覆盖 `conflict === null && requiresConfirmation === false && shouldUpload === false` 时 data 等于规范化 cloud，以及结果不同于 cloud 时 `shouldUpload === true`。
- [x] 覆盖 `cloud === null`、base 缺失降级为 `null`、`Number.MAX_SAFE_INTEGER`、三侧 `lastShown === null`、相同最大时间戳但不同里程碑等边界；base snapshot 损坏后的 `null` 降级继续由既有读取路径负责。
- [x] serializer 断言和调用链复审确认仅数据合并与旧冲突恢复选择改变，冲突 UI 接口、overlay 与跨标签生命周期未改变，因此本轮未启动 Playwright。

#### Task 4：静态检查、文档回写与清理

- [x] 运行临时 MJS 断言并记录主矩阵 20 个 fixture、49 条断言，以及审查回归 1 个 fixture、1 条断言全部通过。
- [x] 运行针对三个实现文件的 ESLint 检查。
- [x] 运行 `pnpm exec tsc --noEmit --pretty false`。
- [x] 运行相关实现文件和三份计划文档的 focused Prettier 检查。
- [x] 运行 `git diff --check`，无新增 whitespace 错误。
- [x] 删除 `.tmp/tmiaa-sync-global-preferences-merge.ts`、`.mjs` 及空 `.tmp/`；未保留临时脚本、bundle、fixture、截图或 trace。
- [x] 把本节状态和相关验证清单更新为真实结果；Playwright、多物理设备和自托管发布产物未执行并明确保留为发布回归项。

### 11.7 完成标准

- donation 三字段差异均不会打开人工冲突窗口，且较大的 interaction count、较新的提醒时间和“稍后提醒”的 `0` 都不会被旧状态覆盖。
- 有可靠 base 时，`suggestMeals` 不同子字段、酒水列与料理列、不同 DLC 以及不同隐藏项的并发修改静默合并。
- 有可靠 base 时，集合成员的增加和移除均保留；输出顺序稳定、无重复项。
- 无可靠 base 的普通集合或普通设置差异仍要求确认，没有扩大静默覆盖用户意图的范围。
- `popularTrend` 等关联状态及其他 namespace 的既有人工冲突边界不变。
- 不升级同步 schema，不新增依赖、环境变量、服务端接口、持久化字段或并行权威状态。
- 临时 TS/MJS 验证产物全部删除，实际执行的断言、静态检查和浏览器范围已如实回写。

## 十二、代码落地状态

- 已新增 [app/lib/account/sync/serializers/customerNormalMeals.ts](../../../app/lib/account/sync/serializers/customerNormalMeals.ts)、[app/lib/account/sync/serializers/customerRareMeals.ts](../../../app/lib/account/sync/serializers/customerRareMeals.ts)、[app/lib/account/sync/serializers/customerRareSettings.ts](../../../app/lib/account/sync/serializers/customerRareSettings.ts)、[app/lib/account/sync/serializers/globalPreferences.ts](../../../app/lib/account/sync/serializers/globalPreferences.ts)、[app/lib/account/sync/serializers/theme.ts](../../../app/lib/account/sync/serializers/theme.ts) 和 [app/lib/account/sync/serializers/tutorialCustomerRare.ts](../../../app/lib/account/sync/serializers/tutorialCustomerRare.ts)。
- 已新增 [app/lib/account/sync/serializers/meals.ts](../../../app/lib/account/sync/serializers/meals.ts) 和 [app/lib/account/sync/serializers/utils.ts](../../../app/lib/account/sync/serializers/utils.ts)，集中处理稳定签名、默认值比较、字段级合并与套餐纯新增合并。
- 已新增 [app/lib/account/sync/serializers/customerRarePlans.ts](../../../app/lib/account/sync/serializers/customerRarePlans.ts) 与 [customerRarePlansMerge.ts](../../../app/lib/account/sync/serializers/customerRarePlansMerge.ts)，并由客户端共同基线、`requiresConfirmation` 和统一 merge-result 路由区分静默收敛、确认与真实冲突。
- 已更新 [app/design/hooks/use-theme/useTheme.ts](../../../app/design/hooks/use-theme/useTheme.ts)，导出 `applyTheme`、`getStoredTheme` 和同标签监听，供 `theme` serializer 写回当前 DOM、storage 与 React 状态。
- serializer 未从 [app/lib/account/sync/index.ts](../../../app/lib/account/sync/index.ts) 导出，避免服务端 API 路由导入浏览器 store/theme 代码。
