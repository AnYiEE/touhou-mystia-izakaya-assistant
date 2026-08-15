import { type AccountApiError } from '@/features/account/client/api';

import {
	MAX_SERVICE_RETRY_AFTER_SECONDS,
	normalizeServiceRetryAfterSeconds,
} from '@/infrastructure/http/client/fetchServiceApi';

export const QUIET_FLUSH_DELAY = 2 * 1000;

export const LEASE_BUSY_RETRY_DELAY = QUIET_FLUSH_DELAY;

export function getRateLimitRetryDelay(error: AccountApiError) {
	const retryAfter = normalizeServiceRetryAfterSeconds(error.retryAfter);
	if (error.status !== 429 || retryAfter === null) {
		return null;
	}

	return Math.min(
		MAX_SERVICE_RETRY_AFTER_SECONDS * 1000,
		Math.max(QUIET_FLUSH_DELAY, Math.ceil(retryAfter * 1000))
	);
}
