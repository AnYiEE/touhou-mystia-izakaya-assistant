interface Map<K, V> {
	/**
	 * @description The `has` method checks if a specified key exists. When the key is present,
	 * the type of `this` is inferred as a `Map` instance that includes the `get` method,
	 * allowing safe access to the value associated with the key.
	 * @returns {boolean} Boolean indicating whether an element with the specified key exists or not.
	 */
	has<P extends K>(key: P): this is {get(key: P): V} & this;
}

type ExtractStringTypes<T> = T extends string ? T : never;
type ReactNodeWithoutBoolean = Exclude<React.ReactNode, boolean>;
type SelectionSet = Exclude<import('@nextui-org/react').Selection, 'all'>;
