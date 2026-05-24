import { type NextRequest } from 'next/server';

import {
	FEATURE_DISABLED_MESSAGE,
	SERVER_MISCONFIGURED_MESSAGE,
	getAccountFeatureStatus,
} from '@/lib/account/server/environment';
import { checkRateLimit } from '@/lib/account/server/rateLimit';
import {
	checkInsecureAccountCookiesAllowed,
	checkSameOriginRequest,
	checkSecureRequest,
	getRequestUserAgent,
	getTrustedRequestIp,
} from '@/lib/account/server/request';
import { createNoStoreErrorResponse } from './utils';

const ACCOUNT_RATE_LIMIT_OPTIONS = { limit: 20, windowMs: 60 * 1000 } as const;
const MAX_ACCOUNT_JSON_BODY_BYTES = 8 * 1024 * 1024;

function createAccountRateLimitKey(parts: ReadonlyArray<string>) {
	return JSON.stringify(parts);
}

export async function checkAccountFeatureResponse() {
	const status = await getAccountFeatureStatus();

	if (!status.enabled) {
		return createNoStoreErrorResponse(
			status.reason,
			status.reason === FEATURE_DISABLED_MESSAGE ? 404 : 500
		);
	}

	try {
		const dbModule = await import('@/lib/account/server/db');
		await dbModule.getAccountDatabase();
		return null;
	} catch {
		return createNoStoreErrorResponse(SERVER_MISCONFIGURED_MESSAGE, 500);
	}
}

export function checkSameOriginResponse(request: NextRequest) {
	if (checkSameOriginRequest(request)) {
		return null;
	}

	return createNoStoreErrorResponse('forbidden', 403);
}

export function checkAccountCookieSecurityResponse(request: NextRequest) {
	if (
		checkSecureRequest(request) ||
		checkInsecureAccountCookiesAllowed(request)
	) {
		return null;
	}

	return createNoStoreErrorResponse(SERVER_MISCONFIGURED_MESSAGE, 500);
}

export function checkAccountRateLimitResponse(
	request: NextRequest,
	scope: string,
	usernameNormalized = ''
) {
	const keys: string[] = [];
	const requestIp = getTrustedRequestIp(request);
	const requestUserAgent = getRequestUserAgent(request);
	if (requestIp !== null) {
		keys.push(
			createAccountRateLimitKey([
				scope,
				'request',
				requestIp,
				requestUserAgent,
			])
		);
	} else if (usernameNormalized === '') {
		keys.push(
			createAccountRateLimitKey([
				scope,
				'request',
				'untrusted',
				requestUserAgent,
			])
		);
	}

	if (usernameNormalized !== '') {
		keys.push(
			createAccountRateLimitKey([scope, 'username', usernameNormalized])
		);
	}

	const result = keys
		.map((key) => checkRateLimit(key, ACCOUNT_RATE_LIMIT_OPTIONS))
		.find((item) => !item.allowed);

	if (result === undefined) {
		return null;
	}

	return createNoStoreErrorResponse('too-many-requests', 429, {
		retry_after: result.retryAfter,
	});
}

export async function readJsonBody<T>(
	request: NextRequest,
	maxBytes = MAX_ACCOUNT_JSON_BODY_BYTES
) {
	const contentLength = request.headers.get('content-length');
	const parsedContentLength =
		contentLength === null || !/^\d+$/u.test(contentLength)
			? null
			: Number.parseInt(contentLength, 10);
	if (
		contentLength !== null &&
		(parsedContentLength === null ||
			!Number.isFinite(parsedContentLength) ||
			parsedContentLength > maxBytes)
	) {
		return null;
	}

	try {
		const requestBody = request.body;
		if (requestBody === null) {
			return null;
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
					return null;
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
			return null;
		}

		return data as Partial<T>;
	} catch {
		return null;
	}
}

export function createServerMisconfiguredResponse() {
	return createNoStoreErrorResponse(SERVER_MISCONFIGURED_MESSAGE, 500);
}
