export function normalizeDatabaseCount(
	value: number | string | bigint,
	errorCode: string
) {
	const count = Number(value);

	if (!Number.isSafeInteger(count) || count < 0) {
		throw new Error(errorCode);
	}

	return count;
}
