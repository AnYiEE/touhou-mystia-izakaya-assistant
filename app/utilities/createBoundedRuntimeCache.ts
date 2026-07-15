interface IBoundedRuntimeCache<K, V> {
	clear(): void;
	get(key: K): V | undefined;
	peek(key: K): V | undefined;
	set(key: K, value: V): void;
}

interface IBoundedRuntimeCacheOptions<V> {
	readonly getWeight?: (value: V) => number;
	readonly maxWeight?: number;
}

interface ICacheEntry<V> {
	readonly value: V;
	readonly weight: number;
}

export function createBoundedRuntimeCache<K, V>(
	maxSize = 1024,
	{
		getWeight = () => 1,
		maxWeight = Infinity,
	}: IBoundedRuntimeCacheOptions<V> = {}
) {
	if (!Number.isInteger(maxSize) || maxSize < 0) {
		throw new RangeError(
			'[utilities/createBoundedRuntimeCache] maxSize must be an integer >= 0'
		);
	}
	if (Number.isNaN(maxWeight) || maxWeight < 0) {
		throw new RangeError(
			'[utilities/createBoundedRuntimeCache] maxWeight must be a number >= 0'
		);
	}

	const cache = new Map<K, ICacheEntry<V>>();
	let totalWeight = 0;

	return {
		clear() {
			cache.clear();
			totalWeight = 0;
		},
		get(key) {
			const entry = cache.get(key);
			if (entry === undefined) {
				return;
			}

			cache.delete(key);
			cache.set(key, entry);

			return entry.value;
		},
		peek(key) {
			return cache.get(key)?.value;
		},
		set(key, value) {
			const currentEntry = cache.get(key);
			if (currentEntry !== undefined) {
				cache.delete(key);
				totalWeight -= currentEntry.weight;
			}

			const weight = getWeight(value);
			if (!Number.isFinite(weight) || weight < 0) {
				throw new RangeError(
					'[utilities/createBoundedRuntimeCache] entry weight must be a finite number >= 0'
				);
			}
			if (maxSize === 0 || weight > maxWeight) {
				return;
			}

			cache.set(key, { value, weight });
			totalWeight += weight;

			while (cache.size > maxSize || totalWeight > maxWeight) {
				const oldest = cache.keys().next();

				if (oldest.done) {
					break;
				}

				const oldestEntry = cache.get(oldest.value);
				if (oldestEntry === undefined) {
					break;
				}
				cache.delete(oldest.value);
				totalWeight -= oldestEntry.weight;
			}
		},
	} as IBoundedRuntimeCache<K, V>;
}
