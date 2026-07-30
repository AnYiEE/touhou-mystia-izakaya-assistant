import { SYNC_NAMESPACE_MAP } from '@/domain/account/contracts';

import { createAccountClientId } from '@/features/account/client/clientId';
import { accountStore } from '@/features/account/client/state/accountStore';
import { globalPreferencesSerializer } from '@/features/account/sync/serializers/globalPreferences';
import type { TGlobalPreferencesSnapshot } from '@/features/account/sync/serializers/globalPreferencesContracts';
import { getSyncMergeAutomaticResolution } from '@/features/account/sync/serializers/utils';
import type {
	IAccountSyncBroadcastMessage,
	IDirtyQueueEntry,
	ISyncConflictItem,
	ISyncStateRecord,
} from '@/features/account/sync/types';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import { readAccountSyncBaseSnapshot } from './baseSnapshot';
import { postAccountSyncBroadcastMessage } from './broadcast';
import { getAccountSyncTabId } from './clientRuntime';
import { resolveAccountSyncConflict } from './conflict';
import { readAccountSyncConflictResolutionJournal } from './conflictResolutionJournal';
import { readDirtyQueueEntry } from './dirtyQueue/collisionEvidence';
import {
	checkSnapshotHashesEquivalent,
	createSnapshotHash,
} from './dirtyQueue/snapshotHash';
import { writeDirtyQueueEntryIfCurrent } from './dirtyQueue/storageTransition';
import { updatePausedConflictEntryIfCurrent } from './queue';
import { captureAccountSyncResetGeneration } from './resetGeneration';
import { checkCurrentAccountUser } from './sessionBoundary';
import { getAccountSyncSerializer } from './snapshot';
import { getAccountSyncLifecyclePort } from './syncLifecyclePort';
import {
	beginAccountSyncAutoResolution,
	checkAccountSyncAutoResolutionActive,
	endAccountSyncAutoResolution,
	upsertAccountSyncConflict,
} from './syncRuntimeState';

export const CONFLICT_HEARTBEAT_INTERVAL = 5 * 1000;

const AUTOMATIC_CONFLICT_REVEAL_DELAY = 5 * 1000;

export const REMOTE_CONFLICT_NOTICE_REASONS: ReadonlySet<
	IAccountSyncBroadcastMessage['runtimeReason']
> = new Set(['conflict-changed', 'conflict-created', 'conflict-heartbeat']);

export function setAccountSyncConflict(conflict: ISyncConflictItem) {
	upsertAccountSyncConflict(conflict);
}

function normalizeGlobalPreferencesDonationModal(
	data: TGlobalPreferencesSnapshot,
	donationModal: TGlobalPreferencesSnapshot['donationModal']
) {
	return { ...data, donationModal };
}

function getDonationOnlyAutomaticConflict(
	conflict: ISyncConflictItem
): {
	conflict: ISyncConflictItem<TGlobalPreferencesSnapshot>;
	resolution: 'cloud' | 'merged';
} | null {
	if (
		conflict.namespace !== SYNC_NAMESPACE_MAP.globalPreferences ||
		conflict.localCollision !== undefined
	) {
		return null;
	}

	let cloud: TGlobalPreferencesSnapshot;
	let local: TGlobalPreferencesSnapshot;
	try {
		cloud = globalPreferencesSerializer.deserialize(conflict.cloud);
		local = globalPreferencesSerializer.deserialize(conflict.local);
	} catch {
		return null;
	}

	const normalizedLocal = normalizeGlobalPreferencesDonationModal(
		local,
		cloud.donationModal
	);
	if (createSnapshotHash(normalizedLocal) !== createSnapshotHash(cloud)) {
		return null;
	}
	const mergeResult = globalPreferencesSerializer.merge({
		base: null,
		cloud,
		local,
		namespace: SYNC_NAMESPACE_MAP.globalPreferences,
	});
	const resolution = getSyncMergeAutomaticResolution(mergeResult, cloud);
	if (resolution === null) {
		return null;
	}

	return {
		conflict: {
			cloud,
			local,
			merged: mergeResult.data,
			namespace: conflict.namespace,
			revision: conflict.revision,
			userId: conflict.userId,
		},
		resolution,
	};
}

function checkConflictSnapshotsEqual(
	left: ISyncConflictItem | null,
	right: ISyncConflictItem
) {
	return (
		left !== null &&
		left.revision === right.revision &&
		createSnapshotHash(left.cloud) === createSnapshotHash(right.cloud) &&
		createSnapshotHash(left.local) === createSnapshotHash(right.local) &&
		createSnapshotHash(left.merged) === createSnapshotHash(right.merged)
	);
}

function exposeAutomaticConflictForUser(
	conflict: ISyncConflictItem,
	userId: string
) {
	const visibleConflict = { ...conflict };
	delete visibleConflict.automaticResolution;
	const entry = readDirtyQueueEntry(userId, conflict.namespace);
	if (
		entry?.paused !== 'conflict' ||
		entry.conflict === null ||
		(entry.conflict.automaticResolution !== undefined &&
			entry.conflict.automaticResolution !==
				conflict.automaticResolution) ||
		!checkConflictSnapshotsEqual(entry.conflict, conflict)
	) {
		return false;
	}
	let mutationId = entry.clientMutationId;
	if (
		entry.conflict.automaticResolution !== undefined &&
		readAccountSyncConflictResolutionJournal(userId, conflict.namespace) ===
			null
	) {
		const nextEntry = updatePausedConflictEntryIfCurrent({
			conflict: visibleConflict,
			data: entry.data,
			expectedEntry: entry,
			generationToken: captureAccountSyncResetGeneration(userId),
			userId,
		});
		if (nextEntry === null) {
			return false;
		}
		mutationId = nextEntry.clientMutationId;
	}
	upsertAccountSyncConflict(visibleConflict);
	const user = accountStore.shared.user.get();
	if (user?.id === userId) {
		void postAccountSyncBroadcastMessage({
			namespaces: [conflict.namespace],
			operationId: createAccountClientId(),
			runtimeMutationId: mutationId,
			runtimeReason: 'conflict-created',
			state_epoch: user.state_epoch,
			tabId: getAccountSyncTabId(),
			type: 'dirty',
			userId,
		});
	}
	return true;
}

function tryResolveStoredAutomaticConflict(
	conflict: ISyncConflictItem,
	userId: string,
	generationToken?: string | null
) {
	const resolution = conflict.automaticResolution;
	if (resolution === undefined) {
		return false;
	}
	if (checkAccountSyncAutoResolutionActive(userId, conflict.namespace)) {
		return true;
	}
	if (!beginAccountSyncAutoResolution(userId, conflict.namespace)) {
		return false;
	}

	void resolveAccountSyncConflict({
		conflict,
		...(generationToken === undefined ? {} : { generationToken }),
		resolution,
		userId,
	})
		.then((didResolve) => {
			if (didResolve) {
				if (resolution === 'merged') {
					getAccountSyncLifecyclePort().scheduleFlush();
				}
				return;
			}
			if (!checkCurrentAccountUser(userId)) {
				return;
			}
			setTimeout(() => {
				if (checkCurrentAccountUser(userId)) {
					exposeAutomaticConflictForUser(conflict, userId);
				}
			}, AUTOMATIC_CONFLICT_REVEAL_DELAY);
		})
		.catch((error: unknown) => {
			if (!checkCurrentAccountUser(userId)) {
				return;
			}
			console.warn('Failed to apply automatic account sync resolution.', {
				errorCode: getLogSafeErrorCode(error),
			});
			accountStore.shared.sync.lastError.set(
				'conflict-auto-resolution-failed'
			);
			exposeAutomaticConflictForUser(conflict, userId);
		})
		.finally(() => {
			endAccountSyncAutoResolution(userId, conflict.namespace);
		});

	return true;
}

function tryResolveDonationOnlyConflict(
	conflict: ISyncConflictItem,
	userId: string
) {
	const automaticConflict = getDonationOnlyAutomaticConflict(conflict);
	const entry = readDirtyQueueEntry(userId, conflict.namespace);
	if (
		automaticConflict === null ||
		!checkCurrentAccountUser(userId) ||
		entry?.paused !== 'conflict' ||
		entry.conflict === null ||
		!checkConflictSnapshotsEqual(entry.conflict, conflict)
	) {
		return false;
	}
	const generationToken = captureAccountSyncResetGeneration(userId);
	const nextConflict = {
		...automaticConflict.conflict,
		automaticResolution: automaticConflict.resolution,
	};
	const nextEntry = updatePausedConflictEntryIfCurrent({
		conflict: nextConflict,
		data: nextConflict.local,
		expectedEntry: entry,
		generationToken,
		userId,
	});
	if (nextEntry === null) {
		return false;
	}

	return tryResolveStoredAutomaticConflict(
		nextConflict,
		userId,
		generationToken
	);
}

function normalizeRestoredAccountSyncConflict(conflict: ISyncConflictItem) {
	const serializer = getAccountSyncSerializer(conflict.namespace);

	return {
		...conflict,
		cloud: serializer.deserialize(conflict.cloud),
		local: serializer.deserialize(conflict.local),
		merged:
			conflict.merged === null
				? null
				: serializer.deserialize(conflict.merged),
	} satisfies ISyncConflictItem;
}

export function restoreAccountSyncConflict(
	conflict: ISyncConflictItem,
	userId: string
) {
	if (tryResolveStoredAutomaticConflict(conflict, userId)) {
		return null;
	}
	if (tryResolveDonationOnlyConflict(conflict, userId)) {
		return null;
	}

	try {
		return normalizeRestoredAccountSyncConflict(conflict);
	} catch (error) {
		console.warn('Failed to restore paused account sync conflict.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return null;
	}
}

export function mergeConflictFromDirtyEntry({
	entry,
	record,
	userId,
}: {
	entry: IDirtyQueueEntry;
	record: ISyncStateRecord | null;
	userId: string;
}) {
	const serializer = getAccountSyncSerializer(entry.namespace);
	const cloud =
		record === null
			? null
			: serializer.migrate(record.data, record.schema_version);
	const local = serializer.migrate(entry.data, entry.schema_version);
	const storedBase = readAccountSyncBaseSnapshot(
		userId,
		entry.namespace,
		entry.baseRevision,
		serializer
	);
	const base = storedBase?.data ?? null;
	const mergeResult = serializer.merge({
		base,
		cloud,
		local,
		namespace: entry.namespace,
	});

	const conflict =
		mergeResult.conflict === null
			? ({
					cloud: cloud ?? serializer.getDefaultSnapshot(),
					local,
					merged: mergeResult.data,
					namespace: entry.namespace,
					revision: record?.revision ?? 0,
					userId,
				} satisfies ISyncConflictItem)
			: {
					...mergeResult.conflict,
					revision: record?.revision ?? 0,
					userId,
				};

	return { cloud, conflict, mergeResult, serializer };
}

export function pauseDirtyEntryWithConflict({
	allowMissing = false,
	conflict,
	entry,
	generationToken,
	incrementAttempts = false,
	userId,
}: {
	allowMissing?: boolean;
	conflict: ISyncConflictItem;
	entry: IDirtyQueueEntry;
	generationToken: string | null;
	incrementAttempts?: boolean;
	userId: string;
}) {
	const currentEntry = readDirtyQueueEntry(userId, entry.namespace);
	const isCurrentEntryMatch =
		currentEntry?.clientMutationId === entry.clientMutationId &&
		checkSnapshotHashesEquivalent(currentEntry, entry);
	if (!isCurrentEntryMatch && !(allowMissing && currentEntry === null)) {
		return false;
	}

	const entryToPause = currentEntry ?? entry;
	const hasConflictChanged =
		entryToPause.paused !== 'conflict' ||
		entryToPause.conflict?.automaticResolution !==
			conflict.automaticResolution ||
		!checkConflictSnapshotsEqual(entryToPause.conflict, conflict);
	const nextEntry = {
		...entryToPause,
		attempts: entryToPause.attempts + (incrementAttempts ? 1 : 0),
		clientMutationId: hasConflictChanged
			? createAccountClientId()
			: entryToPause.clientMutationId,
		conflict,
		data: conflict.local,
		dirtyAt: hasConflictChanged ? Date.now() : entryToPause.dirtyAt,
		lastError: 'conflict',
		paused: 'conflict',
		snapshotHash: createSnapshotHash(conflict.local),
	} satisfies IDirtyQueueEntry;
	if (
		!writeDirtyQueueEntryIfCurrent({
			expectedEntry: currentEntry,
			generationToken,
			nextEntry,
			userId,
		})
	) {
		return false;
	}
	setAccountSyncConflict(conflict);
	const user = accountStore.shared.user.get();
	if (user?.id === userId) {
		void postAccountSyncBroadcastMessage({
			namespaces: [entry.namespace],
			operationId: createAccountClientId(),
			runtimeMutationId: nextEntry.clientMutationId,
			runtimeReason:
				conflict.automaticResolution === undefined
					? 'conflict-created'
					: 'queue-changed',
			state_epoch: user.state_epoch,
			tabId: getAccountSyncTabId(),
			type: 'dirty',
			userId,
		});
	}

	return nextEntry;
}

export function routePausedConflictMergeResult({
	cloud,
	deferredAutoResolutions,
	entry,
	generationToken,
	local,
	mergeResult,
	record,
	userId,
}: {
	cloud: unknown;
	deferredAutoResolutions?: Array<() => void>;
	entry: IDirtyQueueEntry;
	generationToken: string | null;
	local: unknown;
	mergeResult: ReturnType<
		ReturnType<typeof getAccountSyncSerializer>['merge']
	>;
	record: ISyncStateRecord | undefined;
	userId: string;
}) {
	const automaticResolution = getSyncMergeAutomaticResolution(
		mergeResult,
		cloud
	);
	const conflictCloud =
		cloud ?? getAccountSyncSerializer(entry.namespace).getDefaultSnapshot();
	const conflict =
		mergeResult.conflict === null
			? {
					...(automaticResolution === null
						? {}
						: { automaticResolution }),
					cloud: conflictCloud,
					local,
					merged: mergeResult.data,
					namespace: entry.namespace,
					revision: record?.revision ?? 0,
					userId,
				}
			: {
					...mergeResult.conflict,
					revision: record?.revision ?? 0,
					userId,
				};
	const pausedEntry = pauseDirtyEntryWithConflict({
		conflict,
		entry,
		generationToken,
		userId,
	});
	if (pausedEntry === false) {
		return false;
	}
	if (automaticResolution === null) {
		return true;
	}

	const resolveAutomatically = () => {
		tryResolveStoredAutomaticConflict(conflict, userId, generationToken);
	};
	if (deferredAutoResolutions === undefined) {
		resolveAutomatically();
	} else {
		deferredAutoResolutions.push(resolveAutomatically);
	}

	return true;
}
