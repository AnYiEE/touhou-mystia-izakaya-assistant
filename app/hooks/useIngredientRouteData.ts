import { useCallback } from 'react';

import { useFilteredData, useSortedData } from '@/hooks';

import { type TIngredientTag } from '@/data';
import { customerNormalStore, customerRareStore } from '@/stores';
import { filterIngredientData } from '@/utils/customer/shared';

type TCustomerRouteStore =
	| typeof customerNormalStore
	| typeof customerRareStore;

export function useIngredientRouteData(store: TCustomerRouteStore) {
	const hiddenIngredients = store.shared.recipe.table.hiddenIngredients.use();
	const ingredientPinyinSortState =
		store.persistence.ingredient.pinyinSortState.use();
	const ingredientFilterAvailabilityDlcs =
		store.persistence.ingredient.filters.availabilityDlcs.use();
	const ingredientFilterLevels =
		store.persistence.ingredient.filters.levels.use();
	const ingredientFilterNoTags =
		store.persistence.ingredient.filters.noTags.use();
	const ingredientFilterTags =
		store.persistence.ingredient.filters.tags.use();
	const currentCustomerPopularTrend =
		store.shared.customer.popularTrend.use();
	const isFamousShop = store.shared.customer.famousShop.use();

	const instance_ingredient = store.instances.ingredient.get();

	const filterData = useCallback(
		() =>
			filterIngredientData({
				blockedIngredientNames: instance_ingredient.blockedIngredients,
				calculateTagsWithTrend: (tags) =>
					instance_ingredient.calculateTagsWithTrend(
						tags as TIngredientTag[],
						currentCustomerPopularTrend,
						isFamousShop
					),
				filterAvailabilityDlcs: ingredientFilterAvailabilityDlcs,
				filterLevels: ingredientFilterLevels,
				filterNoTags: ingredientFilterNoTags,
				filterTags: ingredientFilterTags,
				hiddenIngredientNames: hiddenIngredients,
				ingredientData: instance_ingredient.data,
			}),
		[
			currentCustomerPopularTrend,
			hiddenIngredients,
			ingredientFilterAvailabilityDlcs,
			ingredientFilterLevels,
			ingredientFilterNoTags,
			ingredientFilterTags,
			instance_ingredient,
			isFamousShop,
		]
	);

	const ingredientFilteredData = useFilteredData(
		instance_ingredient,
		filterData
	);

	const ingredientSortedData = useSortedData(
		instance_ingredient,
		ingredientFilteredData,
		ingredientPinyinSortState
	);

	return { ingredientFilteredData, ingredientSortedData };
}
