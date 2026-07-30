import { accountStore } from '@/features/account/client/state/accountStore';

import { recordAccountSyncRefreshSuccess } from './queueRuntime';
import { readAccountSyncResetGeneration } from './resetGeneration';
import { LEASE_BUSY_RETRY_DELAY } from './retryPolicy';
import { checkCurrentAccountUser } from './sessionBoundary';
import { getAccountSyncLifecyclePort } from './syncLifecyclePort';
import { withAccountSyncOperationLease } from './syncOperationLease';
import { setAccountSyncFutureStateIsolated } from './syncRuntimeState';

const RESET_RECOVERY_ERROR_REPORT_ATTEMPTS = 3;

const RESET_RECOVERY_MAX_RETRY_DELAY = 60 * 1000;

interface IAccountSyncResetRecovery {
	attempts: number;
	deleteStartedAt?: number;
	failures: number;
	key: string;
	operationId: string;
	running: boolean;
	timer: ReturnType<typeof setTimeout> | null;
	userId: string;
}

const resetRecoveries = new Map<string, IAccountSyncResetRecovery>();

function clearAccountSyncResetRecovery(recovery: IAccountSyncResetRecovery) {
	if (recovery.timer !== null) {
		clearTimeout(recovery.timer);
		recovery.timer = null;
	}
	if (resetRecoveries.get(recovery.key) === recovery) {
		resetRecoveries.delete(recovery.key);
	}
}

export function clearAccountSyncResetRecoveries(userId?: string) {
	for (const recovery of resetRecoveries.values()) {
		if (userId === undefined || recovery.userId === userId) {
			clearAccountSyncResetRecovery(recovery);
		}
	}
}

function recordAccountSyncResetRecoveryFailure(
	recovery: IAccountSyncResetRecovery
) {
	if (
		recovery.failures < RESET_RECOVERY_ERROR_REPORT_ATTEMPTS ||
		!checkCurrentAccountUser(recovery.userId)
	) {
		return;
	}
	accountStore.shared.sync.canRetry.set(true);
	accountStore.shared.sync.lastError.set('account-sync-reset-incomplete');
	accountStore.shared.sync.lastResult.set('failed');
}

function clearAccountSyncResetRecoveryError(userId: string) {
	if (
		checkCurrentAccountUser(userId) &&
		accountStore.shared.sync.lastError.get() ===
			'account-sync-reset-incomplete'
	) {
		recordAccountSyncRefreshSuccess({ userId });
	}
}

function createAccountSyncResetRecoveryKey(
	userId: string,
	stateEpoch: number | null,
	operationId: string
) {
	return `${userId}:${stateEpoch ?? 'pending'}:${operationId}`;
}

export function scheduleAccountSyncResetRecovery(
	userId: string,
	operationId?: string,
	deleteStartedAt?: number,
	rearm = false
) {
	const resetGeneration = readAccountSyncResetGeneration(userId);
	if (
		resetGeneration.status === 'future' ||
		resetGeneration.status === 'invalid'
	) {
		clearAccountSyncResetRecoveries(userId);
		setAccountSyncFutureStateIsolated(userId, true);
		accountStore.shared.sync.lastError.set(
			resetGeneration.status === 'future'
				? 'sync-reset-marker-future'
				: 'sync-reset-marker-invalid'
		);
		accountStore.shared.sync.lastResult.set('failed');
		return;
	}
	if (
		resetGeneration.status === 'current' &&
		resetGeneration.marker.phase !== 'prepared'
	) {
		clearAccountSyncResetRecoveries(userId);
		clearAccountSyncResetRecoveryError(userId);
		return;
	}

	const preparedMarker =
		resetGeneration.status === 'current' ? resetGeneration.marker : null;
	const effectiveOperationId = preparedMarker?.operationId ?? operationId;
	if (effectiveOperationId === undefined) {
		return;
	}
	const effectiveDeleteStartedAt =
		preparedMarker?.deleteStartedAt ?? deleteStartedAt;
	const key = createAccountSyncResetRecoveryKey(
		userId,
		preparedMarker?.state_epoch ?? null,
		effectiveOperationId
	);

	for (const recovery of resetRecoveries.values()) {
		if (recovery.userId === userId && recovery.key !== key) {
			clearAccountSyncResetRecovery(recovery);
		}
	}

	let recovery = resetRecoveries.get(key);
	if (recovery === undefined) {
		recovery = {
			attempts: 0,
			...(effectiveDeleteStartedAt === undefined
				? {}
				: { deleteStartedAt: effectiveDeleteStartedAt }),
			failures: 0,
			key,
			operationId: effectiveOperationId,
			running: false,
			timer: null,
			userId,
		};
		resetRecoveries.set(key, recovery);
	} else if (effectiveDeleteStartedAt !== undefined) {
		recovery.deleteStartedAt = effectiveDeleteStartedAt;
	}

	if (recovery.running) {
		return;
	}
	if (recovery.timer !== null) {
		if (!rearm) {
			return;
		}
		clearTimeout(recovery.timer);
		recovery.timer = null;
	}

	const delay = rearm
		? 0
		: Math.min(
				RESET_RECOVERY_MAX_RETRY_DELAY,
				LEASE_BUSY_RETRY_DELAY * 2 ** Math.min(recovery.attempts, 5)
			);
	const scheduledRecovery = recovery;
	scheduledRecovery.timer = setTimeout(() => {
		scheduledRecovery.timer = null;
		if (resetRecoveries.get(key) !== scheduledRecovery) {
			return;
		}
		if (!checkCurrentAccountUser(userId)) {
			clearAccountSyncResetRecovery(scheduledRecovery);
			return;
		}

		const currentGeneration = readAccountSyncResetGeneration(userId);
		if (
			currentGeneration.status === 'current' &&
			currentGeneration.marker.phase !== 'prepared'
		) {
			clearAccountSyncResetRecovery(scheduledRecovery);
			clearAccountSyncResetRecoveryError(userId);
			return;
		}
		if (
			currentGeneration.status === 'current' &&
			(currentGeneration.marker.operationId !==
				scheduledRecovery.operationId ||
				createAccountSyncResetRecoveryKey(
					userId,
					currentGeneration.marker.state_epoch,
					currentGeneration.marker.operationId
				) !== key)
		) {
			clearAccountSyncResetRecovery(scheduledRecovery);
			scheduleAccountSyncResetRecovery(
				userId,
				undefined,
				undefined,
				true
			);
			return;
		}

		scheduledRecovery.running = true;
		scheduledRecovery.attempts += 1;
		let didRunRecovery = false;
		void withAccountSyncOperationLease(userId, 'delete-data', () => {
			didRunRecovery = true;
			return getAccountSyncLifecyclePort().takeOverLocalData({
				operationId: scheduledRecovery.operationId,
				...(scheduledRecovery.deleteStartedAt === undefined
					? {}
					: { deleteStartedAt: scheduledRecovery.deleteStartedAt }),
			});
		})
			.then((recovered) => {
				if (recovered === true) {
					clearAccountSyncResetRecovery(scheduledRecovery);
					return;
				}
				if (didRunRecovery) {
					scheduledRecovery.failures += 1;
					recordAccountSyncResetRecoveryFailure(scheduledRecovery);
				}
			})
			.catch(() => {
				scheduledRecovery.failures += 1;
				recordAccountSyncResetRecoveryFailure(scheduledRecovery);
			})
			.finally(() => {
				scheduledRecovery.running = false;
				if (resetRecoveries.get(key) !== scheduledRecovery) {
					return;
				}
				scheduleAccountSyncResetRecovery(
					userId,
					scheduledRecovery.operationId,
					scheduledRecovery.deleteStartedAt
				);
			});
	}, delay);
}
