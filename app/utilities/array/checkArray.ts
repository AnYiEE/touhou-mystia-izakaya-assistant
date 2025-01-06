export function checkArrayContainsOf<T>(arrayA: ReadonlyArray<T>, arrayB: ReadonlyArray<T>) {
	const arrayBSet = new Set(arrayB);

	return arrayA.some((value) => arrayBSet.has(value));
}

export function checkArraySubsetOf<T>(arrayA: ReadonlyArray<T>, arrayB: ReadonlyArray<T>) {
	const arrayBSet = new Set(arrayB);

	return arrayA.every((value) => arrayBSet.has(value));
}

export const checkArrayEqualOf: typeof checkArrayContainsOf = (arrayA, arrayB) => {
	if (arrayA.length !== arrayB.length) {
		return false;
	}

	return checkArraySubsetOf(arrayA, arrayB);
};
