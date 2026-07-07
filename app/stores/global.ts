import { store } from '@davstack/store';
import { compareVersions } from 'compare-versions';

import { type Selection } from '@heroui/table';

import { trackEvent } from '@/components/analytics';

import {
	beverageTableColumns,
	recipeTableColumns,
} from '@/(pages)/customer-shared/constants';
import type {
	TBeverageTableColumnKey,
	TRecipeTableColumnKey,
} from '@/(pages)/customer-shared/types';
import { siteConfig } from '@/configs';
import {
	type TBeverageName,
	type TDlc,
	type TIngredientName,
	type TRecipeName,
} from '@/data';
import type {
	IGlobalSearchTransientTarget,
	TGlobalSearchPreferenceKey,
} from '@/lib/globalSearch';
import {
	beveragesStore,
	clothesStore,
	cookersStore,
	currenciesStore,
	customerNormalStore,
	customerRareStore,
	ingredientsStore,
	ornamentsStore,
	partnersStore,
	recipesStore,
} from '@/stores';
import {
	persist as persistMiddleware,
	sync as syncMiddleware,
} from '@/stores/middlewares';
import type { IMealRecipe, IPopularTrend, TPopularTag } from '@/types';
import {
	checkArrayContainsOf,
	generateRange,
	numberSort,
	pinyinSort,
	toArray,
	toGetItemWithKey,
	toGetValueCollection,
	toSet,
	union,
} from '@/utilities';
import { safeStorage } from '@/utilities/safeStorage';
import {
	Beverage,
	Clothes,
	Cooker,
	Currency,
	CustomerNormal,
	CustomerRare,
	Ingredient,
	Ornament,
	Partner,
	Recipe,
} from '@/utils';

const { version: appVersion } = siteConfig;

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

function checkRecipeDataHasHiddenBaseIngredient(
	recipeData: IMealRecipe,
	hiddenIngredients: ReadonlySet<TIngredientName>
) {
	try {
		return checkArrayContainsOf(
			instance_recipe.getPropsByName(recipeData.name, 'ingredients'),
			hiddenIngredients
		);
	} catch {
		return false;
	}
}

function updateRecipeDataForHiddenItems(
	recipeData: IMealRecipe,
	hiddenIngredients: ReadonlySet<TIngredientName>,
	hiddenRecipes: ReadonlySet<TRecipeName>
): IMealRecipe | null | undefined {
	if (
		hiddenRecipes.has(recipeData.name) ||
		checkRecipeDataHasHiddenBaseIngredient(recipeData, hiddenIngredients)
	) {
		return null;
	}

	const extraIngredients = recipeData.extraIngredients.filter(
		(ingredientName) => !hiddenIngredients.has(ingredientName)
	);

	if (extraIngredients.length !== recipeData.extraIngredients.length) {
		return { ...recipeData, extraIngredients };
	}

	return undefined;
}

function getNewlyHiddenItems<T>(
	nextItems: ReadonlySet<T>,
	previousItems: ReadonlySet<T>
) {
	return new Set([...nextItems].filter((item) => !previousItems.has(item)));
}

function clearHiddenBeverageSelections(
	hiddenBeverages: ReadonlySet<TBeverageName>
) {
	const normalBeverageName = customerNormalStore.shared.beverage.name.get();
	if (
		normalBeverageName !== null &&
		hiddenBeverages.has(normalBeverageName)
	) {
		customerNormalStore.shared.beverage.name.set(null);
	}

	const rareBeverageName = customerRareStore.shared.beverage.name.get();
	if (rareBeverageName !== null && hiddenBeverages.has(rareBeverageName)) {
		customerRareStore.shared.beverage.name.set(null);
	}
}

function clearHiddenRecipeSelections(
	hiddenIngredients: ReadonlySet<TIngredientName>,
	hiddenRecipes: ReadonlySet<TRecipeName>
) {
	const normalRecipeData = customerNormalStore.shared.recipe.data.get();
	if (normalRecipeData !== null) {
		const nextNormalRecipeData = updateRecipeDataForHiddenItems(
			normalRecipeData,
			hiddenIngredients,
			hiddenRecipes
		);
		if (nextNormalRecipeData !== undefined) {
			customerNormalStore.shared.recipe.data.set(nextNormalRecipeData);
		}
	}

	const rareRecipeData = customerRareStore.shared.recipe.data.get();
	if (rareRecipeData !== null) {
		const nextRareRecipeData = updateRecipeDataForHiddenItems(
			rareRecipeData,
			hiddenIngredients,
			hiddenRecipes
		);
		if (nextRareRecipeData !== undefined) {
			customerRareStore.shared.recipe.data.set(nextRareRecipeData);
		}
	}
}

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

		donationModal: { isOpen: false },
		preferencesModal: {
			isOpen: false,
			openSource: null as null | 'sideButton' | 'spotlight',
			targetKey: null as null | TGlobalSearchPreferenceKey,
		},

		globalSearch: {
			customerRareTutorialAllowedPathname: null as null | string,
			isOpen: false,
			transientTarget: null as null | IGlobalSearchTransientTarget,
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
				const dlcs = toSet(
					currentStore.persistence.hiddenItems.dlcs
						.use()
						.map(Number) as TDlc[]
				);
				dlcs.delete(0);
				return dlcs;
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
			read: () =>
				toSet(
					currentStore.persistence.table.hiddenItems.beverages.use()
				),
			write: (beverages: Set<TBeverageName>) => {
				currentStore.persistence.table.hiddenItems.beverages.set(
					toArray(beverages)
				);
			},
		},
		hiddenIngredients: {
			read: () =>
				toSet(
					currentStore.persistence.table.hiddenItems.ingredients.use()
				),
			write: (ingredients: Set<TIngredientName>) => {
				currentStore.persistence.table.hiddenItems.ingredients.set(
					toArray(ingredients)
				);
			},
		},
		hiddenRecipes: {
			read: () =>
				toSet(currentStore.persistence.table.hiddenItems.recipes.use()),
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
		setDonationModalInteractionCount(count: number) {
			currentStore.persistence.donationModal.interactionCount.set(count);
		},
		setDonationModalIsOpen(isOpen: boolean) {
			currentStore.shared.donationModal.isOpen.set(isOpen);
		},
		setDonationModalLastMilestoneShown(milestone: number) {
			currentStore.persistence.donationModal.lastMilestoneShown.set(
				milestone
			);
		},
		setDonationModalLastShown(timestamp: number) {
			currentStore.persistence.donationModal.lastShown.set(timestamp);
		},

		setPreferencesModalIsOpen(
			isOpen: boolean,
			openSource: null | 'sideButton' | 'spotlight' = null,
			targetKey: null | TGlobalSearchPreferenceKey = null
		) {
			currentStore.shared.preferencesModal.isOpen.set(isOpen);
			currentStore.shared.preferencesModal.openSource.set(
				isOpen ? openSource : null
			);
			currentStore.shared.preferencesModal.targetKey.set(
				isOpen ? targetKey : null
			);
		},

		setGlobalSearchCustomerRareTutorialAllowedPathname(
			pathname: null | string
		) {
			currentStore.shared.globalSearch.customerRareTutorialAllowedPathname.set(
				pathname
			);
		},
		setGlobalSearchIsOpen(isOpen: boolean) {
			currentStore.shared.globalSearch.isOpen.set(isOpen);
		},
		setGlobalSearchTransientTarget(
			target: null | IGlobalSearchTransientTarget
		) {
			currentStore.shared.globalSearch.transientTarget.set(target);
		},

		onTableRowsPerPageChange(rows: Selection) {
			currentStore.tableRows.set(rows);
		},
	}));

export const globalSettingKeyIsHighAppearance = 'setting-high_appearance';

// Update the body class and local storage when there is a change in the high appearance mode.
globalStore.persistence.highAppearance.onChange((isEnabled) => {
	document.body.classList.toggle('bg-blend-mystia-pseudo', isEnabled);
	if (isEnabled) {
		safeStorage.removeItem(globalSettingKeyIsHighAppearance);
	} else {
		safeStorage.setItem(
			globalSettingKeyIsHighAppearance,
			Number(isEnabled).toString()
		);
	}
});

// Reload page if current tab version is lower than the version of the new tab.
globalStore.persistence.version.onChange((version) => {
	if (version && compareVersions(version, appVersion) === 1) {
		trackEvent(
			trackEvent.category.error,
			'Update',
			'Outdated version detected in multiple tabs',
			`${appVersion}, ${version}`
		);
		setTimeout(() => {
			location.reload();
		}, 200);
	}
});

// Update the hidden DLCs when there is a change in the persisted hidden DLCs.
globalStore.persistence.hiddenItems.dlcs.onChange((hiddenDlcs) => {
	const dlcs = hiddenDlcs.map(Number) as TDlc[];
	beveragesStore.shared.hiddenItems.dlcs.set(toSet(dlcs));
	clothesStore.shared.hiddenItems.dlcs.set(toSet(dlcs));
	cookersStore.shared.hiddenItems.dlcs.set(toSet(dlcs));
	currenciesStore.shared.hiddenItems.dlcs.set(toSet(dlcs));
	ingredientsStore.shared.hiddenItems.dlcs.set(toSet(dlcs));
	customerNormalStore.shared.hiddenItems.dlcs.set(toSet(dlcs));
	customerRareStore.shared.hiddenItems.dlcs.set(toSet(dlcs));
	ornamentsStore.shared.hiddenItems.dlcs.set(toSet(dlcs));
	partnersStore.shared.hiddenItems.dlcs.set(toSet(dlcs));
	recipesStore.shared.hiddenItems.dlcs.set(toSet(dlcs));
});

// Update the suggest meal settings when there is a change in the persisted suggest meal settings.
globalStore.persistence.suggestMeals.enabled.onChange((enabled) => {
	customerRareStore.shared.suggestMeals.enabled.set(enabled);
});
globalStore.persistence.suggestMeals.maxExtraIngredients.onChange(
	(maxExtraIngredients) => {
		customerRareStore.shared.suggestMeals.maxExtraIngredients.set(
			maxExtraIngredients
		);
	}
);
globalStore.persistence.suggestMeals.maxRating.onChange((maxRating) => {
	customerRareStore.shared.suggestMeals.maxRating.set(maxRating);
});
globalStore.persistence.suggestMeals.maxResults.onChange((maxResults) => {
	customerRareStore.shared.suggestMeals.maxResults.set(maxResults);
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

// Update the table columns, rows and hidden items when there is a change in the persisted table state.
globalStore.persistence.table.columns.beverage.onChange((columns) => {
	customerNormalStore.shared.beverage.table.columns.set(toSet(columns));
	customerRareStore.shared.beverage.table.columns.set(toSet(columns));
});
globalStore.persistence.table.columns.recipe.onChange((columns) => {
	customerNormalStore.shared.recipe.table.columns.set(toSet(columns));
	customerRareStore.shared.recipe.table.columns.set(toSet(columns));
});
globalStore.persistence.table.row.onChange((row) => {
	const rowString = row.toString();
	customerNormalStore.shared.beverage.table.page.set(1);
	customerNormalStore.shared.beverage.table.row.set(row);
	customerNormalStore.shared.beverage.table.rows.set(toSet(rowString));
	customerNormalStore.shared.recipe.table.page.set(1);
	customerNormalStore.shared.recipe.table.row.set(row);
	customerNormalStore.shared.recipe.table.rows.set(toSet(rowString));
	customerRareStore.shared.beverage.table.page.set(1);
	customerRareStore.shared.beverage.table.row.set(row);
	customerRareStore.shared.beverage.table.rows.set(toSet(rowString));
	customerRareStore.shared.recipe.table.page.set(1);
	customerRareStore.shared.recipe.table.row.set(row);
	customerRareStore.shared.recipe.table.rows.set(toSet(rowString));
});
globalStore.persistence.table.hiddenItems.beverages.onChange((beverages) => {
	const previousHiddenBeverages =
		customerNormalStore.shared.beverage.table.hiddenBeverages.get();
	const hiddenBeverages = toSet(beverages);
	const newlyHiddenBeverages = getNewlyHiddenItems(
		hiddenBeverages,
		previousHiddenBeverages
	);
	customerNormalStore.shared.beverage.table.hiddenBeverages.set(
		hiddenBeverages
	);
	customerRareStore.shared.beverage.table.hiddenBeverages.set(
		toSet(beverages)
	);
	clearHiddenBeverageSelections(newlyHiddenBeverages);
});
globalStore.persistence.table.hiddenItems.ingredients.onChange(
	(ingredients) => {
		const previousHiddenIngredients =
			customerNormalStore.shared.recipe.table.hiddenIngredients.get();
		const hiddenIngredients = toSet(ingredients);
		const newlyHiddenIngredients = getNewlyHiddenItems(
			hiddenIngredients,
			previousHiddenIngredients
		);
		customerNormalStore.shared.recipe.table.hiddenIngredients.set(
			hiddenIngredients
		);
		customerRareStore.shared.recipe.table.hiddenIngredients.set(
			toSet(ingredients)
		);
		clearHiddenRecipeSelections(
			newlyHiddenIngredients,
			new Set<TRecipeName>()
		);
	}
);
globalStore.persistence.table.hiddenItems.recipes.onChange((recipes) => {
	const previousHiddenRecipes =
		customerNormalStore.shared.recipe.table.hiddenRecipes.get();
	const hiddenRecipes = toSet(recipes);
	const newlyHiddenRecipes = getNewlyHiddenItems(
		hiddenRecipes,
		previousHiddenRecipes
	);
	customerNormalStore.shared.recipe.table.hiddenRecipes.set(hiddenRecipes);
	customerRareStore.shared.recipe.table.hiddenRecipes.set(toSet(recipes));
	clearHiddenRecipeSelections(new Set<TIngredientName>(), newlyHiddenRecipes);
});
