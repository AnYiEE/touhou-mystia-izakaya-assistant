import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';
import { FILE_TYPE_JSON } from '@/infrastructure/http/mediaTypes';

import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';

import { ServiceApiError } from './serviceApiError';

export const MAX_SERVICE_RETRY_AFTER_SECONDS = 5 * 60;

export function normalizeServiceRetryAfterSeconds(value: unknown) {
	if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
		return null;
	}

	return Math.min(value, MAX_SERVICE_RETRY_AFTER_SECONDS);
}

function createPathUrl(path: string) {
	return new URL(path, location.origin).toString();
}

function readRetryAfterHeader(headers: Headers) {
	const retryAfter = headers.get('Retry-After');
	if (retryAfter === null || !/^\d+(?:\.\d+)?$/u.test(retryAfter)) {
		return null;
	}

	const value = Number.parseFloat(retryAfter);

	return normalizeServiceRetryAfterSeconds(value);
}

function readRetryAfterData(data: unknown) {
	if (!checkIsRecord(data)) {
		return null;
	}

	const retryAfter = data['retry_after'];

	return normalizeServiceRetryAfterSeconds(retryAfter);
}

function createServiceApiHeaders(headersInit: HeadersInit | undefined) {
	const headers = new Headers(headersInit);
	if (!headers.has('Accept')) {
		headers.set('Accept', FILE_TYPE_JSON);
	}

	return headers;
}

export function createServiceApiUrl(path: string) {
	const serviceApiOrigin = PUBLIC_RUNTIME_CONFIG.serviceApiOrigin.trim();
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
			message: Error.isError(error) ? error.message : 'network-error',
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

	if (!checkIsRecord(body) || !('status' in body)) {
		throw new ServiceApiError({
			message: 'invalid-api-response',
			retryAfter: readRetryAfterHeader(response.headers),
			status: response.status,
		});
	}

	if (response.ok && body['status'] === 'ok' && 'data' in body) {
		return body['data'] as TData;
	}

	throw new ServiceApiError({
		data: body['data'],
		message:
			typeof body['message'] === 'string'
				? body['message']
				: response.statusText,
		retryAfter:
			readRetryAfterHeader(response.headers) ??
			readRetryAfterData(body['data']),
		status: response.status,
	});
}
