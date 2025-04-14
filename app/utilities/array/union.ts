import {checkEmpty, toArray, toSet} from '@/utilities';

export function union<T>(...arrays: Array<ReadonlyArray<T>>) {
	if (checkEmpty(arrays)) {
		return [];
	}

	const flattedArrays = arrays.flat();
	if (checkEmpty(flattedArrays)) {
		return [];
	}

	return toArray(toSet(flattedArrays));
}
