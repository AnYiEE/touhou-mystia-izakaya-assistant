export interface IRateLimitOptions {
	capacityGroup: string;
	limit: number;
	windowMs: number;
}

export interface IRateLimitResult {
	allowed: boolean;
	remaining: number;
	retryAfter: number;
}

interface IRateLimitBucket {
	capacityGroup: string;
	count: number;
	resetAt: number;
}

// Design note: Rate limiting uses in-process memory (Map) with an overflow
// bucket for capacity protection. For multi-instance deployments, migrate to a
// shared SQLite rate_limit table via the project's existing Kysely db instance.
const MAX_RATE_LIMIT_BUCKETS = 10_000;
const RESERVED_OVERFLOW_RATE_LIMIT_BUCKETS = 1;
const MAX_NORMAL_RATE_LIMIT_BUCKETS =
	MAX_RATE_LIMIT_BUCKETS - RESERVED_OVERFLOW_RATE_LIMIT_BUCKETS;
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 60 * 1000;
const RATE_LIMIT_OVERFLOW_KEY = '__overflow__';

const rateLimitBucketMap = new Map<string, IRateLimitBucket>();
let lastRateLimitCleanupAt = 0;

export function clearExpiredRateLimitBuckets(now = Date.now()) {
	rateLimitBucketMap.forEach((bucket, key) => {
		if (bucket.resetAt <= now) {
			rateLimitBucketMap.delete(key);
		}
	});
}

function countRateLimitBucketsByCapacityGroup(capacityGroup: string) {
	let count = 0;
	for (const bucket of rateLimitBucketMap.values()) {
		if (bucket.capacityGroup === capacityGroup) {
			count += 1;
		}
	}

	return count;
}

function createRateLimitBucketMapKey(
	capacityGroup: string,
	key: string,
	bucketType: 'normal' | 'overflow' = 'normal'
) {
	return JSON.stringify([capacityGroup, bucketType, key]);
}

function ensureRateLimitBucketCapacity(
	now: number,
	capacityGroup: string
): boolean {
	const overflowBucketMapKey = createRateLimitBucketMapKey(
		capacityGroup,
		RATE_LIMIT_OVERFLOW_KEY,
		'overflow'
	);
	const checkHasNormalBucketCapacity = () =>
		countRateLimitBucketsByCapacityGroup(capacityGroup) <
		(rateLimitBucketMap.has(overflowBucketMapKey)
			? MAX_RATE_LIMIT_BUCKETS
			: MAX_NORMAL_RATE_LIMIT_BUCKETS);

	if (now - lastRateLimitCleanupAt >= RATE_LIMIT_CLEANUP_INTERVAL_MS) {
		clearExpiredRateLimitBuckets(now);
		lastRateLimitCleanupAt = now;
	}

	if (checkHasNormalBucketCapacity()) {
		return true;
	}

	clearExpiredRateLimitBuckets(now);
	lastRateLimitCleanupAt = now;

	if (checkHasNormalBucketCapacity()) {
		return true;
	}

	// Capacity is reached. New keys should share an overflow bucket rather than
	// evicting existing buckets, which would allow key-rotation attacks.
	return false;
}

function consumeRateLimitBucket(
	bucketMapKey: string,
	capacityGroup: string,
	limit: number,
	windowMs: number,
	now: number
): IRateLimitResult {
	const bucket = rateLimitBucketMap.get(bucketMapKey);
	if (!bucket || bucket.resetAt <= now) {
		rateLimitBucketMap.set(bucketMapKey, {
			capacityGroup,
			count: 1,
			resetAt: now + windowMs,
		});
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

function consumeRateLimitOverflowBucket(
	capacityGroup: string,
	limit: number,
	windowMs: number,
	now: number
): IRateLimitResult {
	const bucketMapKey = createRateLimitBucketMapKey(
		capacityGroup,
		RATE_LIMIT_OVERFLOW_KEY,
		'overflow'
	);
	const bucket = rateLimitBucketMap.get(bucketMapKey);
	if (
		(!bucket || bucket.resetAt <= now) &&
		countRateLimitBucketsByCapacityGroup(capacityGroup) >=
			MAX_RATE_LIMIT_BUCKETS
	) {
		return {
			allowed: false,
			remaining: 0,
			retryAfter: Math.ceil(windowMs / 1000),
		};
	}

	return consumeRateLimitBucket(
		bucketMapKey,
		capacityGroup,
		limit,
		windowMs,
		now
	);
}

export function checkRateLimit(
	key: string,
	{ capacityGroup, limit, windowMs }: IRateLimitOptions,
	now = Date.now()
): IRateLimitResult {
	if (capacityGroup === '') {
		throw new Error('Invalid rate limit option: capacityGroup is required');
	}
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

	const bucketMapKey = createRateLimitBucketMapKey(capacityGroup, key);
	const bucket = rateLimitBucketMap.get(bucketMapKey);

	if (!bucket || bucket.resetAt <= now) {
		if (!ensureRateLimitBucketCapacity(now, capacityGroup)) {
			return consumeRateLimitOverflowBucket(
				capacityGroup,
				limit,
				windowMs,
				now
			);
		}

		return consumeRateLimitBucket(
			bucketMapKey,
			capacityGroup,
			limit,
			windowMs,
			now
		);
	}

	return consumeRateLimitBucket(
		bucketMapKey,
		capacityGroup,
		limit,
		windowMs,
		now
	);
}
