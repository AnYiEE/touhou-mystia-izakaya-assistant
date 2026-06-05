import { NextResponse } from 'next/server';

import type { IApiErrorResponse, IApiSuccessResponse } from './types';

export const NO_STORE_HEADERS = {
	'Cache-Control': 'no-store',
	Vary: 'Cookie',
} as const;

function createNoStoreInit(init?: ResponseInit) {
	const headers = new Headers(init?.headers);

	Object.entries(NO_STORE_HEADERS).forEach(([key, value]) => {
		headers.set(key, value);
	});

	return { ...init, headers };
}

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

export function createNoStoreJsonResponse<T>(
	data: T,
	status = 200,
	init?: ResponseInit
) {
	return createJsonResponse(data, status, createNoStoreInit(init));
}

export function createNoStoreErrorResponse<T>(
	message: string,
	status: number,
	data?: T,
	init?: ResponseInit
) {
	return createErrorResponse(message, status, data, createNoStoreInit(init));
}

export function handleOptionsRequest() {
	return new NextResponse(null, { status: 204 });
}
