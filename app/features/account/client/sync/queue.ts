import { type TSyncNamespace } from '@/domain/account/contracts';

import { createAccountClientId } from '@/features/account/client/clientId';
import { SYNC_SCHEMA_VERSION_MAP } from '@/features/account/sync/constants';
import type {
	IDirtyQueueEntry,
	ISyncConflictItem,
	TSyncPausedReason,
} from '@/features/account/sync/types';

import { canIncrementNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';

import {
	readDirtyQueueEntries,
	readDirtyQueueEntry,
} from './dirtyQueue/collisionEvidence';
import {
	checkSnapshotHashMatches,
	checkSnapshotHashesEquivalent,
	createSnapshotHash,
} from './dirtyQueue/snapshotHash';
import {
	removeDirtyQueueEntryIfCurrent,
	writeDirtyQueueEntryIfCurrent,
} from './dirtyQueue/storageTransition';
import { checkSyncRevision } from './dirtyQueue/validation';
import { captureAccountSyncResetGeneration } from './resetGeneration';
import { checkApplyingRemoteState } from './stateGuards';

export const TERMINAL_SYNC_ERROR_PRECEDENCE = [
	'sync-schema-update-required',
	'sync-account-capacity-exceeded',
	'sync-request-too-large',
] as const;

const TERMINAL_SYNC_ERROR_SET = new Set<string>(TERMINAL_SYNC_ERROR_PRECEDENCE);

function mergeDirtyQueueEntry(
	userId: string,
	entry: IDirtyQueueEntry,
	replacePausedEntry: boolean
): { currentEntry: IDirtyQueueEntry | null; entry: IDirtyQueueEntry } {
	const currentEntry = readDirtyQueueEntry(userId, entry.namespace);
	if (currentEntry?.paused && !replacePausedEntry) {
		return { currentEntry, entry: currentEntry };
	}

	if (currentEntry?.paused === null) {
		return {
			currentEntry,
			entry: {
				...entry,
				attempts: currentEntry.attempts,
				baseRevision: currentEntry.baseRevision,
				clientMutationId: currentEntry.clientMutationId,
				dirtyAt: Math.max(currentEntry.dirtyAt, entry.dirtyAt),
			},
		};
	}

	return { currentEntry, entry };
}

export function markAccountSyncDirty({
	baseRevision,
	data,
	generationToken,
	namespace,
	paused = null,
	replacePausedEntry = false,
	resetOperationId,
	userId,
}: {
	baseRevision: number;
	data: unknown;
	generationToken: string | null;
	namespace: TSyncNamespace;
	paused?: Exclude<TSyncPausedReason, 'conflict'> | null;
	replacePausedEntry?: boolean;
	resetOperationId?: string;
	userId: string;
}) {
	if (!checkSyncRevision(baseRevision)) {
		throw new Error('invalid-base-revision');
	}
	if (checkApplyingRemoteState()) {
		return null;
	}

	const now = Date.now();
	const { currentEntry, entry } = mergeDirtyQueueEntry(
		userId,
		{
			attempts: 0,
			baseRevision,
			clientMutationId: createAccountClientId(),
			conflict: null,
			data,
			dirtyAt: now,
			lastError: null,
			namespace,
			paused,
			schema_version: SYNC_SCHEMA_VERSION_MAP[namespace],
			snapshotHash: createSnapshotHash(data),
		},
		replacePausedEntry
	);

	if (entry === currentEntry) {
		return entry;
	}
	if (
		!writeDirtyQueueEntryIfCurrent({
			expectedEntry: currentEntry,
			generationToken,
			nextEntry: entry,
			...(resetOperationId === undefined ? {} : { resetOperationId }),
			userId,
		})
	) {
		return null;
	}

	return entry;
}

export function completeDirtyQueueEntryUpload({
	entry,
	generationToken,
	nextBaseRevision,
	userId,
}: {
	entry: IDirtyQueueEntry;
	generationToken: string | null;
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
		return removeDirtyQueueEntryIfCurrent({
			expectedEntry: currentEntry,
			generationToken,
			userId,
		})
			? ('removed' as const)
			: ('kept-newer' as const);
	}

	if (currentEntry.paused === null) {
		writeDirtyQueueEntryIfCurrent({
			expectedEntry: currentEntry,
			generationToken,
			nextEntry: {
				...currentEntry,
				baseRevision: nextBaseRevision,
				lastError: null,
			},
			userId,
		});
	}

	return 'kept-newer' as const;
}

function readMatchingPausedConflictEntry(
	userId: string,
	expectedEntry: IDirtyQueueEntry
) {
	const currentEntry = readDirtyQueueEntry(userId, expectedEntry.namespace);
	if (
		currentEntry?.paused !== 'conflict' ||
		currentEntry.conflict === null ||
		currentEntry.clientMutationId !== expectedEntry.clientMutationId ||
		!checkSnapshotHashesEquivalent(currentEntry, expectedEntry)
	) {
		return null;
	}

	return currentEntry;
}

export function removePausedConflictEntryIfCurrent({
	expectedEntry,
	generationToken,
	userId,
}: {
	expectedEntry: IDirtyQueueEntry;
	generationToken: string | null;
	userId: string;
}) {
	const currentEntry = readMatchingPausedConflictEntry(userId, expectedEntry);
	if (currentEntry === null) {
		return false;
	}

	return removeDirtyQueueEntryIfCurrent({
		expectedEntry: currentEntry,
		generationToken,
		userId,
	});
}

export function updatePausedConflictEntryIfCurrent({
	conflict,
	data,
	expectedEntry,
	generationToken,
	userId,
}: {
	conflict: ISyncConflictItem;
	data: unknown;
	expectedEntry: IDirtyQueueEntry;
	generationToken: string | null;
	userId: string;
}) {
	const currentEntry = readMatchingPausedConflictEntry(userId, expectedEntry);
	if (
		currentEntry?.namespace !== conflict.namespace ||
		conflict.userId !== userId ||
		!checkSnapshotHashMatches(data, createSnapshotHash(conflict.local))
	) {
		return null;
	}

	const nextEntry = {
		...currentEntry,
		clientMutationId: createAccountClientId(),
		conflict,
		data,
		dirtyAt: Date.now(),
		lastError: 'conflict',
		paused: 'conflict' as const,
		schema_version: SYNC_SCHEMA_VERSION_MAP[currentEntry.namespace],
		snapshotHash: createSnapshotHash(data),
	};
	if (
		!writeDirtyQueueEntryIfCurrent({
			expectedEntry: currentEntry,
			generationToken,
			nextEntry,
			userId,
		})
	) {
		return null;
	}

	return nextEntry;
}

export function replacePausedConflictWithDirtyIfCurrent({
	baseRevision,
	clientMutationId = createAccountClientId(),
	data,
	expectedEntry,
	generationToken,
	userId,
}: {
	baseRevision: number;
	clientMutationId?: string;
	data: unknown;
	expectedEntry: IDirtyQueueEntry;
	generationToken: string | null;
	userId: string;
}) {
	if (!checkSyncRevision(baseRevision)) {
		throw new Error('invalid-base-revision');
	}

	const currentEntry = readMatchingPausedConflictEntry(userId, expectedEntry);
	if (currentEntry === null) {
		return null;
	}

	const nextEntry = {
		...currentEntry,
		attempts: 0,
		baseRevision,
		clientMutationId,
		conflict: null,
		data,
		dirtyAt: Date.now(),
		lastError: null,
		paused: null,
		schema_version: SYNC_SCHEMA_VERSION_MAP[currentEntry.namespace],
		snapshotHash: createSnapshotHash(data),
	};

	if (
		!writeDirtyQueueEntryIfCurrent({
			expectedEntry: currentEntry,
			generationToken,
			nextEntry,
			operationId: `queue-${clientMutationId}`,
			userId,
		})
	) {
		return null;
	}

	return nextEntry;
}

export function setDirtyQueueEntryError({
	entry,
	generationToken,
	message,
	userId,
}: {
	entry: IDirtyQueueEntry;
	generationToken: string | null;
	message: string;
	userId: string;
}) {
	const currentEntry = readDirtyQueueEntry(userId, entry.namespace);
	if (
		currentEntry?.clientMutationId !== entry.clientMutationId ||
		!checkSnapshotHashesEquivalent(currentEntry, entry)
	) {
		return false;
	}

	return writeDirtyQueueEntryIfCurrent({
		expectedEntry: currentEntry,
		generationToken,
		nextEntry: {
			...currentEntry,
			attempts: canIncrementNonNegativeSafeInteger(currentEntry.attempts)
				? currentEntry.attempts + 1
				: currentEntry.attempts,
			lastError: message,
		},
		userId,
	});
}

export function checkDirtyQueueEntryTerminalError(entry: IDirtyQueueEntry) {
	return (
		entry.lastError !== null && TERMINAL_SYNC_ERROR_SET.has(entry.lastError)
	);
}

export function clearTerminalDirtyQueueEntryErrors(userId: string) {
	// Synchronous user action boundary: every transition shares one token.
	const generationToken = captureAccountSyncResetGeneration(userId);
	let clearedCount = 0;

	for (const entry of readDirtyQueueEntries(userId)) {
		if (!checkDirtyQueueEntryTerminalError(entry)) {
			continue;
		}
		if (
			writeDirtyQueueEntryIfCurrent({
				expectedEntry: entry,
				generationToken,
				nextEntry: { ...entry, attempts: 0, lastError: null },
				userId,
			})
		) {
			clearedCount += 1;
		}
	}

	return clearedCount;
}
