'use client';

import { clearAccountSyncRuntimeConflicts } from './syncRuntimeState';
import { accountStore as store } from '@/stores/account';

export function startAccountFeatureClients() {
	store.shared.bootstrapStatus.set('disabled');
	store.shared.adminCsrfToken.set(null);
	store.shared.csrfToken.set(null);
	store.shared.hasPassword.set(false);
	store.shared.isBootstrapped.set(true);
	store.shared.isLoggedIn.set(false);
	store.setPasswordMustChange(false);
	store.shared.sessionInitialData.set(null);
	store.shared.ssoGrantInitialData.set(null);
	store.shared.sync.canRetry.set(false);
	clearAccountSyncRuntimeConflicts();
	store.shared.sync.failedAttempts.set(0);
	store.shared.sync.isSyncing.set(false);
	store.shared.sync.lastError.set(null);
	store.shared.sync.lastResult.set(null);
	store.shared.sync.lastSyncedAt.set(null);
	store.shared.sync.meta.set(null);
	store.shared.sync.pendingCount.set(0);
	store.shared.user.set(null);

	return () => {};
}

export function AccountFeatureModals() {
	return null;
}
