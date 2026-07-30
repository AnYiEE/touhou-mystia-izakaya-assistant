import { isAvailableWithHiddenDlcs } from '@/domain/availability';
import { type Recipe } from '@/domain/catalog/food/Recipe';
import type { TRecipe } from '@/domain/catalog/food/types';
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
import { copyArray } from '@/shared/utilities/collections/convert';
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

	switch (column) {
		case 'recipe':
			return copyArray(rows).sort(({ name: a }, { name: b }) =>
				isAscending ? pinyinSort(a, b) : pinyinSort(b, a)
			);
		case 'price':
			return copyArray(rows).sort(({ price: a }, { price: b }) =>
				isAscending ? numberSort(a, b) : numberSort(b, a)
			);
		case 'suitability':
			return copyArray(rows).sort(
				({ suitability: a }, { suitability: b }) =>
					isAscending ? numberSort(a, b) : numberSort(b, a)
			);
		case 'time':
			return copyArray(rows).sort(
				({ cookTime: { min: a } }, { cookTime: { min: b } }) =>
					isAscending ? numberSort(a, b) : numberSort(b, a)
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
	getEasterEggScore?: (recipe: TRecipe) => number | null | undefined;
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
	selectedCookers?: ReadonlyArray<TRecipe['cooker']>;
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
