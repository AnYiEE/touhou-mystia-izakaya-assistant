import { publishAccountRuntimeInvalidation } from '@/features/account/client/accountRuntimeInvalidation';
import { AccountApiError } from '@/features/account/client/api';
import {
	resetAccountState,
	resetAccountStateAfterSessionExpired,
} from '@/features/account/client/session';
import { accountStore } from '@/features/account/client/state/accountStore';
import type { IAccountSyncMeta } from '@/features/account/sync/contracts';

import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';

import {
	getSyncClientGeneration,
	scheduleAccountSyncFlushAfter,
} from './clientRuntime';
import { LEASE_BUSY_RETRY_DELAY, getRateLimitRetryDelay } from './retryPolicy';
import { getAccountSessionRefreshPort } from './sessionRefreshPort';
import { getAccountSyncLifecyclePort } from './syncLifecyclePort';
import { setAccountSyncFutureStateIsolated } from './syncRuntimeState';

export const SYNC_AUTHORITY_ERROR_MESSAGES: string[] = [
	'state-epoch-mismatch',
	'sync-generation-mismatch',
	'sync-paused',
];

export function getLoggedInAccountContext() {
	const csrfToken = accountStore.shared.csrfToken.get();
	const user = accountStore.shared.user.get();

	if (csrfToken === null || user === null) {
		return null;
	}

	return { csrfToken, user };
}

export function checkCurrentAccountUser(userId: string) {
	return accountStore.shared.user.get()?.id === userId;
}

export function checkCurrentSyncRun(generation: number, userId: string) {
	return (
		getSyncClientGeneration() === generation &&
		checkCurrentAccountUser(userId)
	);
}

export function setCurrentAccountUserStateEpoch(
	userId: string,
	stateEpoch: number
) {
	if (!isNonNegativeSafeInteger(stateEpoch)) {
		return false;
	}

	const user = accountStore.shared.user.get();
	if (user?.id !== userId) {
		return false;
	}
	if (stateEpoch < user.state_epoch) {
		return false;
	}

	if (user.state_epoch !== stateEpoch) {
		accountStore.shared.user.set({ ...user, state_epoch: stateEpoch });
	}

	return true;
}

export function setCurrentAccountUserSyncState(
	userId: string,
	stateEpoch: number,
	syncGeneration: number,
	syncStatus: IAccountSyncMeta['sync_status']
) {
	if (!setCurrentAccountUserStateEpoch(userId, stateEpoch)) {
		return false;
	}

	const user = accountStore.shared.user.get();
	if (user?.id !== userId) {
		return false;
	}

	if (
		user.sync_generation !== syncGeneration ||
		user.sync_status !== syncStatus
	) {
		accountStore.shared.user.set({
			...user,
			sync_generation: syncGeneration,
			sync_status: syncStatus,
		});
	}

	return true;
}

export function resetExpiredAccountSession() {
	const user = accountStore.shared.user.get();
	if (user === null) {
		resetAccountState();
		return;
	}

	resetAccountStateAfterSessionExpired({
		expectedCsrfToken: accountStore.shared.csrfToken.get(),
		expectedUserId: user.id,
		stateEpoch: user.state_epoch,
	});
}

export function handleForbiddenSyncError(error: AccountApiError) {
	const user = accountStore.shared.user.get();
	accountStore.shared.sync.canRetry.set(false);
	accountStore.shared.sync.failedAttempts.set(0);
	accountStore.shared.sync.lastError.set(error.message);
	accountStore.shared.sync.lastResult.set('failed');

	if (error.message !== 'password-must-change') {
		getAccountSyncLifecyclePort().stopRuns();
		resetExpiredAccountSession();
		return;
	}

	void getAccountSessionRefreshPort()
		.refreshFromInvalidation()
		.then(() => {
			if (user !== null) {
				return publishAccountRuntimeInvalidation({
					reason: 'password-required',
					stateEpoch: user.state_epoch,
					userId: user.id,
				});
			}
			return false;
		})
		.catch(() => {
			accountStore.shared.sync.canRetry.set(true);
		});
}

export function handlePassiveSyncRefreshError(
	error: unknown,
	expectedUserId: string,
	generation: number
) {
	if (!checkCurrentSyncRun(generation, expectedUserId)) {
		return;
	}
	if (
		Error.isError(error) &&
		error.message === 'sync-client-update-required'
	) {
		setAccountSyncFutureStateIsolated(expectedUserId, true);
		accountStore.shared.sync.canRetry.set(false);
		accountStore.shared.sync.lastResult.set('failed');
		return;
	}

	if (error instanceof AccountApiError && error.status === 401) {
		getAccountSyncLifecyclePort().stopRuns();
		resetExpiredAccountSession();
		return;
	}
	if (error instanceof AccountApiError && error.status === 403) {
		handleForbiddenSyncError(error);
		return;
	}
	if (error instanceof AccountApiError && error.status === 429) {
		accountStore.shared.sync.canRetry.set(false);
		accountStore.shared.sync.lastError.set(error.message);
		scheduleAccountSyncFlushAfter(
			getRateLimitRetryDelay(error) ?? LEASE_BUSY_RETRY_DELAY,
			() => {
				getAccountSyncLifecyclePort().scheduleFlush();
			}
		);
		return;
	}

	accountStore.shared.sync.canRetry.set(true);
	accountStore.shared.sync.lastError.set(
		Error.isError(error) ? error.message : 'sync-refresh-failed'
	);
}

export function handleActiveSyncRefreshUnauthorized(
	error: unknown,
	expectedUserId: string,
	generation: number
) {
	if (
		!(error instanceof AccountApiError) ||
		error.status !== 401 ||
		!checkCurrentSyncRun(generation, expectedUserId)
	) {
		return false;
	}

	getAccountSyncLifecyclePort().stopRuns();
	resetExpiredAccountSession();
	return true;
}

export function handleActiveForbiddenSyncError(
	error: unknown,
	expectedUserId: string,
	generation: number
) {
	if (
		!(error instanceof AccountApiError) ||
		error.status !== 403 ||
		!checkCurrentSyncRun(generation, expectedUserId)
	) {
		return false;
	}

	handleForbiddenSyncError(error);
	return true;
}
