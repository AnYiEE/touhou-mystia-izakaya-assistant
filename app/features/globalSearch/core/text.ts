export function normalizeSearchMatchText(value: string) {
	return value.toLowerCase().replace(/\s+/gu, '');
}
