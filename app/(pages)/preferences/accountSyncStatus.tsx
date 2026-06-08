'use client';

import { memo, useCallback } from 'react';

import { Button } from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';
import TimeAgo from '@/components/timeAgo';

import { getAccountClientErrorMessage } from '@/lib/account/client/errorMessage';
import { flushAccountSyncQueue } from '@/lib/account/client/syncClient';
import { getLogSafeErrorCode } from '@/lib/logging';
import { accountStore as store } from '@/stores/account';
import { getSafeStorageMode } from '@/utilities/safeStorage';

interface IProps {}

export default memo<IProps>(function AccountSyncStatus() {
	const sync = store.shared.sync.use();

	const storageMode = getSafeStorageMode();
	const shouldEnableManualRetry =
		sync.pendingCount > 0 && (sync.canRetry || sync.failedAttempts >= 3);

	const handleManualSyncPress = useCallback(() => {
		trackEvent(
			trackEvent.category.click,
			'Account Sync Button',
			'Manual Sync'
		);
		void flushAccountSyncQueue().catch((error: unknown) => {
			console.warn('Manual account sync failed.', {
				errorCode: getLogSafeErrorCode(error),
			});
		});
	}, []);

	return (
		<div className="space-y-2 text-small text-foreground-600">
			<div className="flex flex-wrap gap-x-4 gap-y-1">
				<span>待上传：{sync.pendingCount}</span>
				<span>冲突：{sync.conflicts.length}</span>
				<span>
					最近同步：
					{sync.lastSyncedAt === null ? (
						'尚未同步'
					) : (
						<TimeAgo timestamp={sync.lastSyncedAt} />
					)}
				</span>
			</div>
			{storageMode !== 'local' && (
				<p>同步队列当前无法跨标签持久化，将仅在本会话内尽力同步。</p>
			)}
			{sync.lastError !== null && (
				<p>
					{getAccountClientErrorMessage(
						sync.lastError,
						'同步异常，请稍后重试'
					)}
					{sync.failedAttempts > 0
						? `（已失败 ${sync.failedAttempts} 次）`
						: ''}
				</p>
			)}
			<Button
				color="primary"
				isDisabled={sync.isSyncing || !shouldEnableManualRetry}
				isLoading={sync.isSyncing}
				variant="flat"
				onPress={handleManualSyncPress}
			>
				立即同步
			</Button>
		</div>
	);
});
