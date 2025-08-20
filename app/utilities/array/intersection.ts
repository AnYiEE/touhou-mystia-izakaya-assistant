import { checkEmpty, toSet } from '@/utilities';

export function intersection<T>(
	array: ReadonlyArray<T>,
	target: ArrayLike<T> | ReadonlySetLike<T>
) {
	if (checkEmpty(array) || checkEmpty(target)) {
		return [];
	}

	const set = toSet(target);

	return array.filter((value) => set.has(value));
}
