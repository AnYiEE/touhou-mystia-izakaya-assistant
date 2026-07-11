'use client';

import { memo, useEffect } from 'react';

import { readAccountSyncMeta } from '@/lib/account/client/snapshot';
import {
	refreshAccountState,
	resetAccountSyncRuntime,
} from '@/lib/account/client/session';
import { getLogSafeErrorCode } from '@/lib/logging';
import {
	invalidateAccountSyncClientRuns,
	restoreAccountSyncRuntimeState,
} from '@/lib/account/client/syncClient';
import { type TAccountMeResponse } from '@/lib/account/shared/types';
import { accountStore as store } from '@/stores/account';

interface IProps {
	data: TAccountMeResponse;
}

export default memo<IProps>(function AccountInitialStateHydrator({ data }) {
	useEffect(() => {
		const previousUser = store.shared.user.get();
		const previousCsrfToken = store.shared.csrfToken.get();

		if (!data.isLoggedIn) {
			if (previousUser !== null || previousCsrfToken !== null) {
				invalidateAccountSyncClientRuns();
			}
			if (previousUser !== null) {
				resetAccountSyncRuntime();
			}

			store.shared.bootstrapStatus.set('anonymous');
			store.shared.csrfToken.set(null);
			store.shared.hasPassword.set(false);
			store.shared.isBootstrapped.set(true);
			store.shared.isLoggedIn.set(false);
			store.setPasswordMustChange(false);
			store.shared.sessionInitialData.set(null);
			store.shared.sync.lastError.set(null);
			store.shared.sync.meta.set(data.syncMeta);
			store.shared.user.set(null);
			void refreshAccountState().catch((error: unknown) => {
				console.warn('Post-hydration account refresh failed.', {
					errorCode: getLogSafeErrorCode(error),
				});
			});

			return;
		}

		if (
			previousUser?.id !== data.user.id ||
			previousCsrfToken !== data.csrf_token
		) {
			invalidateAccountSyncClientRuns();
		}
		if (previousUser?.id !== data.user.id) {
			resetAccountSyncRuntime();
		}

		store.shared.bootstrapStatus.set('loggedIn');
		store.shared.csrfToken.set(data.csrf_token);
		store.shared.hasPassword.set(data.has_password);
		store.shared.isBootstrapped.set(true);
		store.shared.isLoggedIn.set(true);
		store.shared.sync.lastError.set(null);
		store.shared.sync.meta.set(
			readAccountSyncMeta(data.user.id) ?? data.syncMeta
		);
		store.shared.user.set(data.user);
		store.setPasswordMustChange(data.password_must_change);
		restoreAccountSyncRuntimeState(data.user.id);
		void refreshAccountState().catch((error: unknown) => {
			console.warn('Post-hydration account refresh failed.', {
				errorCode: getLogSafeErrorCode(error),
			});
		});
	}, [data]);

	return null;
});
