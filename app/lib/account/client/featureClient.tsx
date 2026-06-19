'use client';

import AccountConflictModal from './components/accountConflictModal';
import AccountModal from './components/accountModal';
import AccountPasswordMustChangeModal from './components/accountPasswordMustChangeModal';

import {
	bootstrapAccount,
	startAccountBootstrapRetryClient,
} from './bootstrap';
import { startAccountStoreSyncWatchers } from './doubleWrite';
import { startAccountSyncClient } from './syncClient';

interface IStartAccountFeatureClientsOptions {
	skipInitialBootstrap?: boolean;
}

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
