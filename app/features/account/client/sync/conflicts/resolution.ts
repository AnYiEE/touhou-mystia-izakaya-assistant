import { createAccountClientId } from '@/features/account/client/clientId';
import { accountStore } from '@/features/account/client/state/accountStore';
import {
	readAccountSyncBaseSnapshot,
	removeAccountSyncBaseSnapshot,
	writeAccountSyncBaseSnapshot,
} from '@/features/account/client/sync/baseSnapshot';
import {
	type TAccountSyncConflictResolutionJournalStage,
	type TAccountSyncConflictResolution as TSyncConflictResolution,
	readAccountSyncConflictResolutionJournal,
	runAccountSyncConflictResolutionJournalTransaction,
} from '@/features/account/client/sync/conflictResolutionJournal';
import {
	clearDirtyQueueCollisionEvidence,
	readDirtyQueueEntry,
	readIsolatedDirtyQueueNamespaces,
} from '@/features/account/client/sync/dirtyQueue/collisionEvidence';
import {
	checkSnapshotHashMatches,
	createSnapshotHash,
} from '@/features/account/client/sync/dirtyQueue/snapshotHash';
import {
	removePausedConflictEntryIfCurrent,
	replacePausedConflictWithDirtyIfCurrent,
} from '@/features/account/client/sync/queue';
import {
	checkAccountSyncResetWriteAllowed,
	getAccountSyncResetGenerationIdFromToken,
} from '@/features/account/client/sync/resetGeneration';
import {
	getAccountSyncSerializer,
	readAccountSyncMeta,
	removeAccountSyncMetaIfCurrent,
	withAccountSyncMetaTransitionLock,
	withApplyingRemoteState,
	writeAccountSyncMeta,
} from '@/features/account/client/sync/snapshot';
import { completeAccountSyncConflictResolutionRuntime } from '@/features/account/client/sync/syncRuntimeState';
import { SYNC_SCHEMA_VERSION_MAP } from '@/features/account/sync/constants';
import type {
	IDirtyQueueEntry,
	ISyncConflictItem,
} from '@/features/account/sync/types';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

function getConflictResolutionData(
	conflict: ISyncConflictItem,
	resolution: TSyncConflictResolution
) {
	if (resolution.startsWith('collision:')) {
		const candidateId = resolution.slice('collision:'.length);
		return conflict.localCollision?.candidates.find(
			(candidate) => candidate.id === candidateId
		)?.data;
	}
	if (resolution === 'cloud') {
		return conflict.cloud;
	}
	if (resolution === 'merged' && conflict.merged !== null) {
		return conflict.merged;
	}

	return conflict.local;
}

function getCollisionResolutionCandidate(
	conflict: ISyncConflictItem,
	resolution: TSyncConflictResolution
) {
	if (!resolution.startsWith('collision:')) {
		return;
	}
	const candidateId = resolution.slice('collision:'.length);
	return conflict.localCollision?.candidates.find(
		(candidate) => candidate.id === candidateId
	);
}

function checkConflictSnapshotsEqual(
	left: ISyncConflictItem,
	right: ISyncConflictItem
) {
	return (
		left.revision === right.revision &&
		createSnapshotHash(left.cloud) === createSnapshotHash(right.cloud) &&
		createSnapshotHash(left.local) === createSnapshotHash(right.local) &&
		createSnapshotHash(left.localCollision) ===
			createSnapshotHash(right.localCollision) &&
		createSnapshotHash(left.merged) === createSnapshotHash(right.merged)
	);
}

function rollbackConflictSnapshot(
	serializer: ReturnType<typeof getAccountSyncSerializer>,
	previousSnapshot: unknown
) {
	withApplyingRemoteState(() => {
		serializer.setLocalSnapshot(previousSnapshot);
	});
}

export function checkActiveConflictUser(userId: string) {
	return accountStore.shared.user.get()?.id === userId;
}

export function resolveAccountSyncConflictUnlocked({
	conflict,
	expectedEntry,
	generationToken,
	onStage,
	resolution,
	resultClientMutationId,
	userId,
}: {
	conflict: ISyncConflictItem;
	expectedEntry: IDirtyQueueEntry;
	generationToken: string | null;
	onStage?: (stage: TAccountSyncConflictResolutionJournalStage) => void;
	resultClientMutationId?: string;
	resolution: TSyncConflictResolution;
	userId: string;
}) {
	if (conflict.userId !== userId) {
		return false;
	}
	if (resolution === 'merged' && conflict.merged === null) {
		return false;
	}
	if (
		resolution.startsWith('collision:') &&
		getConflictResolutionData(conflict, resolution) === undefined
	) {
		return false;
	}
	if (!checkActiveConflictUser(userId)) {
		return false;
	}

	const data = getConflictResolutionData(conflict, resolution);
	const collisionCandidate = getCollisionResolutionCandidate(
		conflict,
		resolution
	);
	const resultBaseRevision =
		collisionCandidate?.baseRevision ?? conflict.revision;
	const serializer = getAccountSyncSerializer(conflict.namespace);
	const previousSnapshot = serializer.getLocalSnapshot();

	withApplyingRemoteState(() => {
		serializer.setLocalSnapshot(data);
	});
	onStage?.('snapshot');

	if (!checkActiveConflictUser(userId)) {
		rollbackConflictSnapshot(serializer, previousSnapshot);
		return false;
	}

	if (resolution === 'cloud' && conflict.localCollision === undefined) {
		const previousMeta = readAccountSyncMeta(userId);
		const currentUser = accountStore.shared.user.get();
		const currentMeta = accountStore.shared.sync.meta.get();
		const metaSource =
			previousMeta ??
			(currentUser?.id === userId &&
			currentMeta !== null &&
			currentMeta.state_epoch === currentUser.state_epoch &&
			checkAccountSyncResetWriteAllowed({
				expectedGeneration: generationToken,
				userId,
			})
				? currentMeta
				: null);

		if (metaSource === null) {
			withApplyingRemoteState(() => {
				serializer.setLocalSnapshot(previousSnapshot);
			});
			return false;
		}

		const meta = {
			...metaSource,
			lastAppliedRemoteHash: { ...metaSource.lastAppliedRemoteHash },
			revisions: { ...metaSource.revisions },
		};
		const rollbackMeta = () => {
			if (previousMeta === null) {
				return removeAccountSyncMetaIfCurrent(userId, generationToken);
			}
			writeAccountSyncMeta(userId, previousMeta, { generationToken });
			return true;
		};

		if (!checkActiveConflictUser(userId)) {
			rollbackConflictSnapshot(serializer, previousSnapshot);
			return false;
		}

		try {
			meta.lastAppliedRemoteHash[conflict.namespace] = createSnapshotHash(
				serializer.getLocalSnapshot()
			);
			meta.revisions[conflict.namespace] = conflict.revision;
			writeAccountSyncMeta(userId, meta, { generationToken });
			onStage?.('state');
		} catch (error) {
			withApplyingRemoteState(() => {
				try {
					serializer.setLocalSnapshot(previousSnapshot);
				} catch {
					/* best-effort rollback */
				}
			});

			try {
				rollbackMeta();
			} catch (writeError) {
				console.warn(
					'Failed to restore account sync meta after conflict rollback.',
					{ errorCode: getLogSafeErrorCode(writeError) }
				);
			}

			throw error;
		}

		if (
			!removePausedConflictEntryIfCurrent({
				expectedEntry,
				generationToken,
				userId,
			})
		) {
			rollbackConflictSnapshot(serializer, previousSnapshot);
			try {
				rollbackMeta();
			} catch (writeError) {
				console.warn(
					'Failed to restore account sync meta after stale conflict resolution.',
					{ errorCode: getLogSafeErrorCode(writeError) }
				);
			}
			return false;
		}

		writeAccountSyncBaseSnapshot({
			data,
			generationToken,
			namespace: conflict.namespace,
			revision: conflict.revision,
			userId,
		});
		completeAccountSyncConflictResolutionRuntime(
			userId,
			conflict.namespace,
			expectedEntry.clientMutationId
		);
		onStage?.('runtime');

		return true;
	}

	let entry;
	try {
		if (!checkActiveConflictUser(userId)) {
			rollbackConflictSnapshot(serializer, previousSnapshot);
			return false;
		}

		entry = replacePausedConflictWithDirtyIfCurrent({
			baseRevision: resultBaseRevision,
			...(resultClientMutationId === undefined
				? {}
				: { clientMutationId: resultClientMutationId }),
			data,
			expectedEntry,
			generationToken,
			userId,
		});
	} catch (error) {
		withApplyingRemoteState(() => {
			serializer.setLocalSnapshot(previousSnapshot);
		});
		throw error;
	}

	if (entry === null) {
		withApplyingRemoteState(() => {
			serializer.setLocalSnapshot(previousSnapshot);
		});
		return false;
	}
	if (
		conflict.localCollision !== undefined &&
		!clearDirtyQueueCollisionEvidence(
			generationToken,
			userId,
			conflict.namespace
		)
	) {
		throw new Error('dirty-collision-evidence-cleanup-failed');
	}

	if (conflict.localCollision === undefined) {
		writeAccountSyncBaseSnapshot({
			data: conflict.cloud,
			generationToken,
			namespace: conflict.namespace,
			revision: conflict.revision,
			userId,
		});
	} else if (
		readAccountSyncBaseSnapshot(
			userId,
			conflict.namespace,
			resultBaseRevision,
			serializer
		) === null
	) {
		removeAccountSyncBaseSnapshot(
			userId,
			conflict.namespace,
			generationToken
		);
	}
	onStage?.('state');

	completeAccountSyncConflictResolutionRuntime(
		userId,
		conflict.namespace,
		expectedEntry.clientMutationId
	);
	onStage?.('runtime');

	return true;
}

export async function commitAccountSyncConflictResolution({
	conflict,
	entry,
	generationToken,
	resolution,
	userId,
}: {
	conflict: ISyncConflictItem;
	entry: IDirtyQueueEntry;
	generationToken: string | null;
	resolution: TSyncConflictResolution;
	userId: string;
}) {
	readDirtyQueueEntry(userId, conflict.namespace);

	if (readIsolatedDirtyQueueNamespaces(userId).includes(conflict.namespace)) {
		return false;
	}
	if (
		readAccountSyncConflictResolutionJournal(userId, conflict.namespace) !==
		null
	) {
		return false;
	}

	const operationId = createAccountClientId();
	const selected = getConflictResolutionData(conflict, resolution);
	const selectedHash = createSnapshotHash(selected);
	const resultBaseRevision =
		getCollisionResolutionCandidate(conflict, resolution)?.baseRevision ??
		conflict.revision;
	const willCreateDirty =
		resolution !== 'cloud' || conflict.localCollision !== undefined;
	const resultClientMutationId = willCreateDirty
		? createAccountClientId()
		: null;
	const journal = {
		clientMutationId: entry.clientMutationId,
		cloudHash: createSnapshotHash(conflict.cloud),
		createdAt: Date.now(),
		generationToken,
		localHash: createSnapshotHash(conflict.local),
		mergedHash: createSnapshotHash(conflict.merged),
		namespace: conflict.namespace,
		operationId,
		resetGeneration:
			getAccountSyncResetGenerationIdFromToken(generationToken),
		resolution,
		resultBaseRevision: willCreateDirty ? resultBaseRevision : null,
		resultClientMutationId,
		resultQueueOperationId:
			resultClientMutationId === null
				? null
				: `queue-${resultClientMutationId}`,
		resultSchemaVersion: willCreateDirty
			? SYNC_SCHEMA_VERSION_MAP[conflict.namespace]
			: null,
		revision: conflict.revision,
		selectedHash,
		sourceLocalCollisionHash: createSnapshotHash(conflict.localCollision),
		sourceLocalCollisionToken: conflict.localCollision?.token ?? null,
		sourceSnapshotHash: entry.snapshotHash,
		stage: 'prepared' as const,
		userId,
		version: 2 as const,
	};

	const transactionResult = await withAccountSyncMetaTransitionLock(
		userId,
		generationToken,
		() =>
			runAccountSyncConflictResolutionJournalTransaction({
				checkCurrent: () => {
					if (
						!checkActiveConflictUser(userId) ||
						readIsolatedDirtyQueueNamespaces(userId).includes(
							conflict.namespace
						)
					) {
						return false;
					}
					const currentEntry = readDirtyQueueEntry(
						userId,
						conflict.namespace
					);
					return resolution === 'cloud'
						? currentEntry === null
						: currentEntry?.paused === null &&
								currentEntry.baseRevision ===
									resultBaseRevision &&
								checkSnapshotHashMatches(
									currentEntry.data,
									selectedHash
								);
				},
				execute: (advanceJournal) => {
					const advance = (
						stage: TAccountSyncConflictResolutionJournalStage
					) => {
						const currentEntry = readDirtyQueueEntry(
							userId,
							conflict.namespace
						);
						if (
							readIsolatedDirtyQueueNamespaces(userId).includes(
								conflict.namespace
							)
						) {
							throw new Error('dirty-storage-generation-changed');
						}
						const matchesSourceConflict =
							currentEntry?.paused === 'conflict' &&
							currentEntry.clientMutationId ===
								entry.clientMutationId &&
							currentEntry.snapshotHash === entry.snapshotHash &&
							currentEntry.conflict !== null &&
							checkConflictSnapshotsEqual(
								currentEntry.conflict,
								conflict
							);
						const matchesSelectedDirty =
							currentEntry?.paused === null &&
							currentEntry.baseRevision === resultBaseRevision &&
							checkSnapshotHashMatches(
								currentEntry.data,
								selectedHash
							);
						const hasExpectedState =
							stage === 'snapshot' ||
							(stage === 'state' && resolution === 'cloud')
								? matchesSourceConflict
								: resolution === 'cloud'
									? currentEntry === null
									: matchesSelectedDirty;
						if (!hasExpectedState) {
							throw new Error('dirty-storage-generation-changed');
						}
						advanceJournal(stage);
					};
					return resolveAccountSyncConflictUnlocked({
						conflict,
						expectedEntry: entry,
						generationToken,
						onStage: advance,
						...(resultClientMutationId === null
							? {}
							: { resultClientMutationId }),
						resolution,
						userId,
					});
				},
				generationToken,
				journal,
			})
	);

	return transactionResult === true;
}
