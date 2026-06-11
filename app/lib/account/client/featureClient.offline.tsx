'use client';

import { accountStore } from '@/stores/account';

export function startAccountFeatureClients() {
	accountStore.shared.bootstrapStatus.set('disabled');
	accountStore.shared.adminCsrfToken.set(null);
	accountStore.shared.csrfToken.set(null);
	accountStore.shared.isBootstrapped.set(true);
	accountStore.shared.isLoggedIn.set(false);
	accountStore.shared.passwordMustChange.set(false);
	accountStore.shared.sync.canRetry.set(false);
	accountStore.shared.sync.conflicts.set([]);
	accountStore.shared.sync.failedAttempts.set(0);
	accountStore.shared.sync.isSyncing.set(false);
	accountStore.shared.sync.lastError.set(null);
	accountStore.shared.sync.lastResult.set(null);
	accountStore.shared.sync.lastSyncedAt.set(null);
	accountStore.shared.sync.meta.set(null);
	accountStore.shared.sync.pendingCount.set(0);
	accountStore.shared.user.set(null);

	return () => {};
}

export function AccountFeatureModals() {
	return null;
}
