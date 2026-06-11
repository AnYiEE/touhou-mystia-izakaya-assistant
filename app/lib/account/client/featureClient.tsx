'use client';

import AccountConflictModal from '@/components/accountConflictModal';
import AccountModal from '@/components/accountModal';
import AccountPasswordMustChangeModal from '@/components/accountPasswordMustChangeModal';

import {
	bootstrapAccount,
	startAccountBootstrapRetryClient,
} from './bootstrap';
import { startAccountStoreSyncWatchers } from './doubleWrite';
import { startAccountSyncClient } from './syncClient';

export function startAccountFeatureClients() {
	const stopAccountStoreSyncWatchers = startAccountStoreSyncWatchers();
	void bootstrapAccount();
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
