import { isObject } from 'lodash';

import type { TGetElementType } from './types';

function isIterable<T>(value: T | Iterable<T>) {
	return (
		isObject(value) && Symbol.iterator in value && typeof value !== 'string'
	);
}

export function toArray(...args: DOMTokenList[]): string[];
export function toArray(...args: NodeList[]): Node[];
export function toArray<T, U extends TGetElementType<T> = TGetElementType<T>>(
	...args: Array<T | U>
): U[];
export function toArray<T>(...args: T[]) {
	return args.flatMap((arg) => {
		if (isIterable(arg)) {
			return [...arg];
		}

		return [arg];
	});
}

export function toSet<T, U extends TGetElementType<T> = TGetElementType<T>>(
	...args: Array<T | U>
): Set<U>;
export function toSet<T>(...args: T[]) {
	const set = new Set<T>();

	args.forEach((arg) => {
		if (isIterable(arg)) {
			for (const item of arg) {
				set.add(item);
			}
		} else {
			set.add(arg);
		}
	});

	return set;
}

export { toArray as copyArray, toSet as copySet };
