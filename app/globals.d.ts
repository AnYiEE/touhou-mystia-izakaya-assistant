interface Map<K, V> {
	/**
	 * @description The `has` method checks if a specified key exists. When the key is present,
	 * the type of `this` is inferred as a `Map` instance that includes the `get` method,
	 * allowing safe access to the value associated with the key.
	 * @returns {boolean} Boolean indicating whether an element with the specified key exists or not.
	 */
	has<P extends K>(key: P): this is {get(key: P): V} & this;
}

interface ParentNode {
	/**
	 * @description To avoid type errors, specify that the return value of the following selector is always non-null.
	 * @returns {HTMLElement} The element that matches the specified selector.
	 */
	querySelector(selectors: 'main' | '#modal-portal-container'): HTMLElement;
}

type ExtractStringTypes<T> = T extends string ? T : never;
type ReactNodeWithoutBoolean = Exclude<React.ReactNode, boolean>;
type SelectionSet = Exclude<import('@nextui-org/react').Selection, 'all'>;

type HTMLButtonElementAttributes = import('react').HTMLAttributes<HTMLButtonElement>;
type HTMLDivElementAttributes = import('react').HTMLAttributes<HTMLDivElement>;
type HTMLSpanElementAttributes = import('react').HTMLAttributes<HTMLSpanElement>;
type HTMLHeadingElementAttributes = import('react').HTMLAttributes<HTMLHeadingElement>;
type HTMLLIElementAttributes = import('react').HTMLAttributes<HTMLLIElement>;
type HTMLOListElementAttributes = import('react').HTMLAttributes<HTMLOListElement>;
type HTMLUListElementAttributes = import('react').HTMLAttributes<HTMLUListElement>;
