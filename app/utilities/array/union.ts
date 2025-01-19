import {checkArrayEmpty, toArray, toSet} from '@/utilities';

export function union<T>(...arrays: ReadonlyArray<T>[]) {
	if (checkArrayEmpty(arrays)) {
		return [];
	}

	const flattedArrays = arrays.flat();
	if (checkArrayEmpty(flattedArrays)) {
		return [];
	}

	return toArray(toSet(flattedArrays));
}
