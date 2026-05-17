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
	if (previousUser?.id !== result.user?.id) {
		resetAccountSyncRuntime();
	}
	accountStore.shared.bootstrapStatus.set(
		result.isLoggedIn ? 'loggedIn' : 'anonymous'
	);
	accountStore.shared.csrfToken.set(result.csrf_token);
	accountStore.shared.isBootstrapped.set(true);
	accountStore.shared.isLoggedIn.set(result.isLoggedIn);
	accountStore.shared.passwordMustChange.set(result.password_must_change);
	accountStore.shared.sync.meta.set(
		result.isLoggedIn
			? (readAccountSyncMeta(result.user.id) ?? result.syncMeta)
			: result.syncMeta
	);
	accountStore.shared.user.set(result.user);
	if (result.isLoggedIn) {
		restoreAccountSyncRuntimeState(result.user.id);
	}

	if (result.isLoggedIn && !result.password_must_change) {
		await withAccountSyncPaused(async () => {
			await importPendingLegacyBackupCode(result.csrf_token);
			await takeOverLocalAccountData();
		});
	}

	return result;
}
