'use client';

import { memo, useEffect } from 'react';

import { readAccountSyncMeta } from '@/lib/account/client/snapshot';
import {
	advanceAccountStateRequestGeneration,
	completeAccountPostLoginBootstrap,
	resetAccountSyncRuntime,
} from '@/lib/account/client/session';
import {
	invalidateAccountSyncClientRuns,
	restoreAccountSyncRuntimeState,
} from '@/lib/account/client/syncClient';
import { type TAccountMeResponse } from '@/lib/account/shared/types';
import { accountStore } from '@/stores/account';

interface IProps {
	data: TAccountMeResponse;
}

export default memo<IProps>(function AccountInitialStateHydrator({ data }) {
	useEffect(() => {
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
			accountStore.shared.passwordMustChange.set(false);
			accountStore.shared.sessionInitialData.set(null);
			accountStore.shared.sync.lastError.set(null);
			accountStore.shared.sync.meta.set(data.syncMeta);
			accountStore.shared.user.set(null);

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

		accountStore.shared.bootstrapStatus.set('loggedIn');
		accountStore.shared.csrfToken.set(data.csrf_token);
		accountStore.shared.hasPassword.set(data.has_password);
		accountStore.shared.isBootstrapped.set(true);
		accountStore.shared.isLoggedIn.set(true);
		accountStore.shared.passwordMustChange.set(data.password_must_change);
		accountStore.shared.sync.lastError.set(null);
		accountStore.shared.sync.meta.set(
			readAccountSyncMeta(data.user.id) ?? data.syncMeta
		);
		accountStore.shared.user.set(data.user);
		restoreAccountSyncRuntimeState(data.user.id);
		const generation = advanceAccountStateRequestGeneration();

		void completeAccountPostLoginBootstrap({
			csrfToken: data.csrf_token,
			generation,
			passwordMustChange: data.password_must_change,
			userId: data.user.id,
		});
	}, [data]);

	return null;
});
