import { SYNC_NAMESPACE_MAP } from '@/domain/account/contracts';

import {
	readRetainedAccountSyncBaseSnapshot,
	removeAccountSyncBaseSnapshot,
} from '@/features/account/client/sync/baseSnapshot';
import {
	readAccountSyncConflictResolutionJournal,
	removeAccountSyncConflictResolutionJournal,
} from '@/features/account/client/sync/conflictResolutionJournal';
import { readDirtyQueueEntry } from '@/features/account/client/sync/dirtyQueue/collisionEvidence';
import { removeDirtyQueueEntryIfCurrent } from '@/features/account/client/sync/dirtyQueue/storageTransition';
import { removeAccountSyncLease } from '@/features/account/client/sync/lease';
import {
	captureAccountSyncResetGeneration,
	readAccountSyncResetGeneration,
} from '@/features/account/client/sync/resetGeneration';
import { clearAccountSyncResetRecoveries } from '@/features/account/client/sync/resetRecoveryState';
import {
	getAccountSyncSerializer,
	removeAccountSyncMetaIfCurrentVersion,
} from '@/features/account/client/sync/snapshot';
import { removeAccountSyncOperation } from '@/features/account/client/sync/syncOperationLease';
import { clearAccountSyncRuntimeConflicts } from '@/features/account/client/sync/syncRuntimeState';

export function releaseAccountWorkspaceMetadata(userId: string) {
	const generationToken = captureAccountSyncResetGeneration(userId);
	const resetGeneration = readAccountSyncResetGeneration(userId);
	const deletedOperationId =
		resetGeneration.status === 'current' &&
		resetGeneration.marker.phase === 'deleted'
			? resetGeneration.marker.operationId
			: undefined;
	let didReleaseAllCurrentMetadata = true;
	for (const namespace of Object.values(SYNC_NAMESPACE_MAP)) {
		const serializer = getAccountSyncSerializer(namespace);
		const dirtyEntry = readDirtyQueueEntry(userId, namespace);
		if (dirtyEntry !== null) {
			didReleaseAllCurrentMetadata =
				removeDirtyQueueEntryIfCurrent({
					...(deletedOperationId === undefined
						? {}
						: { deletedOperationId }),
					expectedEntry: dirtyEntry,
					generationToken,
					userId,
				}) && didReleaseAllCurrentMetadata;
		}

		const baseSnapshot = readRetainedAccountSyncBaseSnapshot(
			userId,
			namespace,
			undefined,
			serializer
		);
		if (baseSnapshot !== null) {
			didReleaseAllCurrentMetadata =
				removeAccountSyncBaseSnapshot(
					userId,
					namespace,
					generationToken,
					undefined,
					deletedOperationId
				) && didReleaseAllCurrentMetadata;
		}

		const journal = readAccountSyncConflictResolutionJournal(
			userId,
			namespace
		);
		if (journal?.status === 'current') {
			didReleaseAllCurrentMetadata =
				removeAccountSyncConflictResolutionJournal({
					...(deletedOperationId === undefined
						? {}
						: { deletedOperationId }),
					generationToken,
					namespace,
					operationId: journal.journal.operationId,
					userId,
				}) && didReleaseAllCurrentMetadata;
		}
	}

	didReleaseAllCurrentMetadata =
		removeAccountSyncMetaIfCurrentVersion(
			userId,
			generationToken,
			deletedOperationId
		) && didReleaseAllCurrentMetadata;
	clearAccountSyncResetRecoveries(userId);
	clearAccountSyncRuntimeConflicts();
	return didReleaseAllCurrentMetadata;
}

export function releaseAccountWorkspaceOperationState(userId: string) {
	removeAccountSyncOperation(userId);
	removeAccountSyncLease(userId);
}
