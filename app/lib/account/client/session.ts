import { AccountApiError, importBackupCode } from './api';
import { type IAuthLoginSuccessResponse } from '../shared/types';
import { fetchAccountMeAction } from '@/lib/account/actions/auth';
import { readAccountSyncMeta } from './snapshot';
import {
	invalidateAccountSyncClientRuns,
	restoreAccountSyncRuntimeState,
	scheduleAccountSyncFlush,
	takeOverLocalAccountData,
} from './syncClient';
import { withAccountSyncPaused } from './stateGuards';
import { accountStore, globalStore } from '@/stores';

let accountStateRequestGeneration = 0;

function advanceAccountStateRequestGeneration() {
	accountStateRequestGeneration += 1;

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
	accountStore.shared.sync.conflicts.set([]);
	accountStore.shared.sync.failedAttempts.set(0);
	accountStore.shared.sync.isSyncing.set(false);
	accountStore.shared.sync.lastError.set(null);
	accountStore.shared.sync.lastResult.set(null);
	accountStore.shared.sync.lastSyncedAt.set(null);
	accountStore.shared.sync.pendingCount.set(0);
}

export function resetAccountState() {
	invalidateAccountStateRequests();
	invalidateAccountSyncClientRuns();
	resetAccountSyncRuntime();
	accountStore.shared.bootstrapStatus.set('anonymous');
	accountStore.shared.csrfToken.set(null);
	accountStore.shared.isLoggedIn.set(false);
	accountStore.shared.passwordMustChange.set(false);
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

	advanceAccountStateRequestGeneration();
	invalidateAccountSyncClientRuns();
	const previousUser = currentUser;
	if (previousUser?.id !== data.user.id) {
		resetAccountSyncRuntime();
	}

	accountStore.shared.bootstrapStatus.set('loggedIn');
	accountStore.shared.csrfToken.set(data.csrf_token);
	accountStore.shared.isBootstrapped.set(true);
	accountStore.shared.isLoggedIn.set(true);
	accountStore.shared.passwordMustChange.set(data.password_must_change);
	accountStore.shared.sync.lastError.set(null);
	accountStore.shared.sync.meta.set(readAccountSyncMeta(data.user.id));
	accountStore.shared.user.set(data.user);
	restoreAccountSyncRuntimeState(data.user.id);

	return true;
}

export async function importPendingLegacyBackupCode(
	csrfToken: string,
	checkCurrentRequest = () => true
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

		await importBackupCode(normalizedCode, csrfToken);
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

export async function refreshAccountState() {
	const generation = advanceAccountStateRequestGeneration();
	const previousUser = accountStore.shared.user.get();
	const previousCsrfToken = accountStore.shared.csrfToken.get();
	let result: Awaited<ReturnType<typeof fetchAccountMeAction>>['data'];
	try {
		const actionResult = await fetchAccountMeAction();
		if (actionResult.status === 'error') {
			throw new AccountApiError(
				actionResult.message,
				actionResult.httpStatus
			);
		}

		result = actionResult.data;
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
		isLoggedIn: responseIsLoggedIn,
		password_must_change: passwordMustChange,
		syncMeta,
		user,
	} = result;
	let accountUser: NonNullable<typeof result.user> | null = null;
	let accountCsrfToken: string | null = null;
	let accountPasswordMustChange = false;
	if (responseIsLoggedIn) {
		accountUser = user;
		accountCsrfToken = csrfToken;
		accountPasswordMustChange = passwordMustChange;
	}

	const isLoggedIn = accountUser !== null;
	const accountSyncMeta = syncMeta;
	if (
		previousUser?.id !== accountUser?.id ||
		previousCsrfToken !== accountCsrfToken
	) {
		invalidateAccountSyncClientRuns();
	}
	if (previousUser?.id !== accountUser?.id) {
		resetAccountSyncRuntime();
	}
	accountStore.shared.bootstrapStatus.set(
		isLoggedIn ? 'loggedIn' : 'anonymous'
	);
	accountStore.shared.csrfToken.set(accountCsrfToken);
	accountStore.shared.isBootstrapped.set(true);
	accountStore.shared.isLoggedIn.set(isLoggedIn);
	accountStore.shared.passwordMustChange.set(accountPasswordMustChange);
	accountStore.shared.sync.lastError.set(null);
	accountStore.shared.sync.meta.set(
		accountUser === null
			? accountSyncMeta
			: (readAccountSyncMeta(accountUser.id) ?? accountSyncMeta)
	);
	accountStore.shared.user.set(accountUser);
	if (accountUser !== null) {
		restoreAccountSyncRuntimeState(accountUser.id);
	}

	if (
		accountUser !== null &&
		accountCsrfToken !== null &&
		!accountPasswordMustChange
	) {
		let didImportPendingLegacyBackupCode = false;
		let didTakeOverLocalAccountData = false;
		await withAccountSyncPaused(async () => {
			if (!checkCurrentAccountStateRequest(generation)) {
				return;
			}

			try {
				didImportPendingLegacyBackupCode =
					await importPendingLegacyBackupCode(accountCsrfToken, () =>
						checkCurrentAccountStateRequest(generation)
					);
			} catch (error) {
				if (checkCurrentAccountStateRequest(generation)) {
					accountStore.shared.sync.lastError.set(
						error instanceof Error
							? error.message
							: 'legacy-import-failed'
					);
				}
			}
			try {
				if (!checkCurrentAccountStateRequest(generation)) {
					return;
				}
				if (
					didImportPendingLegacyBackupCode &&
					checkCurrentAccountStateRequest(generation)
				) {
					globalStore.persistence.cloudCode.set(null);
				}

				didTakeOverLocalAccountData = await takeOverLocalAccountData();
				if (!didTakeOverLocalAccountData) {
					throw new Error('local-takeover-failed');
				}
			} catch (error) {
				if (checkCurrentAccountStateRequest(generation)) {
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
		if (checkCurrentAccountStateRequest(generation)) {
			scheduleAccountSyncFlush();
		}
	}

	return result;
}
