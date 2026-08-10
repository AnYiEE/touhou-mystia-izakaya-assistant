export function getHeaderOrigin(value: string | null) {
	if (value === null) {
		return null;
	}

	return URL.parse(value)?.origin ?? null;
}
