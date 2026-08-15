'use client';

import {
	bootstrapAccount,
	startAccountBootstrapRetryClient,
} from './bootstrap';
import AccountConflictModal from './components/accountConflict/AccountConflictModal';
import AccountModal from './components/AccountModal';
import AccountPasswordMustChangeModal from './components/AccountPasswordMustChangeModal';
import type { IStartAccountFeatureClientsOptions } from './featureClient.types';
import { startAccountStoreSyncWatchers } from './sync/doubleWrite';
import { startAccountSyncClient } from './sync/syncClient';

export function startAccountFeatureClients({
	skipInitialBootstrap = false,
}: IStartAccountFeatureClientsOptions = {}) {
	const stopAccountStoreSyncWatchers = startAccountStoreSyncWatchers();
	if (!skipInitialBootstrap) {
		void bootstrapAccount();
	}
	const stopAccountBootstrapRetryClient = startAccountBootstrapRetryClient();
	const stopAccountSyncClient = startAccountSyncClient();

	return () => {
		stopAccountBootstrapRetryClient();
		stopAccountStoreSyncWatchers();
		stopAccountSyncClient();
	};
}

export function AccountFeatureModals() {
	return (
		<>
			<AccountPasswordMustChangeModal />
			<AccountConflictModal />
			<AccountModal />
		</>
	);
}
