import { isObject } from 'lodash';

type TGetElementType<T> = T extends Iterable<infer U> ? U : T;

function isIterable<T>(value: T | Iterable<T>) {
	return isObject(value) && Symbol.iterator in value;
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

export function toSet<T>(...arrays: Array<ReadonlyArray<T>>) {
	return new Set(arrays.flat());
}

export { toArray as copyArray };
