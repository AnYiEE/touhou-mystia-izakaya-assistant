import { type NextRequest } from 'next/server';

import { Clothes } from '@/utils/item/clothes';
import {
	createErrorResponse,
	createJsonResponse,
	getByNameOrNotFound,
	handleOptionsRequest,
} from '@/api/v1/utils';

export function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ name: string }> }
) {
	return params.then(({ name }) => {
		const decodedName = decodeURIComponent(name);
		const instance = Clothes.getInstance();
		const result = getByNameOrNotFound(instance, decodedName);

		if (result.error) {
			return createErrorResponse(result.error, 404);
		}

		return createJsonResponse(result.data);
	});
}

export function OPTIONS() {
	return handleOptionsRequest();
}
