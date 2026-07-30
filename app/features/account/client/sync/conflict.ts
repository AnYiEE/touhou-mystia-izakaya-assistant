import type { ISyncConflictItem } from '@/features/account/sync/types';

import { type TAccountSyncConflictResolution } from './conflictResolutionJournal';
import { recoverAccountSyncConflictResolutionJournalUnlocked } from './conflicts/journalRecovery';
import { commitAccountSyncConflictResolution } from './conflicts/resolution';
import { withAccountSyncNamespaceTransitionLock } from './conflicts/transitionLock';
import { readDirtyQueueEntry } from './dirtyQueue/collisionEvidence';
import {
	checkSnapshotHashMatches,
	createSnapshotHash,
} from './dirtyQueue/snapshotHash';
import { captureAccountSyncResetGeneration } from './resetGeneration';
import { checkAccountSyncOperationActive } from './syncOperationLease';

export type TSyncConflictResolution = TAccountSyncConflictResolution;

export async function resolveAccountSyncConflict({
	conflict,
	generationToken: providedGenerationToken,
	resolution,
	userId,
}: {
	conflict: ISyncConflictItem;
	generationToken?: string | null;
	resolution: TSyncConflictResolution;
	userId: string;
}) {
	const generationToken =
		providedGenerationToken === undefined
			? captureAccountSyncResetGeneration(userId)
			: providedGenerationToken;
	if (checkAccountSyncOperationActive(userId)) {
		return false;
	}
	const result = await withAccountSyncNamespaceTransitionLock(
		userId,
		conflict.namespace,
		async () => {
			if (checkAccountSyncOperationActive(userId)) {
				return false;
			}

			const recovery =
				recoverAccountSyncConflictResolutionJournalUnlocked(
					generationToken,
					userId,
					conflict.namespace
				);
			if (recovery.hasIsolatedJournal) {
				return false;
			}

			const entry = readDirtyQueueEntry(userId, conflict.namespace);
			if (
				entry?.paused !== 'conflict' ||
				entry.conflict === null ||
				!checkSnapshotHashMatches(
					entry.conflict.cloud,
					createSnapshotHash(conflict.cloud)
				) ||
				!checkSnapshotHashMatches(
					entry.conflict.local,
					createSnapshotHash(conflict.local)
				) ||
				!checkSnapshotHashMatches(
					entry.conflict.merged,
					createSnapshotHash(conflict.merged)
				) ||
				entry.conflict.userId !== userId ||
				entry.conflict.revision !== conflict.revision
			) {
				return false;
			}

			return commitAccountSyncConflictResolution({
				conflict,
				entry,
				generationToken,
				resolution,
				userId,
			});
		}
	);

	return result === true;
}
