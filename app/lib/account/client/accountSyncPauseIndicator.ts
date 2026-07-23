import { ACCOUNT_SYNC_STATUS_MAP } from '@/lib/account/shared/constants';
import type { TAccountSyncStatus } from '@/lib/account/shared/types';

const ACCOUNT_SYNC_PAUSED_LABEL = '云同步已暂停';

export function getAccountSyncPauseIndicator(
	syncStatus: TAccountSyncStatus | null | undefined
) {
	const isPaused = syncStatus === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty;

	return { isPaused, label: isPaused ? ACCOUNT_SYNC_PAUSED_LABEL : null };
}
