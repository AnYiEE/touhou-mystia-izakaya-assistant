interface ParentNode {
	/**
	 * @description To avoid type errors, specify that the return value of the following selector is always non-null.
	 * @returns {HTMLElement} The element that matches the specified selector.
	 */
	querySelector(selectors: 'main' | '#modal-portal-container'): HTMLElement;
}

type ReactNodeWithoutBoolean = Exclude<React.ReactNode, boolean>;
type RefProps<T> = Partial<Record<'ref', React.Ref<T>>>;
type SelectionSet = Exclude<import('@heroui/table').Selection, 'all'>;

type HTMLButtonElementAttributes =
	import('react').HTMLAttributes<HTMLButtonElement>;
type HTMLDivElementAttributes = import('react').HTMLAttributes<HTMLDivElement>;
type HTMLSpanElementAttributes =
	import('react').HTMLAttributes<HTMLSpanElement>;
type HTMLHeadingElementAttributes =
	import('react').HTMLAttributes<HTMLHeadingElement>;
type HTMLLIElementAttributes = import('react').HTMLAttributes<HTMLLIElement>;
type HTMLOListElementAttributes =
	import('react').HTMLAttributes<HTMLOListElement>;
type HTMLUListElementAttributes =
	import('react').HTMLAttributes<HTMLUListElement>;
