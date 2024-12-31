declare module '@eslint-community/eslint-plugin-eslint-comments/configs' {
	import {type Linter} from 'eslint';

	const recommended: Linter.Config;
	export = {recommended};
}

declare module 'eslint-plugin-sort-destructure-keys' {
	import {plugin} from 'typescript-eslint';

	const sortDestructureKeys: typeof plugin;
	export = sortDestructureKeys;
}

interface Map<K, V> {
	/**
	 * @description The `has` method checks if a specified key exists. When the key is present,
	 * the type of `this` is inferred as a `Map` instance that includes the `get` method,
	 * allowing safe access to the value associated with the key.
	 * @returns {boolean} Boolean indicating whether an element with the specified key exists or not.
	 */
	has<P extends K>(key: P): this is {get(key: P): V} & this;
}

interface WeakMap<K, V> {
	/**
	 * @description The `has` method checks if a specified key exists. When the key is present,
	 * the type of `this` is inferred as a `WeakMap` instance that includes the `get` method,
	 * allowing safe access to the value associated with the key.
	 * @returns {boolean} Boolean indicating whether an element with the specified key exists or not.
	 */
	has<P extends K>(key: P): this is {get(key: P): V} & this;
}
