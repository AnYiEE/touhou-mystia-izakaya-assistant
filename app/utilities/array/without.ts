import {checkArrayEmpty, toSet} from '@/utilities';

export function without<T>(array: ReadonlyArray<T>, ...values: T[]) {
	if (checkArrayEmpty(array)) {
		return [];
	}

	const valuesSet = toSet(values);

	return array.filter((value) => !valuesSet.has(value));
}
