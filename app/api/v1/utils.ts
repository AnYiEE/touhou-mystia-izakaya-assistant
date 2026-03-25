import { NextResponse } from 'next/server';

import type { IApiErrorResponse, IApiSuccessResponse } from './types';

export function createJsonResponse<T>(data: T, status = 200) {
	return NextResponse.json(
		{ data, status: 'ok' } satisfies IApiSuccessResponse<T>,
		{ status }
	);
}

export function createErrorResponse(message: string, status: number) {
	return NextResponse.json(
		{ message, status: 'error' } satisfies IApiErrorResponse,
		{ status }
	);
}

export function handleOptionsRequest() {
	return new NextResponse(null, { status: 204 });
}
