import { useCallback, useMemo } from 'react';

import type {
	TFeatureAccessReason,
	TFeatureModuleKey,
} from '@/domain/featureAccess/contracts';

import { refreshAccountState } from '@/features/account/client/session';
import { accountStore } from '@/features/account/client/state/accountStore';

export function useFeatureModuleAccess(moduleKey: TFeatureModuleKey) {
	const bootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const featureAccess = accountStore.shared.featureAccess.use();
	const isBootstrapped = accountStore.shared.isBootstrapped.use();
	const isLoggedIn = accountStore.shared.isLoggedIn.use();

	const state = featureAccess?.modules[moduleKey];
	const isLoading = !isBootstrapped;
	const reason: TFeatureAccessReason | null = isLoading
		? null
		: (state?.reason ??
			(bootstrapStatus === 'anonymous'
				? 'login-required'
				: 'unavailable'));
	const refresh = useCallback(() => refreshAccountState(), []);

	return useMemo(
		() => ({
			accessLevel: state?.access_level ?? null,
			allowed: state?.allowed === true,
			bootstrapStatus,
			isLoading,
			isLoggedIn,
			reason,
			refresh,
		}),
		[
			bootstrapStatus,
			isLoading,
			isLoggedIn,
			reason,
			refresh,
			state?.access_level,
			state?.allowed,
		]
	);
}
