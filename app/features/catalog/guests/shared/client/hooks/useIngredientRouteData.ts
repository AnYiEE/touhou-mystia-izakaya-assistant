import { useCallback } from 'react';

import { type normalGuestStore } from '@/features/catalog/guests/normal/client/state/store';
import { filterIngredientData } from '@/features/catalog/guests/shared/queries/filterIngredientData';
import { type specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import { useFilteredData } from '@/features/catalog/shared/client/hooks/useFilteredData';
import { useSortedData } from '@/features/catalog/shared/client/hooks/useSortedData';

type TGuestRouteStore = typeof normalGuestStore | typeof specialGuestStore;

export function useIngredientRouteData(store: TGuestRouteStore) {
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
	const currentGuestPopularTrend = store.shared.guest.popularTrend.use();
	const isFamousShop = store.shared.guest.famousShop.use();

	const ingredientCatalog = store.instances.ingredient.get();

	const filterData = useCallback(
		() =>
			filterIngredientData({
				blockedIngredients: ingredientCatalog.blockedIngredients,
				calculateTagsWithTrend: (tags) =>
					ingredientCatalog.calculateIngredientTagsWithTrend(
						tags,
						currentGuestPopularTrend,
						isFamousShop
					),
				filterAvailabilityDlcs: ingredientFilterAvailabilityDlcs,
				filterLevels: ingredientFilterLevels,
				filterNoTags: ingredientFilterNoTags,
				filterTags: ingredientFilterTags,
				hiddenIngredients,
				ingredientData: ingredientCatalog.data,
			}),
		[
			currentGuestPopularTrend,
			hiddenIngredients,
			ingredientFilterAvailabilityDlcs,
			ingredientFilterLevels,
			ingredientFilterNoTags,
			ingredientFilterTags,
			ingredientCatalog,
			isFamousShop,
		]
	);

	const ingredientFilteredData = useFilteredData(
		ingredientCatalog,
		filterData
	);

	const ingredientSortedData = useSortedData(
		ingredientCatalog,
		ingredientFilteredData,
		ingredientPinyinSortState
	);

	return { ingredientFilteredData, ingredientSortedData };
}
