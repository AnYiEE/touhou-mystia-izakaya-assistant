export function union<T>(...arrays: ReadonlyArray<T>[]) {
	if (arrays.length === 0) {
		return [];
	}

	const flattedArrays = arrays.flat();
	if (flattedArrays.length === 0) {
		return [];
	}

	return [...new Set(flattedArrays)];
}
