import { type TSyncNamespace } from '@/domain/account/contracts';

import { withCrossTabLock } from '@/infrastructure/browser/crossTab/withCrossTabLock';

export const CONFLICT_RESOLUTION_FALLBACK_LOCK_TTL = 5 * 1000;

export function withAccountSyncNamespaceTransitionLock<T>(
	userId: string,
	namespace: TSyncNamespace,
	callback: () => Promise<T> | T
) {
	return withCrossTabLock(
		`account-sync-conflict:${userId}:${namespace}`,
		callback,
		{
			fallbackTtl: CONFLICT_RESOLUTION_FALLBACK_LOCK_TTL,
			ifAvailable: true,
		}
	);
}
