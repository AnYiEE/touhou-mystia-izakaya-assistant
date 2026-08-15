'use client';

import { useMemo } from 'react';

import { isAvailableWithHiddenDlcs } from '@/domain/availability';
import type { IAvailabilityItemData } from '@/domain/availability/types';
import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import type { TFood } from '@/domain/catalog/food/types';
import { NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { ClothesCatalog } from '@/domain/catalog/items/ClothesCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import { DecorationCatalog } from '@/domain/catalog/items/DecorationCatalog';
import { PartnerCatalog } from '@/domain/catalog/items/PartnerCatalog';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import { ALL_MAP_LABELS, MAP_FACTS } from '@/domain/data/places/placeFacts';
import type { TDlc } from '@/domain/data/shared/types';

import { buildCatalogSearchIndex } from '@/features/catalog/globalSearch/buildCatalogSearchIndex';
import { normalGuestStore } from '@/features/catalog/guests/normal/client/state/store';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import { beveragesStore } from '@/features/catalog/items/beverages/client/state/store';
import { clothesStore } from '@/features/catalog/items/clothes/client/state/store';
import { cookersStore } from '@/features/catalog/items/cookers/client/state/store';
import { currencyItemsStore } from '@/features/catalog/items/currencyItems/client/state/store';
import { decorationsStore } from '@/features/catalog/items/decorations/client/state/store';
import { foodsStore } from '@/features/catalog/items/foods/client/state/store';
import { ingredientsStore } from '@/features/catalog/items/ingredients/client/state/store';
import { partnersStore } from '@/features/catalog/items/partners/client/state/store';

function filterRecipesByHiddenIngredients(
	recipes: TFood['recipes'],
	hiddenIngredients: ReadonlySet<TIngredientId>
): TFood['recipes'] | null {
	const visibleRecipes = recipes.filter(
		({ ingredients }) =>
			!ingredients.some((ingredient) => hiddenIngredients.has(ingredient))
	);

	if (visibleRecipes.length === 0) {
		return null;
	}

	return visibleRecipes as TFood['recipes'];
}

export function useCatalogSearchContributor() {
	const beverageHiddenDlcs = beveragesStore.shared.hiddenItems.dlcs.use();
	const clothesHiddenDlcs = clothesStore.shared.hiddenItems.dlcs.use();
	const cookerHiddenDlcs = cookersStore.shared.hiddenItems.dlcs.use();
	const currencyItemHiddenDlcs =
		currencyItemsStore.shared.hiddenItems.dlcs.use();
	const decorationHiddenDlcs = decorationsStore.shared.hiddenItems.dlcs.use();
	const foodHiddenDlcs = foodsStore.shared.hiddenItems.dlcs.use();
	const ingredientHiddenDlcs = ingredientsStore.shared.hiddenItems.dlcs.use();
	const normalGuestHiddenDlcs =
		normalGuestStore.shared.hiddenItems.dlcs.use();
	const partnerHiddenDlcs = partnersStore.shared.hiddenItems.dlcs.use();
	const specialGuestHiddenDlcs =
		specialGuestStore.shared.hiddenItems.dlcs.use();

	const hiddenBeverages =
		normalGuestStore.shared.beverage.table.hiddenBeverages.use();
	const hiddenFoods = normalGuestStore.shared.recipe.table.hiddenFoods.use();
	const hiddenIngredients =
		normalGuestStore.shared.recipe.table.hiddenIngredients.use();
	const foodIsFamousShop = foodsStore.shared.famousShop.use();
	const foodPopularTrend = foodsStore.shared.popularTrend.use();
	const ingredientIsFamousShop = ingredientsStore.shared.famousShop.use();
	const ingredientPopularTrend = ingredientsStore.shared.popularTrend.use();

	const visiblePlaceValues = useMemo(
		() =>
			ALL_MAP_LABELS.filter(
				(map) => !ingredientHiddenDlcs.has(MAP_FACTS[map].dlc)
			).map((map) => MAP_FACTS[map].label),
		[ingredientHiddenDlcs]
	);

	const index = useMemo(() => {
		const filterByHiddenDlcs =
			(hiddenDlcs: ReadonlySet<TDlc>) =>
			({ availabilityPaths }: IAvailabilityItemData) =>
				isAvailableWithHiddenDlcs(availabilityPaths, hiddenDlcs);
		const foodInstance = FoodCatalog.getInstance();
		const ingredientInstance = IngredientCatalog.getInstance();
		const foods = foodInstance.data
			.filter(
				({ availabilityPaths, id }) =>
					isAvailableWithHiddenDlcs(
						availabilityPaths,
						foodHiddenDlcs
					) && !hiddenFoods.has(id)
			)
			.flatMap((item) => {
				const recipes = filterRecipesByHiddenIngredients(
					item.recipes,
					hiddenIngredients
				);
				if (recipes === null) {
					return [];
				}

				const positiveTags = [
					...new Set(
						recipes.flatMap(({ ingredients }) =>
							foodInstance.calculateFoodTagsWithTrend(
								foodInstance.composeFoodTagsWithPopularTrend(
									ingredients,
									[],
									item.positiveTags,
									[],
									foodPopularTrend
								),
								foodPopularTrend,
								foodIsFamousShop
							)
						)
					),
				];

				return [{ ...item, positiveTags, recipes }];
			});
		const ingredients = ingredientInstance.data
			.filter(
				({ availabilityPaths, id }) =>
					isAvailableWithHiddenDlcs(
						availabilityPaths,
						ingredientHiddenDlcs
					) && !hiddenIngredients.has(id)
			)
			.map((item) => ({
				...item,
				tags: ingredientInstance.calculateIngredientTagsWithTrend(
					item.tags,
					ingredientPopularTrend,
					ingredientIsFamousShop
				),
			}));

		return buildCatalogSearchIndex({
			beverages: BeverageCatalog.getInstance().data.filter(
				({ availabilityPaths, id }) =>
					isAvailableWithHiddenDlcs(
						availabilityPaths,
						beverageHiddenDlcs
					) && !hiddenBeverages.has(id)
			),
			clothes: ClothesCatalog.getInstance().data.filter(
				filterByHiddenDlcs(clothesHiddenDlcs)
			),
			cookers: CookerCatalog.getInstance().data.filter(
				filterByHiddenDlcs(cookerHiddenDlcs)
			),
			currencyItems: CurrencyItemCatalog.getInstance().data.filter(
				filterByHiddenDlcs(currencyItemHiddenDlcs)
			),
			decorations: DecorationCatalog.getInstance().data.filter(
				filterByHiddenDlcs(decorationHiddenDlcs)
			),
			foods,
			ingredients:
				ingredients as unknown as typeof ingredientInstance.data,
			normalGuests: NormalGuestCatalog.getInstance().data.filter(
				filterByHiddenDlcs(normalGuestHiddenDlcs)
			),
			partners: PartnerCatalog.getInstance().data.filter(
				filterByHiddenDlcs(partnerHiddenDlcs)
			),
			specialGuests: SpecialGuestCatalog.getInstance().data.filter(
				filterByHiddenDlcs(specialGuestHiddenDlcs)
			),
		});
	}, [
		beverageHiddenDlcs,
		clothesHiddenDlcs,
		cookerHiddenDlcs,
		currencyItemHiddenDlcs,
		decorationHiddenDlcs,
		foodHiddenDlcs,
		foodIsFamousShop,
		foodPopularTrend,
		hiddenBeverages,
		hiddenFoods,
		hiddenIngredients,
		ingredientHiddenDlcs,
		ingredientIsFamousShop,
		ingredientPopularTrend,
		normalGuestHiddenDlcs,
		partnerHiddenDlcs,
		specialGuestHiddenDlcs,
	]);

	return { index, visiblePlaceValues } as const;
}
