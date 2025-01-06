export function intersection<T>(arrayA: ReadonlyArray<T>, arrayB: ReadonlyArray<T>) {
	if (arrayA.length === 0 || arrayB.length === 0) {
		return [];
	}

	const arrayBSet = new Set(arrayB);

	return arrayA.filter((value) => arrayBSet.has(value));
}
