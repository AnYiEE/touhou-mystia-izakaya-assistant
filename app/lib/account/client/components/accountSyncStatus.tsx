'use client';

import { memo, useCallback } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp, faRotate } from '@fortawesome/free-solid-svg-icons';

import { Button, Tooltip } from '@/design/ui/components';

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
	const hasConflicts = sync.conflicts.length > 0;
	const hasPendingUploads = sync.pendingCount > 0;
	const hasSyncError = sync.lastError !== null || sync.failedAttempts > 0;
	const isIdleWithoutSyncRecord =
		sync.lastSyncedAt === null &&
		!hasPendingUploads &&
		!hasConflicts &&
		!hasSyncError &&
		!sync.isSyncing;
	const shouldEnableManualRetry =
		hasPendingUploads && (sync.canRetry || sync.failedAttempts >= 3);
	const shouldShowManualSyncButton =
		sync.isSyncing || shouldEnableManualRetry;

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
			<div className="flex min-h-8 items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-2">
					<FontAwesomeIcon
						icon={faCloudArrowUp}
						className="w-4 text-primary-600"
					/>
					<span className="text-small font-medium text-foreground-700">
						同步状态
					</span>
				</div>
				{shouldShowManualSyncButton ? (
					<Tooltip
						showArrow
						content={sync.isSyncing ? '正在同步' : '立即同步'}
						placement="left"
					>
						<span className="inline-flex shrink-0">
							<Button
								isIconOnly
								aria-label={
									sync.isSyncing ? '正在同步' : '立即同步'
								}
								className="h-8 w-8 min-w-8 text-primary-600"
								color="primary"
								isDisabled={sync.isSyncing}
								isLoading={sync.isSyncing}
								radius="full"
								size="sm"
								spinner={
									<FontAwesomeIcon
										icon={faRotate}
										className="h-3.5 w-3.5 animate-spin"
									/>
								}
								variant="light"
								onPress={handleManualSyncPress}
							>
								<FontAwesomeIcon
									icon={faRotate}
									className="h-3.5 w-3.5"
								/>
							</Button>
						</span>
					</Tooltip>
				) : (
					<span
						aria-hidden="true"
						className="h-8 w-8 min-w-8 shrink-0"
					/>
				)}
			</div>
			{isIdleWithoutSyncRecord ? (
				<p className="leading-5 text-foreground-500">暂无待同步数据</p>
			) : (
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-foreground-500">
					<span>待上传：{sync.pendingCount}</span>
					<span>冲突：{sync.conflicts.length}</span>
					{sync.isSyncing ? (
						<span>正在同步</span>
					) : (
						<span>
							最近同步：
							{sync.lastSyncedAt === null ? (
								'暂无成功记录'
							) : (
								<TimeAgo timestamp={sync.lastSyncedAt} />
							)}
						</span>
					)}
				</div>
			)}
			{storageMode !== 'local' && (
				<p className="leading-5 text-foreground-500">
					同步队列当前无法跨标签持久化，将仅在本会话内尽力同步。
				</p>
			)}
			{sync.lastError !== null && (
				<p className="leading-5 text-danger-600 dark:text-danger">
					{getAccountClientErrorMessage(
						sync.lastError,
						'同步异常，请稍后重试'
					)}
					{sync.failedAttempts > 0
						? `（已失败${sync.failedAttempts}次）`
						: ''}
				</p>
			)}
		</div>
	);
});
