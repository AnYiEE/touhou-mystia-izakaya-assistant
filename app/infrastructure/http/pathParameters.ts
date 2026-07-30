export function parsePositiveIntegerPathParam(value: string) {
	if (!/^\d+$/u.test(value)) {
		return null;
	}

	const parsedValue = Number.parseInt(value, 10);

	return Number.isSafeInteger(parsedValue) && parsedValue >= 1
		? parsedValue
		: null;
}
