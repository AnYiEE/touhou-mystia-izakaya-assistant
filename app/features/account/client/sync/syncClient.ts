import { ACCOUNT_SYNC_STATUS_MAP } from '@/domain/account/contracts';

import {
	consumeAccountRuntimeInvalidationOperation,
	createAccountRuntimeSignalKey,
	parseAccountRuntimeSignal,
} from '@/features/account/client/accountRuntimeInvalidation';
import { createAccountClientId } from '@/features/account/client/clientId';
import { accountStore } from '@/features/account/client/state/accountStore';
import {
	ACCOUNT_STORAGE_KEY_MAP,
	createAccountStorageKey,
} from '@/features/account/client/storage';

import { getSafeStorageMode } from '@/infrastructure/browser/storage/safeStorage';

import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';

import { flushAccountSyncQueueWithBeacon } from './beacon';
import {
	postAccountSyncBroadcastMessage,
	subscribeAccountSyncBroadcastMessage,
} from './broadcast';
import {
	clearSyncTimers,
	getAccountSyncTabId,
	getSyncClientGeneration,
	scheduleAccountSyncFlushAfter,
	setActiveFlushRun,
	setSyncClientGeneration,
	setVisibilityOperationId,
} from './clientRuntime';
import {
	CONFLICT_HEARTBEAT_INTERVAL,
	REMOTE_CONFLICT_NOTICE_REASONS,
} from './conflictOrchestration';
import { reconcileAccountSyncPausedConflicts } from './conflicts/reconciliation';
import {
	readDirtyQueueEntry,
	recordAccountSyncDirtyQueueExternalMutation,
} from './dirtyQueue/collisionEvidence';
import { matchDirtyQueueStorageKey } from './dirtyQueue/keys';
import {
	flushAccountSyncQueue,
	scheduleAccountSyncFlush,
	stopLeaseRenewal,
} from './flush';
import { takeOverLocalAccountData } from './localTakeover';
import { updatePendingCount } from './queueRuntime';
import {
	applyRemoteStatePreservingDirty,
	checkBroadcastStateEpoch,
	checkRemoteStateFresh,
	fetchValidatedSyncState,
	handleStateEpochMismatch,
	pauseAccountSyncForEmptyCloud,
	restoreAccountSyncRuntimeState,
} from './remoteState';
import {
	captureAccountSyncResetGeneration,
	checkAccountSyncResetPrepared,
} from './resetGeneration';
import {
	clearAccountSyncResetRecoveries,
	scheduleAccountSyncResetRecovery,
} from './resetRecovery';
import { LEASE_BUSY_RETRY_DELAY } from './retryPolicy';
import {
	checkCurrentSyncRun,
	getLoggedInAccountContext,
	handlePassiveSyncRefreshError,
	setCurrentAccountUserStateEpoch,
	setCurrentAccountUserSyncState,
} from './sessionBoundary';
import { getAccountSessionRefreshPort } from './sessionRefreshPort';
import {
	type IAccountSyncTakeoverOptions,
	registerAccountSyncLifecyclePort,
} from './syncLifecyclePort';
import {
	ACCOUNT_SYNC_OPERATION_TTL,
	applyAccountSyncOperationLeaseSignal,
	checkAccountSyncOperationActive,
} from './syncOperationLease';
import {
	addAccountSyncRemoteConflictNotices,
	removeAccountSyncRemoteConflictNotices,
} from './syncRuntimeState';

const ACCOUNT_STATE_RESUME_REFRESH_DEDUPE_MS = 1000;

function runAfterAccountSyncPromiseSettles(
	promise: Promise<unknown>,
	callback: () => void
) {
	void promise.finally(callback).catch(() => {});
}

export function invalidateAccountSyncClientRuns(userId?: string) {
	setSyncClientGeneration(getSyncClientGeneration() + 1);
	if (userId !== undefined) {
		clearAccountSyncResetRecoveries(userId);
	}
	setActiveFlushRun(null);
	setVisibilityOperationId(null);
	clearSyncTimers();
	stopLeaseRenewal();
	accountStore.shared.sync.isSyncing.set(false);
}

export function stopAccountSyncClient() {
	invalidateAccountSyncClientRuns();
	clearAccountSyncResetRecoveries();
}

export function startAccountSyncClient() {
	setSyncClientGeneration(getSyncClientGeneration() + 1);
	clearSyncTimers();
	stopLeaseRenewal();
	accountStore.shared.sync.isSyncing.set(false);
	const unsubscribeBroadcast = subscribeAccountSyncBroadcastMessage(
		(message) => {
			const context = getLoggedInAccountContext();
			if (message.tabId === getAccountSyncTabId()) {
				return;
			}
			if (message.type === 'account-updated') {
				if (message.accountRuntime !== undefined) {
					const signal = parseAccountRuntimeSignal({
						key: createAccountRuntimeSignalKey(message.userId),
						value: JSON.stringify({
							...message.accountRuntime,
							operationId: message.operationId,
							state_epoch: message.state_epoch,
							userId: message.userId,
						}),
					});
					if (signal === null) {
						return;
					}
				} else if (
					typeof message.operationId !== 'string' ||
					message.operationId === '' ||
					typeof message.userId !== 'string' ||
					message.userId === '' ||
					!isNonNegativeSafeInteger(message.state_epoch)
				) {
					return;
				}
				if (
					!consumeAccountRuntimeInvalidationOperation(
						`${message.userId}:${message.operationId}`
					)
				) {
					return;
				}
				const expectedUserId = context?.user.id ?? message.userId;
				const generation = getSyncClientGeneration();
				void getAccountSessionRefreshPort()
					.refreshFromInvalidation()
					.catch((error: unknown) => {
						handlePassiveSyncRefreshError(
							error,
							expectedUserId,
							generation
						);
					});
				return;
			}
			if (message.type === 'profile-updated') {
				const expectedUserId = context?.user.id ?? message.userId;
				const generation = getSyncClientGeneration();
				void getAccountSessionRefreshPort()
					.refreshFromInvalidation()
					.catch((error: unknown) => {
						handlePassiveSyncRefreshError(
							error,
							expectedUserId,
							generation
						);
					});
				return;
			}
			if (context?.user.id !== message.userId) {
				return;
			}

			if (message.type === 'dirty' || message.type === 'lease-changed') {
				if (message.type === 'dirty') {
					restoreAccountSyncRuntimeState(context.user.id);
					if (message.runtimeReason === 'conflict-resolved') {
						removeAccountSyncRemoteConflictNotices(
							context.user.id,
							message.namespaces,
							message.runtimeMutationId ?? null
						);
					} else if (
						REMOTE_CONFLICT_NOTICE_REASONS.has(
							message.runtimeReason
						) &&
						getSafeStorageMode() !== 'local'
					) {
						const restoredNamespaces = new Set(
							accountStore.shared.sync.conflicts
								.get()
								.map(({ namespace }) => namespace)
						);
						const remoteNoticeNamespaces =
							message.namespaces.filter(
								(namespace) =>
									!restoredNamespaces.has(namespace)
							);
						addAccountSyncRemoteConflictNotices(
							context.user.id,
							remoteNoticeNamespaces,
							message.runtimeMutationId ?? null
						);
					} else if (getSafeStorageMode() === 'local') {
						removeAccountSyncRemoteConflictNotices(
							context.user.id,
							message.namespaces
						);
					}
				} else if (
					message.syncOperation === undefined ||
					!applyAccountSyncOperationLeaseSignal({
						expiresAt: message.syncOperation.expiresAt,
						operationId: message.operationId,
						status: message.syncOperation.status,
						userId: message.userId,
					})
				) {
					return;
				} else if (
					message.syncOperation.status === 'started' ||
					message.syncOperation.status === 'renewed'
				) {
					invalidateAccountSyncClientRuns();
					scheduleAccountSyncFlushAfter(
						ACCOUNT_SYNC_OPERATION_TTL + 100,
						() => {
							void flushAccountSyncQueue();
						}
					);
					return;
				} else {
					runAfterAccountSyncPromiseSettles(
						reconcileAccountSyncPausedConflicts(context.user.id),
						scheduleAccountSyncFlush
					);
					return;
				}
				scheduleAccountSyncFlush();
				return;
			}

			if (message.type === 'uploaded') {
				const expectedUserId = context.user.id;
				const generation = getSyncClientGeneration();
				const generationToken =
					captureAccountSyncResetGeneration(expectedUserId);
				updatePendingCount();
				void fetchValidatedSyncState(message.namespaces)
					.then(async (remoteState) => {
						if (
							!checkCurrentSyncRun(generation, expectedUserId) ||
							!checkRemoteStateFresh(
								expectedUserId,
								remoteState.state_epoch
							)
						) {
							return;
						}

						const applied = await applyRemoteStatePreservingDirty({
							generationToken,
							records: remoteState.records,
							replaceMeta: false,
							stateEpoch: remoteState.state_epoch,
							syncGeneration: remoteState.sync_generation,
							syncStatus: remoteState.sync_status,
							targetNamespaces: message.namespaces,
							userId: expectedUserId,
						});
						if (applied === null) {
							setTimeout(() => {
								void handleStateEpochMismatch(
									expectedUserId,
									generation,
									false
								).catch((error: unknown) => {
									handlePassiveSyncRefreshError(
										error,
										expectedUserId,
										generation
									);
								});
							}, LEASE_BUSY_RETRY_DELAY);
							return;
						}
						setCurrentAccountUserStateEpoch(
							expectedUserId,
							remoteState.state_epoch
						);
					})
					.catch((error: unknown) => {
						handlePassiveSyncRefreshError(
							error,
							expectedUserId,
							generation
						);
					});
				return;
			}

			if (message.type === 'data-deleted') {
				if (!checkBroadcastStateEpoch(message)) {
					return;
				}
				const expectedUserId = context.user.id;
				void fetchValidatedSyncState([])
					.then(async (remoteState) => {
						if (
							remoteState.sync_status ===
							ACCOUNT_SYNC_STATUS_MAP.pausedEmpty
						) {
							await pauseAccountSyncForEmptyCloud({
								stateEpoch: remoteState.state_epoch,
								syncGeneration: remoteState.sync_generation,
								userId: expectedUserId,
							});
						}
					})
					.catch((error: unknown) => {
						handlePassiveSyncRefreshError(
							error,
							expectedUserId,
							getSyncClientGeneration()
						);
					});
				return;
			}

			const expectedUserId = context.user.id;
			const generation = getSyncClientGeneration();
			const generationToken =
				captureAccountSyncResetGeneration(expectedUserId);
			void fetchValidatedSyncState(message.namespaces)
				.then(async (remoteState) => {
					if (
						!checkCurrentSyncRun(generation, expectedUserId) ||
						!checkRemoteStateFresh(
							expectedUserId,
							remoteState.state_epoch
						)
					) {
						return;
					}
					if (
						remoteState.sync_status ===
						ACCOUNT_SYNC_STATUS_MAP.pausedEmpty
					) {
						await pauseAccountSyncForEmptyCloud({
							stateEpoch: remoteState.state_epoch,
							syncGeneration: remoteState.sync_generation,
							userId: expectedUserId,
						});
						return;
					}
					if (
						accountStore.shared.user.get()?.sync_status ===
						ACCOUNT_SYNC_STATUS_MAP.pausedEmpty
					) {
						await takeOverLocalAccountData();
						return;
					}

					const applied = await applyRemoteStatePreservingDirty({
						generationToken,
						records: remoteState.records,
						replaceMeta: false,
						stateEpoch: remoteState.state_epoch,
						syncGeneration: remoteState.sync_generation,
						syncStatus: remoteState.sync_status,
						targetNamespaces: message.namespaces,
						userId: expectedUserId,
					});
					if (applied === null) {
						setTimeout(() => {
							void handleStateEpochMismatch(
								expectedUserId,
								generation,
								false
							).catch((error: unknown) => {
								handlePassiveSyncRefreshError(
									error,
									expectedUserId,
									generation
								);
							});
						}, LEASE_BUSY_RETRY_DELAY);
						return;
					}
					setCurrentAccountUserSyncState(
						expectedUserId,
						remoteState.state_epoch,
						remoteState.sync_generation,
						remoteState.sync_status
					);
				})
				.catch((error: unknown) => {
					handlePassiveSyncRefreshError(
						error,
						expectedUserId,
						generation
					);
				});
		}
	);
	let lastAccountStateResumeRefreshAt = 0;
	const scheduleAccountStateResumeRefresh = () => {
		const now = Date.now();
		if (
			now - lastAccountStateResumeRefreshAt <
			ACCOUNT_STATE_RESUME_REFRESH_DEDUPE_MS
		) {
			return;
		}
		lastAccountStateResumeRefreshAt = now;

		const expectedUserId = accountStore.shared.user.get()?.id ?? null;
		const generation = getSyncClientGeneration();
		void getAccountSessionRefreshPort()
			.refreshFromInvalidation()
			.catch((error: unknown) => {
				if (expectedUserId !== null) {
					handlePassiveSyncRefreshError(
						error,
						expectedUserId,
						generation
					);
				}
			});
	};
	const onVisibilityChange = () => {
		if (document.visibilityState === 'visible') {
			setVisibilityOperationId(null);
			scheduleAccountStateResumeRefresh();
			scheduleAccountSyncFlush();
		} else {
			flushAccountSyncQueueWithBeacon();
		}
	};
	const conflictHeartbeat = setInterval(() => {
		const context = getLoggedInAccountContext();
		if (context === null) {
			return;
		}
		const conflicts = accountStore.shared.sync.conflicts
			.get()
			.filter(({ userId }) => userId === context.user.id);
		for (const conflict of conflicts) {
			const entry = readDirtyQueueEntry(
				context.user.id,
				conflict.namespace
			);
			if (entry?.paused !== 'conflict') {
				continue;
			}
			void postAccountSyncBroadcastMessage({
				namespaces: [conflict.namespace],
				operationId: createAccountClientId(),
				runtimeMutationId: entry.clientMutationId,
				runtimeReason: 'conflict-heartbeat',
				state_epoch: context.user.state_epoch,
				tabId: getAccountSyncTabId(),
				type: 'dirty',
				userId: context.user.id,
			});
		}
	}, CONFLICT_HEARTBEAT_INTERVAL);
	const onPageHide = () => {
		flushAccountSyncQueueWithBeacon();
	};
	const onRetrySignal = () => {
		scheduleAccountStateResumeRefresh();
		const context = getLoggedInAccountContext();
		if (context !== null) {
			if (checkAccountSyncResetPrepared(context.user.id)) {
				scheduleAccountSyncResetRecovery(
					context.user.id,
					undefined,
					undefined,
					true
				);
			}
			restoreAccountSyncRuntimeState(context.user.id);
			runAfterAccountSyncPromiseSettles(
				reconcileAccountSyncPausedConflicts(context.user.id),
				scheduleAccountSyncFlush
			);
			return;
		}
		scheduleAccountSyncFlush();
	};
	const onStorage = (event: StorageEvent) => {
		const context = getLoggedInAccountContext();
		if (
			context !== null &&
			event.key ===
				`${ACCOUNT_STORAGE_KEY_MAP.resetGeneration}:${context.user.id}`
		) {
			if (checkAccountSyncResetPrepared(context.user.id)) {
				scheduleAccountSyncResetRecovery(
					context.user.id,
					undefined,
					undefined,
					true
				);
			}
			return;
		}
		if (
			context !== null &&
			event.key ===
				`${ACCOUNT_STORAGE_KEY_MAP.syncOperation}:${context.user.id}`
		) {
			if (checkAccountSyncOperationActive(context.user.id)) {
				invalidateAccountSyncClientRuns();
				scheduleAccountSyncFlushAfter(
					ACCOUNT_SYNC_OPERATION_TTL + 100,
					() => {
						void flushAccountSyncQueue();
					}
				);
			} else {
				runAfterAccountSyncPromiseSettles(
					reconcileAccountSyncPausedConflicts(context.user.id),
					scheduleAccountSyncFlush
				);
			}
			return;
		}
		const runtimeSignalPrefix = createAccountStorageKey(
			ACCOUNT_STORAGE_KEY_MAP.runtimeSignal,
			''
		);
		if (event.key?.startsWith(runtimeSignalPrefix) === true) {
			const signal = parseAccountRuntimeSignal({
				key: event.key,
				value: event.newValue,
			});
			if (
				signal === null ||
				!consumeAccountRuntimeInvalidationOperation(
					`${signal.userId}:${signal.operationId}`
				)
			) {
				return;
			}
			const expectedUserId = context?.user.id ?? signal.userId;
			void getAccountSessionRefreshPort()
				.refreshFromInvalidation()
				.catch((error: unknown) => {
					handlePassiveSyncRefreshError(
						error,
						expectedUserId,
						getSyncClientGeneration()
					);
				});
			return;
		}
		if (context !== null) {
			const dirtyQueueStorageKeyMatch = matchDirtyQueueStorageKey(
				context.user.id,
				event.key
			);
			if (dirtyQueueStorageKeyMatch === null) {
				return;
			}
			if (dirtyQueueStorageKeyMatch.kind === 'known') {
				recordAccountSyncDirtyQueueExternalMutation({
					isLegacyKey: dirtyQueueStorageKeyMatch.isLegacyKey,
					namespace: dirtyQueueStorageKeyMatch.namespace,
					newValue: event.newValue,
					oldValue: event.oldValue,
					userId: context.user.id,
				});
			}
			restoreAccountSyncRuntimeState(context.user.id);
			scheduleAccountSyncFlush();
		}
	};

	document.addEventListener('visibilitychange', onVisibilityChange);
	globalThis.addEventListener('focus', onRetrySignal);
	globalThis.addEventListener('online', onRetrySignal);
	globalThis.addEventListener('pageshow', onRetrySignal);
	globalThis.addEventListener('pagehide', onPageHide);
	globalThis.addEventListener('storage', onStorage);

	const initialContext = getLoggedInAccountContext();
	if (initialContext !== null) {
		if (checkAccountSyncResetPrepared(initialContext.user.id)) {
			scheduleAccountSyncResetRecovery(initialContext.user.id);
		}
		restoreAccountSyncRuntimeState(initialContext.user.id);
		runAfterAccountSyncPromiseSettles(
			reconcileAccountSyncPausedConflicts(initialContext.user.id),
			scheduleAccountSyncFlush
		);
	}

	return () => {
		stopAccountSyncClient();
		clearInterval(conflictHeartbeat);
		setVisibilityOperationId(null);
		unsubscribeBroadcast();
		document.removeEventListener('visibilitychange', onVisibilityChange);
		globalThis.removeEventListener('focus', onRetrySignal);
		globalThis.removeEventListener('online', onRetrySignal);
		globalThis.removeEventListener('pageshow', onRetrySignal);
		globalThis.removeEventListener('pagehide', onPageHide);
		globalThis.removeEventListener('storage', onStorage);
	};
}

const accountSyncLifecyclePort = {
	invalidateRuns: invalidateAccountSyncClientRuns,
	restoreRuntimeState: restoreAccountSyncRuntimeState,
	scheduleFlush: scheduleAccountSyncFlush,
	stopRuns: stopAccountSyncClient,
	takeOverLocalData: (options?: IAccountSyncTakeoverOptions) =>
		takeOverLocalAccountData(
			options?.operationId,
			options?.deleteStartedAt
		),
};

registerAccountSyncLifecyclePort(accountSyncLifecyclePort);
