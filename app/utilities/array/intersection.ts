import {checkEmptyArray, toSet} from '@/utilities';

export function intersection<T>(arrayA: ReadonlyArray<T>, arrayB: ReadonlyArray<T>) {
	if (checkEmptyArray(arrayA) || checkEmptyArray(arrayB)) {
		return [];
	}

	const arrayBSet = toSet(arrayB);

	return arrayA.filter((value) => arrayBSet.has(value));
}
