import {store} from '@davstack/store';
import {compareVersions} from 'compare-versions';

import {type Selection} from '@heroui/table';

import {beverageTableColumns, recipeTableColumns} from '@/(pages)/customer-rare/constants';
import {trackEvent} from '@/components/analytics';

import type {IPersistenceState} from './types';
import {siteConfig} from '@/configs';
import {customerNormalStore, customerRareStore, ingredientsStore, recipesStore} from '@/stores';
import {persist as persistMiddleware, sync as syncMiddleware} from '@/stores/middlewares';
import type {IPopularTrend, TPopularTag} from '@/types';
import {generateRange, pinyinSort, toArray, toGetItemWithKey, toGetValueCollection, toSet, union} from '@/utilities';
import {Ingredient, Recipe} from '@/utils';

const {version: appVersion} = siteConfig;

const instance_ingredient = Ingredient.getInstance();
const instance_recipe = Recipe.getInstance();

const ingredientTags = instance_ingredient
	.getValuesByProp('tags')
	.filter((tag) => !instance_ingredient.blockedTags.has(tag));

const recipePositiveTags = instance_recipe
	.getValuesByProp('positiveTags')
	.filter((tag) => !instance_recipe.blockedTags.has(tag));

const validPopularTags = (union(ingredientTags, recipePositiveTags) as TPopularTag[])
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
	userId: 12,
} as const;

const state = {
	popularTags: validPopularTags,

	persistence: {
		customerCardTagsTooltip: true,
		table: {
			columns: {
				beverage: beverageTableColumns.map(toGetItemWithKey('key')),
				recipe: recipeTableColumns.filter(({key}) => key !== 'time').map(toGetItemWithKey('key')),
			},
			row: 8,
		},

		famousShop: false,
		popularTrend: {
			isNegative: false,
			tag: null,
		} as IPopularTrend,

		cloudCode: null as string | null,
		dirver: [] as string[],
		highAppearance: true,
		tachie: true,
		vibrate: true,

		userId: null as string | null,
		version: null as string | null,
	},

	shared: {
		table: {
			selectableRows: generateRange(5, 20).map(toGetValueCollection),
		},
	},
};

export const globalStore = store(state, {
	middlewares: [
		syncMiddleware<typeof state>({
			name: storeName,
			watch: ['persistence'],
		}),
		persistMiddleware<typeof state>({
			name: storeName,
			version: storeVersion.userId,

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
					const {persistence} = oldState;
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					persistence.highAppearance = persistence.backgroundImage;
					delete persistence.backgroundImage;
				}
				if (version < storeVersion.famousShop) {
					oldState.persistence.famousShop = false;
				}
				if (version < storeVersion.popularTrend) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const {persistence} = oldState;
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
							beverage: beverageTableColumns.map(toGetItemWithKey('key')),
							recipe: recipeTableColumns.filter(({key}) => key !== 'time').map(toGetItemWithKey('key')),
						},
						row: 8,
					};
				}
				if (version < storeVersion.userId) {
					oldState.persistence.userId = null;
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
			read: () => toSet(currentStore.persistence.table.columns.beverage.use()) as SelectionSet,
			write: (columns: Selection) => {
				currentStore.persistence.table.columns.beverage.set(toArray<SelectionSet>(columns) as never);
			},
		},
		recipeTableColumns: {
			read: () => toSet(currentStore.persistence.table.columns.recipe.use()) as SelectionSet,
			write: (columns: Selection) => {
				currentStore.persistence.table.columns.recipe.set(toArray<SelectionSet>(columns) as never);
			},
		},

		tableRows: {
			read: () => toSet([currentStore.persistence.table.row.use().toString()]) as SelectionSet,
			write: (rows: Selection) => {
				currentStore.persistence.table.row.set(Number.parseInt(toArray<SelectionSet>(rows)[0] as string));
			},
		},

		selectedPopularTag: {
			read: () => toSet([currentStore.persistence.popularTrend.tag.use()]) as SelectionSet,
			write: (tags: Selection) => {
				const tag = toArray<SelectionSet>(tags)[0] as typeof state.persistence.popularTrend.tag;
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				currentStore.persistence.popularTrend.tag.set(tag || null);
			},
		},
	}))
	.actions((currentStore) => ({
		onTableRowsPerPageChange(rows: Selection) {
			currentStore.tableRows.set(rows);
		},
	}));

// Toggle the background when there is a change in the high appearance state.
globalStore.persistence.highAppearance.onChange((isEnabled) => {
	document.body.classList.toggle('bg-blend-mystia-pseudo', isEnabled);
});

// Reload page if current tab version is lower than the version of the new tab.
globalStore.persistence.version.onChange((version) => {
	if (version && compareVersions(version, appVersion) === 1) {
		trackEvent(trackEvent.category.error, 'Global', 'Outdated version detected in multiple tabs');
		location.reload();
	}
});

// Update the current famous shop state when there is a change in the persisted state.
globalStore.persistence.famousShop.onChange((famousShop) => {
	customerNormalStore.shared.customer.famousShop.set(famousShop);
	customerRareStore.shared.customer.famousShop.set(famousShop);
	ingredientsStore.shared.famousShop.set(famousShop);
	recipesStore.shared.famousShop.set(famousShop);
});

// Update the current popular trend when there is a change in the persisted popular trend data.
globalStore.persistence.popularTrend.onChange((popularTrend) => {
	customerNormalStore.shared.customer.popularTrend.assign(popularTrend);
	customerRareStore.shared.customer.popularTrend.assign(popularTrend);
	ingredientsStore.shared.popularTrend.assign(popularTrend);
	recipesStore.shared.popularTrend.assign(popularTrend);
});

// Update the table columns and rows when there is a change in the persisted table state.
globalStore.persistence.table.columns.beverage.onChange((columns) => {
	customerNormalStore.shared.beverage.table.columns.set(toSet(columns));
	customerRareStore.shared.beverage.table.columns.set(toSet(columns));
});
globalStore.persistence.table.columns.recipe.onChange((columns) => {
	customerNormalStore.shared.recipe.table.columns.set(toSet(columns));
	customerRareStore.shared.recipe.table.columns.set(toSet(columns));
});
globalStore.persistence.table.row.onChange((row) => {
	customerNormalStore.shared.beverage.table.page.set(1);
	customerNormalStore.shared.beverage.table.row.set(row);
	customerNormalStore.shared.beverage.table.rows.set(toSet([row.toString()]));
	customerNormalStore.shared.recipe.table.page.set(1);
	customerNormalStore.shared.recipe.table.row.set(row);
	customerNormalStore.shared.recipe.table.rows.set(toSet([row.toString()]));
	customerRareStore.shared.beverage.table.page.set(1);
	customerRareStore.shared.beverage.table.row.set(row);
	customerRareStore.shared.beverage.table.rows.set(toSet([row.toString()]));
	customerRareStore.shared.recipe.table.page.set(1);
	customerRareStore.shared.recipe.table.row.set(row);
	customerRareStore.shared.recipe.table.rows.set(toSet([row.toString()]));
});

export {storeName as globalStoreKey};
export type TGlobalPersistenceState = IPersistenceState<(typeof state)['persistence']>;
