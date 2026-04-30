interface IBoundedRuntimeCache<K, V> {
	clear(): void;
	get(key: K): V | undefined;
	set(key: K, value: V): void;
}

export function createBoundedRuntimeCache<K, V>(maxSize: number) {
	if (!Number.isInteger(maxSize) || maxSize < 0) {
		throw new RangeError(
			'[utilities/createBoundedRuntimeCache] maxSize must be an integer >= 0'
		);
	}

	const cache = new Map<K, V>();

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
	} as IBoundedRuntimeCache<K, V>;
}
