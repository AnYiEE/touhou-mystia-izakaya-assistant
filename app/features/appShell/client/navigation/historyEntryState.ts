import isObject from 'lodash/isObject.js';

/**
 * @description Next.js treats these fields as an internal history write and
 * skips URL sync. Omit them only when changing the URL; its patched history
 * method restores them from the current entry. All unknown fields are kept.
 */
const NEXT_HISTORY_STATE_KEYS: ReadonlySet<string> = new Set([
	'__NA',
	'__PRIVATE_NEXTJS_INTERNALS_TREE',
	'_N',
]);

type THistoryEntryState = Record<string, unknown>;

function readHistoryEntryState(): THistoryEntryState {
	const { state } = globalThis.history as { state: unknown };
	if (!isObject(state) || Array.isArray(state)) {
		return {};
	}

	return { ...state };
}

/** @description A value the page stored on the current history entry, e.g. to restore an opened popover on back. */
export function readHistoryEntryValue(key: string): unknown {
	return readHistoryEntryState()[key];
}

/**
 * @description Stores a value on the current history entry. The URL stays as it
 * is, so the page does not re-render.
 */
export function writeHistoryEntryValue(key: string, value: unknown) {
	globalThis.history.replaceState(
		{ ...readHistoryEntryState(), [key]: value },
		''
	);
}

export function removeHistoryEntryValue(key: string) {
	const state = readHistoryEntryState();
	if (!(key in state)) {
		return;
	}
	globalThis.history.replaceState(
		Object.fromEntries(
			Object.entries(state).filter(([name]) => name !== key)
		),
		''
	);
}

/** @description Like `history.replaceState(null, '', url)`, but keeps the values stored on the entry. */
export function replaceHistoryEntryUrl(url: string) {
	const state = Object.fromEntries(
		Object.entries(readHistoryEntryState()).filter(
			([key]) => !NEXT_HISTORY_STATE_KEYS.has(key)
		)
	);
	globalThis.history.replaceState(state, '', url);
}
