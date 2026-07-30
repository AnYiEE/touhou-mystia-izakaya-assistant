/**
 * Increment only when recommendation result semantics change.
 * Formatting, refactors, application releases, and cache implementation changes
 * do not require an algorithm version change.
 */
export const RECOMMENDATION_ALGORITHM_VERSION = 2;

/**
 * Increment when the persisted record shape or validation contract changes.
 */
export const RECOMMENDATION_CACHE_RECORD_VERSION = 2;

/**
 * Emergency invalidation switch for otherwise compatible records.
 */
export const RECOMMENDATION_CACHE_EPOCH = 1;

export const RECOMMENDATION_CACHE_DATABASE_VERSION = 1;
export const RECOMMENDATION_CACHE_READ_GRACE_MS = 250;
export const RECOMMENDATION_CACHE_OLD_NAMESPACE_DELETE_BATCH_SIZE = 50;

export const SUGGESTED_MEAL_CARD_CACHE_MAX_ENTRIES = 500;
export const SUGGESTED_MEAL_CARD_CACHE_MAX_MEALS = 5000;
export const CUSTOMER_RARE_PLAN_CACHE_MAX_ENTRIES = 200;
export const CUSTOMER_RARE_PLAN_CACHE_MAX_MEALS = 200_000;
