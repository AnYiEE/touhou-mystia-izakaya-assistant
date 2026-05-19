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
- 合并优先无感，无法安全合并时进入冲突窗口。

## 二、新增文件

| 文件                                                       | 作用                                            |
| ---------------------------------------------------------- | ----------------------------------------------- |
| `app/lib/account/sync/constants.ts`                        | `SYNC_NAMESPACE_MAP`、`SYNC_SCHEMA_VERSION_MAP` |
| `app/lib/account/sync/types.ts`                            | namespace 数据类型                              |
| `app/lib/account/sync/serializers/customerNormalMeals.ts`  | 普客套餐                                        |
| `app/lib/account/sync/serializers/customerRareMeals.ts`    | 稀客套餐                                        |
| `app/lib/account/sync/serializers/customerRareSettings.ts` | 稀客设置                                        |
| `app/lib/account/sync/serializers/globalPreferences.ts`    | 全局设置白名单                                  |
| `app/lib/account/sync/serializers/theme.ts`                | 主题                                            |
| `app/lib/account/sync/serializers/tutorialCustomerRare.ts` | 稀客教程                                        |
| `app/lib/account/sync/index.ts`                            | serializer registry                             |

## 三、namespace 清单

| namespace                | 读取来源                                  | 写回目标           | 合并规则                                           |
| ------------------------ | ----------------------------------------- | ------------------ | -------------------------------------------------- |
| `customer_normal.meals`  | `customerNormalStore.persistence.meals`   | 同左               | 纯新增自动合并；删除、排序、重复意图进入人工冲突   |
| `customer_rare.meals`    | `customerRareStore.persistence.meals`     | 同左               | 纯新增自动合并；删除、排序、重复意图进入人工冲突   |
| `customer_rare.settings` | `orderLinkedFilter`、`showTagDescription` | 同左               | 字段级合并，冲突字段后提交服务端胜出               |
| `global.preferences`     | `globalStore.persistence` 白名单          | 同左               | 字段级合并，未改字段不覆盖云端                     |
| `theme`                  | `theme` localStorage                      | theme apply helper | 后提交服务端的快照胜出                             |
| `tutorial.customer_rare` | legacy `dirver`（历史拼写）映射           | `dirver` 映射      | 只同步完成状态，账号级已完成优先，不同步设备级重置 |

## 四、global.preferences 白名单

同步字段：

- `customerCardTagsTooltip`
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
- `donationModal`
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
	shouldUpload: boolean;
}

export type TSyncNamespace =
	| 'customer_normal.meals'
	| 'customer_rare.meals'
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
- 登录或注册后的本地接管是特例：当缺少 base、云端已有套餐且本地只有可按稳定签名计数消耗后确认的新增套餐时，允许把本地新增追加到云端快照并按云端 revision 入队；item-level revision conflict 仍只生成合并预览，不静默覆盖云端。

不满足以上条件时进入人工冲突，避免删除、排序或用户有意重复保存被自动吞掉。

## 七、字段级合并

- `global.preferences` 记录每个白名单字段的 base/cloud/local 值。
- 本地字段等于默认值且云端已有值时，不把本地默认值视为修改。
- 不同字段并发修改时自动合并。
- 同一字段并发修改时后提交服务端的快照胜出。
- `highAppearance` 远端写回只更新持久化状态并提示刷新，不自动刷新页面。

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
	revision: number;
}
```

窗口按钮：

- 使用本地
- 使用云端
- 使用合并结果

选择“使用本地”或“使用合并结果”后写入 dirty queue，并按云端 revision 重试上传；选择“使用云端”只接受云端、清理对应 dirty 并更新 revision，不再重传。

## 十、验证点

- `global.preferences` 不包含 `userId`、`cloudCode`、`donationModal`。
- 服务端同步写入和旧备份码导入均拒绝或清洗 namespace 白名单外字段。
- 普客/稀客套餐合并不产生重复套餐。
- 普客/稀客套餐删除或排序冲突会进入人工冲突，不自动复活已删除套餐。
- 登录接管或有可靠 base 时，两台设备修改 `global.preferences` 不同字段可自动字段级合并；普通 item-level revision conflict 缺少可靠 base 时只提供合并预览，由用户确认。
- 稀客教程本地完成 + 云端未完成时上传完成状态。
- 本地重置稀客教程不会把云端完成状态改回未完成。
- 主题远端写回会更新当前标签 UI，不只写 storage。
- 写回远端状态不会触发新的 dirty。
- 无法自动合并时产生冲突项。

## 十一、代码落地状态

- 已新增 [app/lib/account/sync/serializers/customerNormalMeals.ts](../../../app/lib/account/sync/serializers/customerNormalMeals.ts)、[app/lib/account/sync/serializers/customerRareMeals.ts](../../../app/lib/account/sync/serializers/customerRareMeals.ts)、[app/lib/account/sync/serializers/customerRareSettings.ts](../../../app/lib/account/sync/serializers/customerRareSettings.ts)、[app/lib/account/sync/serializers/globalPreferences.ts](../../../app/lib/account/sync/serializers/globalPreferences.ts)、[app/lib/account/sync/serializers/theme.ts](../../../app/lib/account/sync/serializers/theme.ts) 和 [app/lib/account/sync/serializers/tutorialCustomerRare.ts](../../../app/lib/account/sync/serializers/tutorialCustomerRare.ts)。
- 已新增 [app/lib/account/sync/serializers/meals.ts](../../../app/lib/account/sync/serializers/meals.ts) 和 [app/lib/account/sync/serializers/utils.ts](../../../app/lib/account/sync/serializers/utils.ts)，集中处理稳定签名、默认值比较、字段级合并与套餐纯新增合并。
- 已更新 [app/design/hooks/use-theme/useTheme.ts](../../../app/design/hooks/use-theme/useTheme.ts)，导出 `applyTheme`、`getStoredTheme` 和同标签监听，供 `theme` serializer 写回当前 DOM、storage 与 React 状态。
- serializer 未从 [app/lib/account/sync/index.ts](../../../app/lib/account/sync/index.ts) 导出，避免服务端 API 路由导入浏览器 store/theme 代码。
