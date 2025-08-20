export type TGetElementType<T> =
	T extends Map<infer K, infer V>
		? [K, V]
		: T extends
					| ArrayLike<infer U>
					| Iterable<infer U>
					| ReadonlySetLike<infer U>
			? U
			: T;
