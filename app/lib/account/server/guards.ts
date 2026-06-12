import { type NextRequest } from 'next/server';
import { createHash } from 'node:crypto';

import {
	FEATURE_DISABLED_MESSAGE,
	SERVER_MISCONFIGURED_MESSAGE,
	getAccountFeatureStatus,
} from './environment';
import { checkRateLimit } from './rateLimit';
import {
	checkAdminFeatureEnabled,
	verifyAdminCsrfToken,
	verifyAdminSessionToken,
} from './admin';
import {
	checkInsecureAccountCookiesAllowed,
	checkSameOriginRequest,
	checkSecureRequest,
	getTrustedRequestIp,
} from './request';
import { ACCOUNT_COOKIE_NAME_MAP } from '../shared/constants';
import { getLogSafeErrorCode } from '@/lib/logging';

const ACCOUNT_RATE_LIMIT_OPTIONS = { limit: 20, windowMs: 60 * 1000 } as const;
const NO_STABLE_RATE_LIMIT_KEY_WARN_INTERVAL_MS = 60 * 1000;

const noStableRateLimitKeyWarnAtMap = new Map<string, number>();

type TGuardErrorData = Record<string, unknown>;

export type TAccountGuardResult<T = undefined> =
	| (T extends undefined ? { status: 'ok' } : { data: T; status: 'ok' })
	| {
			data?: TGuardErrorData;
			headers?: Record<string, string>;
			httpStatus: number;
			message: string;
			status: 'error';
	  };

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

export async function checkAccountFeature(): Promise<TAccountGuardResult> {
	const status = await getAccountFeatureStatus();

	if (!status.enabled) {
		return {
			httpStatus: status.reason === FEATURE_DISABLED_MESSAGE ? 404 : 500,
			message: status.reason,
			status: 'error',
		};
	}

	try {
		const dbModule = await import('@/lib/account/server/db');
		await dbModule.getAccountDatabase();
		return { status: 'ok' };
	} catch (error) {
		console.warn('Account database initialization failed.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return {
			httpStatus: 500,
			message: SERVER_MISCONFIGURED_MESSAGE,
			status: 'error',
		};
	}
}

export function checkAdminFeature(): TAccountGuardResult {
	if (checkAdminFeatureEnabled()) {
		return { status: 'ok' };
	}

	return { httpStatus: 404, message: 'feature-disabled', status: 'error' };
}

export function checkSameOrigin(request: NextRequest): TAccountGuardResult {
	if (checkSameOriginRequest(request)) {
		return { status: 'ok' };
	}

	return { httpStatus: 403, message: 'forbidden', status: 'error' };
}

export function checkAccountCookieSecurity(
	request: NextRequest
): TAccountGuardResult {
	if (checkSecureRequest(request) || checkInsecureAccountCookiesAllowed()) {
		return { status: 'ok' };
	}

	return {
		httpStatus: 500,
		message: SERVER_MISCONFIGURED_MESSAGE,
		status: 'error',
	};
}

export function checkAccountRateLimit(
	request: NextRequest,
	scope: string,
	usernameNormalized = '',
	options: { noTrustedIpGate?: boolean } = {}
): TAccountGuardResult {
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
		const retryAfter = ACCOUNT_RATE_LIMIT_OPTIONS.windowMs / 1000;
		warnNoStableRateLimitKey(scope);
		return {
			data: { retry_after: retryAfter },
			headers: createRetryAfterHeaders(retryAfter),
			httpStatus: 429,
			message: 'too-many-requests',
			status: 'error',
		};
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
		return { status: 'ok' };
	}

	return {
		data: { retry_after: result.retryAfter },
		headers: createRetryAfterHeaders(result.retryAfter),
		httpStatus: 429,
		message: 'too-many-requests',
		status: 'error',
	};
}

export function authenticateAdminSession(
	token: string | null
): TAccountGuardResult<{
	payload: NonNullable<ReturnType<typeof verifyAdminSessionToken>>;
	token: string;
}> {
	if (token === null) {
		return { httpStatus: 401, message: 'unauthorized', status: 'error' };
	}

	const payload = verifyAdminSessionToken(token);
	if (payload === null) {
		return {
			httpStatus: 401,
			message: 'admin-session-expired',
			status: 'error',
		};
	}

	return { data: { payload, token }, status: 'ok' };
}

export function checkAdminCsrf(
	csrfToken: string | null,
	sessionToken: string
): TAccountGuardResult {
	if (csrfToken !== null && verifyAdminCsrfToken(csrfToken, sessionToken)) {
		return { status: 'ok' };
	}

	return { httpStatus: 403, message: 'forbidden', status: 'error' };
}
