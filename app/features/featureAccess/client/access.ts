import { type TFeatureModuleKey } from '@/domain/featureAccess/contracts';

import { accountStore } from '@/features/account/client/state/accountStore';

export function isFeatureModuleAllowed(moduleKey: TFeatureModuleKey) {
	return (
		accountStore.shared.featureAccess.get()?.modules[moduleKey]?.allowed ===
		true
	);
}
