import { publishAccountRuntimeInvalidation } from './accountRuntimeInvalidation';
import { AccountApiError, fetchAccountMe, importBackupCode } from './api';
import { readAccountSyncResetGeneration } from './resetGeneration';
import {
	type IAuthLoginSuccessResponse,
	type TAccountMeResponse,
} from '../shared/types';
import { readAccountSyncMeta } from './snapshot';
import {
	invalidateAccountSyncClientRuns,
	restoreAccountSyncRuntimeState,
	scheduleAccountSyncFlush,
	takeOverLocalAccountData,
} from './syncClient';
import { withAccountSyncPaused } from './stateGuards';
import { withAccountSyncOperationLease } from './syncOperationLease';
import { clearAccountSyncRuntimeConflicts } from './syncRuntimeState';
import { accountStore, globalStore } from '@/stores';

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

export function invalidateAccountStateRequests() {
	advanceAccountStateRequestGeneration();
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
	invalidateAccountStateRequests();
	invalidateAccountSyncClientRuns();
	resetAccountSyncRuntime();
	accountStore.shared.bootstrapStatus.set('anonymous');
	accountStore.shared.csrfToken.set(null);
	accountStore.shared.hasPassword.set(false);
	accountStore.shared.isLoggedIn.set(false);
	accountStore.setPasswordMustChange(false);
	accountStore.shared.sessionInitialData.set(null);
	accountStore.shared.ssoGrantInitialData.set(null);
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
	if (!checkCurrentAccountAuthContext(options)) {
		return false;
	}
	const canUseAccountSync = checkRestoredAccountSyncCanBootstrap(data.user);

	advanceAccountStateRequestGeneration();
	invalidateAccountSyncClientRuns();
	const previousUser = currentUser;
	if (
		previousUser?.id !== data.user.id ||
		previousUser.state_epoch !== data.user.state_epoch
	) {
		resetPostLoginBootstrapState();
		resetAccountSyncRuntime();
	}

	accountStore.shared.bootstrapStatus.set('loggedIn');
	accountStore.shared.csrfToken.set(data.csrf_token);
	accountStore.shared.hasPassword.set(data.has_password);
	accountStore.shared.isBootstrapped.set(true);
	accountStore.shared.isLoggedIn.set(true);
	accountStore.shared.sync.lastError.set(null);
	accountStore.shared.sync.meta.set(readAccountSyncMeta(data.user.id));
	accountStore.shared.user.set(data.user);
	accountStore.setPasswordMustChange(data.password_must_change);
	restoreAccountSyncRuntimeState(data.user.id);
	if (!canUseAccountSync) {
		accountStore.shared.sync.lastError.set(
			'sync-account-restore-incomplete'
		);
		accountStore.shared.sync.lastResult.set('failed');
	}

	return true;
}

export async function importPendingLegacyBackupCode(
	csrfToken: string,
	checkCurrentRequest = () => true,
	userId?: string
) {
	const cloudCode = globalStore.persistence.cloudCode.get();
	const normalizedCode = cloudCode?.trim() ?? '';

	if (normalizedCode === '') {
		if (cloudCode !== null && checkCurrentRequest()) {
			globalStore.persistence.cloudCode.set(null);
		}
		return false;
	}

	try {
		if (!checkCurrentRequest()) {
			return false;
		}

		const result =
			userId === undefined
				? await importBackupCode(normalizedCode, csrfToken)
				: await withAccountSyncOperationLease(
						userId,
						'import-backup',
						() => importBackupCode(normalizedCode, csrfToken)
					);
		if (result === null) {
			throw new Error('backup-code-lock-lost');
		}
		if (!checkCurrentRequest()) {
			return false;
		}

		accountStore.shared.sync.lastError.set(null);
	} catch (error) {
		if (!checkCurrentRequest()) {
			return false;
		}

		accountStore.shared.sync.lastError.set(
			error instanceof Error ? error.message : 'legacy-import-failed'
		);
		return false;
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
	let didImportPendingLegacyBackupCode = false;
	let didTakeOverLocalAccountData = false;
	await withAccountSyncPaused(async () => {
		if (!checkCurrentRequest()) {
			return;
		}

		try {
			didImportPendingLegacyBackupCode =
				await importPendingLegacyBackupCode(
					csrfToken,
					checkCurrentRequest,
					userId
				);
		} catch (error) {
			if (checkCurrentRequest()) {
				accountStore.shared.sync.lastError.set(
					error instanceof Error
						? error.message
						: 'legacy-import-failed'
				);
			}
		}
		try {
			if (!checkCurrentRequest()) {
				return;
			}
			if (didImportPendingLegacyBackupCode && checkCurrentRequest()) {
				globalStore.persistence.cloudCode.set(null);
			}

			didTakeOverLocalAccountData = await takeOverLocalAccountData();
			if (!didTakeOverLocalAccountData) {
				throw new Error('local-takeover-failed');
			}
		} catch (error) {
			if (checkCurrentRequest()) {
				accountStore.shared.sync.lastError.set(
					error instanceof Error
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
		scheduleAccountSyncFlush();
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
				typeof accountMeResult.data?.['retry_after'] === 'number' &&
					Number.isFinite(accountMeResult.data['retry_after'])
					? accountMeResult.data['retry_after']
					: null
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
	const canUseAccountSync =
		accountUser === null ||
		checkRestoredAccountSyncCanBootstrap(accountUser);

	if (
		previousUser?.id !== accountUser?.id ||
		previousCsrfToken !== accountCsrfToken
	) {
		invalidateAccountSyncClientRuns();
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

	if (accountUser !== null && canUseAccountSync) {
		restoreAccountSyncRuntimeState(accountUser.id);
	} else if (accountUser !== null) {
		accountStore.shared.sync.lastError.set(
			'sync-account-restore-incomplete'
		);
		accountStore.shared.sync.lastResult.set('failed');
	}

	if (
		accountUser !== null &&
		accountCsrfToken !== null &&
		!accountPasswordMustChange &&
		canUseAccountSync
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

export function refreshAccountStateFromInvalidation() {
	if (activeAccountStateRefresh !== null) {
		advanceAccountStateRequestGeneration();
		return activeAccountStateRefresh;
	}

	return refreshAccountState();
}
