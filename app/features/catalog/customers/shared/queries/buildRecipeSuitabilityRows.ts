import { isAvailableWithHiddenDlcs } from '@/domain/availability';
import { type Recipe } from '@/domain/catalog/food/Recipe';
import type {
	IProcessedRecipeVariant,
	TRecipe,
} from '@/domain/catalog/food/types';
import type { TCookerName } from '@/domain/data/cookers/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TRecipeTag } from '@/domain/data/tags/types';
import type { IPopularTrend } from '@/domain/trends/types';

import type {
	IRecipeSuitabilityRowsResult,
	TRecipeSuitabilityRow,
} from '@/features/catalog/customers/shared/contracts';
import {
	type ITableSortDescriptor,
	type TRecipeTableSortKey,
} from '@/features/catalog/customers/shared/state/tableDescriptors';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { type TSearchMatcher } from '@/shared/utilities/search/matchPinyinName';
import { numberSort } from '@/shared/utilities/sort/numberSort';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

import {
	buildPaginateRows,
	getTotalPages,
	normalizePositiveInteger,
} from './pagination';

function sortRecipeRows(
	rows: TRecipeSuitabilityRow[],
	sortDescriptor: ITableSortDescriptor<TRecipeTableSortKey>
) {
	const { column, direction } = sortDescriptor;
	const isAscending = direction === 'ascending';
	const compareWithStableFallback = (
		left: TRecipeSuitabilityRow,
		right: TRecipeSuitabilityRow,
		primaryComparison: number
	) => {
		if (primaryComparison !== 0) {
			return primaryComparison;
		}

		const nameComparison = pinyinSort(left.name, right.name);
		if (nameComparison !== 0) {
			return isAscending ? nameComparison : -nameComparison;
		}

		const recipeIdComparison = numberSort(left.recipeId, right.recipeId);
		return isAscending ? recipeIdComparison : -recipeIdComparison;
	};

	switch (column) {
		case 'recipe':
			return rows.toSorted((left, right) =>
				compareWithStableFallback(
					left,
					right,
					isAscending
						? pinyinSort(left.name, right.name)
						: pinyinSort(right.name, left.name)
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

export function buildRecipeSuitabilityRows({
	customerNegativeTags,
	customerPositiveTags,
	getEasterEggScore,
	hiddenDlcs,
	hiddenIngredients,
	hiddenRecipes,
	isFamousShop,
	matchSearch,
	page,
	popularTrend,
	recipeInstance,
	rowsPerPage,
	searchValue = '',
	selectedAvailabilityDlcs = [],
	selectedCookers = [],
	selectedRecipeTags = [],
	sortDescriptor,
}: {
	customerNegativeTags?: ReadonlyArray<TRecipeTag>;
	customerPositiveTags?: ReadonlyArray<TRecipeTag> | null;
	getEasterEggScore?: (
		recipe: TRecipe,
		variant: IProcessedRecipeVariant
	) => number | null | undefined;
	hiddenDlcs: ReadonlySet<TRecipe['dlc']>;
	hiddenIngredients: ReadonlySet<TIngredientName>;
	hiddenRecipes: ReadonlySet<TRecipe['name']>;
	isFamousShop: boolean;
	matchSearch: TSearchMatcher;
	page: number;
	popularTrend: IPopularTrend;
	recipeInstance: Recipe;
	rowsPerPage: number;
	searchValue?: string;
	selectedAvailabilityDlcs?: ReadonlyArray<string>;
	selectedCookers?: ReadonlyArray<TCookerName>;
	selectedRecipeTags?: ReadonlyArray<TRecipeTag>;
	sortDescriptor: ITableSortDescriptor<TRecipeTableSortKey>;
}): IRecipeSuitabilityRowsResult {
	const data: TRecipeSuitabilityRow[] = recipeInstance
		.buildRecipeSuitabilityRows({
			...(customerNegativeTags === undefined
				? {}
				: { customerNegativeTags }),
			...(customerPositiveTags === undefined
				? {}
				: { customerPositiveTags }),
			...(getEasterEggScore === undefined ? {} : { getEasterEggScore }),
			isFamousShop,
			popularTrend,
		})
		.filter(({ availabilityPaths }) =>
			isAvailableWithHiddenDlcs(availabilityPaths, hiddenDlcs)
		);
	const dataWithVisibleRows = data.filter(
		({ ingredients, name }) =>
			!ingredients.some((ingredientName) =>
				hiddenIngredients.has(ingredientName)
			) && !hiddenRecipes.has(name)
	);

	const hasNameFilter = Boolean(searchValue);
	const shouldFilterByTableOptions =
		hasNameFilter ||
		!checkLengthEmpty(selectedAvailabilityDlcs) ||
		!checkLengthEmpty(selectedCookers) ||
		!checkLengthEmpty(selectedRecipeTags);

	const filteredRows = shouldFilterByTableOptions
		? dataWithVisibleRows.filter(
				({ availabilityDlcs, cooker, name, pinyin, positiveTags }) => {
					const isNameMatched = hasNameFilter
						? matchSearch(searchValue, { name, pinyin })
						: true;
					const isAvailabilityDlcMatched =
						checkLengthEmpty(selectedAvailabilityDlcs) ||
						availabilityDlcs.some((value) =>
							selectedAvailabilityDlcs.includes(value.toString())
						);
					const isCookerMatched =
						checkLengthEmpty(selectedCookers) ||
						selectedCookers.includes(cooker);
					const isPositiveTagsMatched =
						checkLengthEmpty(selectedRecipeTags) ||
						selectedRecipeTags.every((value) =>
							positiveTags.includes(value)
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

	const sortedRows = sortRecipeRows(filteredRows, sortDescriptor);
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
