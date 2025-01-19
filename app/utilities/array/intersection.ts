import {checkArrayEmpty, toSet} from '@/utilities';

export function intersection<T>(arrayA: ReadonlyArray<T>, arrayB: ReadonlyArray<T>) {
	if (checkArrayEmpty(arrayA) || checkArrayEmpty(arrayB)) {
		return [];
	}

	const arrayBSet = toSet(arrayB);

	return arrayA.filter((value) => arrayBSet.has(value));
}
