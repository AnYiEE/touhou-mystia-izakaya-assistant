import { store } from '@davstack/store';
import { type Selection } from '@heroui/table';

import { selectionToKnownValues } from '@/design/ui/components/selectionKeys';

import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { ClothesCatalog } from '@/domain/catalog/items/ClothesCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import { DecorationCatalog } from '@/domain/catalog/items/DecorationCatalog';
import { PartnerCatalog } from '@/domain/catalog/items/PartnerCatalog';
import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TDlc } from '@/domain/data/shared/types';
import { FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import { checkPopularFoodTagId } from '@/domain/trends/checkPopularFoodTagId';
import type { IPopularTrend, TPopularFoodTagId } from '@/domain/trends/types';

import { accountRemoteStateApplicationGuard } from '@/features/account/client/sync/stateGuards';
import {
	type TBeverageTableColumnKey,
	type TFoodTableColumnKey,
	beverageTableColumns,
	foodTableColumns,
} from '@/features/catalog/guests/shared/state/tableDescriptors';
import {
	pushOverlayChild,
	requestOverlayClose,
	requestOverlayOpen,
} from '@/features/overlays/client';
import type { TOverlayId } from '@/features/overlays/contracts';
import { type TPreferenceTargetKey } from '@/features/preferences/client/globalSearch/searchItems';

import { createStoreSyncMiddleware } from '@/infrastructure/browser/crossTab/createStoreSyncMiddleware';
import { createPersistMiddleware } from '@/infrastructure/browser/storage/createPersistMiddleware';

import { SITE_METADATA } from '@/shared/site/metadata';
import { generateRange } from '@/shared/utilities/collections/generateRange';
import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';
import {
	toGetItemWithKey,
	toGetValueCollection,
} from '@/shared/utilities/objects/convertCollection';
import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';
import { numberSort } from '@/shared/utilities/sort/numberSort';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

import {
	GLOBAL_PERSISTENCE_STORE_VERSION,
	migrateGlobalPersistedState,
} from './migratePersistedState';
import { normalizeDonationModalPersistence } from './normalizeDonationModalPersistence';

import '@/infrastructure/state/enableImmerMapSet';

const allDlcs = [
	...new Set(
		[
			BeverageCatalog.getInstance().getValuesByProp('dlc'),
			ClothesCatalog.getInstance().getValuesByProp('dlc'),
			CookerCatalog.getInstance().getValuesByProp('dlc'),
			CurrencyItemCatalog.getInstance().getValuesByProp('dlc'),
			IngredientCatalog.getInstance().getValuesByProp('dlc'),
			NormalGuestCatalog.getInstance().getValuesByProp('dlc'),
			SpecialGuestCatalog.getInstance().getValuesByProp('dlc'),
			DecorationCatalog.getInstance().getValuesByProp('dlc'),
			PartnerCatalog.getInstance().getValuesByProp('dlc'),
			FoodCatalog.getInstance().getValuesByProp('dlc'),
		].flat()
	),
].sort(numberSort) as TDlc[];

const ingredientCatalog = IngredientCatalog.getInstance();
const foodCatalog = FoodCatalog.getInstance();

const ingredientTags = ingredientCatalog
	.getValuesByProp('tags')
	.filter((tag) => !ingredientCatalog.blockedTags.has(tag));

const foodPositiveTags = foodCatalog
	.getValuesByProp('positiveTags')
	.filter((tag) => !foodCatalog.blockedTags.has(tag));

const validPopularTags = [
	...new Set(ingredientTags).union(new Set(foodPositiveTags)),
]
	.filter(checkPopularFoodTagId)
	.sort((a, b) => pinyinSort(FOOD_TAG_MAP[a], FOOD_TAG_MAP[b]))
	.map((tag) => ({ tag, value: FOOD_TAG_MAP[tag] }));
const storeName = 'global-storage';

const state = {
	dlcs: allDlcs.map(toGetValueCollection),
	popularTags: validPopularTags,

	persistence: {
		guestCardTagsTooltip: true,
		hiddenItems: { dlcs: [] as string[] },
		suggestMeals: {
			enabled: true,
			maxExtraIngredients: null as number | null,
			maxRating: 4,
			maxResults: 5,
		},
		table: {
			columns: {
				beverage: beverageTableColumns.map(toGetItemWithKey('key')),
				recipe: foodTableColumns
					.filter(({ key }) => key !== 'time')
					.map(toGetItemWithKey('key')),
			},
			hiddenItems: {
				beverages: [] as TBeverageId[],
				foods: [] as TFoodId[],
				ingredients: [] as TIngredientId[],
			},
			row: 8,
		},

		famousShop: false,
		popularTrend: { isNegative: false, tag: null } as IPopularTrend,

		cloudCode: null as string | null,
		dirver: [] as string[],
		highAppearance: true,
		tachie: true,
		vibrate: true,

		userId: null as string | null,
		version: null as string | null,

		donationModal: {
			interactionCount: 0,
			lastMilestoneShown: 0,
			lastShown: null as number | null,
		},
	},

	shared: {
		suggestMeals: {
			selectableMaxExtraIngredients: [
				{ label: '不限', value: null },
				...generateRange(0, 4).map((n) => ({
					label: n.toString(),
					value: n,
				})),
			] as Array<{ label: string; value: number | null }>,
			selectableMaxRatings: [
				{ label: '极度不满', value: 0 },
				{ label: '不满', value: 1 },
				{ label: '普通', value: 2 },
				{ label: '满意', value: 3 },
				{ label: '完美', value: 4 },
			] as Array<{ label: string; value: number }>,
			selectableMaxResults: generateRange(1, 10).map(
				toGetValueCollection
			),
		},
		table: {
			selectableRows: generateRange(5, 20).map(toGetValueCollection),
		},

		preferencesModal: {
			isOpen: false,
			openSource: null as null | 'sideButton' | 'spotlight',
			targetKey: null as null | TPreferenceTargetKey,
		},
	},
};

const beverageTableColumnByKey = new Map<string, TBeverageTableColumnKey>(
	beverageTableColumns.map(({ key }) => [key, key])
);
const foodTableColumnByKey = new Map<string, TFoodTableColumnKey>(
	foodTableColumns.map(({ key }) => [key, key])
);
const maxSuggestMealExtraIngredientByKey = new Map<string, number | null>(
	state.shared.suggestMeals.selectableMaxExtraIngredients.map(({ value }) => [
		value === null ? '' : value.toString(),
		value,
	])
);
const maxSuggestMealRatingByKey = new Map<string, number>(
	state.shared.suggestMeals.selectableMaxRatings.map(({ value }) => [
		value.toString(),
		value,
	])
);
const maxSuggestMealResultByKey = new Map<string, number>(
	state.shared.suggestMeals.selectableMaxResults.map(({ value }) => [
		value.toString(),
		value,
	])
);
const popularTagByKey = new Map<string, TPopularFoodTagId>(
	validPopularTags.map(({ tag }) => [tag.toString(), tag])
);
const tableRowByKey = new Map<string, number>(
	state.shared.table.selectableRows.map(({ value }) => [
		value.toString(),
		value,
	])
);

const hiddenDlcSetCache = new WeakMap<ReadonlyArray<string>, Set<TDlc>>();
const hiddenBeverageSetCache = new WeakMap<
	ReadonlyArray<TBeverageId>,
	Set<TBeverageId>
>();
const hiddenIngredientSetCache = new WeakMap<
	ReadonlyArray<TIngredientId>,
	Set<TIngredientId>
>();
const hiddenFoodSetCache = new WeakMap<ReadonlyArray<TFoodId>, Set<TFoodId>>();

function createGlobalAppVersionRemoteState(appVersion: string) {
	return { persistence: { version: appVersion } } as unknown as Partial<
		typeof state
	>;
}

function readGlobalAppVersionRemoteState(value: unknown) {
	if (!checkIsRecord(value) || !checkIsRecord(value['persistence'])) {
		return null;
	}

	const { version } = value['persistence'];

	return typeof version === 'string' ? version : null;
}

function createHiddenDlcSet(values: ReadonlyArray<string>) {
	const hiddenDlcs = new Set(values.map(Number) as TDlc[]);
	hiddenDlcs.delete(0);
	return hiddenDlcs;
}

function createSet<T>(values: ReadonlyArray<T>) {
	return new Set(values);
}

function normalizeGlobalStoreRemoteState(value: unknown) {
	if (!checkIsRecord(value)) {
		return null;
	}

	const remoteState = value as Partial<typeof state>;
	const remotePersistence = remoteState.persistence;
	if (
		remotePersistence === undefined ||
		!isObjectTagRecord(remotePersistence)
	) {
		return remoteState;
	}
	const remotePersistenceRecord = remotePersistence as Record<
		string,
		unknown
	>;
	const normalizedPersistence = { ...remotePersistenceRecord };
	delete normalizedPersistence['version'];
	const hasDonationModal = Object.hasOwn(
		remotePersistenceRecord,
		'donationModal'
	);
	const hasLegacyTagsTooltip = Object.hasOwn(
		remotePersistenceRecord,
		'customerCardTagsTooltip'
	);
	if (!hasDonationModal && !hasLegacyTagsTooltip) {
		return {
			...remoteState,
			persistence: normalizedPersistence,
		} as Partial<typeof state>;
	}
	const {
		customerCardTagsTooltip: legacyTagsTooltip,
		...currentPersistence
	} = normalizedPersistence;

	return {
		...remoteState,
		persistence: {
			...currentPersistence,
			...(hasLegacyTagsTooltip &&
			!Object.hasOwn(remotePersistenceRecord, 'guestCardTagsTooltip')
				? { guestCardTagsTooltip: legacyTagsTooltip }
				: {}),
			...(hasDonationModal
				? {
						donationModal: normalizeDonationModalPersistence(
							remotePersistenceRecord['donationModal']
						),
					}
				: {}),
		},
	} as Partial<typeof state>;
}

export const globalStore = store(state, {
	middlewares: [
		createStoreSyncMiddleware<typeof state>({
			appVersion: {
				createRemoteState: createGlobalAppVersionRemoteState,
				current: SITE_METADATA.version,
				readRemoteState: readGlobalAppVersionRemoteState,
			},
			name: storeName,
			normalizeRemoteState: normalizeGlobalStoreRemoteState,
			remoteStateApplicationGuard: accountRemoteStateApplicationGuard,
			storeVersion: GLOBAL_PERSISTENCE_STORE_VERSION.recordIdentity,
			watch: ['persistence'],
		}),
		createPersistMiddleware<typeof state>({
			merge(persistedState, currentState) {
				if (!checkIsRecord(persistedState)) {
					return currentState;
				}

				const persisted = persistedState as Partial<typeof state>;
				const persistedPersistence = persisted.persistence;
				if (
					persistedPersistence === undefined ||
					!isObjectTagRecord(persistedPersistence)
				) {
					return { ...currentState, ...persisted };
				}

				return {
					...currentState,
					...persisted,
					persistence: {
						...currentState.persistence,
						...persistedPersistence,
						donationModal: normalizeDonationModalPersistence(
							persistedPersistence.donationModal
						),
					},
				};
			},
			migrate: (persistedState, version) =>
				migrateGlobalPersistedState(
					persistedState,
					version
				) as typeof state,
			name: storeName,
			partialize(currentStore) {
				return {
					persistence: currentStore.persistence,
				} as typeof currentStore;
			},
			version: GLOBAL_PERSISTENCE_STORE_VERSION.recordIdentity,
		}),
	],
})
	.computed((currentStore) => ({
		beverageTableColumns: {
			read: () =>
				new Set(currentStore.persistence.table.columns.beverage.use()),
			write: (columns: Selection) => {
				const values = selectionToKnownValues(
					columns,
					beverageTableColumnByKey
				);
				if (values !== null) {
					currentStore.persistence.table.columns.beverage.set(values);
				}
			},
		},
		foodTableColumns: {
			read: () =>
				new Set(currentStore.persistence.table.columns.recipe.use()),
			write: (columns: Selection) => {
				const values = selectionToKnownValues(
					columns,
					foodTableColumnByKey
				);
				if (values !== null) {
					currentStore.persistence.table.columns.recipe.set(values);
				}
			},
		},

		tableRows: {
			read: () =>
				new Set([currentStore.persistence.table.row.use().toString()]),
			write: (rows: Selection) => {
				const [value] =
					selectionToKnownValues(rows, tableRowByKey) ?? [];
				if (value !== undefined) {
					currentStore.persistence.table.row.set(value);
				}
			},
		},

		hiddenDlcs: {
			read: () => {
				const hiddenDlcValues =
					currentStore.persistence.hiddenItems.dlcs.use();
				return hiddenDlcSetCache.getOrInsertComputed(
					hiddenDlcValues,
					createHiddenDlcSet
				);
			},
			write: (dlcs: Set<TDlc>) => {
				const set = new Set(dlcs);
				set.delete(0);
				currentStore.persistence.hiddenItems.dlcs.set(
					[...set].map(String)
				);
			},
		},

		maxSuggestMealExtraIngredients: {
			read: () =>
				new Set([
					(
						currentStore.persistence.suggestMeals.maxExtraIngredients.use() ??
						''
					).toString(),
				]),
			write: (maxExtra: Selection) => {
				const values = selectionToKnownValues(
					maxExtra,
					maxSuggestMealExtraIngredientByKey
				);
				if (values !== null) {
					currentStore.persistence.suggestMeals.maxExtraIngredients.set(
						values[0] ?? null
					);
				}
			},
		},
		maxSuggestMealRating: {
			read: () =>
				new Set([
					currentStore.persistence.suggestMeals.maxRating
						.use()
						.toString(),
				]),
			write: (maxRating: Selection) => {
				const [value] =
					selectionToKnownValues(
						maxRating,
						maxSuggestMealRatingByKey
					) ?? [];
				if (value !== undefined) {
					currentStore.persistence.suggestMeals.maxRating.set(value);
				}
			},
		},
		maxSuggestMealResults: {
			read: () =>
				new Set([
					currentStore.persistence.suggestMeals.maxResults
						.use()
						.toString(),
				]),
			write: (maxResults: Selection) => {
				const [value] =
					selectionToKnownValues(
						maxResults,
						maxSuggestMealResultByKey
					) ?? [];
				if (value !== undefined) {
					currentStore.persistence.suggestMeals.maxResults.set(value);
				}
			},
		},

		hiddenBeverages: {
			read: () => {
				const hiddenBeverageValues =
					currentStore.persistence.table.hiddenItems.beverages.use();
				return hiddenBeverageSetCache.getOrInsertComputed(
					hiddenBeverageValues,
					createSet
				);
			},
			write: (beverages: Set<TBeverageId>) => {
				currentStore.persistence.table.hiddenItems.beverages.set([
					...beverages,
				]);
			},
		},
		hiddenFoods: {
			read: () => {
				const hiddenFoodValues =
					currentStore.persistence.table.hiddenItems.foods.use();
				return hiddenFoodSetCache.getOrInsertComputed(
					hiddenFoodValues,
					createSet
				);
			},
			write: (foods: Set<TFoodId>) => {
				currentStore.persistence.table.hiddenItems.foods.set([
					...foods,
				]);
			},
		},
		hiddenIngredients: {
			read: () => {
				const hiddenIngredientValues =
					currentStore.persistence.table.hiddenItems.ingredients.use();
				return hiddenIngredientSetCache.getOrInsertComputed(
					hiddenIngredientValues,
					createSet
				);
			},
			write: (ingredients: Set<TIngredientId>) => {
				currentStore.persistence.table.hiddenItems.ingredients.set([
					...ingredients,
				]);
			},
		},

		selectedPopularTag: {
			read: () => {
				const tag = currentStore.persistence.popularTrend.tag.use();
				return new Set(tag === null ? [] : [tag.toString()]);
			},
			write: (tags: Selection) => {
				const values = selectionToKnownValues(tags, popularTagByKey);
				if (values !== null) {
					currentStore.persistence.popularTrend.tag.set(
						values[0] ?? null
					);
				}
			},
		},
	}))
	.actions((currentStore) => ({
		setPreferencesModalIsOpen(
			isOpen: boolean,
			openSource: null | 'sideButton' | 'spotlight' = null,
			targetKey: null | TPreferenceTargetKey = null,
			parentId?: TOverlayId
		) {
			const updateState = () => {
				currentStore.shared.preferencesModal.isOpen.set(isOpen);
				currentStore.shared.preferencesModal.openSource.set(
					isOpen ? openSource : null
				);
				currentStore.shared.preferencesModal.targetKey.set(
					isOpen ? targetKey : null
				);
			};
			if (!isOpen) {
				updateState();
				requestOverlayClose('preferences');
				return;
			}
			if (parentId !== undefined) {
				pushOverlayChild({
					childId: 'preferences',
					onOpenChild: updateState,
					parentId,
				});
				return;
			}
			requestOverlayOpen('preferences', { onActivate: updateState });
		},

		onTableRowsPerPageChange(rows: Selection) {
			currentStore.tableRows.set(rows);
		},
	}));

export const globalSettingKeyIsHighAppearance = 'setting-high_appearance';
