const KEY = 'value';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toGetItemWithKey<K extends keyof any>(key: K) {
	return <U extends Record<K, unknown>>(collection: U) => collection[key];
}

export function toGetValue<T extends {value: unknown}>(collection: T) {
	return toGetItemWithKey(KEY)(collection);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toGetCollectionWithKey<K extends keyof any>(key: K) {
	return <V>(item: V) =>
		({
			[key]: item,
		}) as Record<K, V>;
}

export function toGetValueCollection<V>(value: V) {
	return toGetCollectionWithKey(KEY)(value);
}
