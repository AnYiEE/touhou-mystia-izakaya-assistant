import {
	ACCOUNT_SYNC_STATUS_MAP,
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
} from '@/domain/account/contracts';

import {
	AccountApiError,
	rebuildSyncState,
} from '@/features/account/client/api';
import { createAccountClientId } from '@/features/account/client/clientId';
import { accountStore } from '@/features/account/client/state/accountStore';
import {
	ACCOUNT_SYNC_OPERATION_KIND_MAP,
	SYNC_SCHEMA_VERSION_MAP,
} from '@/features/account/sync/constants';
import type { IAccountSyncMeta } from '@/features/account/sync/contracts';
import type { ISyncStateGetResponse } from '@/features/account/sync/types';

import { writeAccountSyncBaseSnapshot } from './baseSnapshot';
import { withAccountSyncNamespaceTransitionLock } from './conflicts/transitionLock';
import { readDirtyQueueEntry } from './dirtyQueue/collisionEvidence';
import { createSnapshotHash } from './dirtyQueue/snapshotHash';
import {
	removeDirtyQueueEntryIfCurrent,
	writeDirtyQueueEntryIfCurrent,
} from './dirtyQueue/storageTransition';
import { scheduleAccountSyncFlush } from './flush';
import { takeOverLocalAccountData } from './localTakeover';
import { recordAccountSyncRefreshSuccess } from './queueRuntime';
import {
	getRecordMap,
	readRemoteSyncData,
	validateRemoteSyncState,
} from './remoteProtocol';
import {
	postRemoteAppliedBroadcast,
	restoreAccountSyncRuntimeState,
} from './remoteState';
import {
	captureAccountSyncResetGeneration,
	checkAccountSyncResetPrepared,
} from './resetGeneration';
import {
	checkCurrentAccountUser,
	getLoggedInAccountContext,
	setCurrentAccountUserSyncState,
} from './sessionBoundary';
import {
	getAccountSyncSerializer,
	withAccountSyncMetaTransitionLock,
	writeAccountSyncMeta,
} from './snapshot';
import { withAccountSyncOperationLease } from './syncOperationLease';
import { clearAccountSyncRuntimeConflicts } from './syncRuntimeState';

interface IAccountSyncRebuildCapture {
	dirtyEntryHash: string | null;
	localSnapshotHash: string;
}

async function applySuccessfulAccountSyncRebuild({
	captures,
	remoteState,
	userId,
}: {
	captures: Map<TSyncNamespace, IAccountSyncRebuildCapture>;
	remoteState: ISyncStateGetResponse;
	userId: string;
}) {
	const currentUser = accountStore.shared.user.get();
	if (
		remoteState.sync_status !== ACCOUNT_SYNC_STATUS_MAP.active ||
		currentUser?.id !== userId ||
		remoteState.state_epoch <= currentUser.state_epoch ||
		remoteState.sync_generation <= currentUser.sync_generation
	) {
		return false;
	}

	const generationToken = captureAccountSyncResetGeneration(userId);
	const recordMap = getRecordMap(remoteState.records);
	const nextMeta: IAccountSyncMeta = {
		lastAppliedRemoteHash: {},
		revisions: {},
		state_epoch: remoteState.state_epoch,
		sync_generation: remoteState.sync_generation,
		sync_status: remoteState.sync_status,
	};

	for (const namespace of Object.values(SYNC_NAMESPACE_MAP)) {
		const capture = captures.get(namespace);
		const record = recordMap[namespace];
		if (capture === undefined || record?.revision !== 1) {
			return false;
		}
		const didApply = await withAccountSyncNamespaceTransitionLock(
			userId,
			namespace,
			() => {
				if (!checkCurrentAccountUser(userId)) {
					return false;
				}
				const serializer = getAccountSyncSerializer(namespace);
				const cloud = readRemoteSyncData(record);
				if (
					createSnapshotHash(cloud) !== capture.localSnapshotHash ||
					!writeAccountSyncBaseSnapshot({
						data: cloud,
						generationToken,
						namespace,
						revision: record.revision,
						userId,
					})
				) {
					return false;
				}
				nextMeta.lastAppliedRemoteHash[namespace] =
					createSnapshotHash(cloud);
				nextMeta.revisions[namespace] = record.revision;

				const currentEntry = readDirtyQueueEntry(userId, namespace);
				const currentEntryHash =
					currentEntry === null
						? null
						: createSnapshotHash(currentEntry);
				const currentLocal = serializer.deserialize(
					serializer.getLocalSnapshot()
				);
				const isRequestSnapshotCurrent =
					currentEntryHash === capture.dirtyEntryHash &&
					createSnapshotHash(currentLocal) ===
						capture.localSnapshotHash;
				if (isRequestSnapshotCurrent) {
					return (
						currentEntry === null ||
						removeDirtyQueueEntryIfCurrent({
							expectedEntry: currentEntry,
							generationToken,
							userId,
						})
					);
				}

				return writeDirtyQueueEntryIfCurrent({
					expectedEntry: currentEntry,
					generationToken,
					nextEntry: {
						attempts: 0,
						baseRevision: record.revision,
						clientMutationId: createAccountClientId(),
						conflict: null,
						data: currentLocal,
						dirtyAt: Date.now(),
						lastError: null,
						namespace,
						paused: null,
						schema_version: SYNC_SCHEMA_VERSION_MAP[namespace],
						snapshotHash: createSnapshotHash(currentLocal),
					},
					userId,
				});
			}
		);
		if (didApply !== true) {
			return false;
		}
	}

	const didWriteMeta = await withAccountSyncMetaTransitionLock(
		userId,
		generationToken,
		() => {
			if (!checkCurrentAccountUser(userId)) {
				return false;
			}
			writeAccountSyncMeta(userId, nextMeta, { generationToken });
			return true;
		}
	);
	if (
		didWriteMeta !== true ||
		!setCurrentAccountUserSyncState(
			userId,
			remoteState.state_epoch,
			remoteState.sync_generation,
			remoteState.sync_status
		)
	) {
		return false;
	}

	clearAccountSyncRuntimeConflicts();
	restoreAccountSyncRuntimeState(userId);
	postRemoteAppliedBroadcast({
		force: true,
		records: remoteState.records,
		stateEpoch: remoteState.state_epoch,
		userId,
	});
	scheduleAccountSyncFlush();
	recordAccountSyncRefreshSuccess({ userId });

	return true;
}

export async function rebuildAccountSyncCloudFromLocal() {
	const context = getLoggedInAccountContext();
	if (
		context?.user.sync_status !== ACCOUNT_SYNC_STATUS_MAP.pausedEmpty ||
		checkAccountSyncResetPrepared(context.user.id)
	) {
		return false;
	}

	const reconcileRebuildResult = async () => {
		const didReconcile = await takeOverLocalAccountData();
		return (
			didReconcile &&
			accountStore.shared.user.get()?.sync_status ===
				ACCOUNT_SYNC_STATUS_MAP.active
		);
	};

	const result = await withAccountSyncOperationLease(
		context.user.id,
		ACCOUNT_SYNC_OPERATION_KIND_MAP.rebuildCloud,
		async () => {
			const currentContext = getLoggedInAccountContext();
			if (
				currentContext?.user.id !== context.user.id ||
				currentContext.user.sync_status !==
					ACCOUNT_SYNC_STATUS_MAP.pausedEmpty ||
				checkAccountSyncResetPrepared(context.user.id)
			) {
				return false;
			}
			const captures = new Map<
				TSyncNamespace,
				IAccountSyncRebuildCapture
			>();
			const changes = Object.values(SYNC_NAMESPACE_MAP).map(
				(namespace) => {
					const serializer = getAccountSyncSerializer(namespace);
					const localSnapshot = serializer.deserialize(
						serializer.getLocalSnapshot()
					);
					const dirtyEntry = readDirtyQueueEntry(
						context.user.id,
						namespace
					);
					captures.set(namespace, {
						dirtyEntryHash:
							dirtyEntry === null
								? null
								: createSnapshotHash(dirtyEntry),
						localSnapshotHash: createSnapshotHash(localSnapshot),
					});
					return {
						data: serializer.serialize(localSnapshot),
						namespace,
						revision: 0,
						schema_version: SYNC_SCHEMA_VERSION_MAP[namespace],
					};
				}
			);
			try {
				const remoteState = validateRemoteSyncState(
					await rebuildSyncState(
						{
							changes,
							state_epoch: currentContext.user.state_epoch,
							sync_generation:
								currentContext.user.sync_generation,
						},
						currentContext.csrfToken
					)
				);
				const didApply = await applySuccessfulAccountSyncRebuild({
					captures,
					remoteState,
					userId: context.user.id,
				});
				return didApply || (await reconcileRebuildResult());
			} catch (error) {
				if (
					error instanceof AccountApiError &&
					error.status === 409 &&
					(await reconcileRebuildResult())
				) {
					return true;
				}
				throw error;
			}
		}
	);

	return result === true;
}
