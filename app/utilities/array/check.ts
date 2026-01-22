import { isNil } from 'lodash';

import { toSet } from '@/utilities';

export function checkLengthEmpty<T>(target: ArrayLike<T> | ReadonlySetLike<T>) {
	if ('length' in target) {
		return target.length === 0;
	}

	return target.size === 0;
}

export function checkObjectOrStringEmpty(
	item: object | string | unknown[] | null | undefined
) {
	if (isNil(item)) {
		return true;
	}

	if (typeof item === 'string' || Array.isArray(item)) {
		return checkLengthEmpty(item);
	}

	return checkLengthEmpty(Object.keys(item));
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
	if (checkLengthEmpty(array) || checkLengthEmpty(target)) {
		return false;
	}

	const set = toSet(target);

	return array.some((value) => set.has(value));
}

export const checkArraySubsetOf: typeof checkArrayContainsOf = (
	array,
	target
) => {
	if (checkLengthEmpty(array) || checkLengthEmpty(target)) {
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
