import {checkEmpty, toSet} from '@/utilities';

export function intersection<T>(arrayA: ReadonlyArray<T>, arrayB: ReadonlyArray<T>) {
	if (checkEmpty(arrayA) || checkEmpty(arrayB)) {
		return [];
	}

	const arrayBSet = toSet(arrayB);

	return arrayA.filter((value) => arrayBSet.has(value));
}
