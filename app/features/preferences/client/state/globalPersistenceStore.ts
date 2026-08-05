import { store } from '@davstack/store';
import { type Selection } from '@heroui/table';

import { CustomerNormal } from '@/domain/catalog/customers/CustomerNormal';
import { CustomerRare } from '@/domain/catalog/customers/CustomerRare';
import { Beverage } from '@/domain/catalog/food/Beverage';
import { Ingredient } from '@/domain/catalog/food/Ingredient';
import { Recipe } from '@/domain/catalog/food/Recipe';
import { Clothes } from '@/domain/catalog/items/Clothes';
import { Cooker } from '@/domain/catalog/items/Cooker';
import { Currency } from '@/domain/catalog/items/Currency';
import { Ornament } from '@/domain/catalog/items/Ornament';
import { Partner } from '@/domain/catalog/items/Partner';
import type { TBeverageName } from '@/domain/data/beverages/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TRecipeName } from '@/domain/data/recipes/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { IPopularTrend, TPopularTag } from '@/domain/trends/types';

import { accountRemoteStateApplicationGuard } from '@/features/account/client/sync/stateGuards';
import {
	type TBeverageTableColumnKey,
	type TRecipeTableColumnKey,
	beverageTableColumns,
	recipeTableColumns,
} from '@/features/catalog/customers/shared/state/tableDescriptors';
import {
	pushOverlayChild,
	requestOverlayClose,
	requestOverlayOpen,
} from '@/features/overlays/client';
import type { TOverlayId } from '@/features/overlays/contracts';
import { type TPreferenceTargetKey } from '@/features/preferences/client/globalSearch/searchItems';

import { createStoreSyncMiddleware } from '@/infrastructure/browser/crossTab/createStoreSyncMiddleware';
import { createPersistMiddleware } from '@/infrastructure/browser/storage/createPersistMiddleware';

import { toArray, toSet } from '@/shared/utilities/collections/convert';
import { generateRange } from '@/shared/utilities/collections/generateRange';
import { union } from '@/shared/utilities/collections/union';
import {
	toGetItemWithKey,
	toGetValueCollection,
} from '@/shared/utilities/objects/convertCollection';
import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';
import { numberSort } from '@/shared/utilities/sort/numberSort';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

import { normalizeDonationModalPersistence } from './normalizeDonationModalPersistence';

import '@/infrastructure/state/enableImmerMapSet';

const allDlcs = union(
	[
		Beverage.getInstance().getValuesByProp('dlc'),
		Clothes.getInstance().getValuesByProp('dlc'),
		Cooker.getInstance().getValuesByProp('dlc'),
		Currency.getInstance().getValuesByProp('dlc'),
		Ingredient.getInstance().getValuesByProp('dlc'),
		CustomerNormal.getInstance().getValuesByProp('dlc'),
		CustomerRare.getInstance().getValuesByProp('dlc'),
		Ornament.getInstance().getValuesByProp('dlc'),
		Partner.getInstance().getValuesByProp('dlc'),
		Recipe.getInstance().getValuesByProp('dlc'),
	].flat()
).sort(numberSort) as TDlc[];

const instance_ingredient = Ingredient.getInstance();
const instance_recipe = Recipe.getInstance();

const ingredientTags = instance_ingredient
	.getValuesByProp('tags')
	.filter(
		(tag) => !instance_ingredient.blockedTags.has(tag)
	) as TPopularTag[];

const recipePositiveTags = instance_recipe
	.getValuesByProp('positiveTags')
	.filter((tag) => !instance_recipe.blockedTags.has(tag)) as TPopularTag[];

const validPopularTags = union(ingredientTags, recipePositiveTags)
	.map(toGetValueCollection)
	.sort(pinyinSort);

const storeName = 'global-storage';
const storeVersion = {
	initial: 0, // eslint-disable-next-line sort-keys
	dirver: 1,
	tagsTooltip: 2,
	version: 3, // eslint-disable-next-line sort-keys
	backgroundImage: 4,
	tachie: 5,
	vibrate: 6, // eslint-disable-next-line sort-keys
	renameBg: 7, // eslint-disable-next-line sort-keys
	famousShop: 8,
	popularTrend: 9, // eslint-disable-next-line sort-keys
	cloud: 10,
	tableShare: 11,
	userId: 12, // eslint-disable-next-line sort-keys
	hiddenItems: 13, // eslint-disable-next-line sort-keys
	hiddenDlcs: 14, // eslint-disable-next-line sort-keys
	donationModal: 15,
	donationModalRmDismiss: 16,
	suggestMeals: 17,
	suggestMealsExtra: 18,
} as const;

const state = {
	dlcs: allDlcs.map(toGetValueCollection),
	popularTags: validPopularTags,

	persistence: {
		customerCardTagsTooltip: true,
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
				recipe: recipeTableColumns
					.filter(({ key }) => key !== 'time')
					.map(toGetItemWithKey('key')),
			},
			hiddenItems: {
				beverages: [] as TBeverageName[],
				ingredients: [] as TIngredientName[],
				recipes: [] as TRecipeName[],
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

const hiddenDlcSetCache = new WeakMap<ReadonlyArray<string>, Set<TDlc>>();
const hiddenBeverageSetCache = new WeakMap<
	ReadonlyArray<TBeverageName>,
	Set<TBeverageName>
>();
const hiddenIngredientSetCache = new WeakMap<
	ReadonlyArray<TIngredientName>,
	Set<TIngredientName>
>();
const hiddenRecipeSetCache = new WeakMap<
	ReadonlyArray<TRecipeName>,
	Set<TRecipeName>
>();

function normalizeGlobalStoreRemoteState(value: unknown) {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return null;
	}

	const remoteState = value as Partial<typeof state>;
	const remotePersistence = remoteState.persistence;
	if (
		remotePersistence === undefined ||
		!isObjectTagRecord(remotePersistence) ||
		!Object.hasOwn(remotePersistence, 'donationModal')
	) {
		return remoteState;
	}

	return {
		...remoteState,
		persistence: {
			...remotePersistence,
			donationModal: normalizeDonationModalPersistence(
				remotePersistence.donationModal
			),
		},
	} as Partial<typeof state>;
}

export const globalStore = store(state, {
	middlewares: [
		createStoreSyncMiddleware<typeof state>({
			name: storeName,
			normalizeRemoteState: normalizeGlobalStoreRemoteState,
			remoteStateApplicationGuard: accountRemoteStateApplicationGuard,
			watch: ['persistence'],
		}),
		createPersistMiddleware<typeof state>({
			merge(persistedState, currentState) {
				if (
					persistedState === null ||
					typeof persistedState !== 'object' ||
					Array.isArray(persistedState)
				) {
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
			name: storeName,
			version: storeVersion.suggestMealsExtra,

			migrate(persistedState, version) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
				const oldState = persistedState as any;
				if (version < storeVersion.dirver) {
					oldState.persistence.dirver = [];
				}
				if (version < storeVersion.tagsTooltip) {
					oldState.persistence.customerCardTagsTooltip = true;
				}
				if (version < storeVersion.version) {
					oldState.persistence.version = null;
				}
				if (version < storeVersion.backgroundImage) {
					oldState.persistence.backgroundImage = true;
				}
				if (version < storeVersion.tachie) {
					oldState.persistence.tachie = true;
				}
				if (version < storeVersion.vibrate) {
					oldState.persistence.vibrate = true;
				}
				if (version < storeVersion.renameBg) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const { persistence } = oldState;
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					persistence.highAppearance = persistence.backgroundImage;
					delete persistence.backgroundImage;
				}
				if (version < storeVersion.famousShop) {
					oldState.persistence.famousShop = false;
				}
				if (version < storeVersion.popularTrend) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const { persistence } = oldState;
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					persistence.popularTrend = persistence.popular;
					delete persistence.popular;
				}
				if (version < storeVersion.cloud) {
					oldState.persistence.cloudCode = null;
				}
				if (version < storeVersion.tableShare) {
					oldState.persistence.table = {
						columns: {
							beverage: beverageTableColumns.map(
								toGetItemWithKey('key')
							),
							recipe: recipeTableColumns
								.filter(({ key }) => key !== 'time')
								.map(toGetItemWithKey('key')),
						},
						row: 8,
					};
				}
				if (version < storeVersion.userId) {
					oldState.persistence.userId = null;
				}
				if (version < storeVersion.hiddenItems) {
					oldState.persistence.table.hiddenItems = {
						beverages: [],
						ingredients: [],
						recipes: [],
					};
				}
				if (version < storeVersion.hiddenDlcs) {
					oldState.persistence.hiddenItems = { dlcs: [] };
				}
				if (version < storeVersion.donationModal) {
					oldState.persistence.donationModal = {
						interactionCount: 0,
						isDismiss: false,
						lastMilestoneShown: 0,
						lastShown: null,
					};
				}
				if (version < storeVersion.donationModalRmDismiss) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const { persistence } = oldState;
					delete persistence.donationModal.isDismiss;
				}
				if (version < storeVersion.suggestMeals) {
					oldState.persistence.suggestMeals = {
						enabled: true,
						maxResults: 5,
					};
				}
				if (version < storeVersion.suggestMealsExtra) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const { persistence } = oldState;
					persistence.suggestMeals.maxExtraIngredients = null;
					persistence.suggestMeals.maxRating = 4;
				}
				return persistedState as typeof state;
			},
			partialize(currentStore) {
				return {
					persistence: currentStore.persistence,
				} as typeof currentStore;
			},
		}),
	],
})
	.computed((currentStore) => ({
		beverageTableColumns: {
			read: () =>
				toSet(currentStore.persistence.table.columns.beverage.use()),
			write: (columns: Selection) => {
				currentStore.persistence.table.columns.beverage.set(
					toArray(columns) as TBeverageTableColumnKey[]
				);
			},
		},
		recipeTableColumns: {
			read: () =>
				toSet(currentStore.persistence.table.columns.recipe.use()),
			write: (columns: Selection) => {
				currentStore.persistence.table.columns.recipe.set(
					toArray(columns) as TRecipeTableColumnKey[]
				);
			},
		},

		tableRows: {
			read: () =>
				toSet<SelectionSet>(
					currentStore.persistence.table.row.use().toString()
				),
			write: (rows: Selection) => {
				currentStore.persistence.table.row.set(
					Number.parseInt(toArray<SelectionSet>(rows)[0] as string)
				);
			},
		},

		hiddenDlcs: {
			read: () => {
				const hiddenDlcValues =
					currentStore.persistence.hiddenItems.dlcs.use();
				const cachedHiddenDlcs = hiddenDlcSetCache.get(hiddenDlcValues);
				if (cachedHiddenDlcs !== undefined) {
					return cachedHiddenDlcs;
				}
				const hiddenDlcs = toSet(hiddenDlcValues.map(Number) as TDlc[]);
				hiddenDlcs.delete(0);
				hiddenDlcSetCache.set(hiddenDlcValues, hiddenDlcs);
				return hiddenDlcs;
			},
			write: (dlcs: Set<TDlc>) => {
				const set = new Set(dlcs);
				set.delete(0);
				currentStore.persistence.hiddenItems.dlcs.set(
					toArray(set).map(String)
				);
			},
		},

		maxSuggestMealExtraIngredients: {
			read: () =>
				toSet<SelectionSet>(
					(
						currentStore.persistence.suggestMeals.maxExtraIngredients.use() ??
						''
					).toString()
				),
			write: (maxExtra: Selection) => {
				const value = toArray<SelectionSet>(maxExtra)[0] as string;
				currentStore.persistence.suggestMeals.maxExtraIngredients.set(
					value === '' ? null : Number.parseInt(value)
				);
			},
		},
		maxSuggestMealRating: {
			read: () =>
				toSet<SelectionSet>(
					currentStore.persistence.suggestMeals.maxRating
						.use()
						.toString()
				),
			write: (maxRating: Selection) => {
				currentStore.persistence.suggestMeals.maxRating.set(
					Number.parseInt(
						toArray<SelectionSet>(maxRating)[0] as string
					)
				);
			},
		},
		maxSuggestMealResults: {
			read: () =>
				toSet<SelectionSet>(
					currentStore.persistence.suggestMeals.maxResults
						.use()
						.toString()
				),
			write: (maxResults: Selection) => {
				currentStore.persistence.suggestMeals.maxResults.set(
					Number.parseInt(
						toArray<SelectionSet>(maxResults)[0] as string
					)
				);
			},
		},

		hiddenBeverages: {
			read: () => {
				const hiddenBeverageValues =
					currentStore.persistence.table.hiddenItems.beverages.use();
				const cachedHiddenBeverages =
					hiddenBeverageSetCache.get(hiddenBeverageValues);
				if (cachedHiddenBeverages !== undefined) {
					return cachedHiddenBeverages;
				}

				const hiddenBeverages = toSet(hiddenBeverageValues);
				hiddenBeverageSetCache.set(
					hiddenBeverageValues,
					hiddenBeverages
				);
				return hiddenBeverages;
			},
			write: (beverages: Set<TBeverageName>) => {
				currentStore.persistence.table.hiddenItems.beverages.set(
					toArray(beverages)
				);
			},
		},
		hiddenIngredients: {
			read: () => {
				const hiddenIngredientValues =
					currentStore.persistence.table.hiddenItems.ingredients.use();
				const cachedHiddenIngredients = hiddenIngredientSetCache.get(
					hiddenIngredientValues
				);
				if (cachedHiddenIngredients !== undefined) {
					return cachedHiddenIngredients;
				}
				const hiddenIngredients = toSet(hiddenIngredientValues);
				hiddenIngredientSetCache.set(
					hiddenIngredientValues,
					hiddenIngredients
				);
				return hiddenIngredients;
			},
			write: (ingredients: Set<TIngredientName>) => {
				currentStore.persistence.table.hiddenItems.ingredients.set(
					toArray(ingredients)
				);
			},
		},
		hiddenRecipes: {
			read: () => {
				const hiddenRecipeValues =
					currentStore.persistence.table.hiddenItems.recipes.use();
				const cachedHiddenRecipes =
					hiddenRecipeSetCache.get(hiddenRecipeValues);
				if (cachedHiddenRecipes !== undefined) {
					return cachedHiddenRecipes;
				}
				const hiddenRecipes = toSet(hiddenRecipeValues);
				hiddenRecipeSetCache.set(hiddenRecipeValues, hiddenRecipes);
				return hiddenRecipes;
			},
			write: (recipes: Set<TRecipeName>) => {
				currentStore.persistence.table.hiddenItems.recipes.set(
					toArray(recipes)
				);
			},
		},

		selectedPopularTag: {
			read: () =>
				toSet(
					currentStore.persistence.popularTrend.tag.use()
				) as SelectionSet,
			write: (tags: Selection) => {
				const tag = toArray<SelectionSet>(
					tags
				)[0] as typeof state.persistence.popularTrend.tag;
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				currentStore.persistence.popularTrend.tag.set(tag || null);
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
