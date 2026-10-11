import { isAvailableWithHiddenDlcs } from '@/domain/availability';
import { type FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import type { IProcessedRecipe, TFood } from '@/domain/catalog/food/types';
import type { TCookerTypeId } from '@/domain/data/cookers/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TFoodTagId } from '@/domain/data/tags/types';
import type { IPopularTrend } from '@/domain/trends/types';

import type {
	IFoodSuitabilityRowsResult,
	TFoodSuitabilityRow,
} from '@/features/catalog/guests/shared/contracts';
import {
	type ITableSortDescriptor,
	type TFoodTableSortKey,
} from '@/features/catalog/guests/shared/state/tableDescriptors';
import { getActiveLocalizationLocale } from '@/features/catalog/shared/client/localization/activeLocalizationLocale';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { compareLocalizedName } from '@/shared/utilities/search/localeNameMatch';
import { type TSearchMatcher } from '@/shared/utilities/search/matchPinyinName';
import { numberSort } from '@/shared/utilities/sort/numberSort';

import {
	buildPaginateRows,
	getTotalPages,
	normalizePositiveInteger,
} from './pagination';

function sortFoodRows(
	rows: TFoodSuitabilityRow[],
	sortDescriptor: ITableSortDescriptor<TFoodTableSortKey>
) {
	const { column, direction } = sortDescriptor;
	const isAscending = direction === 'ascending';

	const compareNames = (
		left: TFoodSuitabilityRow,
		right: TFoodSuitabilityRow
	) =>
		compareLocalizedName(
			left.name,
			right.name,
			getActiveLocalizationLocale()
		);

	const compareWithStableFallback = (
		left: TFoodSuitabilityRow,
		right: TFoodSuitabilityRow,
		primaryComparison: number
	) => {
		if (primaryComparison !== 0) {
			return primaryComparison;
		}

		const nameComparison = compareNames(left, right);
		if (nameComparison !== 0) {
			return isAscending ? nameComparison : -nameComparison;
		}

		const recipeIdComparison = numberSort(left.recipeId, right.recipeId);
		return isAscending ? recipeIdComparison : -recipeIdComparison;
	};

	switch (column) {
		case 'food':
			return rows.toSorted((left, right) =>
				compareWithStableFallback(
					left,
					right,
					isAscending
						? compareNames(left, right)
						: compareNames(right, left)
				)
			);
		case 'price':
			return rows.toSorted((left, right) =>
				compareWithStableFallback(
					left,
					right,
					isAscending
						? numberSort(left.price, right.price)
						: numberSort(right.price, left.price)
				)
			);
		case 'suitability':
			return rows.toSorted((left, right) =>
				compareWithStableFallback(
					left,
					right,
					isAscending
						? numberSort(left.suitability, right.suitability)
						: numberSort(right.suitability, left.suitability)
				)
			);
		case 'time':
			return rows.toSorted((left, right) =>
				compareWithStableFallback(
					left,
					right,
					isAscending
						? numberSort(left.cookTime.min, right.cookTime.min)
						: numberSort(right.cookTime.min, left.cookTime.min)
				)
			);
		default:
			return rows;
	}
}

export function buildFoodSuitabilityRows({
	foodCatalog,
	getEasterEggScore,
	guestNegativeTags,
	guestPositiveTags,
	hiddenDlcs,
	hiddenFoods,
	hiddenIngredients,
	isFamousShop,
	matchSearch,
	page,
	popularTrend,
	rowsPerPage,
	searchValue = '',
	selectedAvailabilityDlcs = [],
	selectedCookerTypes = [],
	selectedFoodTags = [],
	sortDescriptor,
}: {
	foodCatalog: FoodCatalog;
	getEasterEggScore?: (
		food: TFood,
		recipe: IProcessedRecipe
	) => number | null | undefined;
	guestNegativeTags?: ReadonlyArray<TFoodTagId>;
	guestPositiveTags?: ReadonlyArray<TFoodTagId> | null;
	hiddenDlcs: ReadonlySet<TFood['dlc']>;
	hiddenFoods: ReadonlySet<TFoodId>;
	hiddenIngredients: ReadonlySet<TIngredientId>;
	isFamousShop: boolean;
	matchSearch: TSearchMatcher;
	page: number;
	popularTrend: IPopularTrend;
	rowsPerPage: number;
	searchValue?: string;
	selectedAvailabilityDlcs?: ReadonlyArray<string>;
	selectedCookerTypes?: ReadonlyArray<TCookerTypeId>;
	selectedFoodTags?: ReadonlyArray<TFoodTagId>;
	sortDescriptor: ITableSortDescriptor<TFoodTableSortKey>;
}): IFoodSuitabilityRowsResult {
	const data: TFoodSuitabilityRow[] = foodCatalog
		.buildFoodSuitabilityRows({
			...(guestNegativeTags === undefined ? {} : { guestNegativeTags }),
			...(guestPositiveTags === undefined ? {} : { guestPositiveTags }),
			...(getEasterEggScore === undefined ? {} : { getEasterEggScore }),
			isFamousShop,
			popularTrend,
		})
		.filter(({ availabilityPaths }) =>
			isAvailableWithHiddenDlcs(availabilityPaths, hiddenDlcs)
		);
	const dataWithVisibleRows = data.filter(
		({ id, ingredients }) =>
			!ingredients.some((ingredient) =>
				hiddenIngredients.has(ingredient)
			) && !hiddenFoods.has(id)
	);

	const hasNameFilter = Boolean(searchValue);
	const shouldFilterByTableOptions =
		hasNameFilter ||
		!checkLengthEmpty(selectedAvailabilityDlcs) ||
		!checkLengthEmpty(selectedCookerTypes) ||
		!checkLengthEmpty(selectedFoodTags);

	const filteredRows = shouldFilterByTableOptions
		? dataWithVisibleRows.filter(
				({
					availabilityDlcs,
					cookerType,
					name,
					pinyin,
					positiveTags,
				}) => {
					const isNameMatched = hasNameFilter
						? matchSearch(searchValue, { name, pinyin })
						: true;
					const isAvailabilityDlcMatched =
						checkLengthEmpty(selectedAvailabilityDlcs) ||
						availabilityDlcs.some((value) =>
							selectedAvailabilityDlcs.includes(value.toString())
						);
					const isCookerMatched =
						checkLengthEmpty(selectedCookerTypes) ||
						selectedCookerTypes.includes(cookerType);
					const isPositiveTagsMatched =
						checkLengthEmpty(selectedFoodTags) ||
						selectedFoodTags.every((tag) =>
							positiveTags.includes(tag)
						);

					return (
						isNameMatched &&
						isAvailabilityDlcMatched &&
						isCookerMatched &&
						isPositiveTagsMatched
					);
				}
			)
		: dataWithVisibleRows;

	const sortedRows = sortFoodRows(filteredRows, sortDescriptor);
	const normalizedRowsPerPage = normalizePositiveInteger(rowsPerPage);
	const totalPages = getTotalPages(
		filteredRows.length,
		normalizedRowsPerPage
	);
	const pagedRows = buildPaginateRows(
		sortedRows,
		page,
		normalizedRowsPerPage,
		totalPages
	);

	return { filteredRows, pagedRows, sortedRows, totalPages };
}
