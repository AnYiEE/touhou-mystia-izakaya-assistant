import type {
	IAuthLoginSuccessResponse,
	TAccountMeResponse,
} from '@/features/account/contracts';

import { normalizeServiceRetryAfterSeconds } from '@/infrastructure/http/client/fetchServiceApi';

import { publishAccountRuntimeInvalidation } from './accountRuntimeInvalidation';
import { AccountApiError, fetchAccountMe } from './api';
import { accountStore } from './state/accountStore';
import { readAccountSyncResetGeneration } from './sync/resetGeneration';
import { registerAccountSessionRefreshPort } from './sync/sessionRefreshPort';
import { readAccountSyncMeta } from './sync/snapshot';
import { withAccountSyncPaused } from './sync/stateGuards';
import { getAccountSyncLifecyclePort } from './sync/syncLifecyclePort';
import { clearAccountSyncRuntimeConflicts } from './sync/syncRuntimeState';

let accountStateRequestGeneration = 0;
let activeAccountStateRefresh: Promise<TAccountMeResponse | null> | null = null;
let accountStateRefreshPending = false;
let activePostLoginBootstrap: {
	promise: Promise<boolean>;
	userId: string;
} | null = null;
let completedPostLoginBootstrapUserId: string | null = null;

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
	activePostLoginBootstrap = null;
	completedPostLoginBootstrapUserId = null;
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

export function resetAccountStateIfCurrent(
	options: Parameters<typeof checkCurrentAccountAuthContext>[0] = {}
) {
	if (!checkCurrentAccountAuthContext(options)) {
		return false;
	}

	resetAccountState();

	return true;
}

export function resetAccountStateAfterSessionExpired({
	expectedCsrfToken,
	expectedUserId,
	stateEpoch,
}: {
	expectedCsrfToken: string | null;
	expectedUserId: string;
	stateEpoch: number;
}) {
	const expectedAuthContext = { expectedCsrfToken, expectedUserId };
	if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
		return false;
	}

	void publishAccountRuntimeInvalidation({
		reason: 'session-expired',
		stateEpoch,
		userId: expectedUserId,
	});

	return resetAccountStateIfCurrent(expectedAuthContext);
}

export function resetAccountStateForUnauthorizedError(
	error: unknown,
	context: Parameters<typeof checkCurrentAccountAuthContext>[0] = {}
) {
	if (!(error instanceof AccountApiError) || error.status !== 401) {
		return false;
	}

	const user = accountStore.shared.user.get();
	if (user === null) {
		resetAccountStateIfCurrent(context);
		return true;
	}

	resetAccountStateAfterSessionExpired({
		expectedCsrfToken:
			context.expectedCsrfToken ?? accountStore.shared.csrfToken.get(),
		expectedUserId: context.expectedUserId ?? user.id,
		stateEpoch: user.state_epoch,
	});

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

function ensureAccountPostLoginBootstrap(options: {
	csrfToken: string;
	generation: number;
	passwordMustChange: false;
	userId: string;
}) {
	if (completedPostLoginBootstrapUserId === options.userId) {
		return Promise.resolve(true);
	}
	if (activePostLoginBootstrap?.userId === options.userId) {
		return activePostLoginBootstrap.promise;
	}

	const promise = completeAccountPostLoginBootstrap(options).then(
		(didComplete) => {
			if (
				didComplete &&
				checkCurrentAccountStateRequest(options.generation) &&
				checkCurrentAccountAuthContext({
					expectedCsrfToken: options.csrfToken,
					expectedUserId: options.userId,
				})
			) {
				completedPostLoginBootstrapUserId = options.userId;
			}

			return didComplete;
		}
	);

	activePostLoginBootstrap = { promise, userId: options.userId };

	const clearActiveBootstrap = () => {
		if (activePostLoginBootstrap?.promise === promise) {
			activePostLoginBootstrap = null;
		}
	};

	void promise.then(clearActiveBootstrap, clearActiveBootstrap);

	return promise;
}

async function runAccountStateRefresh() {
	const generation = ++accountStateRequestGeneration;
	const previousUser = accountStore.shared.user.get();
	const previousCsrfToken = accountStore.shared.csrfToken.get();
	let result: TAccountMeResponse;

	try {
		const accountMeResult = await fetchAccountMe();
		if (accountMeResult.status === 'error') {
			throw new AccountApiError(
				accountMeResult.message,
				accountMeResult.httpStatus,
				normalizeServiceRetryAfterSeconds(
					accountMeResult.data?.['retry_after']
				)
			);
		}

		result = accountMeResult.data;
	} catch (error) {
		if (!checkCurrentAccountStateRequest(generation)) {
			return null;
		}
		throw error;
	}
	if (!checkCurrentAccountStateRequest(generation)) {
		return null;
	}

	const {
		csrf_token: csrfToken,
		feature_access: featureAccess,
		has_password: hasPassword,
		isLoggedIn: responseIsLoggedIn,
		password_must_change: passwordMustChange,
		syncMeta,
		user,
	} = result;
	let accountUser: NonNullable<typeof result.user> | null = null;
	let accountCsrfToken: string | null = null;
	let accountPasswordMustChange = false;
	let accountHasPassword = false;

	if (responseIsLoggedIn) {
		accountUser = user;
		accountCsrfToken = csrfToken;
		accountPasswordMustChange = passwordMustChange;
		accountHasPassword = hasPassword;
	}

	const isLoggedIn = accountUser !== null;
	const accountSyncMeta = syncMeta;
	const isAccountSyncAllowed = featureAccess.modules['account.sync'].allowed;
	const canBootstrapAccountSync =
		accountUser !== null &&
		isAccountSyncAllowed &&
		checkRestoredAccountSyncCanBootstrap(accountUser);
	const hasAuthContextChanged = hasAccountAuthContextChanged(
		previousUser?.id ?? null,
		previousCsrfToken,
		accountUser?.id ?? null,
		accountCsrfToken
	);

	if (hasAuthContextChanged) {
		getAccountSyncLifecyclePort().invalidateRuns();
	}
	if (accountUser === null || hasAuthContextChanged) {
		clearAccountSessionInitialData();
	}

	if (
		previousUser?.id !== accountUser?.id ||
		(previousUser !== null &&
			accountUser !== null &&
			previousUser.state_epoch !== accountUser.state_epoch)
	) {
		resetPostLoginBootstrapState();
		resetAccountSyncRuntime();
	}

	accountStore.shared.bootstrapStatus.set(
		isLoggedIn ? 'loggedIn' : 'anonymous'
	);
	accountStore.shared.csrfToken.set(accountCsrfToken);
	accountStore.shared.featureAccess.set(featureAccess);
	accountStore.shared.hasPassword.set(accountHasPassword);
	accountStore.shared.isBootstrapped.set(true);
	accountStore.shared.isLoggedIn.set(isLoggedIn);
	accountStore.shared.sync.lastError.set(null);
	accountStore.shared.sync.meta.set(
		accountUser === null
			? accountSyncMeta
			: (readAccountSyncMeta(accountUser.id) ?? accountSyncMeta)
	);
	accountStore.shared.user.set(accountUser);
	accountStore.setPasswordMustChange(accountPasswordMustChange);

	if (accountUser !== null) {
		getAccountSyncLifecyclePort().restoreRuntimeState(accountUser.id);
	}
	if (
		accountUser !== null &&
		isAccountSyncAllowed &&
		!canBootstrapAccountSync
	) {
		accountStore.shared.sync.lastError.set(
			'sync-account-restore-incomplete'
		);
		accountStore.shared.sync.lastResult.set('failed');
	}

	if (
		accountUser !== null &&
		accountCsrfToken !== null &&
		!accountPasswordMustChange &&
		canBootstrapAccountSync
	) {
		await ensureAccountPostLoginBootstrap({
			csrfToken: accountCsrfToken,
			generation,
			passwordMustChange: false,
			userId: accountUser.id,
		});
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
