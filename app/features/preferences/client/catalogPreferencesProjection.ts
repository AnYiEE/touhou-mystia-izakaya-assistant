import { Recipe } from '@/domain/catalog/food/Recipe';
import type { TBeverageName } from '@/domain/data/beverages/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TRecipeName } from '@/domain/data/recipes/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { IMealRecipe } from '@/domain/meals/types';
import type { IPopularTrend } from '@/domain/trends/types';

import { customerNormalStore } from '@/features/catalog/customers/normal/client/state/store';
import { customerRareStore } from '@/features/catalog/customers/rare/client/state/store';
import { beveragesStore } from '@/features/catalog/items/beverages/client/state/store';
import { clothesStore } from '@/features/catalog/items/clothes/client/state/store';
import { cookersStore } from '@/features/catalog/items/cookers/client/state/store';
import { currenciesStore } from '@/features/catalog/items/currencies/client/state/store';
import { ingredientsStore } from '@/features/catalog/items/ingredients/client/state/store';
import { ornamentsStore } from '@/features/catalog/items/ornaments/client/state/store';
import { partnersStore } from '@/features/catalog/items/partners/client/state/store';
import { recipesStore } from '@/features/catalog/items/recipes/client/state/store';
import type { ICatalogPreferencesProjection } from '@/features/preferences/contracts';

import { toSet } from '@/shared/utilities/collections/convert';

import { globalStore } from './state/globalPersistenceStore';

const recipeInstance = Recipe.getInstance();

function checkRecipeDataHasHiddenBaseIngredient(
	recipeData: IMealRecipe,
	hiddenIngredients: ReadonlySet<TIngredientName>
) {
	try {
		return recipeInstance
			.resolveMealRecipe(recipeData)
			.baseIngredients.some((ingredientName) =>
				hiddenIngredients.has(ingredientName)
			);
	} catch {
		return true;
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

function getHiddenDlcs(hiddenDlcValues: ReadonlyArray<string>) {
	return hiddenDlcValues.map(Number) as TDlc[];
}

function applyInitialHiddenDlcs(hiddenDlcValues: ReadonlyArray<string>) {
	const hiddenDlcs = getHiddenDlcs(hiddenDlcValues);
	beveragesStore.shared.hiddenItems.dlcs.set(toSet(hiddenDlcs));
	clothesStore.shared.hiddenItems.dlcs.set(toSet(hiddenDlcs));
	cookersStore.shared.hiddenItems.dlcs.set(toSet(hiddenDlcs));
	currenciesStore.shared.hiddenItems.dlcs.set(toSet(hiddenDlcs));
	customerNormalStore.shared.hiddenItems.dlcs.set(toSet(hiddenDlcs));
	customerRareStore.shared.hiddenItems.dlcs.set(toSet(hiddenDlcs));
	ingredientsStore.shared.hiddenItems.dlcs.set(toSet(hiddenDlcs));
	ornamentsStore.shared.hiddenItems.dlcs.set(toSet(hiddenDlcs));
	partnersStore.shared.hiddenItems.dlcs.set(toSet(hiddenDlcs));
	recipesStore.shared.hiddenItems.dlcs.set(toSet(hiddenDlcs));
}

function applyChangedHiddenDlcs(hiddenDlcValues: ReadonlyArray<string>) {
	const hiddenDlcs = getHiddenDlcs(hiddenDlcValues);
	beveragesStore.shared.hiddenItems.dlcs.set(toSet(hiddenDlcs));
	clothesStore.shared.hiddenItems.dlcs.set(toSet(hiddenDlcs));
	cookersStore.shared.hiddenItems.dlcs.set(toSet(hiddenDlcs));
	currenciesStore.shared.hiddenItems.dlcs.set(toSet(hiddenDlcs));
	ingredientsStore.shared.hiddenItems.dlcs.set(toSet(hiddenDlcs));
	customerNormalStore.shared.hiddenItems.dlcs.set(toSet(hiddenDlcs));
	customerRareStore.shared.hiddenItems.dlcs.set(toSet(hiddenDlcs));
	ornamentsStore.shared.hiddenItems.dlcs.set(toSet(hiddenDlcs));
	partnersStore.shared.hiddenItems.dlcs.set(toSet(hiddenDlcs));
	recipesStore.shared.hiddenItems.dlcs.set(toSet(hiddenDlcs));
}

function applyFamousShop(famousShop: boolean) {
	customerNormalStore.shared.customer.famousShop.set(famousShop);
	customerRareStore.shared.customer.famousShop.set(famousShop);
	ingredientsStore.shared.famousShop.set(famousShop);
	recipesStore.shared.famousShop.set(famousShop);
}

function applyPopularTrend(popularTrend: IPopularTrend, isInitial: boolean) {
	if (isInitial) {
		customerNormalStore.shared.customer.popularTrend.set(popularTrend);
		customerRareStore.shared.customer.popularTrend.set(popularTrend);
		ingredientsStore.shared.popularTrend.set(popularTrend);
		recipesStore.shared.popularTrend.set(popularTrend);
		return;
	}

	customerNormalStore.shared.customer.popularTrend.assign(popularTrend);
	customerRareStore.shared.customer.popularTrend.assign(popularTrend);
	ingredientsStore.shared.popularTrend.assign(popularTrend);
	recipesStore.shared.popularTrend.assign(popularTrend);
}

function applyInitialTableState() {
	const beverageColumns =
		globalStore.persistence.table.columns.beverage.get();
	const recipeColumns = globalStore.persistence.table.columns.recipe.get();
	const row = globalStore.persistence.table.row.get();
	const selectableRows = globalStore.shared.table.selectableRows.get();
	const rowSet = toSet(row.toString());

	customerNormalStore.shared.beverage.table.columns.set(
		toSet(beverageColumns)
	);
	customerNormalStore.shared.beverage.table.row.set(row);
	customerNormalStore.shared.beverage.table.rows.set(rowSet);
	customerNormalStore.shared.beverage.table.selectableRows.set(
		selectableRows
	);
	customerNormalStore.shared.recipe.table.columns.set(toSet(recipeColumns));
	customerNormalStore.shared.recipe.table.row.set(row);
	customerNormalStore.shared.recipe.table.rows.set(rowSet);
	customerNormalStore.shared.recipe.table.selectableRows.set(selectableRows);
	customerRareStore.shared.beverage.table.columns.set(toSet(beverageColumns));
	customerRareStore.shared.beverage.table.row.set(row);
	customerRareStore.shared.beverage.table.rows.set(rowSet);
	customerRareStore.shared.beverage.table.selectableRows.set(selectableRows);
	customerRareStore.shared.recipe.table.columns.set(toSet(recipeColumns));
	customerRareStore.shared.recipe.table.row.set(row);
	customerRareStore.shared.recipe.table.rows.set(rowSet);
	customerRareStore.shared.recipe.table.selectableRows.set(selectableRows);

	const hiddenBeverages =
		globalStore.persistence.table.hiddenItems.beverages.get();
	const hiddenIngredients =
		globalStore.persistence.table.hiddenItems.ingredients.get();
	const hiddenRecipes =
		globalStore.persistence.table.hiddenItems.recipes.get();
	customerNormalStore.shared.beverage.table.hiddenBeverages.set(
		toSet(hiddenBeverages)
	);
	customerNormalStore.shared.recipe.table.hiddenIngredients.set(
		toSet(hiddenIngredients)
	);
	customerNormalStore.shared.recipe.table.hiddenRecipes.set(
		toSet(hiddenRecipes)
	);
	customerRareStore.shared.beverage.table.hiddenBeverages.set(
		toSet(hiddenBeverages)
	);
	customerRareStore.shared.recipe.table.hiddenIngredients.set(
		toSet(hiddenIngredients)
	);
	customerRareStore.shared.recipe.table.hiddenRecipes.set(
		toSet(hiddenRecipes)
	);
}

function applyInitialProjection() {
	applyInitialHiddenDlcs(globalStore.persistence.hiddenItems.dlcs.get());
	applyFamousShop(globalStore.persistence.famousShop.get());
	applyPopularTrend(globalStore.persistence.popularTrend.get(), true);
	applyInitialTableState();
}

export function createCatalogPreferencesProjection(): ICatalogPreferencesProjection {
	return {
		start() {
			applyInitialProjection();

			const unsubscribers = [
				globalStore.persistence.hiddenItems.dlcs.onChange(
					applyChangedHiddenDlcs
				),
				globalStore.persistence.famousShop.onChange((famousShop) => {
					applyFamousShop(famousShop);
				}),
				globalStore.persistence.popularTrend.onChange(
					(popularTrend) => {
						applyPopularTrend(popularTrend, false);
					}
				),
				globalStore.persistence.table.columns.beverage.onChange(
					(columns) => {
						customerNormalStore.shared.beverage.table.columns.set(
							toSet(columns)
						);
						customerRareStore.shared.beverage.table.columns.set(
							toSet(columns)
						);
					}
				),
				globalStore.persistence.table.columns.recipe.onChange(
					(columns) => {
						customerNormalStore.shared.recipe.table.columns.set(
							toSet(columns)
						);
						customerRareStore.shared.recipe.table.columns.set(
							toSet(columns)
						);
					}
				),
				globalStore.persistence.table.row.onChange((row) => {
					const rowString = row.toString();
					customerNormalStore.shared.beverage.table.page.set(1);
					customerNormalStore.shared.beverage.table.row.set(row);
					customerNormalStore.shared.beverage.table.rows.set(
						toSet(rowString)
					);
					customerNormalStore.shared.recipe.table.page.set(1);
					customerNormalStore.shared.recipe.table.row.set(row);
					customerNormalStore.shared.recipe.table.rows.set(
						toSet(rowString)
					);
					customerRareStore.shared.beverage.table.page.set(1);
					customerRareStore.shared.beverage.table.row.set(row);
					customerRareStore.shared.beverage.table.rows.set(
						toSet(rowString)
					);
					customerRareStore.shared.recipe.table.page.set(1);
					customerRareStore.shared.recipe.table.row.set(row);
					customerRareStore.shared.recipe.table.rows.set(
						toSet(rowString)
					);
				}),
				globalStore.persistence.table.hiddenItems.beverages.onChange(
					(beverages) => {
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
					}
				),
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
				),
				globalStore.persistence.table.hiddenItems.recipes.onChange(
					(recipes) => {
						const previousHiddenRecipes =
							customerNormalStore.shared.recipe.table.hiddenRecipes.get();
						const hiddenRecipes = toSet(recipes);
						const newlyHiddenRecipes = getNewlyHiddenItems(
							hiddenRecipes,
							previousHiddenRecipes
						);
						customerNormalStore.shared.recipe.table.hiddenRecipes.set(
							hiddenRecipes
						);
						customerRareStore.shared.recipe.table.hiddenRecipes.set(
							toSet(recipes)
						);
						clearHiddenRecipeSelections(
							new Set<TIngredientName>(),
							newlyHiddenRecipes
						);
					}
				),
			];

			return () => {
				unsubscribers.forEach((unsubscribe) => {
					unsubscribe();
				});
			};
		},
	};
}
