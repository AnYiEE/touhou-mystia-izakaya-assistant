export function without<T>(array: T[], ...values: T[]) {
	if (array.length === 0) {
		return [];
	}

	const valuesSet = new Set(values);

	return array.filter((value) => !valuesSet.has(value));
}
