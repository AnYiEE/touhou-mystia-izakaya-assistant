import isObject from 'lodash/isObject.js';

/**
 * @description Keys the Next.js app router keeps in `history.state`. A state
 * passed with them skips the router's URL sync, so they are left to the router.
 */
const NEXT_HISTORY_STATE_KEYS: ReadonlySet<string> = new Set([
	'__NA',
	'__PRIVATE_NEXTJS_INTERNALS_TREE',
	'_N',
]);

type THistoryEntryState = Record<string, unknown>;

function readOwnHistoryState(
	excludedKey: string | null = null
): THistoryEntryState {
	const { state } = globalThis.history as { state: unknown };
	if (!isObject(state) || Array.isArray(state)) {
		return {};
	}

	return Object.fromEntries(
		Object.entries(state).filter(
			([key]) => key !== excludedKey && !NEXT_HISTORY_STATE_KEYS.has(key)
		)
	);
}

/** @description A value the page stored on the current history entry, e.g. to restore an opened popover on back. */
export function readHistoryEntryValue(key: string): unknown {
	return readOwnHistoryState()[key];
}

/**
 * @description Stores a value on the current history entry. The URL stays as it
 * is, so the page does not re-render.
 */
export function writeHistoryEntryValue(key: string, value: unknown) {
	globalThis.history.replaceState(
		{ ...readOwnHistoryState(), [key]: value },
		''
	);
}

export function removeHistoryEntryValue(key: string) {
	globalThis.history.replaceState(readOwnHistoryState(key), '');
}

/** @description Like `history.replaceState(null, '', url)`, but keeps the values stored on the entry. */
export function replaceHistoryEntryUrl(url: string) {
	globalThis.history.replaceState(readOwnHistoryState(), '', url);
}
