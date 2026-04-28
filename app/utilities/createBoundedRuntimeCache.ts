interface IBoundedRuntimeCache<TKey, TValue> {
	clear(): void;
	get(key: TKey): TValue | undefined;
	set(key: TKey, value: TValue): void;
}

export function createBoundedRuntimeCache<TKey, TValue>(maxSize: number) {
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
				const oldestKey = cache.keys().next().value;

				if (oldestKey !== undefined) {
					cache.delete(oldestKey);
				}
			}
		},
	} as IBoundedRuntimeCache<TKey, TValue>;
}
