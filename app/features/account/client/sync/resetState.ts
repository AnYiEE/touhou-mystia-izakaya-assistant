import {
	ACCOUNT_SYNC_STATUS_MAP,
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
} from '@/domain/account/contracts';

import { createAccountClientId } from '@/features/account/client/clientId';
import { accountStore } from '@/features/account/client/state/accountStore';

import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';

import {
	readAccountSyncBaseSnapshot,
	removeAccountSyncBaseSnapshot,
} from './baseSnapshot';
import { getSyncClientGeneration } from './clientRuntime';
import {
	readAccountSyncConflictResolutionJournal,
	removeAccountSyncConflictResolutionJournal,
} from './conflictResolutionJournal';
import { withAccountSyncNamespaceTransitionLock } from './conflicts/transitionLock';
import {
	createDirtyQueueNamespaceGenerationHash,
	readDirtyQueueCollisionState,
	readDirtyQueueEntries,
	readDirtyQueueEntry,
	readIsolatedDirtyQueueNamespaces,
} from './dirtyQueue/collisionEvidence';
import { createSnapshotHash } from './dirtyQueue/snapshotHash';
import {
	removeDirtyQueueEntryIfCurrent,
	writeDirtyQueueEntryIfCurrent,
	writeDirtyQueueNullTombstoneIfCurrent,
} from './dirtyQueue/storageTransition';
import {
	checkAccountSyncResetWriteAllowed,
	commitAccountSyncResetGeneration,
	prepareAccountSyncResetGeneration,
	readAccountSyncResetGeneration,
	withAccountSyncResetGenerationLock,
} from './resetGeneration';
import {
	checkCurrentAccountUser,
	checkCurrentSyncRun,
	setCurrentAccountUserStateEpoch,
} from './sessionBoundary';
import {
	getAccountSyncSerializer,
	readAccountSyncMeta,
	writeAccountSyncMeta,
} from './snapshot';
import { getAccountSyncLifecyclePort } from './syncLifecyclePort';
import {
	checkAccountSyncOperationOwnedByCurrentTab,
	withAccountSyncOperationLease,
} from './syncOperationLease';

async function resetAccountSyncCloudStateAfterDeleteUnlocked({
	deleteStartedAt,
	generationToken,
	resetOperationId,
	stateEpoch,
	userId,
}: {
	deleteStartedAt?: number;
	generationToken: string;
	resetOperationId: string;
	stateEpoch: number;
	userId: string;
}) {
	const generation = getSyncClientGeneration();
	if (
		!isNonNegativeSafeInteger(stateEpoch) ||
		!checkCurrentSyncRun(generation, userId) ||
		!checkAccountSyncOperationOwnedByCurrentTab(userId)
	) {
		return null;
	}

	const currentMeta = readAccountSyncMeta(userId);
	const currentUser = accountStore.shared.user.get();
	const currentMetaHash = createSnapshotHash(currentMeta);
	const currentUserStateEpoch = currentUser?.state_epoch;
	const latestKnownEpoch = Math.max(
		currentMeta?.state_epoch ?? 0,
		currentUser?.id === userId ? currentUser.state_epoch : 0
	);
	if (
		stateEpoch < latestKnownEpoch ||
		(currentMeta?.clearedStateEpoch !== undefined &&
			stateEpoch < currentMeta.clearedStateEpoch)
	) {
		return null;
	}
	const resetNamespaceHashes = new Map<TSyncNamespace, string>();
	const createResetNamespaceHash = (namespace: TSyncNamespace) =>
		createSnapshotHash({
			baseSnapshot: readAccountSyncBaseSnapshot(
				userId,
				namespace,
				undefined,
				getAccountSyncSerializer(namespace)
			),
			dirtyGeneration: createDirtyQueueNamespaceGenerationHash(
				userId,
				namespace
			),
			entry: readDirtyQueueEntry(userId, namespace),
			isIsolated:
				readIsolatedDirtyQueueNamespaces(userId).includes(namespace),
			journal: readAccountSyncConflictResolutionJournal(
				userId,
				namespace
			),
		});

	let converged = false;
	for (let pass = 0; pass < 3 && !converged; pass += 1) {
		resetNamespaceHashes.clear();
		for (const namespace of Object.values(SYNC_NAMESPACE_MAP)) {
			if (!checkAccountSyncOperationOwnedByCurrentTab(userId)) {
				break;
			}
			const transitionResult =
				await withAccountSyncNamespaceTransitionLock(
					userId,
					namespace,
					() => {
						const resetGeneration =
							readAccountSyncResetGeneration(userId);
						if (
							resetGeneration.status !== 'current' ||
							resetGeneration.marker.phase !== 'prepared' ||
							resetGeneration.marker.operationId !==
								resetOperationId ||
							resetGeneration.marker.state_epoch !== stateEpoch
						) {
							return false;
						}
						const journal =
							readAccountSyncConflictResolutionJournal(
								userId,
								namespace
							);
						const entry = readDirtyQueueEntry(userId, namespace);
						const isIsolated =
							readIsolatedDirtyQueueNamespaces(userId).includes(
								namespace
							) ||
							(journal !== null && journal.status !== 'current');
						if (isIsolated) {
							if (
								entry === null &&
								readDirtyQueueCollisionState(
									userId,
									namespace
								) === null &&
								!writeDirtyQueueNullTombstoneIfCurrent({
									generationToken,
									namespace,
									resetOperationId,
									userId,
								})
							) {
								return false;
							}
							return removeAccountSyncBaseSnapshot(
								userId,
								namespace,
								generationToken,
								resetOperationId
							)
								? createResetNamespaceHash(namespace)
								: false;
						}
						if (entry !== null) {
							const shouldPreserve =
								deleteStartedAt !== undefined &&
								deleteStartedAt > 0 &&
								entry.dirtyAt >= deleteStartedAt;
							const alreadyRebased =
								entry.baseRevision === 0 &&
								entry.conflict === null &&
								entry.lastError === null &&
								entry.paused === null;
							const didRemove =
								!shouldPreserve &&
								removeDirtyQueueEntryIfCurrent({
									expectedEntry: entry,
									generationToken,
									resetOperationId,
									userId,
								});
							if (!didRemove && !alreadyRebased) {
								const latestEntry = readDirtyQueueEntry(
									userId,
									namespace
								);
								if (
									latestEntry !== null &&
									!writeDirtyQueueEntryIfCurrent({
										expectedEntry: latestEntry,
										generationToken,
										nextEntry: {
											...latestEntry,
											attempts: 0,
											baseRevision: 0,
											clientMutationId:
												createAccountClientId(),
											conflict: null,
											lastError: null,
											paused: null,
										},
										resetOperationId,
										userId,
									})
								) {
									return false;
								}
							}
						}
						if (
							readDirtyQueueEntry(userId, namespace) === null &&
							!writeDirtyQueueNullTombstoneIfCurrent({
								generationToken,
								namespace,
								resetOperationId,
								userId,
							})
						) {
							return false;
						}

						if (
							journal?.status === 'current' &&
							!removeAccountSyncConflictResolutionJournal({
								generationToken,
								namespace,
								operationId: journal.journal.operationId,
								resetOperationId,
								userId,
							})
						) {
							return false;
						}
						if (
							!removeAccountSyncBaseSnapshot(
								userId,
								namespace,
								generationToken,
								resetOperationId
							)
						) {
							return false;
						}
						return createResetNamespaceHash(namespace);
					}
				);
			if (typeof transitionResult !== 'string') {
				break;
			}
			resetNamespaceHashes.set(namespace, transitionResult);
		}
		converged =
			resetNamespaceHashes.size ===
				Object.values(SYNC_NAMESPACE_MAP).length &&
			[...resetNamespaceHashes].every(
				([namespace, expectedHash]) =>
					createResetNamespaceHash(namespace) === expectedHash
			);
	}
	if (!converged) {
		return null;
	}
	const latestUser = accountStore.shared.user.get();
	if (
		!checkCurrentSyncRun(generation, userId) ||
		!checkAccountSyncOperationOwnedByCurrentTab(userId) ||
		latestUser?.state_epoch !== currentUserStateEpoch ||
		createSnapshotHash(readAccountSyncMeta(userId)) !== currentMetaHash
	) {
		return null;
	}
	writeAccountSyncMeta(
		userId,
		{
			clearedStateEpoch: stateEpoch,
			lastAppliedRemoteHash: {},
			revisions: {},
			state_epoch: stateEpoch,
			sync_generation:
				accountStore.shared.user.get()?.sync_generation ?? 0,
			sync_status: ACCOUNT_SYNC_STATUS_MAP.pausedEmpty,
		},
		{ generationToken, resetOperationId, suppressRuntime: true }
	);
	const prepared = readAccountSyncResetGeneration(userId);
	const committedGenerationToken =
		prepared.status === 'current' &&
		prepared.marker.operationId === resetOperationId
			? commitAccountSyncResetGeneration({
					expectedRaw: prepared.raw,
					marker: prepared.marker,
				})
			: false;
	if (
		typeof committedGenerationToken !== 'string' ||
		!checkAccountSyncResetWriteAllowed({
			expectedGeneration: committedGenerationToken,
			userId,
		})
	) {
		return null;
	}
	const hasPendingEntries = readDirtyQueueEntries(userId).length > 0;
	if (!checkCurrentAccountUser(userId)) {
		return hasPendingEntries;
	}
	setCurrentAccountUserStateEpoch(userId, stateEpoch);
	getAccountSyncLifecyclePort().restoreRuntimeState(userId);

	return hasPendingEntries;
}

export async function resetAccountSyncCloudStateAfterDelete({
	deleteStartedAt,
	operationId = createAccountClientId(),
	stateEpoch,
	userId,
}: {
	deleteStartedAt?: number;
	operationId?: string;
	stateEpoch: number;
	userId: string;
}): Promise<boolean | null> {
	if (!checkAccountSyncOperationOwnedByCurrentTab(userId)) {
		const leasedResult: boolean | null =
			await withAccountSyncOperationLease(userId, 'delete-data', () =>
				resetAccountSyncCloudStateAfterDelete({
					...(deleteStartedAt === undefined
						? {}
						: { deleteStartedAt }),
					operationId,
					stateEpoch,
					userId,
				})
			);
		return leasedResult ?? null;
	}
	const result = await withAccountSyncResetGenerationLock(
		userId,
		async () => {
			const current = readAccountSyncResetGeneration(userId);
			if (
				current.status === 'current' &&
				current.marker.phase === 'committed' &&
				current.marker.state_epoch >= stateEpoch
			) {
				const hasPendingEntries =
					readDirtyQueueEntries(userId).length > 0;
				if (checkCurrentAccountUser(userId)) {
					setCurrentAccountUserStateEpoch(
						userId,
						current.marker.state_epoch
					);
					getAccountSyncLifecyclePort().restoreRuntimeState(userId);
				}
				return hasPendingEntries;
			}
			const effectiveOperationId =
				current.status === 'current' &&
				current.marker.phase === 'prepared' &&
				current.marker.state_epoch === stateEpoch
					? current.marker.operationId
					: operationId;
			const marker = prepareAccountSyncResetGeneration({
				...(deleteStartedAt === undefined ? {} : { deleteStartedAt }),
				operationId: effectiveOperationId,
				stateEpoch,
				userId,
			});
			if (marker?.phase !== 'prepared') {
				return null;
			}
			const preparedGeneration = readAccountSyncResetGeneration(userId);
			if (
				preparedGeneration.status !== 'current' ||
				preparedGeneration.marker.operationId !== marker.operationId ||
				preparedGeneration.marker.phase !== 'prepared'
			) {
				return null;
			}
			return resetAccountSyncCloudStateAfterDeleteUnlocked({
				...(deleteStartedAt === undefined ? {} : { deleteStartedAt }),
				generationToken: preparedGeneration.raw,
				resetOperationId: marker.operationId,
				stateEpoch,
				userId,
			});
		}
	);
	return result ?? null;
}
