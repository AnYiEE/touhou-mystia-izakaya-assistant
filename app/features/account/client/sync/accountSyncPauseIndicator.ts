import {
	ACCOUNT_SYNC_STATUS_MAP,
	type TAccountSyncStatus,
} from '@/domain/account/contracts';

import { ACCOUNT_SYNC_STATUS_MESSAGE_MAP } from './conflictCopy';

export function getAccountSyncPauseIndicator(
	syncStatus: TAccountSyncStatus | null | undefined
) {
	const isPaused = syncStatus === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty;

	return {
		isPaused,
		label: isPaused ? ACCOUNT_SYNC_STATUS_MESSAGE_MAP.paused : null,
	};
}
