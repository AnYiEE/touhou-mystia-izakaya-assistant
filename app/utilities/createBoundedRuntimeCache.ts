interface IBoundedRuntimeCache<TKey, TValue> {
	clear(): void;
	get(key: TKey): TValue | undefined;
	set(key: TKey, value: TValue): void;
}

export function createBoundedRuntimeCache<TKey, TValue>(maxSize: number) {
	if (!Number.isInteger(maxSize) || maxSize < 0) {
		throw new RangeError(
			'[createBoundedRuntimeCache] maxSize must be an integer >= 0'
		);
	}

	const cache = new Map<TKey, TValue>();

	return {
		clear() {
			cache.clear();
		},
		get(key) {
			if (!cache.has(key)) {
				return;
			}

			const value = cache.get(key);
			cache.delete(key);
			cache.set(key, value);

			return value;
		},
		set(key, value) {
			if (cache.has(key)) {
				cache.delete(key);
			}

			cache.set(key, value);

			if (cache.size > maxSize) {
				const oldest = cache.keys().next();

				if (!oldest.done) {
					cache.delete(oldest.value);
				}
			}
		},
	} as IBoundedRuntimeCache<TKey, TValue>;
}
