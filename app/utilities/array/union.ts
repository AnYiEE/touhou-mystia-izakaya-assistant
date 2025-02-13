import {checkEmpty, toArray, toSet} from '@/utilities';

export function union<T>(...arrays: ReadonlyArray<T>[]) {
	if (checkEmpty(arrays)) {
		return [];
	}

	const flattedArrays = arrays.flat();
	if (checkEmpty(flattedArrays)) {
		return [];
	}

	return toArray(toSet(flattedArrays));
}
