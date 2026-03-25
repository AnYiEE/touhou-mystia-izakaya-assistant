import { type NextRequest } from 'next/server';

import { Clothes } from '@/utils/item/clothes';
import {
	applyNameSearch,
	applySortParam,
	createJsonResponse,
	handleOptionsRequest,
	parseCommaSeparatedParam,
} from '@/api/v1/utils';

export function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const instance = Clothes.getInstance();

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
