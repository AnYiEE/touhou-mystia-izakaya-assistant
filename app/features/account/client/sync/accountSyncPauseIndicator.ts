import {
	ACCOUNT_SYNC_STATUS_MAP,
	type TAccountSyncStatus,
} from '@/domain/account/contracts';

const ACCOUNT_SYNC_PAUSED_LABEL = '云同步已暂停';

export function getAccountSyncPauseIndicator(
	syncStatus: TAccountSyncStatus | null | undefined
) {
	const isPaused = syncStatus === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty;

	return { isPaused, label: isPaused ? ACCOUNT_SYNC_PAUSED_LABEL : null };
}
