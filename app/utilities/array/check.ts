import { toSet } from '@/utilities';

export function checkEmpty<T>(target: ArrayLike<T> | ReadonlySetLike<T>) {
	if ('length' in target) {
		return target.length === 0;
	}

	return target.size === 0;
}

export function checkArrayLengthEqualOf<T>(
	arrayA: ArrayLike<T>,
	arrayB: ArrayLike<T>
) {
	return arrayA.length === arrayB.length;
}

export function checkArrayContainsOf<T>(
	arrayA: ReadonlyArray<T>,
	arrayB: ReadonlyArray<T>
) {
	const arrayBSet = toSet(arrayB);

	return arrayA.some((value) => arrayBSet.has(value));
}

export function checkArraySubsetOf<T>(
	arrayA: ReadonlyArray<T>,
	arrayB: ReadonlyArray<T>
) {
	const arrayBSet = toSet(arrayB);

	return arrayA.every((value) => arrayBSet.has(value));
}

export const checkArrayEqualOf: typeof checkArrayContainsOf = (
	arrayA,
	arrayB
) => {
	if (!checkArrayLengthEqualOf(arrayA, arrayB)) {
		return false;
	}

	return checkArraySubsetOf(arrayA, arrayB);
};
