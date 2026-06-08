import { createHash } from 'node:crypto';
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
	getTrustedRequestIp,
} from '@/lib/account/server/request';
import { ACCOUNT_COOKIE_NAME_MAP } from '@/lib/account/shared/constants';
import { getLogSafeErrorCode } from '@/lib/logging';
import { createNoStoreErrorResponse } from './utils';

const ACCOUNT_RATE_LIMIT_OPTIONS = { limit: 20, windowMs: 60 * 1000 } as const;
const NO_STABLE_RATE_LIMIT_KEY_WARN_INTERVAL_MS = 60 * 1000;
const MAX_ACCOUNT_JSON_BODY_BYTES = 16 * 1024;

const noStableRateLimitKeyWarnAtMap = new Map<string, number>();

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

function createAccountRateLimitKey(parts: ReadonlyArray<string>) {
	return JSON.stringify(parts);
}

function createAccountRateLimitCapacityGroup(scope: string, dimension: string) {
	return createAccountRateLimitKey([scope, dimension]);
}

function createAccountRateLimitCookieHash(value: string) {
	return createHash('sha256').update(value).digest('base64url');
}

function warnNoStableRateLimitKey(scope: string, now = Date.now()) {
	const lastWarnAt = noStableRateLimitKeyWarnAtMap.get(scope) ?? 0;
	if (now - lastWarnAt < NO_STABLE_RATE_LIMIT_KEY_WARN_INTERVAL_MS) {
		return;
	}

	noStableRateLimitKeyWarnAtMap.set(scope, now);
	console.warn('Account rate limit rejected request without stable key.', {
		scope,
	});
}

export function createRetryAfterHeaders(retryAfter: number) {
	return { 'Retry-After': String(Math.max(0, retryAfter)) };
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
	} catch (error) {
		console.warn('Account database initialization failed.', {
			errorCode: getLogSafeErrorCode(error),
		});

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
	if (checkSecureRequest(request) || checkInsecureAccountCookiesAllowed()) {
		return null;
	}

	return createNoStoreErrorResponse(SERVER_MISCONFIGURED_MESSAGE, 500);
}

export function checkAccountRateLimitResponse(
	request: NextRequest,
	scope: string,
	usernameNormalized = '',
	options: { noTrustedIpGate?: boolean } = {}
) {
	const keys: Array<{ capacityGroup: string; key: string }> = [];
	const trustedRequestIp = getTrustedRequestIp(request);
	if (trustedRequestIp !== null) {
		keys.push({
			capacityGroup: createAccountRateLimitCapacityGroup(
				scope,
				'request'
			),
			key: createAccountRateLimitKey([
				scope,
				'request',
				trustedRequestIp,
			]),
		});
	}
	if (trustedRequestIp === null && options.noTrustedIpGate === true) {
		keys.push({
			capacityGroup: createAccountRateLimitCapacityGroup(
				scope,
				'no-trusted-ip-gate'
			),
			key: createAccountRateLimitKey([scope, 'no-trusted-ip-gate']),
		});
	}

	if (usernameNormalized !== '') {
		keys.push({
			capacityGroup: createAccountRateLimitCapacityGroup(
				scope,
				'username'
			),
			key: createAccountRateLimitKey([
				scope,
				'username',
				usernameNormalized,
			]),
		});
	}

	const accountSession = request.cookies.get(
		ACCOUNT_COOKIE_NAME_MAP.session
	)?.value;
	if (accountSession !== undefined && accountSession !== '') {
		keys.push({
			capacityGroup: createAccountRateLimitCapacityGroup(
				scope,
				'session'
			),
			key: createAccountRateLimitKey([
				scope,
				'session',
				createAccountRateLimitCookieHash(accountSession),
			]),
		});
	}

	const adminSession = request.cookies.get(
		ACCOUNT_COOKIE_NAME_MAP.adminSession
	)?.value;
	if (adminSession !== undefined && adminSession !== '') {
		keys.push({
			capacityGroup: createAccountRateLimitCapacityGroup(
				scope,
				'admin-session'
			),
			key: createAccountRateLimitKey([
				scope,
				'admin-session',
				createAccountRateLimitCookieHash(adminSession),
			]),
		});
	}

	if (keys.length === 0) {
		warnNoStableRateLimitKey(scope);
		return createNoStoreErrorResponse(
			'too-many-requests',
			429,
			{ retry_after: ACCOUNT_RATE_LIMIT_OPTIONS.windowMs / 1000 },
			{
				headers: createRetryAfterHeaders(
					ACCOUNT_RATE_LIMIT_OPTIONS.windowMs / 1000
				),
			}
		);
	}

	let result: ReturnType<typeof checkRateLimit> | undefined;
	for (const { capacityGroup, key } of keys) {
		const check = checkRateLimit(key, {
			...ACCOUNT_RATE_LIMIT_OPTIONS,
			capacityGroup,
		});
		if (!check.allowed) {
			result = check;
			break;
		}
	}

	if (result === undefined) {
		return null;
	}

	return createNoStoreErrorResponse(
		'too-many-requests',
		429,
		{ retry_after: result.retryAfter },
		{ headers: createRetryAfterHeaders(result.retryAfter) }
	);
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
