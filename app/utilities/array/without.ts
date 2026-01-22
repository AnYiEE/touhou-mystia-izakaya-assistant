import { checkLengthEmpty, toSet } from '@/utilities';

export function without<T>(array: ReadonlyArray<T>, ...values: T[]) {
	if (checkLengthEmpty(array)) {
		return [];
	}

	const set = toSet(values);

	return array.filter((value) => !set.has(value));
}
