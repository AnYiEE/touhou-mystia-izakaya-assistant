import { type NextRequest } from 'next/server';

import { Cooker } from '@/utils/item/cooker';
import {
	applyNameSearch,
	applySortParam,
	createJsonResponse,
	handleOptionsRequest,
	parseCommaSeparatedParam,
} from '@/api/v1/utils';
import { checkArrayContainsOf } from '@/utilities';

export function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const instance = Cooker.getInstance();

	const nameParam = searchParams.get('name');
	const sortParam = searchParams.get('sort');

	const filterDlcs = parseCommaSeparatedParam(searchParams.get('dlc'));
	const filterCategories = parseCommaSeparatedParam(
		searchParams.get('category')
	);
	const filterNoCategories = parseCommaSeparatedParam(
		searchParams.get('noCategory')
	);
	const filterTypes = parseCommaSeparatedParam(searchParams.get('type'));
	const filterNoTypes = parseCommaSeparatedParam(searchParams.get('noType'));

	const data = applyNameSearch(instance.data, nameParam);

	let filtered = [...data];

	filtered = filtered.filter(({ category, dlc, type }) => {
		const types = [type].flat();

		if (filterDlcs && !filterDlcs.includes(dlc.toString())) {
			return false;
		}
		if (filterCategories && !filterCategories.includes(category)) {
			return false;
		}
		if (filterNoCategories?.includes(category)) {
			return false;
		}
		if (filterTypes && !checkArrayContainsOf(filterTypes, types)) {
			return false;
		}
		if (filterNoTypes && checkArrayContainsOf(filterNoTypes, types)) {
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
