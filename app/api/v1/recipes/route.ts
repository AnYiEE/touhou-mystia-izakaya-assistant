import { type NextRequest } from 'next/server';

import { Recipe } from '@/utils/food/recipes';
import {
	applyNameSearch,
	applySortParam,
	createJsonResponse,
	handleOptionsRequest,
	parseBooleanParam,
	parseCommaSeparatedParam,
	sortTagsByPinyin,
} from '@/api/v1/utils';
import { checkArrayContainsOf, checkArraySubsetOf } from '@/utilities';
import type { IPopularTrend } from '@/types';

export function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const instance = Recipe.getInstance();

	const nameParam = searchParams.get('name');
	const sortParam = searchParams.get('sort');
	const popularTagParam = searchParams.get('popularTag');
	const popularNegativeParam = searchParams.get('popularNegative');
	const isFamousShopParam = searchParams.get('isFamousShop');

	const filterDlcs = parseCommaSeparatedParam(searchParams.get('dlc'));
	const filterLevels = parseCommaSeparatedParam(searchParams.get('level'));
	const filterCookers = parseCommaSeparatedParam(searchParams.get('cooker'));
	const filterIngredients = parseCommaSeparatedParam(
		searchParams.get('ingredient')
	);
	const filterNoIngredients = parseCommaSeparatedParam(
		searchParams.get('noIngredient')
	);
	const filterPositiveTags = parseCommaSeparatedParam(
		searchParams.get('positiveTag')
	);
	const filterNoPositiveTags = parseCommaSeparatedParam(
		searchParams.get('noPositiveTag')
	);
	const filterNegativeTags = parseCommaSeparatedParam(
		searchParams.get('negativeTag')
	);
	const filterNoNegativeTags = parseCommaSeparatedParam(
		searchParams.get('noNegativeTag')
	);

	const data = applyNameSearch(instance.data, nameParam);
	let normalizedData = data.map((item) => ({
		...item,
		negativeTags: sortTagsByPinyin([...item.negativeTags]),
		positiveTags: sortTagsByPinyin([...item.positiveTags]),
	}));

	const hasTrend = popularTagParam !== null || isFamousShopParam !== null;
	if (hasTrend) {
		const popularTrend: IPopularTrend = {
			isNegative: parseBooleanParam(popularNegativeParam),
			tag: (popularTagParam as IPopularTrend['tag']) ?? null,
		};
		const isFamousShop = parseBooleanParam(isFamousShopParam);

		normalizedData = normalizedData.map((item) => ({
			...item,
			negativeTags: sortTagsByPinyin([...item.negativeTags]),
			positiveTags: sortTagsByPinyin(
				instance.calculateTagsWithTrend(
					instance.composeTagsWithPopularTrend(
						item.ingredients,
						[],
						item.positiveTags,
						[],
						popularTrend
					),
					popularTrend,
					isFamousShop
				)
			),
		}));
	}

	let filtered = [...normalizedData];

	filtered = filtered.filter(
		({ cooker, dlc, ingredients, level, negativeTags, positiveTags }) => {
			if (filterDlcs && !filterDlcs.includes(dlc.toString())) {
				return false;
			}
			if (filterLevels && !filterLevels.includes(level.toString())) {
				return false;
			}
			if (filterCookers && !filterCookers.includes(cooker)) {
				return false;
			}
			if (
				filterIngredients &&
				!checkArraySubsetOf(filterIngredients, ingredients)
			) {
				return false;
			}
			if (
				filterNoIngredients &&
				checkArrayContainsOf(filterNoIngredients, ingredients)
			) {
				return false;
			}
			if (
				filterPositiveTags &&
				!checkArraySubsetOf(filterPositiveTags, positiveTags)
			) {
				return false;
			}
			if (
				filterNoPositiveTags &&
				checkArrayContainsOf(filterNoPositiveTags, positiveTags)
			) {
				return false;
			}
			if (
				filterNegativeTags &&
				!checkArraySubsetOf(filterNegativeTags, negativeTags)
			) {
				return false;
			}
			if (
				filterNoNegativeTags &&
				checkArrayContainsOf(filterNoNegativeTags, negativeTags)
			) {
				return false;
			}
			return true;
		}
	);

	const sorted = applySortParam(filtered, instance, sortParam);

	return createJsonResponse(sorted);
}

export function OPTIONS() {
	return handleOptionsRequest();
}
