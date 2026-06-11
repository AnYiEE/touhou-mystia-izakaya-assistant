import { AccountApiError } from './api';
import { refreshAccountState, resetAccountState } from './session';
import { siteConfig } from '@/configs';
import { accountStore } from '@/stores/account';

function resetAccountBootstrapState(status: 'disabled' | 'error') {
	resetAccountState();
	accountStore.shared.bootstrapStatus.set(status);
	accountStore.shared.isBootstrapped.set(true);
}

function disableAccountBootstrap() {
	resetAccountBootstrapState('disabled');
	accountStore.shared.adminCsrfToken.set(null);
}

function failAccountBootstrap(message: string) {
	resetAccountBootstrapState('error');
	accountStore.shared.sync.lastError.set(message);
}

let bootstrapInFlight: Promise<void> | null = null;

async function runBootstrapAccount() {
	try {
		if (!siteConfig.isAccountFeatureClientEnabled) {
			disableAccountBootstrap();
			return;
		}

		await refreshAccountState();
	} catch (error) {
		if (error instanceof AccountApiError) {
			if (error.status === 404 || error.message === 'feature-disabled') {
				disableAccountBootstrap();
				return;
			}

			console.error('Account bootstrap failed.', error);
			failAccountBootstrap(error.message || 'bootstrap-failed');
			return;
		}

		console.error('Account bootstrap failed.', error);
		failAccountBootstrap('bootstrap-failed');
	}
}

export function bootstrapAccount() {
	if (bootstrapInFlight !== null) {
		return bootstrapInFlight;
	}

	bootstrapInFlight = runBootstrapAccount()
		.catch((error: unknown) => {
			console.error('Account bootstrap failed unexpectedly.', error);
			try {
				failAccountBootstrap('bootstrap-failed');
			} catch (bootstrapError) {
				console.error(
					'Failed to record account bootstrap failure.',
					bootstrapError
				);
			}
		})
		.finally(() => {
			bootstrapInFlight = null;
		});

	return bootstrapInFlight;
}

export function startAccountBootstrapRetryClient() {
	if (!siteConfig.isAccountFeatureClientEnabled) {
		return () => {};
	}

	const retryBootstrap = () => {
		if (accountStore.shared.bootstrapStatus.get() !== 'error') {
			return;
		}

		void bootstrapAccount();
	};

	globalThis.addEventListener('online', retryBootstrap);
	globalThis.addEventListener('focus', retryBootstrap);

	return () => {
		globalThis.removeEventListener('online', retryBootstrap);
		globalThis.removeEventListener('focus', retryBootstrap);
	};
}
