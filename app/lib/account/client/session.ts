import { accountStore, globalStore } from '@/stores';
import { fetchAccountMe, importBackupCode } from './api';
import { type IAuthLoginSuccessResponse } from '../shared/types';
import { readAccountSyncMeta } from './snapshot';
import {
	restoreAccountSyncRuntimeState,
	takeOverLocalAccountData,
} from './syncClient';
import { withAccountSyncPaused } from './stateGuards';

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
	resetAccountSyncRuntime();
	accountStore.shared.bootstrapStatus.set('anonymous');
	accountStore.shared.csrfToken.set(null);
	accountStore.shared.isLoggedIn.set(false);
	accountStore.shared.passwordMustChange.set(false);
	accountStore.shared.sync.meta.set(null);
	accountStore.shared.user.set(null);
}

export function applyAccountAuthSuccessResponse(
	data: IAuthLoginSuccessResponse
) {
	advanceAccountStateRequestGeneration();
	const previousUser = accountStore.shared.user.get();
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

		globalStore.persistence.cloudCode.set(null);
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
	let result: Awaited<ReturnType<typeof fetchAccountMe>>;
	try {
		result = await fetchAccountMe();
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
		await withAccountSyncPaused(async () => {
			if (!checkCurrentAccountStateRequest(generation)) {
				return;
			}

			try {
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

				await takeOverLocalAccountData();
			} catch (error) {
				if (checkCurrentAccountStateRequest(generation)) {
					accountStore.shared.sync.lastError.set(
						error instanceof Error
							? error.message
							: 'local-takeover-failed'
					);
				}
			}
		});
	}

	return result;
}
