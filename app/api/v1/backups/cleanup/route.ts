import { type NextRequest } from 'next/server';

import { createRetryAfterHeaders } from '@/infrastructure/http/headers';
import { checkRateLimit } from '@/infrastructure/http/rateLimit/inMemory';
import { getRequestIp } from '@/infrastructure/http/server/requestContext';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';
import { checkSecretEqual } from '@/infrastructure/security/server/checkSecretEqual';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function checkCleanupSecret(secret: string | null, configuredSecret: string) {
	return secret !== null && checkSecretEqual(secret, configuredSecret);
}

function checkCleanupSecretFailureRateLimit(request: NextRequest) {
	const requestIp = getRequestIp(request).trim();
	const key = requestIp === '' ? 'no-ip' : requestIp;
	const result = checkRateLimit(
		JSON.stringify(['backup-cleanup-secret', key]),
		{
			capacityGroup: 'backup-cleanup-secret',
			limit: 20,
			windowMs: 60 * 1000,
		}
	);

	return result.allowed ? null : result.retryAfter;
}

export async function DELETE(request: NextRequest) {
	const secret = request.headers.get('x-cleanup-secret');
	const configuredSecret = process.env.CLEANUP_SECRET;

	if (typeof configuredSecret !== 'string' || configuredSecret.length === 0) {
		return createNoStoreErrorResponse('server-misconfigured', 500);
	}

	if (!checkCleanupSecret(secret, configuredSecret)) {
		const retryAfter = checkCleanupSecretFailureRateLimit(request);
		return createNoStoreErrorResponse(
			'Invalid secret',
			retryAfter === null ? 401 : 429,
			retryAfter === null ? undefined : { retry_after: retryAfter },
			retryAfter === null
				? undefined
				: { headers: createRetryAfterHeaders(retryAfter) }
		);
	}

	const now = Date.now();
	const { cleanupExpiredLegacyBackups } =
		await import('@/features/legacyBackup/server/cleanup');
	const result = await cleanupExpiredLegacyBackups(now);
	if (result.status === 'error') {
		return createNoStoreErrorResponse(result.error, 409);
	}

	return createNoStoreJsonResponse(result.data);
}
