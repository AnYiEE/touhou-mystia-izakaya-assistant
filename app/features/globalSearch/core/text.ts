export function normalizeSearchMatchText(value: string) {
	return value.toLowerCase().replaceAll(/\s+/gu, '');
}
