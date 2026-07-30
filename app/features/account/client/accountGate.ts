import type {
	IAccountGatePort,
	IAccountGateSnapshot,
} from '@/features/recommendations/contracts';

import { accountStore } from './state/accountStore';

function getSnapshot(): IAccountGateSnapshot {
	const bootstrapStatus = accountStore.shared.bootstrapStatus.get();
	const isBootstrapComplete = accountStore.shared.isBootstrapped.get();

	return {
		isAuthenticated:
			bootstrapStatus === 'loggedIn' &&
			accountStore.shared.isLoggedIn.get() &&
			accountStore.shared.user.get() !== null &&
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
	];

	return () => {
		for (const stopSubscription of stopSubscriptions) {
			stopSubscription();
		}
	};
}

export const accountGate: IAccountGatePort = { getSnapshot, subscribe };
