import type { PropsWithChildren } from 'react';

const SEARCH_SYNTAX_TOKEN_CLASS_NAME =
	'inline-flex max-w-full items-center rounded-small border border-default-200/70 bg-default/30 px-1 py-0.5 align-baseline font-semibold leading-4 text-foreground-600 dark:border-default-100/20 dark:bg-default-100/10 dark:text-foreground-500';

export function renderSearchSyntax(value: string) {
	return value.split(/(@[^\s@]+)/u).map((part, index) =>
		part.startsWith('@') ? (
			<span
				key={`${part}-${index}`}
				className={SEARCH_SYNTAX_TOKEN_CLASS_NAME}
			>
				{part}
			</span>
		) : (
			part
		)
	);
}

export function SearchSyntaxToken({ children }: PropsWithChildren<object>) {
	return <span className={SEARCH_SYNTAX_TOKEN_CLASS_NAME}>{children}</span>;
}
