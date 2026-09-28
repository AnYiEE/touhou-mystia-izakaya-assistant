'use client';

import {
	useCallback,
	useDebugValue,
	useMemo,
	useSyncExternalStore,
} from 'react';

import { addSafeMediaQueryEventListener } from '@/infrastructure/browser/compatibility/mediaQuery';

export type TBreakpointConfig = Readonly<Record<string, number>>;

export interface IBreakpoint<C extends TBreakpointConfig> {
	breakpoint: keyof C;
	maxWidth: number | null;
	minWidth: number;
	query: string;
}

const EMPTY_BREAKPOINT = {
	breakpoint: null,
	maxWidth: null,
	minWidth: null,
	query: null,
} as const;

function createMediaQueries<C extends TBreakpointConfig>(
	config: C
): Array<IBreakpoint<C>> {
	const sortedBreakpoints = Object.keys(config).sort(
		(left, right) => (config[right] ?? 0) - (config[left] ?? 0)
	);

	return sortedBreakpoints.map((breakpoint, index) => {
		const minWidth = config[breakpoint] ?? 0;
		const previousBreakpoint = sortedBreakpoints[index - 1];
		const maxWidth =
			previousBreakpoint === undefined
				? null
				: (config[previousBreakpoint] ?? 0);
		let query = '';

		if (minWidth >= 0) {
			query = `(min-width: ${minWidth}px)`;
		}
		if (maxWidth !== null) {
			if (query !== '') {
				query += ' and ';
			}
			query += `(max-width: ${maxWidth - 1}px)`;
		}

		return {
			breakpoint,
			maxWidth: maxWidth === null ? null : maxWidth - 1,
			minWidth,
			query,
		};
	});
}

function serializeBreakpointConfig(config: TBreakpointConfig) {
	return JSON.stringify(Object.entries(config));
}

export function useBreakpoint<C extends TBreakpointConfig>(
	config: C,
	defaultBreakpoint: keyof C
): IBreakpoint<C>;
export function useBreakpoint<C extends TBreakpointConfig>(
	config: C
): IBreakpoint<C> | typeof EMPTY_BREAKPOINT;
export function useBreakpoint<C extends TBreakpointConfig>(
	config: C,
	defaultBreakpoint?: keyof C
) {
	const serializedConfig = serializeBreakpointConfig(config);
	const mediaQueries = useMemo(
		() =>
			createMediaQueries<C>(
				Object.fromEntries(
					JSON.parse(serializedConfig) as Array<[string, number]>
				) as C
			),
		[serializedConfig]
	);

	const subscribe = useCallback(
		(onStoreChange: () => void) => {
			const removeListeners = mediaQueries.map(({ query }) =>
				addSafeMediaQueryEventListener(
					globalThis.matchMedia(query),
					onStoreChange
				)
			);

			return () => {
				for (const removeListener of removeListeners) {
					removeListener();
				}
			};
		},
		[mediaQueries]
	);

	const getSnapshot = useCallback(() => {
		const matchedQuery = mediaQueries.find(
			({ query }) => globalThis.matchMedia(query).matches
		);

		if (matchedQuery !== undefined) {
			return matchedQuery;
		}

		const defaultQuery = mediaQueries.find(
			({ breakpoint }) => breakpoint === defaultBreakpoint
		);

		return defaultQuery ?? EMPTY_BREAKPOINT;
	}, [defaultBreakpoint, mediaQueries]);

	const getServerSnapshot = useCallback(() => {
		const defaultQuery = mediaQueries.find(
			({ breakpoint }) => breakpoint === defaultBreakpoint
		);

		return defaultQuery ?? EMPTY_BREAKPOINT;
	}, [defaultBreakpoint, mediaQueries]);

	const currentBreakpoint = useSyncExternalStore(
		subscribe,
		getSnapshot,
		getServerSnapshot
	);

	useDebugValue(currentBreakpoint, (breakpoint) =>
		typeof breakpoint.breakpoint === 'string'
			? `${breakpoint.breakpoint} (${breakpoint.minWidth ?? 0} ≤ x${
					breakpoint.maxWidth === null
						? ''
						: ` < ${breakpoint.maxWidth + 1}`
				})`
			: ''
	);

	return currentBreakpoint;
}
