import { type NextRequest } from 'next/server';

import { CustomerRare } from '@/utils/customer/customer_rare';
import {
	applyNameSearch,
	applySortParam,
	createJsonResponse,
	handleOptionsRequest,
	parseCommaSeparatedParam,
	sortTagsByPinyin,
} from '@/api/v1/utils';
import { checkArrayContainsOf } from '@/utilities';

export function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const instance = CustomerRare.getInstance();

	const nameParam = searchParams.get('name');
	const sortParam = searchParams.get('sort');

	const filterDlcs = parseCommaSeparatedParam(searchParams.get('dlc'));
	const filterPlaces = parseCommaSeparatedParam(searchParams.get('place'));
	const filterNoPlaces = parseCommaSeparatedParam(
		searchParams.get('noPlace')
	);

	const data = applyNameSearch(instance.data, nameParam);
	const normalizedData = data.map((item) => ({
		...item,
		negativeTags: sortTagsByPinyin([...item.negativeTags]),
		positiveTags: sortTagsByPinyin([...item.positiveTags]),
	}));

	let filtered = [...normalizedData];

	filtered = filtered.filter(({ dlc, places }) => {
		if (filterDlcs && !filterDlcs.includes(dlc.toString())) {
			return false;
		}
		if (filterPlaces && !checkArrayContainsOf(filterPlaces, places)) {
			return false;
		}
		if (filterNoPlaces && checkArrayContainsOf(filterNoPlaces, places)) {
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
