import { type NextRequest } from 'next/server';
import { createHash } from 'node:crypto';

import { ACCOUNT_COOKIE_NAME_MAP } from '@/features/account/constants';
import { checkInsecureAccountCookiesAllowed } from '@/features/account/server/auth/cookiePolicy';
import {
	FEATURE_DISABLED_MESSAGE,
	getAccountFeatureStatus,
} from '@/features/account/server/featureStatus';

import { SERVER_MISCONFIGURED_MESSAGE } from '@/infrastructure/environment/serverValidation';
import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import { createRetryAfterHeaders } from '@/infrastructure/http/headers';
import { checkRateLimit } from '@/infrastructure/http/rateLimit/inMemory';
import {
	checkSameOriginRequest,
	checkSecureRequest,
	getTrustedRequestIp,
} from '@/infrastructure/http/server/requestContext';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

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

export async function checkAccountFeatureGuard(): Promise<TAccountGuardResult> {
	const status = await getAccountFeatureStatus();

	if (!status.enabled) {
		return {
			httpStatus: status.reason === FEATURE_DISABLED_MESSAGE ? 404 : 500,
			message: status.reason,
			status: 'error',
		};
	}

	try {
		const dbModule =
			await import('@/features/account/server/persistence/database');
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

export function checkSameOriginGuard(
	request: NextRequest
): TAccountGuardResult {
	if (checkSameOriginRequest(request)) {
		return { status: 'ok' };
	}

	return {
		httpStatus: 403,
		message: HTTP_API_RESPONSE_CODE_MAP.forbidden,
		status: 'error',
	};
}

export function checkAccountCookieSecurityGuard(
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

export function checkAccountRateLimitGuard(
	request: NextRequest,
	scope: string,
	usernameNormalized = '',
	options: {
		noTrustedIpGate?: boolean;
		parts?: ReadonlyArray<{ name: string; value: string }>;
		rateLimit?: Readonly<{ limit: number; windowMs: number }>;
	} = {}
): TAccountGuardResult {
	const rateLimitOptions = options.rateLimit ?? ACCOUNT_RATE_LIMIT_OPTIONS;
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
		if (trustedRequestIp !== null) {
			keys.push({
				capacityGroup: createAccountRateLimitCapacityGroup(
					scope,
					'username-request'
				),
				key: createAccountRateLimitKey([
					scope,
					'username-request',
					usernameNormalized,
					trustedRequestIp,
				]),
			});
		}
	}

	options.parts?.forEach(({ name, value }) => {
		if (value === '') {
			return;
		}
		const hashedValue = createAccountRateLimitCookieHash(value);
		keys.push({
			capacityGroup: createAccountRateLimitCapacityGroup(scope, name),
			key: createAccountRateLimitKey([scope, name, hashedValue]),
		});
		if (trustedRequestIp !== null) {
			keys.push({
				capacityGroup: createAccountRateLimitCapacityGroup(
					scope,
					`${name}-request`
				),
				key: createAccountRateLimitKey([
					scope,
					`${name}-request`,
					hashedValue,
					trustedRequestIp,
				]),
			});
		}
	});

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
		const retryAfter = rateLimitOptions.windowMs / 1000;
		warnNoStableRateLimitKey(scope);
		return {
			data: { retry_after: retryAfter },
			headers: createRetryAfterHeaders(retryAfter),
			httpStatus: 429,
			message: HTTP_API_RESPONSE_CODE_MAP.tooManyRequests,
			status: 'error',
		};
	}

	let result: ReturnType<typeof checkRateLimit> | undefined;
	for (const { capacityGroup, key } of keys) {
		const check = checkRateLimit(key, {
			capacityGroup,
			...rateLimitOptions,
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
		message: HTTP_API_RESPONSE_CODE_MAP.tooManyRequests,
		status: 'error',
	};
}
