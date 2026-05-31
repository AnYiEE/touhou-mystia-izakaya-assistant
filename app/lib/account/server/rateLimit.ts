export interface IRateLimitOptions {
	limit: number;
	windowMs: number;
}

export interface IRateLimitResult {
	allowed: boolean;
	remaining: number;
	retryAfter: number;
}

interface IRateLimitBucket {
	count: number;
	resetAt: number;
}

// Design note: Rate limiting uses in-process memory (Map) with fail-closed
// capacity protection. For multi-instance deployments, migrate to a shared
// SQLite rate_limit table via the project's existing Kysely db instance.
const MAX_RATE_LIMIT_BUCKETS = 10_000;
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 60 * 1000;

const rateLimitBucketMap = new Map<string, IRateLimitBucket>();
let lastRateLimitCleanupAt = 0;

export function clearExpiredRateLimitBuckets(now = Date.now()) {
	rateLimitBucketMap.forEach((bucket, key) => {
		if (bucket.resetAt <= now) {
			rateLimitBucketMap.delete(key);
		}
	});
}

function ensureRateLimitBucketCapacity(now: number): boolean {
	if (now - lastRateLimitCleanupAt >= RATE_LIMIT_CLEANUP_INTERVAL_MS) {
		clearExpiredRateLimitBuckets(now);
		lastRateLimitCleanupAt = now;
	}

	if (rateLimitBucketMap.size < MAX_RATE_LIMIT_BUCKETS) {
		return true;
	}

	clearExpiredRateLimitBuckets(now);
	lastRateLimitCleanupAt = now;

	if (rateLimitBucketMap.size < MAX_RATE_LIMIT_BUCKETS) {
		return true;
	}

	// Fail closed when capacity is reached: reject new keys rather than
	// evicting existing buckets, which would allow key-rotation attacks.
	return false;
}

export function checkRateLimit(
	key: string,
	{ limit, windowMs }: IRateLimitOptions,
	now = Date.now()
): IRateLimitResult {
	if (!Number.isInteger(limit) || limit <= 0) {
		throw new Error(
			'Invalid rate limit option: limit must be a positive integer'
		);
	}
	if (!Number.isInteger(windowMs) || windowMs <= 0) {
		throw new Error(
			'Invalid rate limit option: windowMs must be a positive integer'
		);
	}

	const bucket = rateLimitBucketMap.get(key);

	if (!bucket || bucket.resetAt <= now) {
		if (!ensureRateLimitBucketCapacity(now)) {
			return {
				allowed: false,
				remaining: 0,
				retryAfter: Math.ceil(windowMs / 1000),
			};
		}

		rateLimitBucketMap.set(key, { count: 1, resetAt: now + windowMs });
		return { allowed: true, remaining: limit - 1, retryAfter: 0 };
	}
	if (bucket.count >= limit) {
		return {
			allowed: false,
			remaining: 0,
			retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
		};
	}

	bucket.count += 1;
	return {
		allowed: true,
		remaining: Math.max(0, limit - bucket.count),
		retryAfter: 0,
	};
}
