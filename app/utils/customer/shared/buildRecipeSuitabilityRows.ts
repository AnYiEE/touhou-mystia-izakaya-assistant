import { type TIngredientName, type TRecipeTag } from '@/data';
import type { IPopularTrend } from '@/types';
import {
	type TSearchMatcher,
	checkArrayContainsOf,
	checkArraySubsetOf,
	checkLengthEmpty,
	copyArray,
	numberSort,
	pinyinSort,
} from '@/utilities';
import { type Recipe } from '@/utils';
import type { TRecipe } from '@/utils/types';

import {
	buildPaginateRows,
	getTotalPages,
	normalizePositiveInteger,
} from './getPaginateMeta';
import type {
	IRecipeSuitabilityRowsResult,
	ITableSortDescriptor,
	TRecipeSuitabilityRow,
	TRecipeTableSortKey,
} from './types';

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
	selectedCookers = [],
	selectedDlcs = [],
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
	selectedCookers?: ReadonlyArray<TRecipe['cooker']>;
	selectedDlcs?: ReadonlyArray<string>;
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
		.filter(({ dlc }) => !hiddenDlcs.has(dlc));
	const dataWithVisibleRows = data.filter(
		({ ingredients, name }) =>
			!checkArrayContainsOf(ingredients, hiddenIngredients) &&
			!hiddenRecipes.has(name)
	);

	const hasNameFilter = Boolean(searchValue);
	const shouldFilterByTableOptions =
		hasNameFilter ||
		!checkLengthEmpty(selectedCookers) ||
		!checkLengthEmpty(selectedDlcs) ||
		!checkLengthEmpty(selectedRecipeTags);

	const filteredRows = shouldFilterByTableOptions
		? dataWithVisibleRows.filter(
				({ cooker, dlc, name, pinyin, positiveTags }) => {
					const isNameMatched = hasNameFilter
						? matchSearch(searchValue, { name, pinyin })
						: true;
					const isDlcMatched =
						checkLengthEmpty(selectedDlcs) ||
						selectedDlcs.includes(dlc.toString());
					const isCookerMatched =
						checkLengthEmpty(selectedCookers) ||
						selectedCookers.includes(cooker);
					const isPositiveTagsMatched =
						checkLengthEmpty(selectedRecipeTags) ||
						checkArraySubsetOf(selectedRecipeTags, positiveTags);

					return (
						isNameMatched &&
						isDlcMatched &&
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
