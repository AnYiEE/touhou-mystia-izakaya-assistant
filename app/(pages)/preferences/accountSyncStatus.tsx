'use client';

import { Button } from '@/design/ui/components';
import { flushAccountSyncQueue } from '@/lib/account/client/syncClient';
import { accountStore } from '@/stores/account';
import { getSafeStorageMode } from '@/utilities';
import TimeAgo from '@/components/timeAgo';

export default function AccountSyncStatus() {
	const sync = accountStore.shared.sync.use();
	const storageMode = getSafeStorageMode();
	const canRetry = sync.canRetry || sync.failedAttempts >= 3;

	return (
		<div className="space-y-2 text-sm text-foreground-600">
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
					同步失败：{sync.lastError}
					{sync.failedAttempts > 0
						? `（已失败 ${sync.failedAttempts} 次）`
						: ''}
				</p>
			)}
			<Button
				color="primary"
				isDisabled={
					sync.isSyncing || (sync.pendingCount === 0 && !canRetry)
				}
				isLoading={sync.isSyncing}
				variant="flat"
				onPress={() => {
					void flushAccountSyncQueue();
				}}
			>
				立即同步
			</Button>
		</div>
	);
}
