import {isObject} from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TCollectionKey = keyof any;

const KEY = 'value';

export function isValueCollection<T>(value: T | ValueCollection<T>): value is ValueCollection<T> {
	return isObject(value) && 'value' in value;
}

export function toGetItemWithKey<K extends TCollectionKey>(key: K) {
	return <U extends Record<K, unknown>>(collection: U) => collection[key];
}

export function toGetValue<T extends ValueCollection<unknown>>(collection: T) {
	return toGetItemWithKey(KEY)(collection);
}

export function toGetCollectionWithKey<K extends TCollectionKey>(key: K) {
	return <V>(item: V) =>
		({
			[key]: item,
		}) as Record<K, V>;
}

export function toGetValueCollection<V>(value: V) {
	return toGetCollectionWithKey(KEY)(value);
}
