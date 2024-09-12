export function isArrayEqual<T>(arrayA: ReadonlyArray<T>, arrayB: ReadonlyArray<T>) {
	if (arrayA.length !== arrayB.length) {
		return false;
	}

	const arrayBSet = new Set(arrayB);

	return arrayA.every((value) => arrayBSet.has(value));
}
