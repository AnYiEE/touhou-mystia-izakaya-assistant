export function toValueWithKey<T extends string>(key: T) {
	return <U extends Record<T, unknown>>(valueObject: U) => valueObject[key];
}

export function toValue<T extends {value: unknown}>(valueObject: T) {
	return toValueWithKey('value')(valueObject);
}

export function toValueObjectWithKey<K extends string>(key: K) {
	return <T>(value: T) =>
		({
			[key]: value,
		}) as Record<K, T>;
}

export function toValueObject<T>(value: T) {
	return toValueObjectWithKey('value')(value);
}
