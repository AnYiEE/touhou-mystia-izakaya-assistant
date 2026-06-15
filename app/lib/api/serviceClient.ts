import type { IApiErrorResponse, IApiSuccessResponse } from './types';

import { siteConfig } from '@/configs';

export class ServiceApiError<TData = unknown> extends Error {
	readonly data: TData | undefined;
	readonly retryAfter: number | null;
	readonly status: number;

	constructor({
		data,
		message,
		retryAfter,
		status,
	}: {
		data?: TData;
		message: string;
		retryAfter?: number | null;
		status: number;
	}) {
		super(message);
		this.name = 'ServiceApiError';
		this.data = data;
		this.retryAfter = retryAfter ?? null;
		this.status = status;
	}
}

function createPathUrl(path: string) {
	return new URL(path, globalThis.location.origin).toString();
}

function readRetryAfterHeader(headers: Headers) {
	const retryAfter = headers.get('Retry-After');
	if (retryAfter === null || !/^\d+(?:\.\d+)?$/u.test(retryAfter)) {
		return null;
	}

	const value = Number.parseFloat(retryAfter);

	return Number.isFinite(value) ? value : null;
}

function readRetryAfterData(data: unknown) {
	if (data === null || Array.isArray(data) || typeof data !== 'object') {
		return null;
	}

	const retryAfter = (data as Record<string, unknown>)['retry_after'];

	return typeof retryAfter === 'number' && Number.isFinite(retryAfter)
		? retryAfter
		: null;
}

function createServiceApiHeaders(headersInit: HeadersInit | undefined) {
	const headers = new Headers(headersInit);
	if (!headers.has('Accept')) {
		headers.set('Accept', 'application/json');
	}

	return headers;
}

export function createServiceApiUrl(path: string) {
	const serviceApiOrigin = siteConfig.serviceApiOrigin.trim();
	if (serviceApiOrigin === '') {
		return createPathUrl(path);
	}

	return new URL(path, serviceApiOrigin).toString();
}

export async function fetchServiceApi<TData>(
	path: string,
	init: RequestInit = {}
) {
	let response: Response;
	try {
		response = await fetch(createServiceApiUrl(path), {
			...init,
			cache: init.cache ?? 'no-store',
			credentials: init.credentials ?? 'include',
			headers: createServiceApiHeaders(init.headers),
		});
	} catch (error) {
		throw new ServiceApiError({
			message: error instanceof Error ? error.message : 'network-error',
			status: 0,
		});
	}

	let body: unknown;
	try {
		body = await response.json();
	} catch {
		throw new ServiceApiError({
			message: response.ok ? 'invalid-api-response' : response.statusText,
			retryAfter: readRetryAfterHeader(response.headers),
			status: response.status,
		});
	}

	if (
		body === null ||
		Array.isArray(body) ||
		typeof body !== 'object' ||
		!('status' in body)
	) {
		throw new ServiceApiError({
			message: 'invalid-api-response',
			retryAfter: readRetryAfterHeader(response.headers),
			status: response.status,
		});
	}

	if (response.ok && body.status === 'ok' && 'data' in body) {
		return (body as IApiSuccessResponse<TData>).data;
	}

	const errorBody = body as IApiErrorResponse;
	throw new ServiceApiError({
		data: errorBody.data,
		message:
			typeof errorBody.message === 'string'
				? errorBody.message
				: response.statusText,
		retryAfter:
			readRetryAfterHeader(response.headers) ??
			readRetryAfterData(errorBody.data),
		status: response.status,
	});
}
