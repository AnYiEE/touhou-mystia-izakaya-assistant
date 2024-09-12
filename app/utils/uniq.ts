export function uniq<T>(array: ReadonlyArray<T>) {
	if (array.length === 0) {
		return [];
	}

	return [...new Set(array)];
}
