import { type NextRequest, NextResponse } from 'next/server';

import type { IApiErrorResponse, IApiSuccessResponse } from './types';

type TJsonBodyReadResult<T extends object> =
	| { data: Partial<T>; status: 'ok' }
	| { status: 'invalid' | 'payload-too-large' };

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

export async function readJsonBodyResult<T extends object>(
	request: NextRequest,
	maxBytes: number
): Promise<TJsonBodyReadResult<T>> {
	const contentLength = request.headers.get('content-length');
	const parsedContentLength =
		contentLength === null || !/^\d+$/u.test(contentLength)
			? null
			: Number.parseInt(contentLength, 10);
	if (contentLength !== null) {
		if (parsedContentLength === null) {
			return { status: 'invalid' };
		}
		if (
			!Number.isFinite(parsedContentLength) ||
			parsedContentLength > maxBytes
		) {
			return { status: 'payload-too-large' };
		}
	}

	try {
		const requestBody = request.body;
		if (requestBody === null) {
			return { status: 'invalid' };
		}

		const reader = requestBody.getReader();
		const decoder = new TextDecoder();
		let receivedBytes = 0;
		let text = '';
		try {
			let readResult = await reader.read();
			while (!readResult.done) {
				const { value } = readResult;
				receivedBytes += value.byteLength;
				if (receivedBytes > maxBytes) {
					await reader.cancel('payload-too-large');
					return { status: 'payload-too-large' };
				}

				text += decoder.decode(value, { stream: true });
				readResult = await reader.read();
			}
			text += decoder.decode();
		} finally {
			reader.releaseLock();
		}

		const data: unknown = JSON.parse(text);
		if (data === null || Array.isArray(data) || typeof data !== 'object') {
			return { status: 'invalid' };
		}

		return { data, status: 'ok' };
	} catch {
		return { status: 'invalid' };
	}
}
