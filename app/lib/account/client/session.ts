import { accountStore, globalStore } from '@/stores';
import { fetchAccountMe, importBackupCode } from './api';
import { readAccountSyncMeta } from './snapshot';
import {
	restoreAccountSyncRuntimeState,
	takeOverLocalAccountData,
} from './syncClient';
import { withAccountSyncPaused } from './stateGuards';

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
	resetAccountSyncRuntime();
	accountStore.shared.bootstrapStatus.set('anonymous');
	accountStore.shared.csrfToken.set(null);
	accountStore.shared.isLoggedIn.set(false);
	accountStore.shared.passwordMustChange.set(false);
	accountStore.shared.sync.meta.set(null);
	accountStore.shared.user.set(null);
}

export async function importPendingLegacyBackupCode(csrfToken: string) {
	const cloudCode = globalStore.persistence.cloudCode.get();
	const normalizedCode = cloudCode?.trim() ?? '';
	if (normalizedCode === '') {
		if (cloudCode !== null) {
			globalStore.persistence.cloudCode.set(null);
		}

		return false;
	}

	try {
		await importBackupCode(normalizedCode, csrfToken);
		globalStore.persistence.cloudCode.set(null);
		accountStore.shared.sync.lastError.set(null);
	} catch (error) {
		accountStore.shared.sync.lastError.set(
			error instanceof Error ? error.message : 'legacy-import-failed'
		);
		return false;
	}

	return true;
}

export async function refreshAccountState() {
	const previousUser = accountStore.shared.user.get();
	const result = await fetchAccountMe();
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
			await importPendingLegacyBackupCode(accountCsrfToken);
			await takeOverLocalAccountData();
		});
	}

	return result;
}
