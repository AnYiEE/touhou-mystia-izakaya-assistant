export function getTrimmedSearchParam(
	searchParams: URLSearchParams,
	name: string
) {
	const value = searchParams.get(name)?.trim();

	return value === undefined || value === '' ? undefined : value;
}

export function parsePositiveIntegerParam(
	value: string | null,
	defaultValue: number,
	maxValue: number
) {
	if (value === null) {
		return defaultValue;
	}
	if (!/^\d+$/u.test(value)) {
		return null;
	}

	const parsedValue = Number.parseInt(value, 10);
	if (
		!Number.isSafeInteger(parsedValue) ||
		parsedValue < 1 ||
		parsedValue > maxValue
	) {
		return null;
	}

	return parsedValue;
}

export function parseNonNegativeIntegerParam(value: string | null) {
	if (value === null) {
		return;
	}
	if (!/^\d+$/u.test(value)) {
		return null;
	}

	const parsedValue = Number.parseInt(value, 10);

	return Number.isSafeInteger(parsedValue) ? parsedValue : null;
}
