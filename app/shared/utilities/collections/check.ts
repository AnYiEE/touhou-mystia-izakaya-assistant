import isNil from 'lodash/isNil.js';

export function checkLengthEmpty<T>(
	target: string | ArrayLike<T> | ReadonlySetLike<T> | null | undefined
) {
	if (isNil(target)) {
		return true;
	}
	if (typeof target === 'string') {
		return target.length === 0;
	}
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
	if (typeof targetA === 'string' || typeof targetB === 'string') {
		return (
			(typeof targetA === 'string' || 'length' in targetA) &&
			(typeof targetB === 'string' || 'length' in targetB) &&
			targetA.length === targetB.length
		);
	}
	if ('length' in targetA && 'length' in targetB) {
		return targetA.length === targetB.length;
	}

	if ('size' in targetA && 'size' in targetB) {
		return targetA.size === targetB.size;
	}

	return false;
}

function toValueSet<T>(target: ArrayLike<T> | ReadonlySetLike<T>) {
	if (typeof target === 'string') {
		return new Set([target]) as Set<T>;
	}

	return 'length' in target
		? // eslint-disable-next-line unicorn/prefer-spread -- ArrayLike values need not implement Symbol.iterator.
			new Set(Array.from(target))
		: target;
}

type TCheckArrayRelation = <T>(
	array: ReadonlyArray<T>,
	target: ArrayLike<T> | ReadonlySetLike<T>
) => boolean;

const checkArraySubsetOf: TCheckArrayRelation = (array, target) => {
	if (checkLengthEmpty(array) || checkLengthEmpty(target)) {
		return false;
	}

	const set = toValueSet(target);

	return array.every((value) => set.has(value));
};

export const checkArrayEqualOf: TCheckArrayRelation = (array, target) => {
	if (!checkLengthEqualOf(array, target)) {
		return false;
	}

	return checkArraySubsetOf(array, target);
};

export function checkOrderedArrayEqual<T>(
	left: ReadonlyArray<T>,
	right: ReadonlyArray<T>
) {
	return (
		left.length === right.length &&
		left.every((value, index) => value === right[index])
	);
}
