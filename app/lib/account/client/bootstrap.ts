import { siteConfig } from '@/configs';
import { accountStore } from '@/stores/account';
import { AccountApiError } from './api';
import {
	invalidateAccountStateRequests,
	refreshAccountState,
	resetAccountSyncRuntime,
} from './session';

function disableAccountBootstrap() {
	invalidateAccountStateRequests();
	resetAccountSyncRuntime();
	accountStore.shared.sync.meta.set(null);
	accountStore.shared.bootstrapStatus.set('disabled');
	accountStore.shared.csrfToken.set(null);
	accountStore.shared.isBootstrapped.set(true);
	accountStore.shared.isLoggedIn.set(false);
	accountStore.shared.passwordMustChange.set(false);
	accountStore.shared.user.set(null);
}

function failAccountBootstrap(message: string) {
	invalidateAccountStateRequests();
	resetAccountSyncRuntime();
	accountStore.shared.sync.meta.set(null);
	accountStore.shared.bootstrapStatus.set('error');
	accountStore.shared.csrfToken.set(null);
	accountStore.shared.isBootstrapped.set(true);
	accountStore.shared.isLoggedIn.set(false);
	accountStore.shared.passwordMustChange.set(false);
	accountStore.shared.sync.lastError.set(message);
	accountStore.shared.user.set(null);
}

export async function bootstrapAccount() {
	if (!siteConfig.isAccountFeatureClientEnabled) {
		disableAccountBootstrap();
		return;
	}

	try {
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
