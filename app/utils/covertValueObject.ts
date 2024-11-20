// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toValueWithKey<K extends keyof any>(key: K) {
	return <U extends Record<K, unknown>>(valueObject: U) => valueObject[key];
}

export function toValue<T extends {value: unknown}>(valueObject: T) {
	return toValueWithKey('value')(valueObject);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toValueObjectWithKey<K extends keyof any>(key: K) {
	return <V>(value: V) =>
		({
			[key]: value,
		}) as Record<K, V>;
}

export function toValueObject<V>(value: V) {
	return toValueObjectWithKey('value')(value);
}
