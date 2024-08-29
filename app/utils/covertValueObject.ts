export function toValue<T extends {value: unknown}>(valueObject: T) {
	return valueObject.value as T['value'];
}

export function toValueWithKey<T extends string>(key: T) {
	return <U extends Record<T, unknown>>(valueObject: U) => valueObject[key];
}

export function toValueObject<T>(value: T) {
	return {value};
}

export function toValueObjectWithKey(key: string) {
	return <T>(value: T) => ({
		[key]: value,
	});
}
