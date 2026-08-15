import type { TCookerTypeId } from '@/domain/data/cookers/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TMapLabel } from '@/domain/data/places/types';
import type { TFoodTagId } from '@/domain/data/tags/types';

import {
	FOOD_COLLABORATION_SOURCE_FILTER,
	type TFoodSourceFilter,
} from '@/features/catalog/items/foods/sourceFilter';

interface IFilterableFood {
	availabilityDlcs: ReadonlyArray<number>;
	dlc: number;
	isCollaborationSource: boolean;
	level: number;
	maps: ReadonlyArray<TMapLabel>;
	negativeTags: ReadonlyArray<TFoodTagId>;
	recipes: ReadonlyArray<{
		cookerType: TCookerTypeId;
		ingredients: ReadonlyArray<TIngredientId>;
		positiveTags: ReadonlyArray<TFoodTagId>;
	}>;
}

export function filterFoodData<TFood extends IFilterableFood>({
	data,
	filterAvailabilityDlcs,
	filterContentDlcs,
	filterCookerTypes,
	filterIngredients,
	filterLevels,
	filterNegativeTags,
	filterNoIngredients,
	filterNoNegativeTags,
	filterNoPositiveTags,
	filterNoSourceValues,
	filterPositiveTags,
	filterSourceValues,
}: {
	data: ReadonlyArray<TFood>;
	filterAvailabilityDlcs: ReadonlyArray<string>;
	filterContentDlcs: ReadonlyArray<string>;
	filterCookerTypes: ReadonlyArray<TCookerTypeId>;
	filterIngredients: ReadonlyArray<TIngredientId>;
	filterLevels: ReadonlyArray<string>;
	filterNegativeTags: ReadonlyArray<TFoodTagId>;
	filterNoIngredients: ReadonlyArray<TIngredientId>;
	filterNoNegativeTags: ReadonlyArray<TFoodTagId>;
	filterNoPositiveTags: ReadonlyArray<TFoodTagId>;
	filterNoSourceValues: ReadonlyArray<TFoodSourceFilter>;
	filterPositiveTags: ReadonlyArray<TFoodTagId>;
	filterSourceValues: ReadonlyArray<TFoodSourceFilter>;
}): TFood[] {
	const hasAvailabilityDlcFilter = filterAvailabilityDlcs.length > 0;
	const hasContentDlcFilter = filterContentDlcs.length > 0;
	const hasCookerTypeFilter = filterCookerTypes.length > 0;
	const hasIngredientFilter = filterIngredients.length > 0;
	const hasLevelFilter = filterLevels.length > 0;
	const hasNegativeTagFilter = filterNegativeTags.length > 0;
	const hasNoIngredientFilter = filterNoIngredients.length > 0;
	const hasNoNegativeTagFilter = filterNoNegativeTags.length > 0;
	const hasNoPositiveTagFilter = filterNoPositiveTags.length > 0;
	const hasNoSourceValueFilter = filterNoSourceValues.length > 0;
	const hasPositiveTagFilter = filterPositiveTags.length > 0;
	const hasSourceValueFilter = filterSourceValues.length > 0;

	return data.filter(
		({
			availabilityDlcs,
			dlc,
			isCollaborationSource,
			level,
			maps,
			negativeTags,
			recipes,
		}) => {
			const checkHasSourceValue = (sourceValue: TFoodSourceFilter) =>
				sourceValue === FOOD_COLLABORATION_SOURCE_FILTER
					? isCollaborationSource
					: maps.includes(sourceValue);
			if (
				hasAvailabilityDlcFilter &&
				!filterAvailabilityDlcs.some((selectedDlc) =>
					availabilityDlcs.some(
						(availabilityDlc) =>
							selectedDlc === String(availabilityDlc)
					)
				)
			) {
				return false;
			}
			if (
				hasContentDlcFilter &&
				!filterContentDlcs.includes(String(dlc))
			) {
				return false;
			}
			if (hasLevelFilter && !filterLevels.includes(String(level))) {
				return false;
			}
			if (
				(hasCookerTypeFilter ||
					hasIngredientFilter ||
					hasNoIngredientFilter ||
					hasNoPositiveTagFilter ||
					hasPositiveTagFilter) &&
				!recipes.some(
					({ cookerType, ingredients, positiveTags }) =>
						(!hasCookerTypeFilter ||
							filterCookerTypes.includes(cookerType)) &&
						(!hasIngredientFilter ||
							filterIngredients.every((ingredient) =>
								ingredients.includes(ingredient)
							)) &&
						(!hasNoIngredientFilter ||
							!filterNoIngredients.some((ingredient) =>
								ingredients.includes(ingredient)
							)) &&
						(!hasPositiveTagFilter ||
							filterPositiveTags.every((tag) =>
								positiveTags.includes(tag)
							)) &&
						(!hasNoPositiveTagFilter ||
							!filterNoPositiveTags.some((tag) =>
								positiveTags.includes(tag)
							))
				)
			) {
				return false;
			}
			if (
				hasNegativeTagFilter &&
				!filterNegativeTags.every((tag) => negativeTags.includes(tag))
			) {
				return false;
			}
			if (
				hasNoNegativeTagFilter &&
				filterNoNegativeTags.some((tag) => negativeTags.includes(tag))
			) {
				return false;
			}
			if (
				hasSourceValueFilter &&
				!filterSourceValues.some(checkHasSourceValue)
			) {
				return false;
			}
			if (
				hasNoSourceValueFilter &&
				filterNoSourceValues.some(checkHasSourceValue)
			) {
				return false;
			}

			return true;
		}
	);
}
