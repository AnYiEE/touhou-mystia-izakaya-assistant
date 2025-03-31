interface ParentNode {
	/**
	 * @description To avoid type errors, specify that the return value of the following selector is always non-null.
	 * @returns {HTMLElement} The element that matches the specified selector.
	 */
	querySelector(selectors: 'main' | '#modal-portal-container'): HTMLElement;
}

type ExtractCollectionValue<T extends Record<string, unknown>> = T[keyof T];
type ExtractStringTypes<T> = T extends string ? T : never;
type ReactNodeWithoutBoolean = Exclude<React.ReactNode, boolean>;
type SelectionSet = Exclude<import('@heroui/table').Selection, 'all'>;
type ValueCollection<T = string> = Record<'value', T>;

type HTMLButtonElementAttributes = import('react').HTMLAttributes<HTMLButtonElement>;
type HTMLDivElementAttributes = import('react').HTMLAttributes<HTMLDivElement>;
type HTMLSpanElementAttributes = import('react').HTMLAttributes<HTMLSpanElement>;
type HTMLHeadingElementAttributes = import('react').HTMLAttributes<HTMLHeadingElement>;
type HTMLLIElementAttributes = import('react').HTMLAttributes<HTMLLIElement>;
type HTMLOListElementAttributes = import('react').HTMLAttributes<HTMLOListElement>;
type HTMLUListElementAttributes = import('react').HTMLAttributes<HTMLUListElement>;
