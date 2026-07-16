'use client';

import '@/lib/recommendations/bridge/launchDescriptor';

import AccountConflictModal from './components/accountConflictModal';
import AccountModal from './components/accountModal';
import AccountPasswordMustChangeModal from './components/accountPasswordMustChangeModal';

import {
	bootstrapAccount,
	startAccountBootstrapRetryClient,
} from './bootstrap';
import { startAccountStoreSyncWatchers } from './doubleWrite';
import { startAccountSyncClient } from './syncClient';

import { startRecommendationBridgeClient } from '@/lib/recommendations/bridge/client';

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
	const stopRecommendationBridgeClient = startRecommendationBridgeClient();

	return () => {
		stopRecommendationBridgeClient();
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
