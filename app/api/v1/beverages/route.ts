import { type NextRequest } from 'next/server';

import { Beverage } from '@/utils/food/beverages';
import {
	applyNameSearch,
	applySortParam,
	createJsonResponse,
	handleOptionsRequest,
	parseCommaSeparatedParam,
	sortBeverageTags,
} from '@/api/v1/utils';
import { checkArrayContainsOf, checkArraySubsetOf } from '@/utilities';

export function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const instance = Beverage.getInstance();

	const nameParam = searchParams.get('name');
	const sortParam = searchParams.get('sort');

	const filterDlcs = parseCommaSeparatedParam(searchParams.get('dlc'));
	const filterLevels = parseCommaSeparatedParam(searchParams.get('level'));
	const filterTags = parseCommaSeparatedParam(searchParams.get('tag'));
	const filterNoTags = parseCommaSeparatedParam(searchParams.get('noTag'));

	const data = applyNameSearch(instance.data, nameParam);
	const normalizedData = data.map((item) => ({
		...item,
		tags: sortBeverageTags([...item.tags]),
	}));

	let filtered = [...normalizedData];

	filtered = filtered.filter(({ dlc, level, tags }) => {
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
		return true;
	});

	const sorted = applySortParam(filtered, instance, sortParam);

	return createJsonResponse(sorted);
}

export function OPTIONS() {
	return handleOptionsRequest();
}
