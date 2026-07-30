'use client';

import type { IStartAccountFeatureClientsOptions } from './featureClient.types';
import { accountStore } from './state/accountStore';
import { clearAccountSyncRuntimeConflicts } from './sync/syncRuntimeState';

export function startAccountFeatureClients(
	options: IStartAccountFeatureClientsOptions = {}
) {
	void options;

	accountStore.shared.bootstrapStatus.set('disabled');
	accountStore.shared.adminCsrfToken.set(null);
	accountStore.shared.csrfToken.set(null);
	accountStore.shared.hasPassword.set(false);
	accountStore.shared.isBootstrapped.set(true);
	accountStore.shared.isLoggedIn.set(false);
	accountStore.setPasswordMustChange(false);
	accountStore.shared.sessionInitialData.set(null);
	accountStore.shared.ssoGrantInitialData.set(null);
	accountStore.shared.webauthnInitialData.set(null);
	accountStore.shared.sync.canRetry.set(false);
	clearAccountSyncRuntimeConflicts();
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
