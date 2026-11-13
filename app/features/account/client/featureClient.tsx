'use client';

import { SYNC_NAMESPACE_MAP } from '@/domain/account/contracts';

import {
	bootstrapAccount,
	startAccountBootstrapRetryClient,
} from './bootstrap';
import AccountModal from './components/AccountModal';
import AccountPasswordMustChangeModal from './components/AccountPasswordMustChangeModal';
import AccountWorkspaceSessionModal, {
	AccountWorkspaceLegalRequiredModal,
} from './components/AccountWorkspaceSessionModal';
import AccountConflictModal from './components/accountConflict/AccountConflictModal';
import AccountLogoutRecoveryModal from './components/accountManager/AccountLogoutRecoveryModal';
import type { IStartAccountFeatureClientsOptions } from './featureClient.types';
import { accountStore } from './state/accountStore';
import { checkAccountSyncClientReady } from './sync/clientReadiness';
import {
	enqueueAccountSyncLocalSnapshotReconcile,
	startAccountStoreSyncWatchers,
} from './sync/doubleWrite';
import { startAccountSyncClient } from './sync/syncClient';
import { startAccountWorkspaceCoordinationClient } from './workspace/coordination';
import { workspaceStore } from './workspace/workspaceStore';

export function startAccountFeatureClients({
	skipInitialBootstrap = false,
}: IStartAccountFeatureClientsOptions = {}) {
	const stopAccountWorkspaceCoordinationClient =
		startAccountWorkspaceCoordinationClient();
	let stopAccountStoreSyncWatchers: (() => void) | null = null;
	let stopAccountSyncClient: (() => void) | null = null;
	const stopReadyClients = () => {
		stopAccountSyncClient?.();
		stopAccountStoreSyncWatchers?.();
		stopAccountSyncClient = null;
		stopAccountStoreSyncWatchers = null;
	};
	const reconcileReadyClients = () => {
		const bootstrapStatus = accountStore.shared.bootstrapStatus.get();
		const isReady = checkAccountSyncClientReady({
			bootstrapStatus,
			isAuthReconciled: workspaceStore.isAuthReconciled.get(),
			isBootstrapped: accountStore.shared.isBootstrapped.get(),
			isWorkspaceReady: workspaceStore.isReady.get(),
			phase: workspaceStore.phase.get(),
		});
		if (!isReady) {
			stopReadyClients();
			return;
		}
		if (stopAccountStoreSyncWatchers !== null) {
			return;
		}
		stopAccountStoreSyncWatchers = startAccountStoreSyncWatchers();
		Object.values(SYNC_NAMESPACE_MAP).forEach((namespace) => {
			enqueueAccountSyncLocalSnapshotReconcile(namespace);
		});
		stopAccountSyncClient = startAccountSyncClient();
	};
	const stopWorkspaceSubscriptions = [
		workspaceStore.isReady.onChange(reconcileReadyClients),
		workspaceStore.isAuthReconciled.onChange(reconcileReadyClients),
		workspaceStore.owner.onChange(reconcileReadyClients),
		workspaceStore.phase.onChange(reconcileReadyClients),
		accountStore.shared.isBootstrapped.onChange(reconcileReadyClients),
		accountStore.shared.bootstrapStatus.onChange(reconcileReadyClients),
	];

	reconcileReadyClients();
	if (!skipInitialBootstrap) {
		void bootstrapAccount();
	}
	const stopAccountBootstrapRetryClient = startAccountBootstrapRetryClient();

	return () => {
		stopAccountBootstrapRetryClient();
		stopReadyClients();
		stopWorkspaceSubscriptions.forEach((stopSubscription) => {
			stopSubscription();
		});
		stopAccountWorkspaceCoordinationClient();
	};
}

export function AccountFeatureModals() {
	return (
		<>
			<AccountPasswordMustChangeModal />
			<AccountConflictModal />
			<AccountLogoutRecoveryModal />
			<AccountWorkspaceSessionModal />
			<AccountWorkspaceLegalRequiredModal />
			<AccountModal />
		</>
	);
}
