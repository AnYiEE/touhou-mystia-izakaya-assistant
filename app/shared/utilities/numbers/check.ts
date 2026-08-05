export function isNonNegativeSafeInteger(value: unknown): value is number {
	return (
		typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
	);
}

export function isNullableNonNegativeSafeInteger(
	value: unknown
): value is number | null {
	return value === null || isNonNegativeSafeInteger(value);
}

export function isPositiveSafeInteger(value: unknown): value is number {
	return isNonNegativeSafeInteger(value) && value > 0;
}

export function canIncrementNonNegativeSafeInteger(
	value: unknown
): value is number {
	return isNonNegativeSafeInteger(value) && value < Number.MAX_SAFE_INTEGER;
}

export function canAddNonNegativeSafeIntegers(
	value: unknown,
	increment: unknown
): value is number {
	return (
		isNonNegativeSafeInteger(value) &&
		isNonNegativeSafeInteger(increment) &&
		value <= Number.MAX_SAFE_INTEGER - increment
	);
}
