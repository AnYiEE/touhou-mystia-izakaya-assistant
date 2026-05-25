import { siteConfig } from '@/configs';
import { accountStore } from '@/stores/account';
import { AccountApiError } from './api';
import { refreshAccountState } from './session';

function disableAccountBootstrap() {
	accountStore.shared.bootstrapStatus.set('disabled');
	accountStore.shared.csrfToken.set(null);
	accountStore.shared.isBootstrapped.set(true);
	accountStore.shared.isLoggedIn.set(false);
	accountStore.shared.passwordMustChange.set(false);
	accountStore.shared.sync.lastError.set(null);
	accountStore.shared.user.set(null);
}

function failAccountBootstrap(message: string) {
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
			failAccountBootstrap('bootstrap-failed');
			return;
		}

		console.error('Account bootstrap failed.', error);
		failAccountBootstrap('bootstrap-failed');
	}
}
