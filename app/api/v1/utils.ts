import { NextResponse } from 'next/server';

import type { IApiErrorResponse, IApiSuccessResponse } from './types';

export const NO_STORE_HEADERS = {
	'Cache-Control': 'no-store',
	Vary: 'Cookie',
} as const;

export function createJsonResponse<T>(
	data: T,
	status = 200,
	init?: ResponseInit
) {
	return NextResponse.json(
		{ data, status: 'ok' } satisfies IApiSuccessResponse<T>,
		{ ...init, status }
	);
}

export function createErrorResponse<T>(
	message: string,
	status: number,
	data?: T,
	init?: ResponseInit
) {
	const body =
		data === undefined
			? ({ message, status: 'error' } satisfies IApiErrorResponse)
			: ({
					data,
					message,
					status: 'error',
				} satisfies IApiErrorResponse<T>);

	return NextResponse.json(body, { ...init, status });
}

export function createNoStoreJsonResponse<T>(data: T, status = 200) {
	return createJsonResponse(data, status, { headers: NO_STORE_HEADERS });
}

export function createNoStoreErrorResponse<T>(
	message: string,
	status: number,
	data?: T
) {
	return createErrorResponse(message, status, data, {
		headers: NO_STORE_HEADERS,
	});
}

export function handleOptionsRequest() {
	return new NextResponse(null, { status: 204 });
}
