import { AccountApiError } from '@/features/account/client/api';

export const QUIET_FLUSH_DELAY = 2 * 1000;

export const LEASE_BUSY_RETRY_DELAY = QUIET_FLUSH_DELAY;

const MAX_RATE_LIMIT_RETRY_DELAY = 5 * 60 * 1000;

export function getRateLimitRetryDelay(error: AccountApiError) {
	if (error.status !== 429 || error.retryAfter === null) {
		return null;
	}

	return Math.min(
		MAX_RATE_LIMIT_RETRY_DELAY,
		Math.max(QUIET_FLUSH_DELAY, Math.ceil(error.retryAfter * 1000))
	);
}
