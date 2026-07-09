import { sha1 } from 'js-sha1';

import {
	ACCOUNT_STORAGE_KEY_MAP,
	createAccountStorageKey,
	getAccountStorageKeys,
	readAccountJsonStorage,
	removeAccountStorage,
	writeAccountJsonStorage,
} from './storage';
import { checkApplyingRemoteState } from './stateGuards';
import { createAccountClientId } from './random';
import {
	type IDirtyQueueEntry,
	type ISyncConflictItem,
	SYNC_NAMESPACE_MAP,
	SYNC_SCHEMA_VERSION_MAP,
	type TSyncNamespace,
	type TSyncPausedReason,
	checkSupportedSyncSchemaVersion,
} from '@/lib/account/sync';
import {
	isNonNegativeSafeInteger,
	isPlainObject,
} from '@/lib/account/sync/serializers/utils';

const SYNC_NAMESPACE_SET = new Set<TSyncNamespace>(
	Object.values(SYNC_NAMESPACE_MAP)
);
const SYNC_PAUSED_REASON_SET = new Set<TSyncPausedReason | null>([
	null,
	'applying-remote',
	'bootstrap',
	'conflict',
	'delete-data',
	'importing-backup',
]);

function checkSyncRevision(value: unknown): value is number {
	return isNonNegativeSafeInteger(value) && value < Number.MAX_SAFE_INTEGER;
}

function checkSyncNamespace(value: unknown): value is TSyncNamespace {
	return (
		typeof value === 'string' &&
		SYNC_NAMESPACE_SET.has(value as TSyncNamespace)
	);
}

function checkDirtyQueueConflict(
	value: unknown,
	namespace: TSyncNamespace,
	userId: string
): value is ISyncConflictItem {
	return (
		isPlainObject(value) &&
		'cloud' in value &&
		'local' in value &&
		'merged' in value &&
		value['namespace'] === namespace &&
		checkSyncRevision(value['revision']) &&
		value['userId'] === userId
	);
}

function readDirtyQueueNamespaceFromKey(
	key: string,
	prefix: string
): TSyncNamespace | null {
	const namespace = key.slice(prefix.length);

	return checkSyncNamespace(namespace) ? namespace : null;
}

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

export function checkSnapshotHashesEquivalent(
	currentEntry: IDirtyQueueEntry,
	entry: IDirtyQueueEntry
) {
	return (
		checkSnapshotHashMatches(currentEntry.data, entry.snapshotHash) &&
		checkSnapshotHashMatches(entry.data, currentEntry.snapshotHash)
	);
}

function sanitizeDirtyQueueEntry({
	entry,
	key,
	namespace,
	userId,
}: {
	entry: unknown;
	key: string;
	namespace: TSyncNamespace;
	userId: string;
}) {
	if (
		!isPlainObject(entry) ||
		!('data' in entry) ||
		entry['namespace'] !== namespace ||
		!checkSupportedSyncSchemaVersion(namespace, entry['schema_version']) ||
		!isNonNegativeSafeInteger(entry['attempts']) ||
		!checkSyncRevision(entry['baseRevision']) ||
		!isNonNegativeSafeInteger(entry['dirtyAt']) ||
		typeof entry['clientMutationId'] !== 'string' ||
		entry['clientMutationId'] === '' ||
		typeof entry['snapshotHash'] !== 'string' ||
		entry['snapshotHash'] === '' ||
		(entry['lastError'] !== null &&
			typeof entry['lastError'] !== 'string') ||
		!SYNC_PAUSED_REASON_SET.has(entry['paused'] as TSyncPausedReason | null)
	) {
		removeAccountStorage(key);
		return null;
	}
	if (!checkSnapshotHashMatches(entry['data'], entry['snapshotHash'])) {
		removeAccountStorage(key);
		return null;
	}

	if (entry['paused'] === 'conflict') {
		if (!checkDirtyQueueConflict(entry['conflict'], namespace, userId)) {
			removeAccountStorage(key);
			return null;
		}
	} else if (entry['conflict'] !== null) {
		removeAccountStorage(key);
		return null;
	}

	return entry as unknown as IDirtyQueueEntry;
}

export function createDirtyQueueKey(userId: string, namespace: TSyncNamespace) {
	return createAccountStorageKey(
		ACCOUNT_STORAGE_KEY_MAP.dirtyQueue,
		userId,
		namespace
	);
}

export function readDirtyQueueEntry(userId: string, namespace: TSyncNamespace) {
	const key = createDirtyQueueKey(userId, namespace);
	const entry = readAccountJsonStorage<unknown>(key, null);

	return sanitizeDirtyQueueEntry({ entry, key, namespace, userId });
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
		.map((key) => {
			const namespace = readDirtyQueueNamespaceFromKey(key, prefix);
			if (namespace === null) {
				removeAccountStorage(key);
				return null;
			}

			return sanitizeDirtyQueueEntry({
				entry: readAccountJsonStorage<unknown>(key, null),
				key,
				namespace,
				userId,
			});
		})
		.filter((entry): entry is IDirtyQueueEntry => entry !== null);
}

export function markAccountSyncDirty({
	baseRevision,
	data,
	namespace,
	userId,
}: {
	baseRevision: number;
	data: unknown;
	namespace: TSyncNamespace;
	userId: string;
}) {
	if (!checkSyncRevision(baseRevision)) {
		throw new Error('invalid-base-revision');
	}
	if (checkApplyingRemoteState()) {
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
	if (!checkSyncRevision(nextBaseRevision)) {
		throw new Error('invalid-next-base-revision');
	}

	const currentEntry = readDirtyQueueEntry(userId, entry.namespace);

	if (currentEntry === null) {
		return 'removed' as const;
	}

	if (
		currentEntry.clientMutationId === entry.clientMutationId &&
		checkSnapshotHashesEquivalent(currentEntry, entry)
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
