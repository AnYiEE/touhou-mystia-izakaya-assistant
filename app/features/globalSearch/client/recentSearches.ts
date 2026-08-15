import isObject from 'lodash/isObject.js';

import { GLOBAL_SEARCH_RECENT_STORAGE_KEY } from '@/features/globalSearch/core/constants';

import { safeStorage } from '@/infrastructure/browser/storage/safeStorage';

import {
	type TGlobalSearchRecentIndexItem,
	migrateGlobalSearchRecentState,
} from './migrateRecentSearches';

const MAX_RECENT_ITEMS = 8;
const MAX_RECENT_QUERIES = 8;

export interface IGlobalSearchRecentState {
	items: string[];
	queries: string[];
}

export const EMPTY_GLOBAL_SEARCH_RECENT_STATE: IGlobalSearchRecentState = {
	items: [],
	queries: [],
};

export function writeGlobalSearchRecentState(state: IGlobalSearchRecentState) {
	safeStorage.setItem(
		GLOBAL_SEARCH_RECENT_STORAGE_KEY,
		JSON.stringify(state)
	);
}

export function readGlobalSearchRecentState(
	index: ReadonlyArray<TGlobalSearchRecentIndexItem>
): IGlobalSearchRecentState {
	const value = safeStorage.getItem(GLOBAL_SEARCH_RECENT_STORAGE_KEY);
	if (value === null) {
		return EMPTY_GLOBAL_SEARCH_RECENT_STATE;
	}

	try {
		const parsed: unknown = JSON.parse(value);
		if (
			isObject(parsed) &&
			Array.isArray(
				(parsed as Partial<IGlobalSearchRecentState>).items
			) &&
			Array.isArray((parsed as Partial<IGlobalSearchRecentState>).queries)
		) {
			const recentState = parsed as IGlobalSearchRecentState;
			const normalizedState = {
				items: recentState.items
					.filter((item): item is string => typeof item === 'string')
					.slice(0, MAX_RECENT_ITEMS),
				queries: recentState.queries
					.filter((item): item is string => typeof item === 'string')
					.slice(0, MAX_RECENT_QUERIES),
			};
			const migratedState = migrateGlobalSearchRecentState(
				normalizedState,
				index
			);
			if (migratedState !== normalizedState) {
				writeGlobalSearchRecentState(migratedState);
			}
			return migratedState;
		}
	} catch {
		/* empty */
	}

	return EMPTY_GLOBAL_SEARCH_RECENT_STATE;
}

export function addGlobalSearchRecentEntry({
	itemId,
	query,
	state,
}: {
	itemId: string;
	query: string;
	state: IGlobalSearchRecentState;
}): IGlobalSearchRecentState {
	const trimmedQuery = query.trim();
	return {
		items: [
			itemId,
			...state.items.filter((recentItemId) => recentItemId !== itemId),
		].slice(0, MAX_RECENT_ITEMS),
		queries:
			trimmedQuery.length === 0
				? state.queries
				: [
						trimmedQuery,
						...state.queries.filter(
							(recentQuery) => recentQuery !== trimmedQuery
						),
					].slice(0, MAX_RECENT_QUERIES),
	};
}

export function clearGlobalSearchRecentItems(state: IGlobalSearchRecentState) {
	return { ...state, items: [] };
}

export function clearGlobalSearchRecentQueries(
	state: IGlobalSearchRecentState
) {
	return { ...state, queries: [] };
}
