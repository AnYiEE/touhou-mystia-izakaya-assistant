import {
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
} from '@/domain/account/contracts';

import {
	getAccountSyncConflictResolutionRecoveryAction,
	readAccountSyncConflictResolutionJournal,
	removeAccountSyncConflictResolutionJournal,
} from '@/features/account/client/sync/conflictResolutionJournal';
import {
	readDirtyQueueEntry,
	readIsolatedDirtyQueueNamespaces,
} from '@/features/account/client/sync/dirtyQueue/collisionEvidence';
import { createSnapshotHash } from '@/features/account/client/sync/dirtyQueue/snapshotHash';
import {
	captureAccountSyncResetGeneration,
	checkAccountSyncResetWriteAllowed,
	getAccountSyncResetGenerationIdFromToken,
} from '@/features/account/client/sync/resetGeneration';
import {
	getAccountSyncSerializer,
	readAccountSyncMeta,
} from '@/features/account/client/sync/snapshot';

import { resolveAccountSyncConflictUnlocked } from './resolution';
import { withAccountSyncNamespaceTransitionLock } from './transitionLock';

const activeJournalRecoveries = new Map<
	string,
	Promise<{ hasIsolatedJournal: boolean; recoveredCount: number }>
>();

export function recoverAccountSyncConflictResolutionJournalUnlocked(
	generationToken: string | null,
	userId: string,
	namespace: TSyncNamespace
) {
	const result = readAccountSyncConflictResolutionJournal(userId, namespace);

	if (result === null) {
		return { hasIsolatedJournal: false, recoveredCount: 0 };
	}
	if (result.status !== 'current') {
		return { hasIsolatedJournal: true, recoveredCount: 0 };
	}

	const { journal } = result;
	if (
		journal.generationToken !== generationToken ||
		journal.resetGeneration !==
			getAccountSyncResetGenerationIdFromToken(generationToken) ||
		!checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			userId,
		})
	) {
		return { hasIsolatedJournal: true, recoveredCount: 0 };
	}
	const entry = readDirtyQueueEntry(userId, namespace);

	if (readIsolatedDirtyQueueNamespaces(userId).includes(namespace)) {
		return { hasIsolatedJournal: true, recoveredCount: 0 };
	}

	const serializer = getAccountSyncSerializer(namespace);
	const localHash = createSnapshotHash(serializer.getLocalSnapshot());
	const meta = readAccountSyncMeta(userId);
	const conflict = entry?.paused === 'conflict' ? entry.conflict : null;
	const action = getAccountSyncConflictResolutionRecoveryAction({
		journal,
		localHash,
		metaHash: meta?.lastAppliedRemoteHash[namespace] ?? null,
		metaRevision: meta?.revisions[namespace] ?? null,
		queue:
			entry === null
				? { kind: 'none' }
				: conflict === null
					? {
							baseRevision: entry.baseRevision,
							clientMutationId: entry.clientMutationId,
							dataHash: createSnapshotHash(entry.data),
							kind: 'dirty',
							queueOperationId: entry.queueOperationId ?? null,
							schemaVersion: entry.schema_version,
						}
					: {
							clientMutationId: entry.clientMutationId,
							cloudHash: createSnapshotHash(conflict.cloud),
							kind: 'conflict',
							localHash: createSnapshotHash(conflict.local),
							mergedHash: createSnapshotHash(conflict.merged),
							revision: conflict.revision,
							sourceLocalCollisionHash: createSnapshotHash(
								conflict.localCollision
							),
							sourceLocalCollisionToken:
								conflict.localCollision?.token ?? null,
							sourceSnapshotHash: entry.snapshotHash,
						},
	});

	if (action === 'finalize-selection') {
		if (conflict === null || entry === null) {
			return { hasIsolatedJournal: true, recoveredCount: 0 };
		}
		const didFinalize = resolveAccountSyncConflictUnlocked({
			conflict,
			expectedEntry: entry,
			generationToken,
			...(journal.resultClientMutationId === null
				? {}
				: { resultClientMutationId: journal.resultClientMutationId }),
			resolution: journal.resolution,
			userId,
		});
		if (!didFinalize) {
			return { hasIsolatedJournal: true, recoveredCount: 0 };
		}
	}

	if (
		['accept-committed', 'finalize-selection', 'resume-conflict'].includes(
			action
		)
	) {
		removeAccountSyncConflictResolutionJournal({
			generationToken,
			namespace,
			operationId: journal.operationId,
			userId,
		});
		return { hasIsolatedJournal: false, recoveredCount: 1 };
	}

	return { hasIsolatedJournal: true, recoveredCount: 0 };
}

export function checkAccountSyncConflictResolutionJournalsPending(
	userId: string
) {
	return Object.values(SYNC_NAMESPACE_MAP).some(
		(namespace) =>
			readAccountSyncConflictResolutionJournal(userId, namespace) !== null
	);
}

export function recoverAccountSyncConflictResolutionJournals(userId: string) {
	const active = activeJournalRecoveries.get(userId);
	if (active !== undefined) {
		return active;
	}

	const generationToken = captureAccountSyncResetGeneration(userId);
	const recovery = Promise.all(
		Object.values(SYNC_NAMESPACE_MAP).map((namespace) =>
			withAccountSyncNamespaceTransitionLock(userId, namespace, () =>
				recoverAccountSyncConflictResolutionJournalUnlocked(
					generationToken,
					userId,
					namespace
				)
			)
		)
	).then((results) => ({
		hasIsolatedJournal: results.some(
			(result) => result === null || result.hasIsolatedJournal
		),
		recoveredCount: results.reduce(
			(count, result) => count + (result?.recoveredCount ?? 0),
			0
		),
	}));
	activeJournalRecoveries.set(userId, recovery);
	void recovery
		.finally(() => {
			if (activeJournalRecoveries.get(userId) === recovery) {
				activeJournalRecoveries.delete(userId);
			}
		})
		.catch(() => {});

	return recovery;
}
