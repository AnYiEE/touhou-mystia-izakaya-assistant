import {
	ACCOUNT_SYNC_STATUS_MAP,
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
} from '@/domain/account/contracts';

import { createAccountClientId } from '@/features/account/client/clientId';
import { accountStore } from '@/features/account/client/state/accountStore';
import { SYNC_SCHEMA_VERSION_MAP } from '@/features/account/sync/constants';
import {
	checkSnapshotEqual,
	checkSyncMergeCanApplyAutomatically,
} from '@/features/account/sync/serializers/utils';
import type { ISyncStateRecord } from '@/features/account/sync/types';

import {
	readAccountSyncBaseSnapshot,
	readRetainedAccountSyncBaseSnapshot,
	writeAccountSyncBaseSnapshot,
} from './baseSnapshot';
import {
	pauseDirtyEntryWithConflict,
	restoreAccountSyncConflict,
	routePausedConflictMergeResult,
	setAccountSyncConflict,
} from './conflictOrchestration';
import { withAccountSyncNamespaceTransitionLock } from './conflicts/transitionLock';
import {
	readDirtyQueueEntries,
	readDirtyQueueEntry,
} from './dirtyQueue/collisionEvidence';
import { createSnapshotHash } from './dirtyQueue/snapshotHash';
import { removeDirtyQueueEntryIfCurrent } from './dirtyQueue/storageTransition';
import { scheduleAccountSyncFlush } from './flush';
import { markAccountSyncDirty } from './queue';
import { recordAccountSyncRefreshSuccess } from './queueRuntime';
import { getRecordMap } from './remoteProtocol';
import {
	checkRemoteStateCleared,
	checkRemoteStateFresh,
	fetchSyncStateForCurrentUser,
	pauseAccountSyncForEmptyCloud,
	postRemoteAppliedBroadcast,
} from './remoteState';
import {
	captureAccountSyncResetGeneration,
	checkAccountSyncResetPrepared,
	checkAccountSyncResetWriteAllowed,
	commitAccountSyncResetGeneration,
	prepareAccountSyncResetGeneration,
	readAccountSyncResetGeneration,
	withAccountSyncResetGenerationLock,
} from './resetGeneration';
import { resetAccountSyncCloudStateAfterDelete } from './resetState';
import {
	checkCurrentAccountUser,
	getLoggedInAccountContext,
	setCurrentAccountUserSyncState,
} from './sessionBoundary';
import {
	applyRemoteAccountRecords,
	getAccountSyncSerializer,
	readAccountSyncMeta,
	withAccountSyncMetaTransitionLock,
	withApplyingRemoteState,
	writeAccountSyncMeta,
} from './snapshot';
import {
	checkAccountSyncOperationOwnedByCurrentTab,
	withAccountSyncOperationLease,
} from './syncOperationLease';
import { removeAccountSyncConflict } from './syncRuntimeState';

export async function takeOverLocalAccountData(
	resetOperationId?: string,
	deleteStartedAt?: number
): Promise<boolean> {
	const context = getLoggedInAccountContext();
	if (context === null) {
		return false;
	}
	let generationToken = captureAccountSyncResetGeneration(context.user.id);
	const resetGeneration = readAccountSyncResetGeneration(context.user.id);
	if (
		resetGeneration.status === 'current' &&
		resetGeneration.marker.phase === 'deleted'
	) {
		if (context.user.state_epoch <= resetGeneration.marker.state_epoch) {
			return false;
		}
		if (!checkAccountSyncOperationOwnedByCurrentTab(context.user.id)) {
			const recovered = await withAccountSyncOperationLease(
				context.user.id,
				'delete-data',
				(leaseOperationId) =>
					takeOverLocalAccountData(
						resetOperationId ?? leaseOperationId,
						deleteStartedAt
					)
			);
			return recovered === true;
		}
		const prepared = await withAccountSyncResetGenerationLock(
			context.user.id,
			() =>
				prepareAccountSyncResetGeneration({
					accountRestorationStateEpoch: context.user.state_epoch,
					operationId: resetOperationId ?? createAccountClientId(),
					stateEpoch: context.user.state_epoch,
					userId: context.user.id,
				})
		);
		if (prepared?.phase !== 'prepared') {
			return false;
		}
		const preparedGeneration = readAccountSyncResetGeneration(
			context.user.id
		);
		if (
			preparedGeneration.status !== 'current' ||
			preparedGeneration.marker.phase !== 'prepared' ||
			preparedGeneration.marker.operationId !== prepared.operationId ||
			preparedGeneration.marker.restoredFromStateEpoch === undefined
		) {
			return false;
		}
		generationToken = preparedGeneration.raw;
	}
	if (
		checkAccountSyncResetPrepared(context.user.id) &&
		!checkAccountSyncOperationOwnedByCurrentTab(context.user.id)
	) {
		const recovered = await withAccountSyncOperationLease(
			context.user.id,
			'delete-data',
			(leaseOperationId) =>
				takeOverLocalAccountData(
					resetOperationId ?? leaseOperationId,
					deleteStartedAt
				)
		);
		return recovered === true;
	}

	const remoteState = await fetchSyncStateForCurrentUser(context.user.id);
	if (remoteState === null) {
		return false;
	}
	if (
		!checkCurrentAccountUser(context.user.id) ||
		!checkRemoteStateFresh(context.user.id, remoteState.state_epoch)
	) {
		return false;
	}
	if (remoteState.sync_status === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty) {
		return pauseAccountSyncForEmptyCloud({
			stateEpoch: remoteState.state_epoch,
			syncGeneration: remoteState.sync_generation,
			userId: context.user.id,
		});
	}
	const localSyncMeta = readAccountSyncMeta(context.user.id);
	const wasCloudPaused =
		context.user.sync_status === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty ||
		localSyncMeta?.sync_status === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty ||
		(localSyncMeta?.sync_generation ?? 0) < remoteState.sync_generation ||
		readDirtyQueueEntries(context.user.id).some(
			(entry) => entry.paused === 'cloud-paused'
		);
	const remoteResetGeneration = readAccountSyncResetGeneration(
		context.user.id
	);
	const shouldSupersedePreparedReset =
		remoteResetGeneration.status === 'current' &&
		remoteResetGeneration.marker.phase === 'prepared' &&
		remoteState.state_epoch >= remoteResetGeneration.marker.state_epoch;
	let didRestoreAccount = false;
	let shouldResumePreparedReset = false;
	if (shouldSupersedePreparedReset) {
		const preparedMarker = remoteResetGeneration.marker;
		const isAccountRestoration =
			preparedMarker.restoredFromStateEpoch !== undefined &&
			preparedMarker.restoredFromStateEpoch <
				preparedMarker.state_epoch &&
			preparedMarker.state_epoch === context.user.state_epoch &&
			remoteState.state_epoch === context.user.state_epoch;
		if (isAccountRestoration) {
			const resetResult = await resetAccountSyncCloudStateAfterDelete({
				operationId: preparedMarker.operationId,
				stateEpoch: remoteState.state_epoch,
				userId: context.user.id,
			});
			if (resetResult === null) {
				return false;
			}
			generationToken = captureAccountSyncResetGeneration(
				context.user.id
			);
			didRestoreAccount = true;
		} else if (remoteState.state_epoch === preparedMarker.state_epoch) {
			if (remoteState.records.length > 0) {
				return false;
			}
			shouldResumePreparedReset = true;
		} else {
			const committedGenerationToken =
				await withAccountSyncResetGenerationLock(context.user.id, () =>
					commitAccountSyncResetGeneration({
						expectedRaw: remoteResetGeneration.raw,
						marker: preparedMarker,
					})
				);
			if (typeof committedGenerationToken !== 'string') {
				return false;
			}
			generationToken = committedGenerationToken;
		}
		if (
			!checkCurrentAccountUser(context.user.id) ||
			!checkRemoteStateFresh(context.user.id, remoteState.state_epoch)
		) {
			return false;
		}
		if (
			!shouldResumePreparedReset &&
			!checkAccountSyncResetWriteAllowed({
				expectedGeneration: generationToken,
				userId: context.user.id,
			})
		) {
			return false;
		}
	}
	if (
		!didRestoreAccount &&
		(shouldResumePreparedReset ||
			checkRemoteStateCleared({
				records: remoteState.records,
				stateEpoch: remoteState.state_epoch,
				userId: context.user.id,
			}))
	) {
		const shouldFlushPreservedDirty =
			await resetAccountSyncCloudStateAfterDelete({
				...(deleteStartedAt === undefined ? {} : { deleteStartedAt }),
				...(resetOperationId === undefined
					? {}
					: { operationId: resetOperationId }),
				stateEpoch: remoteState.state_epoch,
				userId: context.user.id,
			});
		if (shouldFlushPreservedDirty === null) {
			return false;
		}
		if (shouldFlushPreservedDirty) {
			scheduleAccountSyncFlush();
		}
		recordAccountSyncRefreshSuccess({ userId: context.user.id });

		return true;
	}
	const recordMap = getRecordMap(remoteState.records);
	const dirtyNamespaceSet = new Set<TSyncNamespace>();
	const dirtyRemoteRecords: ISyncStateRecord[] = [];
	const recordsToApply: ISyncStateRecord[] = [];

	for (const namespace of Object.values(SYNC_NAMESPACE_MAP)) {
		const deferredAutoResolutions: Array<() => void> = [];
		const lockResult = await withAccountSyncNamespaceTransitionLock(
			context.user.id,
			namespace,
			() => {
				if (!checkCurrentAccountUser(context.user.id)) {
					return false;
				}
				const dirtyEntry = readDirtyQueueEntry(
					context.user.id,
					namespace
				);
				if (dirtyEntry !== null) {
					dirtyNamespaceSet.add(namespace);
				}
				const storedConflict = dirtyEntry?.conflict ?? null;
				const pausedDirtyEntry =
					dirtyEntry?.paused === 'conflict' && storedConflict !== null
						? dirtyEntry
						: null;
				if (dirtyNamespaceSet.has(namespace) && !wasCloudPaused) {
					if (pausedDirtyEntry !== null && storedConflict !== null) {
						const serializer = getAccountSyncSerializer(namespace);
						const record = recordMap[namespace];
						const currentCloud =
							record === undefined
								? serializer.getDefaultSnapshot()
								: serializer.migrate(
										record.data,
										record.schema_version
									);
						const storedCloud = serializer.deserialize(
							storedConflict.cloud
						);
						if (
							storedConflict.revision ===
								(record?.revision ?? 0) &&
							checkSnapshotEqual(storedCloud, currentCloud)
						) {
							const restoredConflict = restoreAccountSyncConflict(
								storedConflict,
								context.user.id
							);
							if (restoredConflict !== null) {
								setAccountSyncConflict(restoredConflict);
							}
							return true;
						}
					} else {
						return true;
					}
				}

				const serializer = getAccountSyncSerializer(namespace);
				const local = serializer.deserialize(
					serializer.getLocalSnapshot()
				);
				const record = recordMap[namespace];
				const cloud =
					record === undefined
						? null
						: serializer.migrate(
								record.data,
								record.schema_version
							);
				const cloudSnapshot = cloud ?? serializer.getDefaultSnapshot();
				if (checkSnapshotEqual(local, cloudSnapshot)) {
					if (
						dirtyEntry !== null &&
						!removeDirtyQueueEntryIfCurrent({
							expectedEntry: dirtyEntry,
							generationToken,
							userId: context.user.id,
						})
					) {
						return false;
					}
					removeAccountSyncConflict(context.user.id, namespace);
					if (record !== undefined) {
						recordsToApply.push(record);
					}
					return true;
				}
				if (pausedDirtyEntry !== null && storedConflict !== null) {
					const storedCloud = serializer.deserialize(
						storedConflict.cloud
					);
					if (
						storedConflict.revision === (record?.revision ?? 0) &&
						checkSnapshotEqual(storedCloud, cloudSnapshot)
					) {
						const restoredConflict = restoreAccountSyncConflict(
							storedConflict,
							context.user.id
						);
						if (restoredConflict !== null) {
							setAccountSyncConflict(restoredConflict);
						}
						return true;
					}
				}
				const expectedBaseRevision =
					dirtyEntry?.baseRevision ??
					localSyncMeta?.revisions[namespace];
				const storedBase = wasCloudPaused
					? readRetainedAccountSyncBaseSnapshot(
							context.user.id,
							namespace,
							expectedBaseRevision,
							serializer
						)
					: dirtyEntry === null
						? null
						: readAccountSyncBaseSnapshot(
								context.user.id,
								namespace,
								dirtyEntry.baseRevision,
								serializer
							);
				const base = storedBase?.data ?? null;
				const mergeResult = serializer.merge({
					allowBaseNullAutoMerge: dirtyEntry === null,
					base,
					cloud,
					local,
					namespace,
				});
				if (pausedDirtyEntry !== null) {
					const didRoute = routePausedConflictMergeResult({
						cloud: cloud ?? serializer.getDefaultSnapshot(),
						deferredAutoResolutions,
						entry: pausedDirtyEntry,
						generationToken,
						local,
						mergeResult,
						record,
						userId: context.user.id,
					});
					return didRoute;
				}

				if (!checkSyncMergeCanApplyAutomatically(mergeResult, cloud)) {
					const now = Date.now();
					const conflict =
						mergeResult.conflict === null
							? {
									cloud:
										cloud ??
										serializer.getDefaultSnapshot(),
									local,
									merged: mergeResult.data,
									namespace,
									revision: record?.revision ?? 0,
									userId: context.user.id,
								}
							: {
									...mergeResult.conflict,
									revision: record?.revision ?? 0,
									userId: context.user.id,
								};
					pauseDirtyEntryWithConflict({
						allowMissing: true,
						conflict,
						entry: {
							attempts: 0,
							baseRevision: conflict.revision,
							clientMutationId: createAccountClientId(),
							conflict,
							data: conflict.local,
							dirtyAt: now,
							lastError: 'conflict',
							namespace,
							paused: 'conflict',
							schema_version: SYNC_SCHEMA_VERSION_MAP[namespace],
							snapshotHash: createSnapshotHash(conflict.local),
						},
						generationToken,
						userId: context.user.id,
					});
					return true;
				}

				if (mergeResult.shouldUpload) {
					const markedEntry = markAccountSyncDirty({
						baseRevision: record?.revision ?? 0,
						data: mergeResult.data,
						generationToken,
						namespace,
						replacePausedEntry: wasCloudPaused,
						userId: context.user.id,
					});
					if (markedEntry?.paused !== null) {
						return false;
					}
					dirtyNamespaceSet.add(namespace);
					if (record !== undefined) {
						dirtyRemoteRecords.push(record);
					}
					withApplyingRemoteState(() => {
						serializer.setLocalSnapshot(mergeResult.data);
					});
					return true;
				}

				if (
					dirtyEntry?.paused === 'cloud-paused' &&
					!removeDirtyQueueEntryIfCurrent({
						expectedEntry: dirtyEntry,
						generationToken,
						userId: context.user.id,
					})
				) {
					return false;
				}
				if (record !== undefined) {
					recordsToApply.push(record);
				}
				return true;
			}
		);
		if (!lockResult) {
			accountStore.shared.sync.lastError.set('conflict-reconcile-failed');
			return false;
		}
		deferredAutoResolutions.forEach((resolve) => {
			resolve();
		});
	}

	const appliedRecords: ISyncStateRecord[] = [];
	for (const record of recordsToApply) {
		const lockResult = await withAccountSyncNamespaceTransitionLock(
			context.user.id,
			record.namespace,
			async () => {
				if (
					!checkCurrentAccountUser(context.user.id) ||
					readDirtyQueueEntry(context.user.id, record.namespace) !==
						null
				) {
					return false;
				}
				const metaResult = await withAccountSyncMetaTransitionLock(
					context.user.id,
					generationToken,
					() => {
						if (
							!checkCurrentAccountUser(context.user.id) ||
							readDirtyQueueEntry(
								context.user.id,
								record.namespace
							) !== null
						) {
							return false;
						}
						return applyRemoteAccountRecords({
							generationToken,
							records: [record],
							replaceMeta: false,
							stateEpoch: remoteState.state_epoch,
							syncGeneration: remoteState.sync_generation,
							syncStatus: remoteState.sync_status,
							userId: context.user.id,
						});
					}
				);
				return metaResult !== null && metaResult !== false;
			}
		);
		if (lockResult) {
			appliedRecords.push(record);
		} else {
			dirtyNamespaceSet.add(record.namespace);
		}
	}
	if (dirtyRemoteRecords.length > 0) {
		const dirtyMetaResult = await withAccountSyncMetaTransitionLock(
			context.user.id,
			generationToken,
			() => {
				if (!checkCurrentAccountUser(context.user.id)) {
					return false;
				}
				const meta = readAccountSyncMeta(context.user.id) ?? {
					lastAppliedRemoteHash: {},
					revisions: {},
					state_epoch: remoteState.state_epoch,
					sync_generation: remoteState.sync_generation,
					sync_status: remoteState.sync_status,
				};
				for (const record of dirtyRemoteRecords) {
					if (
						readDirtyQueueEntry(
							context.user.id,
							record.namespace
						) === null
					) {
						return false;
					}
					const serializer = getAccountSyncSerializer(
						record.namespace
					);
					const data = serializer.migrate(
						record.data,
						record.schema_version
					);
					meta.lastAppliedRemoteHash[record.namespace] =
						createSnapshotHash(data);
					meta.revisions[record.namespace] = record.revision;
					writeAccountSyncBaseSnapshot({
						data,
						generationToken,
						namespace: record.namespace,
						revision: record.revision,
						userId: context.user.id,
					});
				}
				meta.state_epoch = remoteState.state_epoch;
				meta.sync_generation = remoteState.sync_generation;
				meta.sync_status = remoteState.sync_status;
				writeAccountSyncMeta(context.user.id, meta, {
					generationToken,
				});
				return true;
			}
		);
		if (dirtyMetaResult !== true) {
			accountStore.shared.sync.lastError.set('conflict-reconcile-failed');
			return false;
		}
	}
	postRemoteAppliedBroadcast({
		force: wasCloudPaused,
		records: appliedRecords,
		stateEpoch: remoteState.state_epoch,
		userId: context.user.id,
	});
	setCurrentAccountUserSyncState(
		context.user.id,
		remoteState.state_epoch,
		remoteState.sync_generation,
		remoteState.sync_status
	);
	scheduleAccountSyncFlush();
	recordAccountSyncRefreshSuccess({ userId: context.user.id });

	return true;
}
