import type {
	IAccountGatePort,
	IAccountGateSnapshot,
} from '@/features/recommendations/contracts';

import { accountStore } from './state/accountStore';
import {
	checkWorkspaceAccount,
	workspaceStore,
} from './workspace/workspaceStore';

function getSnapshot(): IAccountGateSnapshot {
	const bootstrapStatus = accountStore.shared.bootstrapStatus.get();
	const isBootstrapComplete = accountStore.shared.isBootstrapped.get();
	const owner = workspaceStore.owner.get();
	const user = accountStore.shared.user.get();

	return {
		isAuthenticated:
			bootstrapStatus === 'loggedIn' &&
			accountStore.shared.isLoggedIn.get() &&
			user !== null &&
			workspaceStore.phase.get() === 'ready' &&
			checkWorkspaceAccount(owner, user.id) &&
			!accountStore.shared.passwordMustChange.get(),
		isBootstrapComplete,
		isDisabled: bootstrapStatus === 'disabled',
	};
}

function subscribe(listener: () => void): () => void {
	const stopSubscriptions = [
		accountStore.shared.isBootstrapped.onChange(listener),
		accountStore.shared.bootstrapStatus.onChange(listener),
		accountStore.shared.isLoggedIn.onChange(listener),
		accountStore.shared.user.onChange(listener),
		accountStore.shared.passwordMustChange.onChange(listener),
		workspaceStore.owner.onChange(listener),
		workspaceStore.phase.onChange(listener),
	];

	return () => {
		for (const stopSubscription of stopSubscriptions) {
			stopSubscription();
		}
	};
}

export const accountGate: IAccountGatePort = { getSnapshot, subscribe };
