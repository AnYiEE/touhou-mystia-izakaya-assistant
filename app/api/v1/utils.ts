import { NextResponse } from 'next/server';

import type { IApiErrorResponse, IApiSuccessResponse } from './types';

export const NO_STORE_HEADERS = {
	'Cache-Control': 'no-store',
	Vary: 'Cookie',
} as const;

function createNoStoreInit(init?: ResponseInit) {
	const headers = new Headers(init?.headers);

	Object.entries(NO_STORE_HEADERS).forEach(([key, value]) => {
		if (key.toLowerCase() === 'vary') {
			const varyValues = new Map<string, string>();
			const current = headers.get(key);
			if (current !== null) {
				current.split(',').forEach((item) => {
					const normalizedItem = item.trim();
					if (normalizedItem !== '') {
						varyValues.set(
							normalizedItem.toLowerCase(),
							normalizedItem
						);
					}
				});
			}
			varyValues.set(value.toLowerCase(), value);
			headers.set(key, [...varyValues.values()].join(', '));
			return;
		}

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

export function createNoStoreRedirectResponse(url: URL | string) {
	const response = NextResponse.redirect(url, 303);
	const noStoreInit = createNoStoreInit();

	noStoreInit.headers.forEach((value, key) => {
		response.headers.set(key, value);
	});

	return response;
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
