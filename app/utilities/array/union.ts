import type { TGetElementType } from './types';

import { checkLengthEmpty, toArray, toSet } from '@/utilities';

export function union<T, U extends TGetElementType<T> = TGetElementType<T>>(
	...args: U[]
) {
	if (checkLengthEmpty(args)) {
		return [];
	}

	const flattedArrays = args.flat();
	if (checkLengthEmpty(flattedArrays)) {
		return [];
	}

	return toArray(toSet(flattedArrays));
}
