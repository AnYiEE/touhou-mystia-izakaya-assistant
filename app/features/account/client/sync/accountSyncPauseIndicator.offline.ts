import { type TAccountSyncStatus } from '@/domain/account/contracts';

export function getAccountSyncPauseIndicator(
	syncStatus: TAccountSyncStatus | null | undefined
) {
	void syncStatus;

	return { isPaused: false, label: null };
}
