export function uniq<T>(array: T[]) {
	if (array.length === 0) {
		return [];
	}

	return [...new Set(array)];
}
