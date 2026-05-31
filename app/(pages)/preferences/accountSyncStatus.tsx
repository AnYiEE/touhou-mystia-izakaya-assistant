'use client';

import { Button } from '@/design/ui/components';
import { flushAccountSyncQueue } from '@/lib/account/client/syncClient';
import { accountStore } from '@/stores/account';
import { getSafeStorageMode } from '@/utilities';
import TimeAgo from '@/components/timeAgo';

const SYNC_ERROR_MESSAGE_MAP: Record<string, string> = {
	'bootstrap-failed': '账号初始化失败，请刷新页面重试',
	conflict: '数据冲突，请在冲突解决面板中处理',
	'legacy-import-failed': '旧版数据导入失败',
	'sync-failed': '同步失败，请稍后重试',
	'sync-refresh-failed': '刷新同步状态失败，请稍后重试',
};

function getSyncErrorMessage(errorCode: string) {
	return SYNC_ERROR_MESSAGE_MAP[errorCode] ?? `同步异常：${errorCode}`;
}

export default function AccountSyncStatus() {
	const sync = accountStore.shared.sync.use();
	const storageMode = getSafeStorageMode();
	const shouldEnableManualRetry =
		sync.pendingCount > 0 && (sync.canRetry || sync.failedAttempts >= 3);

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
					{getSyncErrorMessage(sync.lastError)}
					{sync.failedAttempts > 0
						? `（已失败 ${sync.failedAttempts} 次）`
						: ''}
				</p>
			)}
			<Button
				color="primary"
				isDisabled={
					sync.isSyncing ||
					(sync.pendingCount === 0 && !shouldEnableManualRetry)
				}
				isLoading={sync.isSyncing}
				variant="flat"
				onPress={() => {
					void flushAccountSyncQueue().catch(() => false);
				}}
			>
				立即同步
			</Button>
		</div>
	);
}
