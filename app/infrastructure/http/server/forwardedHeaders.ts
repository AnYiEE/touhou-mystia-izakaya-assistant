export function getFirstForwardedHeaderValue(value: string | null) {
	const firstValue = value?.split(',', 1)[0]?.trim();

	return firstValue === undefined || firstValue === '' ? null : firstValue;
}
