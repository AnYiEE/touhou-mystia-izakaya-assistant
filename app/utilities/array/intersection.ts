import { checkLengthEmpty, toSet } from '@/utilities';

export function intersection<T>(
	array: ReadonlyArray<T>,
	target: ArrayLike<T> | ReadonlySetLike<T>
) {
	if (checkLengthEmpty(array) || checkLengthEmpty(target)) {
		return [];
	}

	const set = toSet(target);

	return array.filter((value) => set.has(value));
}
