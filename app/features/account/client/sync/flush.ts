import {
	ACCOUNT_SYNC_STATUS_MAP,
	type TSyncNamespace,
} from '@/domain/account/contracts';

import { AccountApiError, putSyncState } from '@/features/account/client/api';
import { createAccountClientId } from '@/features/account/client/clientId';
import { accountStore } from '@/features/account/client/state/accountStore';
import type { IAccountSyncMeta } from '@/features/account/sync/contracts';
import { checkSyncMergeCanApplyAutomatically } from '@/features/account/sync/serializers/utils';
import type {
	IDirtyQueueEntry,
	ISyncStateItemCapacityError,
	ISyncStateItemConflict,
	ISyncStatePutResponse,
	TSyncStatePutResult,
} from '@/features/account/sync/types';

import { checkCrossTabNativeLockSupported } from '@/infrastructure/browser/crossTab/withCrossTabLock';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';

import { writeAccountSyncBaseSnapshot } from './baseSnapshot';
import { postAccountSyncBroadcastMessage } from './broadcast';
import {
	clearActiveFlushRun,
	clearLeaseRenewalTimer,
	clearSyncTimers,
	getAccountSyncTabId,
	getActiveFlushRun,
	getForceFlushTimer,
	getQuietFlushTimer,
	getSyncClientGeneration,
	scheduleAccountSyncFlushAfter,
	setActiveFlushRun,
	setForceFlushTimer,
	setLeaseRenewalTimerIfIdle,
	setQuietFlushTimer,
} from './clientRuntime';
import {
	mergeConflictFromDirtyEntry,
	routePausedConflictMergeResult,
} from './conflictOrchestration';
import {
	readDirtyQueueEntry,
	readIsolatedDirtyQueueNamespaces,
} from './dirtyQueue/collisionEvidence';
import {
	checkSnapshotHashMatches,
	checkSnapshotHashesEquivalent,
	createSnapshotHash,
} from './dirtyQueue/snapshotHash';
import {
	ACCOUNT_SYNC_LEASE_RENEW_INTERVAL,
	acquireAccountSyncLease,
	readAccountSyncLease,
	releaseAccountSyncLease,
	renewAccountSyncLease,
} from './lease';
import {
	checkDirtyQueueEntryTerminalError,
	clearTerminalDirtyQueueEntryErrors,
	completeDirtyQueueEntryUpload,
	setDirtyQueueEntryError,
} from './queue';
import {
	checkFlushEntriesStillCurrent,
	getFlushableEntries,
	readMigratedDirtyQueueEntries,
	recordAccountSyncRefreshSuccess,
	updatePendingCount,
} from './queueRuntime';
import { checkRemoteRevision, validateSyncPutResponse } from './remoteProtocol';
import {
	handleStateEpochMismatch,
	restoreAccountSyncRuntimeState,
} from './remoteState';
import {
	captureAccountSyncResetGeneration,
	checkAccountSyncResetPrepared,
	checkAccountSyncResetWriteAllowed,
} from './resetGeneration';
import { scheduleAccountSyncResetRecovery } from './resetRecovery';
import {
	LEASE_BUSY_RETRY_DELAY,
	QUIET_FLUSH_DELAY,
	getRateLimitRetryDelay,
} from './retryPolicy';
import {
	SYNC_AUTHORITY_ERROR_MESSAGES,
	checkCurrentAccountUser,
	checkCurrentSyncRun,
	getLoggedInAccountContext,
	handleForbiddenSyncError,
	resetExpiredAccountSession,
	setCurrentAccountUserSyncState,
} from './sessionBoundary';
import {
	checkAccountSyncPaused,
	readAccountSyncMeta,
	withAccountSyncMetaTransitionLock,
	writeAccountSyncMeta,
} from './snapshot';
import { getAccountSyncLifecyclePort } from './syncLifecyclePort';
import { checkAccountSyncOperationActive } from './syncOperationLease';
import { setAccountSyncFutureStateIsolated } from './syncRuntimeState';

const DIRTY_COUNT_FLUSH_THRESHOLD = 10;

const FORCE_FLUSH_DELAY = 30 * 1000;

const EXPLICIT_FLUSH_MAX_PASSES = 8;

export function stopLeaseRenewal(generation?: number) {
	clearLeaseRenewalTimer(generation);
}

export function startLeaseRenewal(
	userId: string,
	generation: number,
	leaseRunId: string
) {
	setLeaseRenewalTimerIfIdle(generation, () =>
		setInterval(() => {
			void renewAccountSyncLease(
				userId,
				getAccountSyncTabId(),
				leaseRunId
			)
				.then((isRenewed) => {
					if (!isRenewed && checkCurrentSyncRun(generation, userId)) {
						getAccountSyncLifecyclePort().stopRuns();
					}
				})
				.catch(() => {
					if (checkCurrentSyncRun(generation, userId)) {
						getAccountSyncLifecyclePort().stopRuns();
					}
				});
		}, ACCOUNT_SYNC_LEASE_RENEW_INTERVAL)
	);
}

async function handleSuccessfulUpload({
	entry,
	generationToken,
	revision,
	stateEpoch,
	userId,
}: {
	entry: IDirtyQueueEntry;
	generationToken: string | null;
	revision: number;
	stateEpoch: number;
	userId: string;
}) {
	if (
		!checkRemoteRevision(revision) ||
		!isNonNegativeSafeInteger(stateEpoch)
	) {
		throw new Error('invalid-sync-result');
	}

	const result = await withAccountSyncMetaTransitionLock(
		userId,
		generationToken,
		() => {
			const currentEntry = readDirtyQueueEntry(userId, entry.namespace);
			if (
				!checkCurrentAccountUser(userId) ||
				currentEntry === null ||
				!checkSnapshotHashesEquivalent(currentEntry, entry) ||
				!checkAccountSyncResetWriteAllowed({
					expectedGeneration: generationToken,
					userId,
				})
			) {
				return false;
			}

			const meta: IAccountSyncMeta = readAccountSyncMeta(userId) ?? {
				lastAppliedRemoteHash: {},
				revisions: {},
				state_epoch: stateEpoch,
				sync_generation:
					accountStore.shared.user.get()?.sync_generation ?? 0,
				sync_status:
					accountStore.shared.user.get()?.sync_status ??
					ACCOUNT_SYNC_STATUS_MAP.active,
			};
			meta.lastAppliedRemoteHash[entry.namespace] = createSnapshotHash(
				entry.data
			);
			meta.revisions[entry.namespace] = revision;
			meta.state_epoch = stateEpoch;
			writeAccountSyncMeta(userId, meta, { generationToken });
			writeAccountSyncBaseSnapshot({
				data: entry.data,
				generationToken,
				namespace: entry.namespace,
				revision,
				userId,
			});
			const completion = completeDirtyQueueEntryUpload({
				entry,
				generationToken,
				nextBaseRevision: revision,
				userId,
			});
			return checkCurrentAccountUser(userId) &&
				checkAccountSyncResetWriteAllowed({
					expectedGeneration: generationToken,
					userId,
				})
				? completion
				: false;
		}
	);
	if (result === false || result === null) {
		return false;
	}
	restoreAccountSyncRuntimeState(userId);
	return true;
}

async function handleConflictUpload({
	entry,
	generationToken,
	result,
	stateEpoch,
	userId,
}: {
	entry: IDirtyQueueEntry;
	generationToken: string | null;
	result: ISyncStateItemConflict;
	stateEpoch: number;
	userId: string;
}) {
	if (checkSnapshotHashMatches(result.data, entry.snapshotHash)) {
		const didConfirm = await handleSuccessfulUpload({
			entry,
			generationToken,
			revision: result.revision,
			stateEpoch,
			userId,
		});
		return didConfirm ? ('confirmed' as const) : ('stale' as const);
	}

	const merged = mergeConflictFromDirtyEntry({
		entry,
		record:
			result.data === null
				? null
				: {
						data: result.data,
						namespace: result.namespace,
						revision: result.revision,
						schema_version: result.schema_version,
						updated_at: result.updated_at,
					},
		userId,
	});
	const canResolveAutomatically = checkSyncMergeCanApplyAutomatically(
		merged.mergeResult,
		merged.cloud
	);
	const didRoute = routePausedConflictMergeResult({
		cloud: merged.cloud,
		entry,
		generationToken,
		local: merged.conflict.local,
		mergeResult: merged.mergeResult,
		record:
			result.data === null
				? undefined
				: {
						data: result.data,
						namespace: result.namespace,
						revision: result.revision,
						schema_version: result.schema_version,
						updated_at: result.updated_at,
					},
		userId,
	});

	if (!didRoute) {
		return 'stale' as const;
	}

	return canResolveAutomatically
		? ('auto-resolving' as const)
		: ('paused' as const);
}

function createFlushResultMap({
	entries,
	results,
}: {
	entries: IDirtyQueueEntry[];
	results: TSyncStatePutResult[];
}) {
	const entryNamespaceSet = new Set(entries.map((entry) => entry.namespace));
	const resultMap = new Map<TSyncNamespace, TSyncStatePutResult>();

	for (const result of results) {
		if (
			!entryNamespaceSet.has(result.namespace) ||
			resultMap.has(result.namespace)
		) {
			return null;
		}

		resultMap.set(result.namespace, result);
	}

	return resultMap.size === entryNamespaceSet.size ? resultMap : null;
}

function checkSyncCapacityError(
	result: TSyncStatePutResult
): result is ISyncStateItemCapacityError {
	return (
		result.status === 'error' &&
		result.message === 'sync-account-capacity-exceeded'
	);
}

async function requestSyncEntryBatch({
	csrfToken,
	entries,
	stateEpoch,
}: {
	csrfToken: string;
	entries: IDirtyQueueEntry[];
	stateEpoch: number;
}) {
	return validateSyncPutResponse(
		await putSyncState(
			{
				changes: entries.map((entry) => ({
					data: entry.data,
					namespace: entry.namespace,
					revision: entry.baseRevision,
					schema_version: entry.schema_version,
				})),
				state_epoch: stateEpoch,
				sync_generation:
					accountStore.shared.user.get()?.sync_generation ?? 0,
			},
			csrfToken
		)
	);
}

async function requestSyncEntriesWithRequestLimitSplit({
	csrfToken,
	entries,
	stateEpoch,
}: {
	csrfToken: string;
	entries: IDirtyQueueEntry[];
	stateEpoch: number;
}): Promise<ISyncStatePutResponse> {
	try {
		return await requestSyncEntryBatch({ csrfToken, entries, stateEpoch });
	} catch (error) {
		if (!(error instanceof AccountApiError) || error.status !== 413) {
			throw error;
		}
		const [entry] = entries;
		if (entry !== undefined && entries.length === 1) {
			return {
				results: [
					{
						message: 'sync-request-too-large',
						namespace: entry.namespace,
						status: 'error',
					},
				],
				state_epoch: stateEpoch,
				sync_generation:
					accountStore.shared.user.get()?.sync_generation ?? 0,
				sync_status:
					accountStore.shared.user.get()?.sync_status ??
					ACCOUNT_SYNC_STATUS_MAP.active,
			};
		}
	}

	const results: TSyncStatePutResult[] = [];
	let responseStateEpoch = stateEpoch;
	for (const entry of entries) {
		try {
			const response = await requestSyncEntryBatch({
				csrfToken,
				entries: [entry],
				stateEpoch,
			});
			responseStateEpoch = response.state_epoch;
			const [result] = response.results;
			if (result === undefined || response.results.length !== 1) {
				throw new Error('invalid-sync-result');
			}
			results.push(result);
		} catch (error) {
			if (error instanceof AccountApiError && error.status === 413) {
				results.push({
					message: 'sync-request-too-large',
					namespace: entry.namespace,
					status: 'error',
				});
				continue;
			}
			throw error;
		}
	}

	return {
		results,
		state_epoch: responseStateEpoch,
		sync_generation: accountStore.shared.user.get()?.sync_generation ?? 0,
		sync_status:
			accountStore.shared.user.get()?.sync_status ??
			ACCOUNT_SYNC_STATUS_MAP.active,
	};
}

async function requestSyncEntriesWithCapacityRetry({
	csrfToken,
	entries,
	stateEpoch,
}: {
	csrfToken: string;
	entries: IDirtyQueueEntry[];
	stateEpoch: number;
}) {
	const initialResponse = await requestSyncEntriesWithRequestLimitSplit({
		csrfToken,
		entries,
		stateEpoch,
	});
	const initialMap = createFlushResultMap({
		entries,
		results: initialResponse.results,
	});
	if (initialMap === null) {
		throw new Error('invalid-sync-result');
	}
	const shrinkEntries = entries.filter((entry) => {
		const result = initialMap.get(entry.namespace);
		return (
			result !== undefined &&
			checkSyncCapacityError(result) &&
			result.candidate_namespace_bytes < result.current_namespace_bytes
		);
	});
	if (shrinkEntries.length === 0) {
		return initialResponse;
	}

	const finalMap = new Map(initialMap);
	const shrinkResponse = await requestSyncEntriesWithRequestLimitSplit({
		csrfToken,
		entries: shrinkEntries,
		stateEpoch,
	});
	const shrinkMap = createFlushResultMap({
		entries: shrinkEntries,
		results: shrinkResponse.results,
	});
	if (shrinkMap === null) {
		throw new Error('invalid-sync-result');
	}
	shrinkMap.forEach((result, namespace) => {
		finalMap.set(namespace, result);
	});
	const didShrink = [...shrinkMap.values()].some(
		(result) => result.status === 'ok'
	);
	const remainingEntries = entries.filter((entry) => {
		const result = initialMap.get(entry.namespace);
		return (
			result !== undefined &&
			checkSyncCapacityError(result) &&
			!shrinkMap.has(entry.namespace)
		);
	});
	let responseStateEpoch = shrinkResponse.state_epoch;
	if (didShrink && remainingEntries.length > 0) {
		const remainingResponse = await requestSyncEntriesWithRequestLimitSplit(
			{ csrfToken, entries: remainingEntries, stateEpoch }
		);
		const remainingMap = createFlushResultMap({
			entries: remainingEntries,
			results: remainingResponse.results,
		});
		if (remainingMap === null) {
			throw new Error('invalid-sync-result');
		}
		remainingMap.forEach((result, namespace) => {
			finalMap.set(namespace, result);
		});
		responseStateEpoch = remainingResponse.state_epoch;
	}

	return {
		results: entries.map((entry) => {
			const result = finalMap.get(entry.namespace);
			if (result === undefined) {
				throw new Error('invalid-sync-result');
			}
			return result;
		}),
		state_epoch: responseStateEpoch,
		sync_generation: initialResponse.sync_generation,
		sync_status: initialResponse.sync_status,
	} satisfies ISyncStatePutResponse;
}

export async function flushAccountSyncQueue() {
	const generation = getSyncClientGeneration();
	const context = getLoggedInAccountContext();
	if (context === null) {
		return true;
	}
	if (context.user.sync_status === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty) {
		clearSyncTimers();
		updatePendingCount();
		return true;
	}
	if (checkAccountSyncResetPrepared(context.user.id)) {
		return false;
	}
	const entryGenerationToken = captureAccountSyncResetGeneration(
		context.user.id
	);

	const allEntries = readMigratedDirtyQueueEntries(
		context.user.id,
		entryGenerationToken
	);
	let entries = allEntries.filter(
		(entry) =>
			entry.paused === null &&
			!readIsolatedDirtyQueueNamespaces(context.user.id).includes(
				entry.namespace
			) &&
			!checkDirtyQueueEntryTerminalError(entry)
	);
	updatePendingCount(allEntries);
	if (entries.length === 0) {
		clearSyncTimers();
		return allEntries.length === 0;
	}
	if (
		checkAccountSyncPaused() ||
		checkAccountSyncOperationActive(context.user.id)
	) {
		return false;
	}

	const flushRunId = createAccountClientId();
	const activeFlushRun = getActiveFlushRun();
	if (activeFlushRun !== null) {
		if (
			activeFlushRun.generation === generation &&
			activeFlushRun.userId === context.user.id
		) {
			void activeFlushRun.promise.then((isFlushed) => {
				if (
					checkCurrentSyncRun(generation, context.user.id) &&
					(!isFlushed ||
						getFlushableEntries(
							context.user.id,
							entryGenerationToken
						).length > 0)
				) {
					// eslint-disable-next-line @typescript-eslint/no-use-before-define
					scheduleAccountSyncFlush();
				}
			});

			return activeFlushRun.promise;
		}

		setActiveFlushRun(null);
	}

	const flushPromise = (async () => {
		let didAcquireLease = false;
		let retryAfterFlushDelay = LEASE_BUSY_RETRY_DELAY;
		let shouldScheduleRetryAfterFlush = false;
		let shouldCheckLeaseBeforeWrite = false;

		try {
			const operationGenerationToken = entryGenerationToken;
			const leaseResult = await acquireAccountSyncLease(
				context.user.id,
				getAccountSyncTabId(),
				flushRunId
			);
			if (!leaseResult.acquired) {
				shouldScheduleRetryAfterFlush = true;
				return false;
			}
			didAcquireLease = true;
			shouldCheckLeaseBeforeWrite = !checkCrossTabNativeLockSupported();

			if (!checkCurrentSyncRun(generation, context.user.id)) {
				return false;
			}

			clearSyncTimers();
			startLeaseRenewal(context.user.id, generation, flushRunId);
			if (shouldCheckLeaseBeforeWrite) {
				const lease = readAccountSyncLease(context.user.id);
				if (
					lease === null ||
					lease.expiresAt <= Date.now() ||
					lease.ownerTabId !== getAccountSyncTabId() ||
					lease.ownerRunId !== flushRunId
				) {
					shouldScheduleRetryAfterFlush = true;
					return false;
				}
			}
			accountStore.shared.sync.isSyncing.set(true);
			const checkFlushTerminalPreflight = (
				entriesToCheck: IDirtyQueueEntry[] = entries
			) => {
				const lease = readAccountSyncLease(context.user.id);
				return (
					checkCurrentSyncRun(generation, context.user.id) &&
					!checkAccountSyncOperationActive(context.user.id) &&
					checkAccountSyncResetWriteAllowed({
						expectedGeneration: operationGenerationToken,
						userId: context.user.id,
					}) &&
					lease !== null &&
					lease.expiresAt > Date.now() &&
					lease.ownerTabId === getAccountSyncTabId() &&
					lease.ownerRunId === flushRunId &&
					checkFlushEntriesStillCurrent(
						context.user.id,
						entriesToCheck
					)
				);
			};
			entries = getFlushableEntries(
				context.user.id,
				operationGenerationToken
			);
			if (entries.length === 0) {
				return false;
			}
			if (!checkFlushTerminalPreflight()) {
				shouldScheduleRetryAfterFlush =
					getFlushableEntries(
						context.user.id,
						operationGenerationToken
					).length > 0;
				return false;
			}

			const response = await requestSyncEntriesWithCapacityRetry({
				csrfToken: context.csrfToken,
				entries,
				stateEpoch: context.user.state_epoch,
			});
			if (!checkFlushTerminalPreflight()) {
				return false;
			}
			const currentUser = accountStore.shared.user.get();
			if (
				currentUser?.id !== context.user.id ||
				response.state_epoch < currentUser.state_epoch
			) {
				return false;
			}

			const resultMap = createFlushResultMap({
				entries,
				results: response.results,
			});
			if (resultMap === null) {
				throw new Error('invalid-sync-result');
			}

			let unresolvedReason: string | null = null;
			const uploadedNamespaces: TSyncNamespace[] = [];
			const checkAfterFlushHandler = (
				remainingEntries: IDirtyQueueEntry[]
			) => {
				if (checkFlushTerminalPreflight(remainingEntries)) {
					return true;
				}
				restoreAccountSyncRuntimeState(context.user.id);
				shouldScheduleRetryAfterFlush = true;
				return false;
			};
			for (const [entryIndex, entry] of entries.entries()) {
				const remainingEntries = entries.slice(entryIndex + 1);
				if (!checkFlushTerminalPreflight(entries.slice(entryIndex))) {
					restoreAccountSyncRuntimeState(context.user.id);
					return false;
				}
				const result = resultMap.get(entry.namespace);
				if (result === undefined) {
					throw new Error('invalid-sync-result');
				}
				if (result.status === 'ok') {
					const didHandle = await handleSuccessfulUpload({
						entry,
						generationToken: operationGenerationToken,
						revision: result.revision,
						stateEpoch: response.state_epoch,
						userId: context.user.id,
					});
					if (!didHandle) {
						shouldScheduleRetryAfterFlush = true;
						return false;
					}
					if (!checkAfterFlushHandler(remainingEntries)) {
						return false;
					}
					uploadedNamespaces.push(result.namespace);
					continue;
				}
				if (result.status === 'conflict') {
					const conflictResult = await handleConflictUpload({
						entry,
						generationToken: operationGenerationToken,
						result,
						stateEpoch: response.state_epoch,
						userId: context.user.id,
					});
					if (!checkAfterFlushHandler(remainingEntries)) {
						return false;
					}
					if (conflictResult === 'confirmed') {
						uploadedNamespaces.push(result.namespace);
						continue;
					}
					if (conflictResult === 'auto-resolving') {
						continue;
					}
					if (conflictResult === 'stale') {
						shouldScheduleRetryAfterFlush = true;
					}
					unresolvedReason = 'conflict';
					continue;
				}
				if (result.message === 'sync-schema-update-required') {
					setAccountSyncFutureStateIsolated(context.user.id, true);
					accountStore.shared.sync.canRetry.set(false);
				}

				setDirtyQueueEntryError({
					entry,
					generationToken: operationGenerationToken,
					message: result.message,
					userId: context.user.id,
				});
				unresolvedReason ??= result.message;
				if (!checkAfterFlushHandler(remainingEntries)) {
					return false;
				}
			}
			if (!checkAfterFlushHandler([])) {
				return false;
			}
			setCurrentAccountUserSyncState(
				context.user.id,
				response.state_epoch,
				response.sync_generation,
				response.sync_status
			);

			recordAccountSyncRefreshSuccess({
				unresolvedReason,
				userId: context.user.id,
			});
			if (uploadedNamespaces.length > 0) {
				void postAccountSyncBroadcastMessage({
					namespaces: uploadedNamespaces,
					operationId: createAccountClientId(),
					state_epoch: response.state_epoch,
					tabId: getAccountSyncTabId(),
					type: 'uploaded',
					userId: context.user.id,
				});
			}

			return unresolvedReason === null;
		} catch (error) {
			if (
				error instanceof Error &&
				error.message === 'sync-client-update-required' &&
				checkCurrentSyncRun(generation, context.user.id)
			) {
				setAccountSyncFutureStateIsolated(context.user.id, true);
				accountStore.shared.sync.canRetry.set(false);
				accountStore.shared.sync.lastResult.set('failed');
				return false;
			}
			if (error instanceof AccountApiError && error.status === 429) {
				if (!checkCurrentSyncRun(generation, context.user.id)) {
					return false;
				}

				shouldScheduleRetryAfterFlush =
					getFlushableEntries(context.user.id, entryGenerationToken)
						.length > 0;
				retryAfterFlushDelay =
					getRateLimitRetryDelay(error) ?? retryAfterFlushDelay;
				accountStore.shared.sync.canRetry.set(false);
				accountStore.shared.sync.lastError.set(error.message);
				accountStore.shared.sync.lastResult.set('failed');
				return false;
			}
			if (error instanceof AccountApiError && error.status === 401) {
				if (checkCurrentSyncRun(generation, context.user.id)) {
					getAccountSyncLifecyclePort().stopRuns();
					resetExpiredAccountSession();
				}
				return false;
			}
			if (error instanceof AccountApiError && error.status === 403) {
				if (checkCurrentSyncRun(generation, context.user.id)) {
					handleForbiddenSyncError(error);
				}
				return false;
			}
			if (
				error instanceof Error &&
				SYNC_AUTHORITY_ERROR_MESSAGES.includes(error.message)
			) {
				try {
					const didRefresh = await handleStateEpochMismatch(
						context.user.id,
						generation
					);
					if (
						!didRefresh ||
						!checkCurrentSyncRun(generation, context.user.id)
					) {
						return false;
					}

					shouldScheduleRetryAfterFlush =
						getFlushableEntries(
							context.user.id,
							entryGenerationToken
						).length > 0;
					accountStore.shared.sync.canRetry.set(false);
					accountStore.shared.sync.failedAttempts.set(0);
					accountStore.shared.sync.lastError.set(
						accountStore.shared.sync.conflicts.get().length > 0
							? 'conflict'
							: null
					);
					accountStore.shared.sync.lastResult.set('partial');
					return false;
				} catch (refreshError) {
					if (!checkCurrentSyncRun(generation, context.user.id)) {
						return false;
					}
					if (
						refreshError instanceof AccountApiError &&
						refreshError.status === 429
					) {
						shouldScheduleRetryAfterFlush =
							getFlushableEntries(
								context.user.id,
								entryGenerationToken
							).length > 0;
						retryAfterFlushDelay =
							getRateLimitRetryDelay(refreshError) ??
							retryAfterFlushDelay;
						accountStore.shared.sync.canRetry.set(false);
						accountStore.shared.sync.lastError.set(
							refreshError.message
						);
						accountStore.shared.sync.lastResult.set('failed');
						return false;
					}

					accountStore.shared.sync.lastError.set(
						refreshError instanceof Error
							? refreshError.message
							: 'sync-refresh-failed'
					);
					accountStore.shared.sync.lastResult.set('failed');
					return false;
				}
			}
			if (!checkCurrentSyncRun(generation, context.user.id)) {
				return false;
			}

			accountStore.shared.sync.canRetry.set(true);
			accountStore.shared.sync.failedAttempts.set(
				(attempts) => attempts + 1
			);
			accountStore.shared.sync.lastError.set(
				error instanceof Error ? error.message : 'sync-failed'
			);
			accountStore.shared.sync.lastResult.set('failed');
			return false;
		} finally {
			const isCurrentRun = checkCurrentSyncRun(
				generation,
				context.user.id
			);
			if (isCurrentRun) {
				accountStore.shared.sync.isSyncing.set(false);
				updatePendingCount();
			}
			if (didAcquireLease) {
				stopLeaseRenewal(generation);
				try {
					await releaseAccountSyncLease(
						context.user.id,
						getAccountSyncTabId(),
						flushRunId
					);
				} catch (error) {
					console.warn('Failed to release account sync lease.', {
						errorCode: getLogSafeErrorCode(error),
					});
				}
			}
			clearActiveFlushRun({
				generation,
				runId: flushRunId,
				userId: context.user.id,
			});
			if (didAcquireLease && isCurrentRun) {
				void postAccountSyncBroadcastMessage({
					namespaces: [],
					operationId: createAccountClientId(),
					state_epoch: context.user.state_epoch,
					tabId: getAccountSyncTabId(),
					type: 'lease-changed',
					userId: context.user.id,
				});
			}
			if (isCurrentRun && shouldScheduleRetryAfterFlush) {
				scheduleAccountSyncFlushAfter(retryAfterFlushDelay, () => {
					void flushAccountSyncQueue();
				});
			}
		}
	})();
	setActiveFlushRun({
		generation,
		promise: flushPromise,
		runId: flushRunId,
		userId: context.user.id,
	});
	return flushPromise;
}

export function scheduleAccountSyncFlush() {
	const context = getLoggedInAccountContext();
	if (context === null) {
		return;
	}

	// Synchronous scheduler boundary; migrations use this one captured token.
	const generationToken = captureAccountSyncResetGeneration(context.user.id);
	const allEntries = readMigratedDirtyQueueEntries(
		context.user.id,
		generationToken
	);
	const entries = allEntries.filter(
		(entry) =>
			entry.paused === null && !checkDirtyQueueEntryTerminalError(entry)
	);
	updatePendingCount(allEntries);

	if (entries.length === 0) {
		clearSyncTimers();
		return;
	}
	if (checkAccountSyncPaused()) {
		return;
	}

	if (entries.length >= DIRTY_COUNT_FLUSH_THRESHOLD) {
		void flushAccountSyncQueue();
		return;
	}

	if (getQuietFlushTimer() === null) {
		setQuietFlushTimer(
			setTimeout(() => {
				setQuietFlushTimer(null);
				void flushAccountSyncQueue();
			}, QUIET_FLUSH_DELAY)
		);
	}
	if (getForceFlushTimer() === null) {
		setForceFlushTimer(
			setTimeout(() => {
				setForceFlushTimer(null);
				void flushAccountSyncQueue();
			}, FORCE_FLUSH_DELAY)
		);
	}
}

export async function flushAccountSyncQueueUntilIdle() {
	const context = getLoggedInAccountContext();
	if (context === null) {
		return true;
	}
	const generationToken = captureAccountSyncResetGeneration(context.user.id);

	for (let pass = 0; pass < EXPLICIT_FLUSH_MAX_PASSES; pass += 1) {
		if (!checkCurrentAccountUser(context.user.id)) {
			return false;
		}

		const isFlushed = await flushAccountSyncQueue();
		if (!isFlushed || !checkCurrentAccountUser(context.user.id)) {
			return false;
		}

		const entries = readMigratedDirtyQueueEntries(
			context.user.id,
			generationToken
		);
		updatePendingCount(entries);
		if (entries.length === 0) {
			clearSyncTimers();
			return true;
		}
	}

	scheduleAccountSyncFlush();

	return false;
}

export function retryAccountSyncQueue() {
	const context = getLoggedInAccountContext();
	if (context !== null) {
		if (checkAccountSyncResetPrepared(context.user.id)) {
			scheduleAccountSyncResetRecovery(
				context.user.id,
				undefined,
				undefined,
				true
			);
			accountStore.shared.sync.canRetry.set(false);
			return Promise.resolve(false);
		}
		clearTerminalDirtyQueueEntryErrors(context.user.id);
	}
	return flushAccountSyncQueue();
}
