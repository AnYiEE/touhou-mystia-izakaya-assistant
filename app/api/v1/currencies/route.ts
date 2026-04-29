import { type NextRequest } from 'next/server';

import { Currency } from '@/utils/item/currency';
import {
	applyNameSearch,
	applySortParam,
	createJsonResponse,
	handleOptionsRequest,
	parseCommaSeparatedParam,
} from '@/api/v1/utils';

export function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const instance = Currency.getInstance();

	const nameParam = searchParams.get('name');
	const sortParam = searchParams.get('sort');
	const filterDlcs = parseCommaSeparatedParam(searchParams.get('dlc'));

	let data = applyNameSearch(instance.data, nameParam);

	if (filterDlcs) {
		data = data.filter(({ dlc }) => filterDlcs.includes(dlc.toString()));
	}

	const sorted = applySortParam(data, instance, sortParam);

	return createJsonResponse(sorted);
}

export function OPTIONS() {
	return handleOptionsRequest();
}
