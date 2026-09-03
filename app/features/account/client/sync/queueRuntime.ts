import { accountStore } from '@/features/account/client/state/accountStore';
import { SYNC_SCHEMA_VERSION_MAP } from '@/features/account/sync/constants';
import { normalizeSyncStateData } from '@/features/account/sync/normalizeSyncStateData';
import type { IDirtyQueueEntry } from '@/features/account/sync/types';

import {
	readDirtyQueueEntries,
	readDirtyQueueEntry,
	readIsolatedDirtyQueueNamespaces,
} from './dirtyQueue/collisionEvidence';
import { migrateDirtyQueueEntrySchema } from './dirtyQueue/migrateEntrySchema';
import {
	checkSnapshotHashesEquivalent,
	createSnapshotHash,
} from './dirtyQueue/snapshotHash';
import { writeDirtyQueueEntryIfCurrent } from './dirtyQueue/storageTransition';
import {
	TERMINAL_SYNC_ERROR_PRECEDENCE,
	checkDirtyQueueEntryTerminalError,
} from './queue';
import {
	captureAccountSyncResetGeneration,
	checkAccountSyncResetPrepared,
} from './resetGeneration';
import { checkCurrentAccountUser } from './sessionBoundary';
import { getAccountSyncSerializer } from './snapshot';

export function updatePendingCount(entries?: IDirtyQueueEntry[]) {
	const user = accountStore.shared.user.get();
	const pendingEntries =
		entries ?? (user === null ? [] : readDirtyQueueEntries(user.id));
	const isolatedNamespaces = new Set(
		user === null ? [] : readIsolatedDirtyQueueNamespaces(user.id)
	);

	accountStore.shared.sync.pendingCount.set(
		pendingEntries.filter(
			(entry) =>
				entry.paused === null &&
				!isolatedNamespaces.has(entry.namespace) &&
				!checkDirtyQueueEntryTerminalError(entry)
		).length
	);
	accountStore.shared.sync.queueRevision.set(
		accountStore.shared.sync.queueRevision.get() + 1
	);
}

function createMigratedDirtyQueueEntry({
	entry,
}: {
	entry: IDirtyQueueEntry;
}): IDirtyQueueEntry {
	const schemaVersion = SYNC_SCHEMA_VERSION_MAP[entry.namespace];
	if (entry.schema_version >= schemaVersion) {
		return entry;
	}

	try {
		const serializer = getAccountSyncSerializer(entry.namespace);
		return {
			...migrateDirtyQueueEntrySchema({
				entry,
				serializer,
				targetSchemaVersion: schemaVersion,
			}),
			...(entry.lastError === 'sync-schema-update-required'
				? { attempts: 0, lastError: null }
				: {}),
		} satisfies IDirtyQueueEntry;
	} catch {
		return entry;
	}
}

export function readMigratedDirtyQueueEntries(
	userId: string,
	generationToken: string | null
) {
	return readDirtyQueueEntries(userId)
		.map((entry) => {
			const normalized = normalizeSyncStateData({
				data: entry.data,
				namespace: entry.namespace,
				revision: entry.baseRevision,
				schema_version: entry.schema_version,
			});

			if (normalized.status !== 'accepted') {
				return entry;
			}

			const migratedEntry = createMigratedDirtyQueueEntry({ entry });

			const migratedNormalized = normalizeSyncStateData({
				data: migratedEntry.data,
				namespace: migratedEntry.namespace,
				revision: migratedEntry.baseRevision,
				schema_version: migratedEntry.schema_version,
			});

			if (migratedNormalized.status === 'accepted') {
				const nextEntry = {
					...migratedEntry,
					data: migratedNormalized.data,
					schema_version: migratedNormalized.schema_version,
					snapshotHash: createSnapshotHash(migratedNormalized.data),
				} satisfies IDirtyQueueEntry;
				if (
					migratedEntry === entry &&
					createSnapshotHash(nextEntry.data) ===
						createSnapshotHash(migratedEntry.data) &&
					nextEntry.schema_version === migratedEntry.schema_version
				) {
					return migratedEntry;
				}
				return writeDirtyQueueEntryIfCurrent({
					expectedEntry: entry,
					generationToken,
					nextEntry,
					userId,
				})
					? nextEntry
					: readDirtyQueueEntry(userId, entry.namespace);
			}

			return migratedEntry;
		})
		.filter((entry): entry is IDirtyQueueEntry => entry !== null);
}

export function getFlushableEntries(
	userId: string,
	generationToken: string | null
) {
	if (checkAccountSyncResetPrepared(userId)) {
		return [];
	}
	const entries = readMigratedDirtyQueueEntries(userId, generationToken);
	const isolatedNamespaces = new Set(
		readIsolatedDirtyQueueNamespaces(userId)
	);
	return entries.filter(
		(entry) =>
			entry.paused === null &&
			!isolatedNamespaces.has(entry.namespace) &&
			!checkDirtyQueueEntryTerminalError(entry)
	);
}

export function recordAccountSyncRefreshSuccess({
	unresolvedReason = null,
	userId,
}: {
	unresolvedReason?: string | null;
	userId: string;
}) {
	if (!checkCurrentAccountUser(userId)) {
		return false;
	}
	// Synchronous runtime-status boundary.
	const generationToken = captureAccountSyncResetGeneration(userId);
	const allEntries = readMigratedDirtyQueueEntries(userId, generationToken);
	const hasPendingUploads =
		getFlushableEntries(userId, generationToken).length > 0;
	const durableTerminalError =
		TERMINAL_SYNC_ERROR_PRECEDENCE.find((message) =>
			allEntries.some((entry) => entry.lastError === message)
		) ?? null;
	const hasCurrentUserConflict = accountStore.shared.sync.conflicts
		.get()
		.some((conflict) => conflict.userId === userId);
	const hasIsolatedState =
		durableTerminalError === 'sync-schema-update-required' ||
		readIsolatedDirtyQueueNamespaces(userId).length > 0;
	const effectiveError = hasCurrentUserConflict
		? 'conflict'
		: (durableTerminalError ?? unresolvedReason);
	const hasPartialResult =
		effectiveError !== null ||
		hasPendingUploads ||
		hasCurrentUserConflict ||
		hasIsolatedState;

	accountStore.shared.sync.canRetry.set(false);
	accountStore.shared.sync.failedAttempts.set(0);
	accountStore.shared.sync.hasIsolatedState.set(hasIsolatedState);
	accountStore.shared.sync.lastError.set(effectiveError);
	accountStore.shared.sync.lastResult.set(
		hasIsolatedState ? 'failed' : hasPartialResult ? 'partial' : 'success'
	);
	accountStore.shared.sync.lastSyncedAt.set(Date.now());

	return true;
}

export function checkFlushEntriesStillCurrent(
	userId: string,
	entries: IDirtyQueueEntry[]
) {
	const entriesMatch = entries.every((entry) => {
		const currentEntry = readDirtyQueueEntry(userId, entry.namespace);

		return (
			currentEntry !== null &&
			currentEntry.paused === null &&
			currentEntry.clientMutationId === entry.clientMutationId &&
			checkSnapshotHashesEquivalent(currentEntry, entry)
		);
	});
	if (!entriesMatch) {
		return false;
	}
	const isolatedNamespaces = new Set(
		readIsolatedDirtyQueueNamespaces(userId)
	);
	return entries.every((entry) => !isolatedNamespaces.has(entry.namespace));
}
