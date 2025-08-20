import type { TGetElementType } from './types';

import { checkEmpty, toArray, toSet } from '@/utilities';

export function union<T, U extends TGetElementType<T> = TGetElementType<T>>(
	...args: U[]
) {
	if (checkEmpty(args)) {
		return [];
	}

	const flattedArrays = args.flat();
	if (checkEmpty(flattedArrays)) {
		return [];
	}

	return toArray(toSet(flattedArrays));
}
