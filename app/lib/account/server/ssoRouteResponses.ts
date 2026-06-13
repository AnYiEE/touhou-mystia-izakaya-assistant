import { type NextRequest } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from 'node:process';

import { checkRateLimit } from '@/lib/account/server/rateLimit';
import { getTrustedRequestIp } from '@/lib/account/server/request';
import { createRetryAfterHeaders } from '@/lib/api/http';
import { createNoStoreErrorResponse } from '@/lib/api/routeResponses';

const SSO_RATE_LIMIT_OPTIONS = { limit: 20, windowMs: 60 * 1000 } as const;

function createRateLimitKey(parts: ReadonlyArray<string>) {
	return JSON.stringify(parts);
}

function createRateLimitHash(value: string) {
	return createHash('sha256').update(value).digest('base64url');
}

function createRateLimitCapacityGroup(scope: string, dimension: string) {
	return createRateLimitKey([scope, dimension]);
}

export function checkSsoRateLimitResponse(
	request: NextRequest,
	scope: string,
	parts: ReadonlyArray<{ name: string; value: string }>
) {
	const keys: Array<{ capacityGroup: string; key: string }> = [];
	const trustedRequestIp = getTrustedRequestIp(request);
	if (trustedRequestIp === null) {
		keys.push({
			capacityGroup: createRateLimitCapacityGroup(
				scope,
				'no-trusted-ip-gate'
			),
			key: createRateLimitKey([scope, 'no-trusted-ip-gate']),
		});
	} else {
		keys.push({
			capacityGroup: createRateLimitCapacityGroup(scope, 'request'),
			key: createRateLimitKey([scope, 'request', trustedRequestIp]),
		});
	}

	parts.forEach(({ name, value }) => {
		if (value === '') {
			return;
		}
		keys.push({
			capacityGroup: createRateLimitCapacityGroup(scope, name),
			key: createRateLimitKey([scope, name, createRateLimitHash(value)]),
		});
	});

	for (const { capacityGroup, key } of keys) {
		const result = checkRateLimit(key, {
			...SSO_RATE_LIMIT_OPTIONS,
			capacityGroup,
		});
		if (!result.allowed) {
			return createNoStoreErrorResponse(
				'too-many-requests',
				429,
				{ retry_after: result.retryAfter },
				{ headers: createRetryAfterHeaders(result.retryAfter) }
			);
		}
	}

	return null;
}

function createSecretDigest(secret: string) {
	return createHash('sha256').update(secret).digest();
}

export function checkDispatchSecret(secret: string | null) {
	const configuredSecret = env.DISPATCH_SECRET;
	if (typeof configuredSecret !== 'string' || configuredSecret.length === 0) {
		return 'misconfigured';
	}

	return secret !== null &&
		timingSafeEqual(
			createSecretDigest(secret),
			createSecretDigest(configuredSecret)
		)
		? 'ok'
		: 'invalid';
}
