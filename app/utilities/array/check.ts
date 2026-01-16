import { toSet } from '@/utilities';

export function checkEmpty<T>(target: ArrayLike<T> | ReadonlySetLike<T>) {
	if ('length' in target) {
		return target.length === 0;
	}

	return target.size === 0;
}

export function checkLengthEqualOf<
	T,
	U extends ArrayLike<T> | ReadonlySetLike<T>,
>(targetA: U, targetB: U) {
	if ('length' in targetA && 'length' in targetB) {
		return targetA.length === targetB.length;
	}

	if ('size' in targetA && 'size' in targetB) {
		return targetA.size === targetB.size;
	}

	return false;
}

export function checkArrayContainsOf<T>(
	array: ReadonlyArray<T>,
	target: ArrayLike<T> | ReadonlySetLike<T>
) {
	if (checkEmpty(array) || checkEmpty(target)) {
		return false;
	}

	const set = toSet(target);

	return array.some((value) => set.has(value));
}

export const checkArraySubsetOf: typeof checkArrayContainsOf = (
	array,
	target
) => {
	if (checkEmpty(array) || checkEmpty(target)) {
		return false;
	}

	const set = toSet(target);

	return array.every((value) => set.has(value));
};

export const checkArrayEqualOf: typeof checkArrayContainsOf = (
	array,
	target
) => {
	if (!checkLengthEqualOf(array, target)) {
		return false;
	}

	return checkArraySubsetOf(array, target);
};
