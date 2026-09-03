import { store } from '@davstack/store';
import { type Selection } from '@heroui/table';

import { selectionToKnownValues } from '@/design/ui/components/selectionKeys';

import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TDlc } from '@/domain/data/shared/types';
import {
	RECOMMENDATION_SORT_PROFILES,
	type TRecommendationSortProfile,
} from '@/domain/recommendations/sortProfiles';
import type { TPopularFoodTagId } from '@/domain/trends/types';

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
import { type TPreferenceTargetKey } from '@/features/preferences/contracts';
import {
	createDefaultGlobalStorePersistence,
	createDefaultGlobalStoreSharedState,
	createDefaultGlobalStoreStaticState,
	normalizeGlobalStorePersistence,
} from '@/features/preferences/shapes/globalPreferencesStateDefinition';

import { createStoreSyncMiddleware } from '@/infrastructure/browser/crossTab/createStoreSyncMiddleware';
import { createPersistMiddleware } from '@/infrastructure/browser/storage/createPersistMiddleware';

import { SITE_METADATA } from '@/shared/site/metadata';
import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';
import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import {
	GLOBAL_PERSISTENCE_STORE_VERSION,
	migrateGlobalPersistedState,
} from './migratePersistedState';

import '@/infrastructure/state/enableImmerMapSet';

const storeName = 'global-storage';

const state = {
	...createDefaultGlobalStoreStaticState(),
	persistence: createDefaultGlobalStorePersistence(),
	shared: createDefaultGlobalStoreSharedState(),
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
const suggestMealSortProfileByKey = new Map<string, TRecommendationSortProfile>(
	RECOMMENDATION_SORT_PROFILES.map((value) => [value, value])
);
const popularTagByKey = new Map<string, TPopularFoodTagId>(
	state.popularTags.map(({ tag }) => [tag.toString(), tag])
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
	const {
		customerCardTagsTooltip: legacyTagsTooltip,
		...currentPersistence
	} = remotePersistenceRecord;
	const normalizedPersistence = normalizeGlobalStorePersistence({
		...currentPersistence,
		...(legacyTagsTooltip !== undefined &&
		!Object.hasOwn(currentPersistence, 'guestCardTagsTooltip')
			? { guestCardTagsTooltip: legacyTagsTooltip }
			: {}),
	}) as unknown as Record<string, unknown>;
	delete normalizedPersistence['version'];

	return {
		...remoteState,
		persistence: normalizedPersistence,
	} as unknown as Partial<typeof state>;
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
			storeVersion:
				GLOBAL_PERSISTENCE_STORE_VERSION.suggestMealsSortProfile,
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
					},
				};
			},
			migrate: (persistedState, version) =>
				migrateGlobalPersistedState(
					persistedState,
					version
				) as typeof state,
			name: storeName,
			normalize: normalizeGlobalStorePersistence,
			partialize(currentStore) {
				return {
					persistence: currentStore.persistence,
				} as typeof currentStore;
			},
			version: GLOBAL_PERSISTENCE_STORE_VERSION.suggestMealsSortProfile,
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
		suggestMealSortProfile: {
			read: () =>
				new Set([
					currentStore.persistence.suggestMeals.sortProfile.use(),
				]),
			write: (sortProfiles: Selection) => {
				const [value] =
					selectionToKnownValues(
						sortProfiles,
						suggestMealSortProfileByKey
					) ?? [];
				if (value !== undefined) {
					currentStore.persistence.suggestMeals.sortProfile.set(
						value
					);
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
