import {
	type IDirtyQueueEntry,
	SYNC_SCHEMA_VERSION_MAP,
	type TSyncNamespace,
} from '@/lib/account/sync';
import { sha1 } from 'js-sha1';
import {
	ACCOUNT_STORAGE_KEY_MAP,
	createAccountStorageKey,
	getAccountStorageKeys,
	readAccountJsonStorage,
	removeAccountStorage,
	writeAccountJsonStorage,
} from './storage';
import {
	checkAccountSyncPaused,
	checkApplyingRemoteState,
} from './stateGuards';
import { createAccountClientId } from './random';

function sortJsonValue(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(sortJsonValue);
	}
	if (value !== null && typeof value === 'object') {
		return Object.keys(value)
			.sort()
			.reduce<Record<string, unknown>>((result, key) => {
				const object = value as Record<string, unknown>;
				if (object[key] !== undefined) {
					result[key] = sortJsonValue(object[key]);
				}
				return result;
			}, {});
	}

	return value;
}

function createSnapshotStableJson(data: unknown) {
	const sortedData = sortJsonValue(data);
	if (
		sortedData === undefined ||
		typeof sortedData === 'function' ||
		typeof sortedData === 'symbol'
	) {
		return 'undefined';
	}

	return JSON.stringify(sortedData);
}

function createSnapshotDigest(stableJson: string) {
	return `sha1:${sha1(stableJson)}`;
}

export function createSnapshotHash(data: unknown): string {
	return createSnapshotDigest(createSnapshotStableJson(data));
}

export function checkSnapshotHashMatches(
	data: unknown,
	snapshotHash: string | undefined
) {
	if (snapshotHash === undefined) {
		return false;
	}

	const stableJson = createSnapshotStableJson(data);

	return (
		snapshotHash === createSnapshotDigest(stableJson) ||
		snapshotHash === stableJson
	);
}

export function createDirtyQueueKey(userId: string, namespace: TSyncNamespace) {
	return createAccountStorageKey(
		ACCOUNT_STORAGE_KEY_MAP.dirtyQueue,
		userId,
		namespace
	);
}

export function readDirtyQueueEntry(userId: string, namespace: TSyncNamespace) {
	return readAccountJsonStorage<IDirtyQueueEntry | null>(
		createDirtyQueueKey(userId, namespace),
		null
	);
}

export function writeDirtyQueueEntry(userId: string, entry: IDirtyQueueEntry) {
	writeAccountJsonStorage(
		createDirtyQueueKey(userId, entry.namespace),
		entry
	);
}

function mergeDirtyQueueEntry(
	userId: string,
	entry: IDirtyQueueEntry
): IDirtyQueueEntry {
	const currentEntry = readDirtyQueueEntry(userId, entry.namespace);
	if (currentEntry?.paused === null) {
		return {
			...entry,
			attempts: currentEntry.attempts,
			baseRevision: currentEntry.baseRevision,
			clientMutationId: currentEntry.clientMutationId,
			dirtyAt: Math.max(currentEntry.dirtyAt, entry.dirtyAt),
		};
	}

	return entry;
}

export function removeDirtyQueueEntry(
	userId: string,
	namespace: TSyncNamespace
) {
	removeAccountStorage(createDirtyQueueKey(userId, namespace));
}

export function removeDirtyQueueEntries(userId: string) {
	const prefix = createAccountStorageKey(
		ACCOUNT_STORAGE_KEY_MAP.dirtyQueue,
		userId,
		''
	);

	getAccountStorageKeys(prefix).forEach(removeAccountStorage);
}

export function readDirtyQueueEntries(userId: string) {
	const prefix = createAccountStorageKey(
		ACCOUNT_STORAGE_KEY_MAP.dirtyQueue,
		userId,
		''
	);

	return getAccountStorageKeys(prefix)
		.map((key) =>
			readAccountJsonStorage<IDirtyQueueEntry | null>(key, null)
		)
		.filter((entry): entry is IDirtyQueueEntry => entry !== null);
}

export function markAccountSyncDirty({
	baseRevision,
	data,
	ignorePause = false,
	namespace,
	userId,
}: {
	baseRevision: number;
	data: unknown;
	ignorePause?: boolean;
	namespace: TSyncNamespace;
	userId: string;
}) {
	if (
		checkApplyingRemoteState() ||
		(!ignorePause && checkAccountSyncPaused())
	) {
		return null;
	}

	const now = Date.now();
	const entry = mergeDirtyQueueEntry(userId, {
		attempts: 0,
		baseRevision,
		clientMutationId: createAccountClientId(),
		conflict: null,
		data,
		dirtyAt: now,
		lastError: null,
		namespace,
		paused: null,
		schema_version: SYNC_SCHEMA_VERSION_MAP[namespace],
		snapshotHash: createSnapshotHash(data),
	});

	writeDirtyQueueEntry(userId, entry);

	return entry;
}

export function completeDirtyQueueEntryUpload({
	entry,
	nextBaseRevision,
	userId,
}: {
	entry: IDirtyQueueEntry;
	nextBaseRevision: number;
	userId: string;
}) {
	const currentEntry = readDirtyQueueEntry(userId, entry.namespace);

	if (currentEntry === null) {
		return 'removed' as const;
	}

	if (
		currentEntry.clientMutationId === entry.clientMutationId &&
		currentEntry.snapshotHash === entry.snapshotHash
	) {
		removeDirtyQueueEntry(userId, entry.namespace);
		return 'removed' as const;
	}

	if (currentEntry.paused === null) {
		writeDirtyQueueEntry(userId, {
			...currentEntry,
			baseRevision: nextBaseRevision,
			lastError: null,
		});
	}

	return 'kept-newer' as const;
}
