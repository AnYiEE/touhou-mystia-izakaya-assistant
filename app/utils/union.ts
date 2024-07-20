import {uniq} from '@/utils';

export function union<T>(...arrays: T[][]) {
	if (arrays.length === 0) {
		return [];
	}

	const flattedArrays = arrays.flat();
	if (flattedArrays.length === 0) {
		return [];
	}

	return uniq(flattedArrays);
}
