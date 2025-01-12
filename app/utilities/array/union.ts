import {checkEmptyArray, toArray, toSet} from '@/utilities';

export function union<T>(...arrays: ReadonlyArray<T>[]) {
	if (checkEmptyArray(arrays)) {
		return [];
	}

	const flattedArrays = arrays.flat();
	if (checkEmptyArray(flattedArrays)) {
		return [];
	}

	return toArray(toSet(flattedArrays));
}
