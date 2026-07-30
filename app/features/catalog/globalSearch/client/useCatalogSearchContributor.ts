'use client';

import { useMemo } from 'react';

import { isAvailableWithHiddenDlcs } from '@/domain/availability';
import type { IAvailabilityItemData } from '@/domain/availability/types';
import { CustomerNormal } from '@/domain/catalog/customers/CustomerNormal';
import { CustomerRare } from '@/domain/catalog/customers/CustomerRare';
import { Beverage } from '@/domain/catalog/food/Beverage';
import { Ingredient } from '@/domain/catalog/food/Ingredient';
import { Recipe } from '@/domain/catalog/food/Recipe';
import type { TRecipe } from '@/domain/catalog/food/types';
import { Clothes } from '@/domain/catalog/items/Clothes';
import { Cooker } from '@/domain/catalog/items/Cooker';
import { Currency } from '@/domain/catalog/items/Currency';
import { Ornament } from '@/domain/catalog/items/Ornament';
import { Partner } from '@/domain/catalog/items/Partner';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import { ALL_PLACES, PLACE_DLC_MAP } from '@/domain/data/places/placeFacts';
import type { TDlc } from '@/domain/data/shared/types';

import { customerNormalStore } from '@/features/catalog/customers/normal/client/state/store';
import { customerRareStore } from '@/features/catalog/customers/rare/client/state/store';
import { buildCatalogSearchIndex } from '@/features/catalog/globalSearch/buildCatalogSearchIndex';
import { beveragesStore } from '@/features/catalog/items/beverages/client/state/store';
import { clothesStore } from '@/features/catalog/items/clothes/client/state/store';
import { cookersStore } from '@/features/catalog/items/cookers/client/state/store';
import { currenciesStore } from '@/features/catalog/items/currencies/client/state/store';
import { ingredientsStore } from '@/features/catalog/items/ingredients/client/state/store';
import { ornamentsStore } from '@/features/catalog/items/ornaments/client/state/store';
import { partnersStore } from '@/features/catalog/items/partners/client/state/store';
import { recipesStore } from '@/features/catalog/items/recipes/client/state/store';

function filterRecipeVariantsByHiddenIngredients(
	recipes: TRecipe['recipes'],
	hiddenIngredients: ReadonlySet<TIngredientName>
): TRecipe['recipes'] | null {
	const [firstRecipe, ...remainingRecipes] = recipes.filter(
		({ ingredients: variantIngredients }) =>
			!variantIngredients.some((ingredient) =>
				hiddenIngredients.has(ingredient)
			)
	);

	return firstRecipe === undefined
		? null
		: [firstRecipe, ...remainingRecipes];
}

export function useCatalogSearchContributor() {
	const beverageHiddenDlcs = beveragesStore.shared.hiddenItems.dlcs.use();
	const clothesHiddenDlcs = clothesStore.shared.hiddenItems.dlcs.use();
	const cookerHiddenDlcs = cookersStore.shared.hiddenItems.dlcs.use();
	const currencyHiddenDlcs = currenciesStore.shared.hiddenItems.dlcs.use();
	const ingredientHiddenDlcs = ingredientsStore.shared.hiddenItems.dlcs.use();
	const ornamentHiddenDlcs = ornamentsStore.shared.hiddenItems.dlcs.use();
	const partnerHiddenDlcs = partnersStore.shared.hiddenItems.dlcs.use();
	const recipeHiddenDlcs = recipesStore.shared.hiddenItems.dlcs.use();
	const customerNormalHiddenDlcs =
		customerNormalStore.shared.hiddenItems.dlcs.use();
	const customerRareHiddenDlcs =
		customerRareStore.shared.hiddenItems.dlcs.use();

	const hiddenBeverages =
		customerNormalStore.shared.beverage.table.hiddenBeverages.use();
	const hiddenIngredients =
		customerNormalStore.shared.recipe.table.hiddenIngredients.use();
	const hiddenRecipes =
		customerNormalStore.shared.recipe.table.hiddenRecipes.use();
	const isFamousShop = ingredientsStore.shared.famousShop.use();
	const ingredientPopularTrend = ingredientsStore.shared.popularTrend.use();
	const recipePopularTrend = recipesStore.shared.popularTrend.use();
	const recipeIsFamousShop = recipesStore.shared.famousShop.use();

	const visiblePlaceValues = useMemo(
		() =>
			ALL_PLACES.filter(
				(place) => !ingredientHiddenDlcs.has(PLACE_DLC_MAP[place])
			),
		[ingredientHiddenDlcs]
	);

	const index = useMemo(() => {
		const filterByHiddenDlcs =
			(hiddenDlcs: ReadonlySet<TDlc>) =>
			({ availabilityPaths }: IAvailabilityItemData) =>
				isAvailableWithHiddenDlcs(availabilityPaths, hiddenDlcs);
		const ingredientInstance = Ingredient.getInstance();
		const recipeInstance = Recipe.getInstance();
		const ingredients = ingredientInstance.data
			.filter(
				({ availabilityPaths, name }) =>
					isAvailableWithHiddenDlcs(
						availabilityPaths,
						ingredientHiddenDlcs
					) && !hiddenIngredients.has(name)
			)
			.map((item) => ({
				...item,
				tags: ingredientInstance.calculateTagsWithTrend(
					item.tags,
					ingredientPopularTrend,
					isFamousShop
				),
			}));
		const recipes = recipeInstance.data
			.filter(
				({ availabilityPaths, name }) =>
					isAvailableWithHiddenDlcs(
						availabilityPaths,
						recipeHiddenDlcs
					) && !hiddenRecipes.has(name)
			)
			.flatMap((item) => {
				const recipes = filterRecipeVariantsByHiddenIngredients(
					item.recipes,
					hiddenIngredients
				);
				if (recipes === null) {
					return [];
				}

				const positiveTags = [
					...new Set(
						recipes.flatMap(({ ingredients: variantIngredients }) =>
							recipeInstance.calculateTagsWithTrend(
								recipeInstance.composeTagsWithPopularTrend(
									variantIngredients,
									[],
									item.positiveTags,
									[],
									recipePopularTrend
								),
								recipePopularTrend,
								recipeIsFamousShop
							)
						)
					),
				];

				return [{ ...item, positiveTags, recipes }];
			});

		return buildCatalogSearchIndex({
			beverages: Beverage.getInstance().data.filter(
				({ availabilityPaths, name }) =>
					isAvailableWithHiddenDlcs(
						availabilityPaths,
						beverageHiddenDlcs
					) && !hiddenBeverages.has(name)
			),
			clothes: Clothes.getInstance().data.filter(
				filterByHiddenDlcs(clothesHiddenDlcs)
			),
			cookers: Cooker.getInstance().data.filter(
				filterByHiddenDlcs(cookerHiddenDlcs)
			),
			currencies: Currency.getInstance().data.filter(
				filterByHiddenDlcs(currencyHiddenDlcs)
			),
			customerNormal: CustomerNormal.getInstance().data.filter(
				filterByHiddenDlcs(customerNormalHiddenDlcs)
			),
			customerRare: CustomerRare.getInstance().data.filter(
				filterByHiddenDlcs(customerRareHiddenDlcs)
			),
			ingredients:
				ingredients as unknown as typeof ingredientInstance.data,
			ornaments: Ornament.getInstance().data.filter(
				filterByHiddenDlcs(ornamentHiddenDlcs)
			),
			partners: Partner.getInstance().data.filter(
				filterByHiddenDlcs(partnerHiddenDlcs)
			),
			recipes,
		});
	}, [
		beverageHiddenDlcs,
		clothesHiddenDlcs,
		cookerHiddenDlcs,
		currencyHiddenDlcs,
		customerNormalHiddenDlcs,
		customerRareHiddenDlcs,
		hiddenBeverages,
		hiddenIngredients,
		hiddenRecipes,
		ingredientHiddenDlcs,
		ingredientPopularTrend,
		isFamousShop,
		ornamentHiddenDlcs,
		partnerHiddenDlcs,
		recipeHiddenDlcs,
		recipeIsFamousShop,
		recipePopularTrend,
	]);

	return { index, visiblePlaceValues } as const;
}
