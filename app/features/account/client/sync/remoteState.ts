import {
	ACCOUNT_SYNC_STATUS_MAP,
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
} from '@/domain/account/contracts';

import { fetchSyncState } from '@/features/account/client/api';
import { createAccountClientId } from '@/features/account/client/clientId';
import { accountStore } from '@/features/account/client/state/accountStore';
import { SYNC_SCHEMA_VERSION_MAP } from '@/features/account/sync/constants';
import type { IAccountSyncMeta } from '@/features/account/sync/contracts';
import {
	checkSnapshotEqual,
	checkSyncMergeCanApplyAutomatically,
} from '@/features/account/sync/serializers/utils';
import type {
	IAccountSyncBroadcastMessage,
	ISyncConflictItem,
	ISyncStateRecord,
} from '@/features/account/sync/types';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';

import {
	readAccountSyncBaseSnapshot,
	readRetainedAccountSyncBaseSnapshot,
} from './baseSnapshot';
import { postAccountSyncBroadcastMessage } from './broadcast';
import { getAccountSyncTabId, getSyncClientGeneration } from './clientRuntime';
import {
	mergeConflictFromDirtyEntry,
	pauseDirtyEntryWithConflict,
	restoreAccountSyncConflict,
	routePausedConflictMergeResult,
	setAccountSyncConflict,
} from './conflictOrchestration';
import {
	readAccountSyncConflictResolutionJournal,
	removeAccountSyncConflictResolutionJournal,
} from './conflictResolutionJournal';
import {
	checkAccountSyncConflictResolutionJournalsPending,
	recoverAccountSyncConflictResolutionJournals,
} from './conflicts/journalRecovery';
import { reconcileAccountSyncDirtyQueueCollisions } from './conflicts/reconciliation';
import { withAccountSyncNamespaceTransitionLock } from './conflicts/transitionLock';
import {
	readDirtyQueueCollisionState,
	readDirtyQueueEntries,
	readDirtyQueueEntry,
	readIsolatedDirtyQueueNamespaces,
} from './dirtyQueue/collisionEvidence';
import {
	checkSnapshotHashMatches,
	createSnapshotHash,
} from './dirtyQueue/snapshotHash';
import {
	removeDirtyQueueEntryIfCurrent,
	replaceDirtyQueueCollisionIfCurrent,
	writeDirtyQueueEntryIfCurrent,
} from './dirtyQueue/storageTransition';
import { markAccountSyncDirty } from './queue';
import {
	TERMINAL_SYNC_ERROR_PRECEDENCE,
	readMigratedDirtyQueueEntries,
	updatePendingCount,
} from './queueRuntime';
import { getRecordMap, validateRemoteSyncState } from './remoteProtocol';
import {
	captureAccountSyncResetGeneration,
	checkAccountSyncResetWriteAllowed,
	commitAccountSyncResetGeneration,
	prepareAccountSyncResetGeneration,
	readAccountSyncResetGeneration,
	withAccountSyncResetGenerationLock,
} from './resetGeneration';
import { resetAccountSyncCloudStateAfterDelete } from './resetState';
import {
	checkCurrentAccountUser,
	checkCurrentSyncRun,
	handleActiveForbiddenSyncError,
	handleActiveSyncRefreshUnauthorized,
	setCurrentAccountUserStateEpoch,
	setCurrentAccountUserSyncState,
} from './sessionBoundary';
import {
	applyRemoteAccountRecords,
	getAccountSyncSerializer,
	readAccountSyncMeta,
	withAccountSyncMetaTransitionLock,
	withAccountSyncPaused,
	writeAccountSyncMeta,
} from './snapshot';
import { getAccountSyncLifecyclePort } from './syncLifecyclePort';
import {
	clearAccountSyncRuntimeConflicts,
	removeAccountSyncConflict,
	replaceAccountSyncConflicts,
	setAccountSyncFutureStateIsolated,
} from './syncRuntimeState';

export function checkBroadcastStateEpoch(
	message: IAccountSyncBroadcastMessage
) {
	const { state_epoch: stateEpoch } = message;

	return isNonNegativeSafeInteger(stateEpoch);
}

export function checkRemoteStateFresh(userId: string, stateEpoch: number) {
	if (!isNonNegativeSafeInteger(stateEpoch)) {
		return false;
	}

	const currentUser = accountStore.shared.user.get();
	if (currentUser?.id !== userId || stateEpoch < currentUser.state_epoch) {
		return false;
	}

	const currentMeta = readAccountSyncMeta(userId);

	return currentMeta === null || stateEpoch >= currentMeta.state_epoch;
}

interface IPauseAccountSyncForEmptyCloudOptions {
	stateEpoch: number;
	syncGeneration: number;
	userId: string;
}

export async function fetchSyncStateForCurrentUser(
	userId: string,
	generation = getSyncClientGeneration()
) {
	try {
		return validateRemoteSyncState(await fetchSyncState());
	} catch (error) {
		if (handleActiveSyncRefreshUnauthorized(error, userId, generation)) {
			return null;
		}
		if (handleActiveForbiddenSyncError(error, userId, generation)) {
			return null;
		}
		if (
			error instanceof Error &&
			error.message === 'sync-client-update-required' &&
			checkCurrentSyncRun(generation, userId)
		) {
			setAccountSyncFutureStateIsolated(userId, true);
			accountStore.shared.sync.canRetry.set(false);
			accountStore.shared.sync.lastResult.set('failed');
		}

		throw error;
	}
}

export async function fetchValidatedSyncState(namespaces: TSyncNamespace[]) {
	return validateRemoteSyncState(await fetchSyncState(namespaces));
}

export function postRemoteAppliedBroadcast({
	force = false,
	records,
	stateEpoch,
	userId,
}: {
	force?: boolean;
	records: ISyncStateRecord[];
	stateEpoch: number;
	userId: string;
}) {
	if (!force && records.length === 0) {
		return;
	}

	void postAccountSyncBroadcastMessage({
		namespaces: records.map((record) => record.namespace),
		operationId: createAccountClientId(),
		state_epoch: stateEpoch,
		tabId: getAccountSyncTabId(),
		type: 'remote-applied',
		userId,
	});
}

export function checkRemoteStateCleared({
	records,
	stateEpoch,
	userId,
}: {
	records: ISyncStateRecord[];
	stateEpoch: number;
	userId: string;
}) {
	const currentMeta = readAccountSyncMeta(userId);
	if (records.length > 0) {
		return false;
	}

	if (currentMeta !== null && stateEpoch > currentMeta.state_epoch) {
		return true;
	}

	if (currentMeta?.clearedStateEpoch !== stateEpoch) {
		return false;
	}

	return readDirtyQueueEntries(userId).length === 0;
}

function applyRemoteStatePreservingDirtyUnlocked({
	deferredAutoResolutions,
	generationToken,
	records,
	replaceMeta = true,
	stateEpoch,
	syncGeneration,
	syncStatus,
	targetNamespaces,
	userId,
}: {
	deferredAutoResolutions: Array<() => void>;
	generationToken: string | null;
	records: ISyncStateRecord[];
	replaceMeta?: boolean;
	stateEpoch: number;
	syncGeneration: number;
	syncStatus: IAccountSyncMeta['sync_status'];
	targetNamespaces?: TSyncNamespace[];
	userId: string;
}) {
	if (!checkRemoteStateFresh(userId, stateEpoch)) {
		return [];
	}

	const targetNamespaceSet =
		targetNamespaces === undefined ? null : new Set(targetNamespaces);
	const targetRecords =
		targetNamespaceSet === null
			? records
			: records.filter((record) =>
					targetNamespaceSet.has(record.namespace)
				);
	const dirtyEntries = readMigratedDirtyQueueEntries(
		userId,
		generationToken
	).filter(
		(entry) =>
			targetNamespaceSet === null ||
			targetNamespaceSet.has(entry.namespace)
	);
	const preserveNamespaceSet = new Set<TSyncNamespace>();
	const recordMap = getRecordMap(targetRecords);

	dirtyEntries.forEach((entry) => {
		const storedConflict = entry.conflict;
		const wasPausedConflict =
			entry.paused === 'conflict' && storedConflict !== null;
		if (entry.paused === 'conflict' && storedConflict !== null) {
			const serializer = getAccountSyncSerializer(entry.namespace);
			const record = recordMap[entry.namespace];
			const currentCloud =
				record === undefined
					? serializer.getDefaultSnapshot()
					: serializer.migrate(record.data, record.schema_version);
			const storedCloud = serializer.deserialize(storedConflict.cloud);
			if (
				storedConflict.revision === (record?.revision ?? 0) &&
				checkSnapshotEqual(storedCloud, currentCloud)
			) {
				const restoredConflict = restoreAccountSyncConflict(
					storedConflict,
					userId
				);
				if (restoredConflict !== null) {
					setAccountSyncConflict(restoredConflict);
					preserveNamespaceSet.add(entry.namespace);
				}
				return;
			}
		}

		const serializer = getAccountSyncSerializer(entry.namespace);
		const record = recordMap[entry.namespace];
		const cloud =
			record === undefined
				? null
				: serializer.migrate(record.data, record.schema_version);
		const local = serializer.migrate(entry.data, entry.schema_version);
		const cloudSnapshot = cloud ?? serializer.getDefaultSnapshot();
		if (checkSnapshotEqual(local, cloudSnapshot)) {
			if (
				!removeDirtyQueueEntryIfCurrent({
					expectedEntry: entry,
					generationToken,
					userId,
				})
			) {
				preserveNamespaceSet.add(entry.namespace);
				return;
			}
			removeAccountSyncConflict(userId, entry.namespace);
			return;
		}

		const storedBase =
			entry.paused === 'cloud-paused'
				? readRetainedAccountSyncBaseSnapshot(
						userId,
						entry.namespace,
						entry.baseRevision,
						serializer
					)
				: readAccountSyncBaseSnapshot(
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
		if (wasPausedConflict) {
			routePausedConflictMergeResult({
				cloud: cloud ?? serializer.getDefaultSnapshot(),
				deferredAutoResolutions,
				entry,
				generationToken,
				local,
				mergeResult,
				record,
				userId,
			});
			preserveNamespaceSet.add(entry.namespace);
			return;
		}

		if (checkSyncMergeCanApplyAutomatically(mergeResult, cloud)) {
			routePausedConflictMergeResult({
				cloud: cloud ?? serializer.getDefaultSnapshot(),
				deferredAutoResolutions,
				entry,
				generationToken,
				local,
				mergeResult,
				record,
				userId,
			});
			preserveNamespaceSet.add(entry.namespace);
			return;
		}

		pauseDirtyEntryWithConflict({
			conflict:
				mergeResult.conflict === null
					? {
							cloud: cloud ?? serializer.getDefaultSnapshot(),
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
						},
			entry,
			generationToken,
			userId,
		});
		preserveNamespaceSet.add(entry.namespace);
	});

	const recordsToApply = targetRecords.filter(
		(record) => !preserveNamespaceSet.has(record.namespace)
	);
	applyRemoteAccountRecords({
		generationToken,
		preserveNamespaces: [...preserveNamespaceSet],
		records: recordsToApply,
		replaceMeta,
		stateEpoch,
		syncGeneration,
		syncStatus,
		userId,
	});
	recordsToApply.forEach((record) => {
		const schemaVersion = SYNC_SCHEMA_VERSION_MAP[record.namespace];
		if (record.schema_version >= schemaVersion) {
			return;
		}

		const serializer = getAccountSyncSerializer(record.namespace);
		const data = serializer.migrate(record.data, record.schema_version);
		writeDirtyQueueEntryIfCurrent({
			expectedEntry: null,
			generationToken,
			nextEntry: {
				attempts: 0,
				baseRevision: record.revision,
				clientMutationId: createAccountClientId(),
				conflict: null,
				data,
				dirtyAt: Date.now(),
				lastError: null,
				namespace: record.namespace,
				paused: null,
				schema_version: schemaVersion,
				snapshotHash: createSnapshotHash(data),
			},
			userId,
		});
	});
	updatePendingCount();

	return recordsToApply;
}

export async function applyRemoteStatePreservingDirty(options: {
	generationToken: string | null;
	records: ISyncStateRecord[];
	replaceMeta?: boolean;
	stateEpoch: number;
	syncGeneration: number;
	syncStatus: IAccountSyncMeta['sync_status'];
	targetNamespaces?: TSyncNamespace[];
	userId: string;
}) {
	const deferredAutoResolutions: Array<() => void> = [];
	const result = await withAccountSyncMetaTransitionLock(
		options.userId,
		options.generationToken,
		() => {
			if (
				!checkCurrentAccountUser(options.userId) ||
				!checkRemoteStateFresh(options.userId, options.stateEpoch) ||
				!checkAccountSyncResetWriteAllowed({
					expectedGeneration: options.generationToken,
					userId: options.userId,
				})
			) {
				return null;
			}
			return applyRemoteStatePreservingDirtyUnlocked({
				...options,
				deferredAutoResolutions,
			});
		}
	);
	if (result !== null) {
		deferredAutoResolutions.forEach((resolve) => {
			resolve();
		});
	}

	return result;
}

export function restoreAccountSyncRuntimeState(
	userId: string,
	skipJournalRecovery = false
) {
	const resetGeneration = readAccountSyncResetGeneration(userId);
	if (
		resetGeneration.status === 'future' ||
		resetGeneration.status === 'invalid'
	) {
		setAccountSyncFutureStateIsolated(userId, true);
		accountStore.shared.sync.lastError.set(
			resetGeneration.status === 'future'
				? 'sync-reset-marker-future'
				: 'sync-reset-marker-invalid'
		);
		accountStore.shared.sync.lastResult.set('failed');
		updatePendingCount([]);
		return;
	}
	const hasPendingJournal =
		checkAccountSyncConflictResolutionJournalsPending(userId);
	if (hasPendingJournal && !skipJournalRecovery) {
		void recoverAccountSyncConflictResolutionJournals(userId)
			.then(() => {
				if (checkCurrentAccountUser(userId)) {
					restoreAccountSyncRuntimeState(userId, true);
				}
			})
			.catch((error: unknown) => {
				if (checkCurrentAccountUser(userId)) {
					console.warn(
						'Failed to recover account sync conflict journal.',
						{ errorCode: getLogSafeErrorCode(error) }
					);
					setAccountSyncFutureStateIsolated(userId, true);
				}
			});
	}
	const runtimeGenerationToken =
		resetGeneration.status === 'current' ? resetGeneration.raw : null;
	const entries = readMigratedDirtyQueueEntries(
		userId,
		runtimeGenerationToken
	);
	const conflicts = entries
		.map((entry) => {
			if (entry.paused !== 'conflict' || entry.conflict === null) {
				return null;
			}

			return restoreAccountSyncConflict(entry.conflict, userId);
		})
		.filter((conflict): conflict is ISyncConflictItem => conflict !== null);
	const terminalError =
		TERMINAL_SYNC_ERROR_PRECEDENCE.find((message) =>
			entries.some((entry) => entry.lastError === message)
		) ?? null;
	replaceAccountSyncConflicts(userId, conflicts);
	if (
		conflicts.length === 0 &&
		accountStore.shared.sync.lastError.get() === 'conflict'
	) {
		accountStore.shared.sync.lastError.set(null);
	}
	const isolatedNamespaces = readIsolatedDirtyQueueNamespaces(userId);
	if (isolatedNamespaces.length > 0) {
		void reconcileAccountSyncDirtyQueueCollisions(userId)
			.then((results) => {
				if (
					checkCurrentAccountUser(userId) &&
					results.some(
						(result) =>
							result === 'conflict' || result === 'resolved'
					)
				) {
					restoreAccountSyncRuntimeState(userId, true);
					if (results.includes('resolved')) {
						getAccountSyncLifecyclePort().scheduleFlush();
					}
				}
			})
			.catch((error: unknown) => {
				if (!checkCurrentAccountUser(userId)) {
					return;
				}
				console.warn('Failed to quarantine account sync state.', {
					errorCode: getLogSafeErrorCode(error),
				});
				setAccountSyncFutureStateIsolated(userId, true);
				accountStore.shared.sync.lastError.set(
					error instanceof Error &&
						error.message === 'quarantine-storage-failed'
						? 'quarantine-storage-failed'
						: 'conflict-reconcile-failed'
				);
				accountStore.shared.sync.lastResult.set('failed');
			});
	}
	setAccountSyncFutureStateIsolated(
		userId,
		hasPendingJournal ||
			isolatedNamespaces.length > 0 ||
			terminalError === 'sync-schema-update-required'
	);
	if (
		terminalError !== null &&
		conflicts.length === 0 &&
		!hasPendingJournal &&
		isolatedNamespaces.length === 0
	) {
		accountStore.shared.sync.canRetry.set(false);
		accountStore.shared.sync.lastError.set(terminalError);
		accountStore.shared.sync.lastResult.set('failed');
	}
	updatePendingCount(entries);
}

async function pauseAccountSyncForEmptyCloudUnlocked({
	stateEpoch,
	syncGeneration,
	userId,
}: IPauseAccountSyncForEmptyCloudOptions) {
	const user = accountStore.shared.user.get();
	if (
		user?.id !== userId ||
		!isNonNegativeSafeInteger(stateEpoch) ||
		!isNonNegativeSafeInteger(syncGeneration)
	) {
		return false;
	}

	getAccountSyncLifecyclePort().invalidateRuns(userId);

	const resetMarker = await withAccountSyncResetGenerationLock(userId, () => {
		const current = readAccountSyncResetGeneration(userId);
		if (
			current.status === 'current' &&
			current.marker.state_epoch === stateEpoch &&
			(current.marker.phase === 'prepared' ||
				current.marker.phase === 'committed')
		) {
			return current.marker;
		}
		return prepareAccountSyncResetGeneration({
			operationId: createAccountClientId(),
			stateEpoch,
			userId,
		});
	});
	if (resetMarker === null) {
		return false;
	}

	const resetGeneration = readAccountSyncResetGeneration(userId);
	if (
		resetGeneration.status !== 'current' ||
		resetGeneration.marker.operationId !== resetMarker.operationId ||
		resetGeneration.marker.state_epoch !== stateEpoch
	) {
		return false;
	}

	const generationToken = resetGeneration.raw;
	const resetOperationId = resetMarker.operationId;
	if (
		!setCurrentAccountUserSyncState(
			userId,
			stateEpoch,
			syncGeneration,
			ACCOUNT_SYNC_STATUS_MAP.pausedEmpty
		)
	) {
		return false;
	}

	const currentMeta = readAccountSyncMeta(userId);
	writeAccountSyncMeta(
		userId,
		{
			clearedStateEpoch: stateEpoch,
			lastAppliedRemoteHash: currentMeta?.lastAppliedRemoteHash ?? {},
			revisions: currentMeta?.revisions ?? {},
			state_epoch: stateEpoch,
			sync_generation: syncGeneration,
			sync_status: ACCOUNT_SYNC_STATUS_MAP.pausedEmpty,
		},
		{ generationToken, resetOperationId }
	);
	for (const namespace of Object.values(SYNC_NAMESPACE_MAP)) {
		const transitionResult = await withAccountSyncNamespaceTransitionLock(
			userId,
			namespace,
			() => {
				const currentUser = accountStore.shared.user.get();
				if (
					currentUser?.id !== userId ||
					currentUser.sync_generation !== syncGeneration ||
					currentUser.sync_status !==
						ACCOUNT_SYNC_STATUS_MAP.pausedEmpty
				) {
					return false;
				}
				const journal = readAccountSyncConflictResolutionJournal(
					userId,
					namespace
				);
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
				const serializer = getAccountSyncSerializer(namespace);
				const currentMeta = readAccountSyncMeta(userId);
				const data = serializer.getLocalSnapshot();
				const baseRevision = currentMeta?.revisions[namespace] ?? 0;
				const currentEntry = readDirtyQueueEntry(userId, namespace);
				if (
					currentEntry?.paused === 'cloud-paused' &&
					checkSnapshotHashMatches(data, currentEntry.snapshotHash)
				) {
					return true;
				}
				const entry = markAccountSyncDirty({
					baseRevision,
					data,
					generationToken,
					namespace,
					paused: 'cloud-paused',
					replacePausedEntry: true,
					resetOperationId,
					userId,
				});
				if (entry !== null) {
					return true;
				}
				const collision = readDirtyQueueCollisionState(
					userId,
					namespace
				);
				if (collision === null) {
					return false;
				}
				return replaceDirtyQueueCollisionIfCurrent({
					generationToken,
					nextEntry: {
						attempts: 0,
						baseRevision,
						clientMutationId: createAccountClientId(),
						conflict: null,
						data,
						dirtyAt: Date.now(),
						lastError: null,
						namespace,
						paused: 'cloud-paused',
						schema_version: SYNC_SCHEMA_VERSION_MAP[namespace],
						snapshotHash: createSnapshotHash(data),
					},
					resetOperationId,
					token: collision.token,
					userId,
				});
			}
		);
		if (transitionResult !== true) {
			return false;
		}
	}

	if (resetGeneration.marker.phase === 'prepared') {
		const committedGenerationToken =
			await withAccountSyncResetGenerationLock(userId, () =>
				commitAccountSyncResetGeneration({
					expectedRaw: generationToken,
					marker: resetGeneration.marker,
				})
			);
		if (typeof committedGenerationToken !== 'string') {
			return false;
		}
	}

	clearAccountSyncRuntimeConflicts();
	restoreAccountSyncRuntimeState(userId);

	return true;
}

export function pauseAccountSyncForEmptyCloud(
	options: IPauseAccountSyncForEmptyCloudOptions
) {
	return withAccountSyncPaused(() =>
		pauseAccountSyncForEmptyCloudUnlocked(options)
	);
}

function pauseDirtyEntriesAfterRemoteClear({
	generationToken,
	stateEpoch,
	userId,
}: {
	generationToken: string | null;
	stateEpoch: number;
	userId: string;
}) {
	if (!isNonNegativeSafeInteger(stateEpoch)) {
		return false;
	}

	const dirtyEntries = readMigratedDirtyQueueEntries(userId, generationToken);
	if (dirtyEntries.length === 0) {
		return false;
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
		{ generationToken }
	);
	for (const entry of dirtyEntries) {
		const { conflict } = mergeConflictFromDirtyEntry({
			entry,
			record: null,
			userId,
		});
		pauseDirtyEntryWithConflict({
			conflict,
			entry,
			generationToken,
			userId,
		});
	}
	accountStore.shared.sync.lastError.set('conflict');
	updatePendingCount();
	setCurrentAccountUserStateEpoch(userId, stateEpoch);

	return true;
}

export async function handleStateEpochMismatch(
	userId: string,
	generation: number,
	shouldBroadcast = true
) {
	const generationToken = captureAccountSyncResetGeneration(userId);
	const remoteState = await fetchSyncStateForCurrentUser(userId, generation);
	if (remoteState === null) {
		return false;
	}
	if (
		!checkCurrentSyncRun(generation, userId) ||
		!checkRemoteStateFresh(userId, remoteState.state_epoch)
	) {
		return false;
	}
	if (remoteState.sync_status === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty) {
		return pauseAccountSyncForEmptyCloud({
			stateEpoch: remoteState.state_epoch,
			syncGeneration: remoteState.sync_generation,
			userId,
		});
	}
	if (
		checkRemoteStateCleared({
			records: remoteState.records,
			stateEpoch: remoteState.state_epoch,
			userId,
		})
	) {
		const pausedAfterClear = await withAccountSyncMetaTransitionLock(
			userId,
			generationToken,
			() => {
				if (
					!checkCurrentSyncRun(generation, userId) ||
					!checkRemoteStateFresh(userId, remoteState.state_epoch)
				) {
					return null;
				}
				return pauseDirtyEntriesAfterRemoteClear({
					generationToken,
					stateEpoch: remoteState.state_epoch,
					userId,
				});
			}
		);
		if (pausedAfterClear === null) {
			return false;
		}
		if (!pausedAfterClear) {
			const resetResult = await resetAccountSyncCloudStateAfterDelete({
				stateEpoch: remoteState.state_epoch,
				userId,
			});
			if (resetResult === null) {
				return false;
			}
		}
		setCurrentAccountUserStateEpoch(userId, remoteState.state_epoch);
		return true;
	}

	const recordsToApply = await applyRemoteStatePreservingDirty({
		generationToken,
		records: remoteState.records,
		stateEpoch: remoteState.state_epoch,
		syncGeneration: remoteState.sync_generation,
		syncStatus: remoteState.sync_status,
		userId,
	});
	if (recordsToApply === null) {
		return false;
	}
	if (shouldBroadcast) {
		postRemoteAppliedBroadcast({
			records: recordsToApply,
			stateEpoch: remoteState.state_epoch,
			userId,
		});
	}

	const latestMeta = readAccountSyncMeta(userId);
	if (latestMeta !== null) {
		writeAccountSyncMeta(
			userId,
			{
				...latestMeta,
				state_epoch: remoteState.state_epoch,
				sync_generation: remoteState.sync_generation,
				sync_status: remoteState.sync_status,
			},
			{ generationToken }
		);
	}
	setCurrentAccountUserSyncState(
		userId,
		remoteState.state_epoch,
		remoteState.sync_generation,
		remoteState.sync_status
	);

	return true;
}
