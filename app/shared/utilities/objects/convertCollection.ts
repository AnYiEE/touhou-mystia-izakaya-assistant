import { isObject } from 'lodash';

const KEY = 'value';

export function isValueCollection<T>(value: T | ValueCollection<T>) {
	return isObject(value) && KEY in value;
}

export function toGetItemWithKey<K extends PropertyKey>(key: K) {
	return <U extends Record<K, unknown>>(collection: U) => collection[key];
}

export function toGetValue<T extends ValueCollection<unknown>>(collection: T) {
	return toGetItemWithKey(KEY)(collection);
}

export function toGetCollectionWithKey<K extends PropertyKey>(key: K) {
	return <V>(item: V) => ({ [key]: item }) as Record<K, V>;
}

export function toGetValueCollection<V>(value: V): ValueCollection<V> {
	return toGetCollectionWithKey(KEY)(value);
}
