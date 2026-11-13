import { publishAccountRuntimeInvalidation } from '@/features/account/client/accountRuntimeInvalidation';
import { AccountApiError } from '@/features/account/client/api';
import { resetAccountState } from '@/features/account/client/session';
import { accountStore } from '@/features/account/client/state/accountStore';
import { readAccountWorkspacePendingAuth } from '@/features/account/client/workspace/authRuntime';
import { checkAccountWorkspaceUserId } from '@/features/account/client/workspace/ownerStorage';
import {
	checkWorkspaceAccount,
	workspaceStore,
} from '@/features/account/client/workspace/workspaceStore';
import type { IAccountSyncMeta } from '@/features/account/sync/contracts';
import { FEATURE_ACCESS_API_RESPONSE_CODE_MAP } from '@/features/featureAccess/apiResponseCodes';
import { isFeatureModuleAllowed } from '@/features/featureAccess/client/access';

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

function getActiveGuestAdoptionContext() {
	const pendingAuth = readAccountWorkspacePendingAuth();
	const owner = workspaceStore.owner.get();
	if (
		pendingAuth === null ||
		owner?.kind !== 'guest' ||
		owner.generation !== pendingAuth.expectedWorkspaceGeneration ||
		workspaceStore.phase.get() !== 'transitioning' ||
		!pendingAuth.featureAccess.modules['account.sync'].allowed
	) {
		return null;
	}

	return pendingAuth;
}

export function getLoggedInAccountContext() {
	const guestAdoption = getActiveGuestAdoptionContext();
	if (guestAdoption !== null) {
		return { csrfToken: guestAdoption.csrfToken, user: guestAdoption.user };
	}

	const csrfToken = accountStore.shared.csrfToken.get();
	const user = accountStore.shared.user.get();

	if (
		csrfToken === null ||
		user === null ||
		workspaceStore.phase.get() !== 'ready' ||
		!checkWorkspaceAccount(workspaceStore.owner.get(), user.id) ||
		!isFeatureModuleAllowed('account.sync')
	) {
		return null;
	}

	return { csrfToken, user };
}

export function getCurrentSyncAccountUser() {
	return (
		getActiveGuestAdoptionContext()?.user ?? accountStore.shared.user.get()
	);
}

export function checkCurrentAccountUser(userId: string) {
	const user = getCurrentSyncAccountUser();
	if (user?.id !== userId) {
		return false;
	}
	if (getActiveGuestAdoptionContext()?.user.id === userId) {
		return true;
	}

	return (
		workspaceStore.phase.get() === 'ready' &&
		checkWorkspaceAccount(workspaceStore.owner.get(), userId)
	);
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

	const guestAdoption = getActiveGuestAdoptionContext();
	if (guestAdoption !== null && guestAdoption.user.id === userId) {
		if (stateEpoch < guestAdoption.user.state_epoch) {
			return false;
		}
		if (guestAdoption.user.state_epoch !== stateEpoch) {
			guestAdoption.user = {
				...guestAdoption.user,
				state_epoch: stateEpoch,
			};
		}
		return true;
	}

	const user = accountStore.shared.user.get();
	if (
		user?.id !== userId ||
		!checkWorkspaceAccount(workspaceStore.owner.get(), userId)
	) {
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

	const guestAdoption = getActiveGuestAdoptionContext();
	if (guestAdoption !== null && guestAdoption.user.id === userId) {
		if (
			guestAdoption.user.sync_generation !== syncGeneration ||
			guestAdoption.user.sync_status !== syncStatus
		) {
			guestAdoption.user = {
				...guestAdoption.user,
				sync_generation: syncGeneration,
				sync_status: syncStatus,
			};
		}
		return true;
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
	const owner = workspaceStore.owner.get();
	if (owner === null) {
		resetAccountState();
		return;
	}

	void import('@/features/account/client/workspace/lifecycle').then(
		({ reconcileAccountWorkspace }) =>
			reconcileAccountWorkspace({
				authOutcome: { kind: 'session-expired' },
				source: 'runtime-invalidation',
			})
	);
}

function handleAccountDisabledSyncError(error: AccountApiError) {
	const owner = workspaceStore.owner.get();
	const responseUserId = error.data?.['user_id'];
	const sessionUserId = checkAccountWorkspaceUserId(responseUserId)
		? responseUserId
		: undefined;
	if (owner === null || sessionUserId === undefined) {
		resetExpiredAccountSession();
		return;
	}
	void import('@/features/account/client/workspace/lifecycle').then(
		({ reconcileAccountWorkspace }) =>
			reconcileAccountWorkspace({
				authOutcome: { kind: 'account-disabled', sessionUserId },
				source: 'runtime-invalidation',
			})
	);
}

function handlePasswordRequiredSyncError() {
	const user = accountStore.shared.user.get();
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

function checkDisabledSessionUserId(error: AccountApiError) {
	return checkAccountWorkspaceUserId(error.data?.['user_id']);
}

function handleOtherForbiddenSyncError(error: AccountApiError) {
	accountStore.shared.sync.canRetry.set(true);
	accountStore.shared.sync.lastError.set(error.message);
	accountStore.shared.sync.lastResult.set('failed');
}

function finishForbiddenSyncError(error: AccountApiError) {
	if (
		error.message === 'user-disabled' &&
		(error.data?.['user_id'] === undefined ||
			checkDisabledSessionUserId(error))
	) {
		getAccountSyncLifecyclePort().stopRuns();
		handleAccountDisabledSyncError(error);
		return true;
	}
	if (error.message === 'password-must-change') {
		handlePasswordRequiredSyncError();
		return true;
	}
	handleOtherForbiddenSyncError(error);
	return true;
}

export function handleForbiddenSyncError(error: AccountApiError) {
	accountStore.shared.sync.canRetry.set(false);
	accountStore.shared.sync.failedAttempts.set(0);
	accountStore.shared.sync.lastResult.set('failed');

	if (error.message === FEATURE_ACCESS_API_RESPONSE_CODE_MAP.denied) {
		accountStore.shared.sync.lastError.set(null);
		getAccountSyncLifecyclePort().stopRuns();
		void getAccountSessionRefreshPort()
			.refreshFromInvalidation()
			.catch(() => {});
		return;
	}

	accountStore.shared.sync.lastError.set(error.message);
	finishForbiddenSyncError(error);
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
