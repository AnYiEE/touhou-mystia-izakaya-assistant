import {toSet} from '@/utilities';

export function checkArrayLengthEqualOf<T>(arrayA: ReadonlyArray<T>, arrayB: ReadonlyArray<T>) {
	return arrayA.length === arrayB.length;
}

export function checkArrayContainsOf<T>(arrayA: ReadonlyArray<T>, arrayB: ReadonlyArray<T>) {
	const arrayBSet = toSet(arrayB);

	return arrayA.some((value) => arrayBSet.has(value));
}

export function checkArraySubsetOf<T>(arrayA: ReadonlyArray<T>, arrayB: ReadonlyArray<T>) {
	const arrayBSet = toSet(arrayB);

	return arrayA.every((value) => arrayBSet.has(value));
}

export const checkArrayEqualOf: typeof checkArrayContainsOf = (arrayA, arrayB) => {
	if (!checkArrayLengthEqualOf(arrayA, arrayB)) {
		return false;
	}

	return checkArraySubsetOf(arrayA, arrayB);
};

export function checkEmptyArray<T>(array: ReadonlyArray<T>) {
	return array.length === 0;
}
