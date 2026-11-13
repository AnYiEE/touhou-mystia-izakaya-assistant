import type {
	IAuthLoginSuccessResponse,
	TAccountMeResponse,
} from '@/features/account/contracts';

import { normalizeServiceRetryAfterSeconds } from '@/infrastructure/http/client/fetchServiceApi';

import { AccountApiError, fetchAccountMe } from './api';
import { accountStore } from './state/accountStore';
import { readAccountSyncResetGeneration } from './sync/resetGeneration';
import { registerAccountSessionRefreshPort } from './sync/sessionRefreshPort';
import { readAccountSyncMeta } from './sync/snapshot';
import { withAccountSyncPaused } from './sync/stateGuards';
import { getAccountSyncLifecyclePort } from './sync/syncLifecyclePort';
import { clearAccountSyncRuntimeConflicts } from './sync/syncRuntimeState';
import {
	checkWorkspaceAccount,
	workspaceStore,
} from './workspace/workspaceStore';

let accountStateRequestGeneration = 0;
let activeAccountStateRefresh: Promise<TAccountMeResponse | null> | null = null;
let accountStateRefreshPending = false;

function requestAccountStateTrailingRefresh() {
	accountStateRefreshPending = true;
}

function consumeAccountStateTrailingRefreshRequest() {
	accountStateRefreshPending = false;
}

function checkAccountStateTrailingRefreshRequested() {
	return accountStateRefreshPending;
}

function resetPostLoginBootstrapState() {
	/* Reserved for lifecycle-owned bootstrap generation cleanup. */
}

export function advanceAccountStateRequestGeneration() {
	accountStateRequestGeneration += 1;
	if (activeAccountStateRefresh !== null) {
		requestAccountStateTrailingRefresh();
	}

	return accountStateRequestGeneration;
}

function checkCurrentAccountStateRequest(generation: number) {
	return generation === accountStateRequestGeneration;
}

export function resetAccountSyncRuntime() {
	accountStore.shared.sync.canRetry.set(false);
	clearAccountSyncRuntimeConflicts();
	accountStore.shared.sync.failedAttempts.set(0);
	accountStore.shared.sync.isSyncing.set(false);
	accountStore.shared.sync.lastError.set(null);
	accountStore.shared.sync.lastResult.set(null);
	accountStore.shared.sync.lastSyncedAt.set(null);
	accountStore.shared.sync.pendingCount.set(0);
}

export function clearAccountSessionInitialData() {
	accountStore.shared.sessionInitialData.set(null);
	accountStore.shared.ssoGrantInitialData.set(null);
	accountStore.shared.webauthnInitialData.set(null);
}

function hasAccountAuthContextChanged(
	previousUserId: string | null,
	previousCsrfToken: string | null,
	nextUserId: string | null,
	nextCsrfToken: string | null
) {
	return previousUserId !== nextUserId || previousCsrfToken !== nextCsrfToken;
}

function checkRestoredAccountSyncCanBootstrap(user: {
	id: string;
	state_epoch: number;
}) {
	const resetGeneration = readAccountSyncResetGeneration(user.id);
	if (resetGeneration.status !== 'current') {
		return true;
	}
	return (
		resetGeneration.marker.phase !== 'deleted' ||
		user.state_epoch > resetGeneration.marker.state_epoch
	);
}

export function resetAccountState() {
	resetPostLoginBootstrapState();
	advanceAccountStateRequestGeneration();
	getAccountSyncLifecyclePort().invalidateRuns();
	resetAccountSyncRuntime();
	accountStore.shared.bootstrapStatus.set('anonymous');
	accountStore.shared.csrfToken.set(null);
	accountStore.shared.featureAccess.set(null);
	accountStore.shared.hasPassword.set(false);
	accountStore.shared.isLoggedIn.set(false);
	accountStore.setPasswordMustChange(false);
	clearAccountSessionInitialData();
	accountStore.shared.sync.meta.set(null);
	accountStore.shared.user.set(null);
}

export function checkCurrentAccountAuthContext({
	expectedCsrfToken,
	expectedUserId,
}: { expectedCsrfToken?: string | null; expectedUserId?: string | null } = {}) {
	const currentUser = accountStore.shared.user.get();
	const currentUserId = currentUser?.id ?? null;
	if (
		currentUser !== null &&
		(workspaceStore.phase.get() !== 'ready' ||
			!checkWorkspaceAccount(workspaceStore.owner.get(), currentUser.id))
	) {
		return false;
	}
	if (expectedUserId !== undefined && currentUserId !== expectedUserId) {
		return false;
	}
	if (
		expectedCsrfToken !== undefined &&
		accountStore.shared.csrfToken.get() !== expectedCsrfToken
	) {
		return false;
	}

	return true;
}

export function applyAccountAuthSuccessResponse(
	data: IAuthLoginSuccessResponse,
	options: {
		expectedCsrfToken?: string | null;
		expectedUserId?: string | null;
	} = {}
) {
	const currentUser = accountStore.shared.user.get();
	const currentCsrfToken = accountStore.shared.csrfToken.get();
	if (
		!checkWorkspaceAccount(workspaceStore.owner.get(), data.user.id) ||
		(currentUser !== null && currentUser.id !== data.user.id)
	) {
		return false;
	}
	if (!checkCurrentAccountAuthContext(options)) {
		return false;
	}
	const canUseAccountSync = checkRestoredAccountSyncCanBootstrap(data.user);
	const syncLifecyclePort = getAccountSyncLifecyclePort();
	const hasAuthContextChanged = hasAccountAuthContextChanged(
		currentUser?.id ?? null,
		currentCsrfToken,
		data.user.id,
		data.csrf_token
	);

	advanceAccountStateRequestGeneration();
	syncLifecyclePort.invalidateRuns();
	const previousUser = currentUser;
	if (hasAuthContextChanged) {
		clearAccountSessionInitialData();
		accountStore.shared.featureAccess.set(null);
	}
	if (
		previousUser?.id !== data.user.id ||
		previousUser.state_epoch !== data.user.state_epoch
	) {
		resetPostLoginBootstrapState();
		resetAccountSyncRuntime();
	}

	accountStore.shared.bootstrapStatus.set('loggedIn');
	accountStore.shared.csrfToken.set(data.csrf_token);
	accountStore.shared.featureAccess.set(data.feature_access);
	accountStore.shared.hasPassword.set(data.has_password);
	accountStore.shared.isBootstrapped.set(true);
	accountStore.shared.isLoggedIn.set(true);
	accountStore.shared.sync.lastError.set(null);
	accountStore.shared.sync.meta.set(readAccountSyncMeta(data.user.id));
	accountStore.shared.user.set(data.user);
	accountStore.setPasswordMustChange(data.password_must_change);
	syncLifecyclePort.restoreRuntimeState(data.user.id);
	if (!canUseAccountSync) {
		accountStore.shared.sync.lastError.set(
			'sync-account-restore-incomplete'
		);
		accountStore.shared.sync.lastResult.set('failed');
	}

	return true;
}

export async function completeAccountPostLoginBootstrap({
	csrfToken,
	generation,
	passwordMustChange,
	userId,
}: {
	csrfToken: string | null;
	generation: number;
	passwordMustChange: boolean;
	userId: string | null;
}) {
	if (userId === null || csrfToken === null || passwordMustChange) {
		return false;
	}

	const checkCurrentRequest = () =>
		checkCurrentAccountStateRequest(generation) &&
		checkCurrentAccountAuthContext({
			expectedCsrfToken: csrfToken,
			expectedUserId: userId,
		});
	let didTakeOverLocalAccountData = false;
	const syncLifecyclePort = getAccountSyncLifecyclePort();
	await withAccountSyncPaused(async () => {
		if (!checkCurrentRequest()) {
			return;
		}

		try {
			if (!checkCurrentRequest()) {
				return;
			}

			didTakeOverLocalAccountData =
				await syncLifecyclePort.takeOverLocalData();
			if (!didTakeOverLocalAccountData) {
				throw new Error('local-takeover-failed');
			}
		} catch (error) {
			if (checkCurrentRequest()) {
				accountStore.shared.sync.lastError.set(
					Error.isError(error)
						? error.message
						: 'local-takeover-failed'
				);
				accountStore.shared.bootstrapStatus.set('error');
				accountStore.shared.isLoggedIn.set(false);
				accountStore.shared.sync.meta.set(null);
			}
		}
	});
	if (checkCurrentRequest()) {
		syncLifecyclePort.scheduleFlush();
	}

	return didTakeOverLocalAccountData;
}

async function runAccountStateRefresh() {
	const generation = ++accountStateRequestGeneration;
	let result: TAccountMeResponse;

	try {
		const accountMeResult = await fetchAccountMe();
		if (accountMeResult.status === 'error') {
			throw new AccountApiError(
				accountMeResult.message,
				accountMeResult.httpStatus,
				normalizeServiceRetryAfterSeconds(
					accountMeResult.data?.['retry_after']
				),
				accountMeResult.data
			);
		}

		result = accountMeResult.data;
	} catch (error) {
		if (!checkCurrentAccountStateRequest(generation)) {
			return null;
		}
		if (
			error instanceof AccountApiError &&
			(error.status === 404 || error.message === 'feature-disabled')
		) {
			throw error;
		}
		const [{ classifyAccountWorkspaceAuthOutcome }, lifecycle] =
			await Promise.all([
				import('./workspace/authOutcome'),
				import('./workspace/lifecycle'),
			]);
		const reconcileResult = await lifecycle.reconcileAccountWorkspace({
			authOutcome: classifyAccountWorkspaceAuthOutcome({
				error,
				source: 'me-refresh',
			}),
			source: 'me-refresh',
		});
		if (reconcileResult === 'adoption-required') {
			await lifecycle.completeGuestAdoption();
		}
		return null;
	}
	if (!checkCurrentAccountStateRequest(generation)) {
		return null;
	}

	const [{ classifyAccountWorkspaceAuthOutcome }, lifecycle] =
		await Promise.all([
			import('./workspace/authOutcome'),
			import('./workspace/lifecycle'),
		]);
	const reconcileResult = await lifecycle.reconcileAccountWorkspace({
		authOutcome: classifyAccountWorkspaceAuthOutcome({
			response: result,
			source: 'me-refresh',
		}),
		source: 'me-refresh',
	});
	if (reconcileResult === 'adoption-required') {
		await lifecycle.completeGuestAdoption();
	}

	return result;
}

export function refreshAccountState() {
	if (activeAccountStateRefresh !== null) {
		return activeAccountStateRefresh;
	}

	const promise = (async () => {
		let result: TAccountMeResponse | null = null;
		do {
			consumeAccountStateTrailingRefreshRequest();
			try {
				result = await runAccountStateRefresh();
			} catch (error) {
				if (!checkAccountStateTrailingRefreshRequested()) {
					throw error;
				}
			}
		} while (checkAccountStateTrailingRefreshRequested());

		return result;
	})().finally(() => {
		if (activeAccountStateRefresh === promise) {
			activeAccountStateRefresh = null;
		}
	});

	activeAccountStateRefresh = promise;

	return promise;
}

export function refreshAccountStateFromInvalidation(): Promise<void> {
	if (activeAccountStateRefresh !== null) {
		advanceAccountStateRequestGeneration();
		return activeAccountStateRefresh.then(() => {});
	}

	return refreshAccountState().then(() => {});
}

const accountSessionRefreshPort = {
	refreshFromInvalidation: refreshAccountStateFromInvalidation,
};

registerAccountSessionRefreshPort(accountSessionRefreshPort);
