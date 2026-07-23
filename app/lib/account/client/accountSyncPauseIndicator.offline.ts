import type { TAccountSyncStatus } from '@/lib/account/shared/types';

export function getAccountSyncPauseIndicator(
	syncStatus: TAccountSyncStatus | null | undefined
) {
	void syncStatus;

	return { isPaused: false, label: null };
}
