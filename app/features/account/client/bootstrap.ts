import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import { AccountApiError } from './api';
import { refreshAccountState, resetAccountState } from './session';
import { accountStore } from './state/accountStore';

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
		if (!PUBLIC_RUNTIME_CONFIG.isAccountFeatureClientEnabled) {
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

			console.error('Account bootstrap failed.', {
				errorCode: getLogSafeErrorCode(error),
			});
			failAccountBootstrap(error.message || 'bootstrap-failed');
			return;
		}

		console.error('Account bootstrap failed.', {
			errorCode: getLogSafeErrorCode(error),
		});
		failAccountBootstrap('bootstrap-failed');
	}
}

export function bootstrapAccount() {
	if (bootstrapInFlight !== null) {
		return bootstrapInFlight;
	}

	bootstrapInFlight = runBootstrapAccount()
		.catch((error: unknown) => {
			console.error('Account bootstrap failed unexpectedly.', {
				errorCode: getLogSafeErrorCode(error),
			});
			try {
				failAccountBootstrap('bootstrap-failed');
			} catch (bootstrapError) {
				console.error('Failed to record account bootstrap failure.', {
					errorCode: getLogSafeErrorCode(bootstrapError),
				});
			}
		})
		.finally(() => {
			bootstrapInFlight = null;
		});

	return bootstrapInFlight;
}

export function startAccountBootstrapRetryClient() {
	if (!PUBLIC_RUNTIME_CONFIG.isAccountFeatureClientEnabled) {
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
