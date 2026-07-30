'use client';

import { memo, useEffect } from 'react';

import {
	clearAccountSessionInitialData,
	refreshAccountState,
	resetAccountSyncRuntime,
} from '@/features/account/client/session';
import { accountStore } from '@/features/account/client/state/accountStore';
import { restoreAccountSyncRuntimeState } from '@/features/account/client/sync/remoteState';
import { readAccountSyncMeta } from '@/features/account/client/sync/snapshot';
import { invalidateAccountSyncClientRuns } from '@/features/account/client/sync/syncClient';
import type { TAccountMeResponse } from '@/features/account/contracts';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

interface IProps {
	data: TAccountMeResponse | null;
}

export default memo<IProps>(function AccountInitialStateHydrator({ data }) {
	useEffect(() => {
		if (data === null) {
			return;
		}

		const previousUser = accountStore.shared.user.get();
		const previousCsrfToken = accountStore.shared.csrfToken.get();

		if (!data.isLoggedIn) {
			if (previousUser !== null || previousCsrfToken !== null) {
				invalidateAccountSyncClientRuns();
			}
			if (previousUser !== null) {
				resetAccountSyncRuntime();
			}

			accountStore.shared.bootstrapStatus.set('anonymous');
			accountStore.shared.csrfToken.set(null);
			accountStore.shared.hasPassword.set(false);
			accountStore.shared.isBootstrapped.set(true);
			accountStore.shared.isLoggedIn.set(false);
			accountStore.setPasswordMustChange(false);
			clearAccountSessionInitialData();
			accountStore.shared.sync.lastError.set(null);
			accountStore.shared.sync.meta.set(data.syncMeta);
			accountStore.shared.user.set(null);
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
			clearAccountSessionInitialData();
		}
		if (previousUser?.id !== data.user.id) {
			resetAccountSyncRuntime();
		}

		accountStore.shared.bootstrapStatus.set('loggedIn');
		accountStore.shared.csrfToken.set(data.csrf_token);
		accountStore.shared.hasPassword.set(data.has_password);
		accountStore.shared.isBootstrapped.set(true);
		accountStore.shared.isLoggedIn.set(true);
		accountStore.shared.sync.lastError.set(null);
		accountStore.shared.sync.meta.set(
			readAccountSyncMeta(data.user.id) ?? data.syncMeta
		);
		accountStore.shared.user.set(data.user);
		accountStore.setPasswordMustChange(data.password_must_change);
		restoreAccountSyncRuntimeState(data.user.id);
		void refreshAccountState().catch((error: unknown) => {
			console.warn('Post-hydration account refresh failed.', {
				errorCode: getLogSafeErrorCode(error),
			});
		});
	}, [data]);

	return null;
});
