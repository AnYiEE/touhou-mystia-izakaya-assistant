import { type TIngredientName, type TRecipeTag } from '@/data';
import {
	checkArrayContainsOf,
	checkArraySubsetOf,
	checkLengthEmpty,
	copyArray,
	numberSort,
	pinyinSort,
} from '@/utilities';
import type { TRecipe } from '@/utils/types';

import type {
	IRecipeSuitabilityRowsResult,
	ITableSortDescriptor,
	TRecipeSuitabilityRow,
	TRecipeTableSortKey,
	TSearchMatcher,
} from './types';

interface IRecipeSuitabilityResult {
	negativeTags?: TRecipeTag[];
	positiveTags: TRecipeTag[];
	suitability: number;
}

export interface IBuildRecipeSuitabilityRowsArgs {
	blockedRecipeNames: ReadonlySet<TRecipe['name']>;
	calculateTagsWithTrend: (
		recipeTags: ReadonlyArray<TRecipeTag>
	) => TRecipeTag[];
	composeTagsWithPopularTrend: (
		ingredients: ReadonlyArray<TIngredientName>,
		positiveTags: ReadonlyArray<TRecipeTag>
	) => TRecipeTag[];
	customerNegativeTags?: ReadonlyArray<TRecipeTag>;
	customerPositiveTags?: ReadonlyArray<TRecipeTag> | null;
	getCustomerSuitability: (
		recipeTags: ReadonlyArray<TRecipeTag>,
		customerPositiveTags: ReadonlyArray<TRecipeTag>,
		customerNegativeTags?: ReadonlyArray<TRecipeTag>
	) => IRecipeSuitabilityResult;
	getEasterEggScore?: (recipe: TRecipe) => number | null | undefined;
	hiddenDlcs: ReadonlySet<TRecipe['dlc']>;
	hiddenIngredients: ReadonlySet<TIngredientName>;
	hiddenRecipes: ReadonlySet<TRecipe['name']>;
	matchSearch: TSearchMatcher;
	page: number;
	recipes: ReadonlyArray<TRecipe>;
	rowsPerPage: number;
	searchValue?: string;
	selectedCookers?: ReadonlyArray<TRecipe['cooker']>;
	selectedDlcs?: ReadonlyArray<string>;
	selectedRecipeTags?: ReadonlyArray<TRecipeTag>;
	sortDescriptor: ITableSortDescriptor<TRecipeTableSortKey>;
}

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

function paginateRows<T>(rows: T[], page: number, rowsPerPage: number) {
	const start = (page - 1) * rowsPerPage;
	const end = start + rowsPerPage;

	return rows.slice(start, end);
}

function createRecipeRow(
	recipe: TRecipe,
	matchedPositiveTags: TRecipeTag[],
	suitability: number,
	positiveTags: TRecipeTag[] = recipe.positiveTags,
	matchedNegativeTags?: TRecipeTag[]
): TRecipeSuitabilityRow {
	return {
		...recipe,
		...(matchedNegativeTags === undefined ? {} : { matchedNegativeTags }),
		matchedPositiveTags,
		positiveTags,
		suitability,
	};
}

/**
 * 从 recipe 原始数据构建表格需要的 suitability 行数据，并保留现有过滤与排序顺序。
 */
export function buildRecipeSuitabilityRows({
	blockedRecipeNames,
	calculateTagsWithTrend,
	composeTagsWithPopularTrend,
	customerNegativeTags,
	customerPositiveTags,
	getCustomerSuitability,
	getEasterEggScore,
	hiddenDlcs,
	hiddenIngredients,
	hiddenRecipes,
	matchSearch,
	page,
	recipes,
	rowsPerPage,
	searchValue = '',
	selectedCookers = [],
	selectedDlcs = [],
	selectedRecipeTags = [],
	sortDescriptor,
}: IBuildRecipeSuitabilityRowsArgs): IRecipeSuitabilityRowsResult {
	const data = recipes.filter(
		({ dlc, name }) => !hiddenDlcs.has(dlc) && !blockedRecipeNames.has(name)
	);

	let filteredRows: TRecipeSuitabilityRow[];

	if (customerPositiveTags === null || customerPositiveTags === undefined) {
		filteredRows = data.map((recipe) =>
			createRecipeRow(
				recipe,
				[],
				0,
				recipe.positiveTags,
				customerNegativeTags === undefined ? undefined : []
			)
		);
	} else {
		const dataWithRealSuitability = data
			.map((recipe) => {
				const recipeTagsWithTrend = calculateTagsWithTrend(
					composeTagsWithPopularTrend(
						recipe.ingredients,
						recipe.positiveTags
					)
				);
				const easterEggScore = getEasterEggScore?.(recipe);

				if (easterEggScore !== null && easterEggScore !== undefined) {
					return createRecipeRow(
						recipe,
						[],
						easterEggScore > 0 ? Infinity : -Infinity,
						recipeTagsWithTrend,
						customerNegativeTags === undefined ? undefined : []
					);
				}

				const {
					negativeTags = [],
					positiveTags: matchedPositiveTags,
					suitability,
				} = getCustomerSuitability(
					recipeTagsWithTrend,
					customerPositiveTags,
					customerNegativeTags
				);

				return createRecipeRow(
					recipe,
					matchedPositiveTags,
					suitability,
					recipeTagsWithTrend,
					customerNegativeTags === undefined
						? undefined
						: negativeTags
				);
			})
			.filter(
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

		filteredRows = shouldFilterByTableOptions
			? dataWithRealSuitability.filter(
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
							checkArraySubsetOf(
								selectedRecipeTags,
								positiveTags
							);

						return (
							isNameMatched &&
							isDlcMatched &&
							isCookerMatched &&
							isPositiveTagsMatched
						);
					}
				)
			: dataWithRealSuitability;
	}

	const sortedRows = sortRecipeRows(filteredRows, sortDescriptor);
	const pagedRows = paginateRows(sortedRows, page, rowsPerPage);

	return {
		filteredRows,
		pagedRows,
		sortedRows,
		totalPages: Math.ceil(filteredRows.length / rowsPerPage),
	};
}
