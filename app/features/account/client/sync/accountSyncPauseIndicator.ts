import {
	ACCOUNT_SYNC_STATUS_MAP,
	type TAccountSyncStatus,
} from '@/domain/account/contracts';

import { type TAccountMessageKey } from '@/features/account/client/messages';

import { ACCOUNT_SYNC_STATUS_MESSAGE_KEYS } from './conflictCopy';

export function getAccountSyncPauseIndicator(
	syncStatus: TAccountSyncStatus | null | undefined
) {
	const isPaused = syncStatus === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty;

	return {
		isPaused,
		labelKey: isPaused
			? ACCOUNT_SYNC_STATUS_MESSAGE_KEYS.paused
			: (null as TAccountMessageKey | null),
	};
}
