import { type NextRequest } from 'next/server';

import { createNoStoreErrorResponse } from '@/api/v1/utils';
import {
	type TAccountGuardResult,
	checkAccountCookieSecurity,
	checkAccountFeature,
	checkAccountRateLimit,
	checkSameOrigin,
	createRetryAfterHeaders as createGuardRetryAfterHeaders,
} from '@/lib/account/server/guards';
import { SERVER_MISCONFIGURED_MESSAGE } from '@/lib/account/server/environment';
import { MAX_ACCOUNT_JSON_BODY_BYTES } from '@/lib/account/shared/requestLimits';

type TAccountAuthError = Extract<
	Awaited<
		ReturnType<
			(typeof import('@/lib/account/server/auth'))['authenticateAccountRequest']
		>
	>,
	{ status: 'error' }
>;
type TJsonBodyReadResult<T extends object> =
	| { data: Partial<T>; status: 'ok' }
	| { status: 'invalid' | 'payload-too-large' };

type TAccountGuardError = Extract<TAccountGuardResult, { status: 'error' }>;

function createGuardErrorResponse(error: TAccountGuardError) {
	return createNoStoreErrorResponse(
		error.message,
		error.httpStatus,
		error.data,
		error.headers === undefined ? undefined : { headers: error.headers }
	);
}

export function createRetryAfterHeaders(retryAfter: number) {
	return createGuardRetryAfterHeaders(retryAfter);
}

export async function checkAccountFeatureResponse() {
	const result = await checkAccountFeature();

	return result.status === 'ok' ? null : createGuardErrorResponse(result);
}

export function checkSameOriginResponse(request: NextRequest) {
	const result = checkSameOrigin(request);

	return result.status === 'ok' ? null : createGuardErrorResponse(result);
}

export function checkAccountCookieSecurityResponse(request: NextRequest) {
	const result = checkAccountCookieSecurity(request);

	return result.status === 'ok' ? null : createGuardErrorResponse(result);
}

export function checkAccountRateLimitResponse(
	request: NextRequest,
	scope: string,
	usernameNormalized = '',
	options: { noTrustedIpGate?: boolean } = {}
) {
	const result = checkAccountRateLimit(
		request,
		scope,
		usernameNormalized,
		options
	);

	return result.status === 'ok' ? null : createGuardErrorResponse(result);
}

export async function readJsonBodyResult<T extends object>(
	request: NextRequest,
	maxBytes = MAX_ACCOUNT_JSON_BODY_BYTES
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

export async function readJsonBody<T extends object>(
	request: NextRequest,
	maxBytes = MAX_ACCOUNT_JSON_BODY_BYTES
) {
	const result = await readJsonBodyResult<T>(request, maxBytes);

	return result.status === 'ok' ? result.data : null;
}

export function createServerMisconfiguredResponse() {
	return createNoStoreErrorResponse(SERVER_MISCONFIGURED_MESSAGE, 500);
}

export function createAccountAuthErrorResponse(
	auth: TAccountAuthError,
	request: NextRequest
) {
	void request;

	return createNoStoreErrorResponse(auth.message, auth.httpStatus);
}
