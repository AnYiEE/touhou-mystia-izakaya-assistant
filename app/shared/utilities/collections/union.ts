import { checkLengthEmpty } from './check';
import { toArray, toSet } from './convert';
import type { TGetElementType } from './types';

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
