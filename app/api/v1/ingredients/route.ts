import { type NextRequest } from 'next/server';

import { Ingredient } from '@/utils/food/ingredients';
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
	const instance = Ingredient.getInstance();

	const nameParam = searchParams.get('name');
	const sortParam = searchParams.get('sort');
	const popularTagParam = searchParams.get('popularTag');
	const popularNegativeParam = searchParams.get('popularNegative');
	const isFamousShopParam = searchParams.get('isFamousShop');

	const filterDlcs = parseCommaSeparatedParam(searchParams.get('dlc'));
	const filterLevels = parseCommaSeparatedParam(searchParams.get('level'));
	const filterTags = parseCommaSeparatedParam(searchParams.get('tag'));
	const filterNoTags = parseCommaSeparatedParam(searchParams.get('noTag'));
	const filterTypes = parseCommaSeparatedParam(searchParams.get('type'));
	const filterNoTypes = parseCommaSeparatedParam(searchParams.get('noType'));
	interface INormalizedIngredientItem {
		dlc: number;
		level: number;
		tags: string[];
		type: string;
	}

	const data = applyNameSearch(instance.data, nameParam);
	let normalizedData: INormalizedIngredientItem[] = data.map((item) => ({
		...item,
		tags: sortTagsByPinyin([...item.tags]) as string[],
		type: item.type,
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
			tags: sortTagsByPinyin(
				instance.calculateTagsWithTrend(
					item.tags as Parameters<
						typeof instance.calculateTagsWithTrend
					>[0],
					popularTrend,
					isFamousShop
				)
			) as string[],
		}));
	}

	let filtered = [...normalizedData];

	filtered = filtered.filter(({ dlc, level, tags, type }) => {
		if (filterDlcs && !filterDlcs.includes(dlc.toString())) {
			return false;
		}
		if (filterLevels && !filterLevels.includes(level.toString())) {
			return false;
		}
		if (filterTags && !checkArraySubsetOf(filterTags, tags)) {
			return false;
		}
		if (filterNoTags && checkArrayContainsOf(filterNoTags, tags)) {
			return false;
		}
		if (filterTypes && !filterTypes.includes(type)) {
			return false;
		}
		if (filterNoTypes?.includes(type)) {
			return false;
		}

		return true;
	});

	const sorted = applySortParam(filtered, instance, sortParam);

	return createJsonResponse(sorted);
}

export function OPTIONS() {
	return handleOptionsRequest();
}
