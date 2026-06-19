'use client';

import { memo, useCallback, useMemo, useState } from 'react';

import { Accordion, AccordionItem } from '@heroui/accordion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faChevronDown,
	faCloudArrowUp,
	faRotate,
} from '@fortawesome/free-solid-svg-icons';

import { Button, Tooltip } from '@/design/ui/components';
import { useReducedMotion } from '@/design/ui/hooks';

import { trackEvent } from '@/components/analytics';
import TimeAgo from '@/components/timeAgo';

import { checkAccountSyncBroadcastSupported } from '@/lib/account/client/broadcast';
import { getAccountClientErrorMessage } from '@/lib/account/client/errorMessage';
import { readDirtyQueueEntries } from '@/lib/account/client/queue';
import { flushAccountSyncQueue } from '@/lib/account/client/syncClient';
import { SYNC_NAMESPACE_MAP, type TSyncNamespace } from '@/lib/account/sync';
import { getLogSafeErrorCode } from '@/lib/logging';
import { accountStore as store } from '@/stores/account';
import { checkCrossTabNativeLockSupported } from '@/utilities/crossTabLock';
import { getSafeStorageMode } from '@/utilities/safeStorage';

interface IProps {}

const SYNC_DETAIL_ACCORDION_KEY = 'sync-detail';
const syncNamespaces = Object.values(SYNC_NAMESPACE_MAP);

const storageModeLabelMap = {
	local: '本地持久化',
	memory: '内存兜底',
	session: '会话兜底',
} as const satisfies Record<ReturnType<typeof getSafeStorageMode>, string>;

const pausedReasonLabelMap = {
	'applying-remote': '应用云端中',
	bootstrap: '初始化中',
	conflict: '冲突待处理',
	'delete-data': '清空数据中',
	'importing-backup': '导入旧备份中',
} as const;

function getNamespaceLabel(namespace: TSyncNamespace) {
	return namespace.replace('.', ' / ');
}

export default memo<IProps>(function AccountSyncStatus() {
	const sync = store.shared.sync.use();
	const user = store.shared.user.use();
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const isReducedMotion = useReducedMotion();

	const storageMode = getSafeStorageMode();
	const supportsNativeLock = checkCrossTabNativeLockSupported();
	const supportsBroadcast = checkAccountSyncBroadcastSupported();
	const dirtyEntries = useMemo(
		() => (user === null ? [] : readDirtyQueueEntries(user.id)),
		[user]
	);
	const dirtyEntryMap = useMemo(
		() =>
			new Map(
				dirtyEntries.map((entry) => [entry.namespace, entry] as const)
			),
		[dirtyEntries]
	);
	const conflictNamespaceSet = useMemo(
		() =>
			new Set(
				sync.conflicts
					.filter(
						(conflict) =>
							user !== null && conflict.userId === user.id
					)
					.map((conflict) => conflict.namespace)
			),
		[sync.conflicts, user]
	);
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

	const handleDetailToggle = useCallback(() => {
		setIsDetailOpen((value) => !value);
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
				<div className="inline-flex shrink-0 items-center gap-1">
					{shouldShowManualSyncButton && (
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
					)}
					<Tooltip
						showArrow
						content={isDetailOpen ? '收起同步详情' : '展开同步详情'}
						placement="left"
					>
						<span className="inline-flex shrink-0">
							<Button
								isIconOnly
								aria-label={
									isDetailOpen
										? '收起同步详情'
										: '展开同步详情'
								}
								className="h-8 w-8 min-w-8 text-primary-600"
								radius="full"
								size="sm"
								variant="light"
								onPress={handleDetailToggle}
							>
								<FontAwesomeIcon
									icon={faChevronDown}
									className={`h-3.5 w-3.5 transition-transform ${
										isDetailOpen ? 'rotate-180' : ''
									}`}
								/>
							</Button>
						</span>
					</Tooltip>
				</div>
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
			<Accordion
				disableAnimation={isReducedMotion}
				hideIndicator
				isCompact
				selectedKeys={isDetailOpen ? [SYNC_DETAIL_ACCORDION_KEY] : []}
				selectionMode="multiple"
				className="p-0"
				itemClasses={{
					base: 'p-0',
					content: 'space-y-3 border-t border-default-200/80 pt-3',
					trigger: 'hidden',
				}}
			>
				<AccordionItem
					key={SYNC_DETAIL_ACCORDION_KEY}
					aria-label="同步详情"
					title="同步详情"
				>
					<div className="grid gap-2 sm:grid-cols-3">
						<div className="rounded-medium border border-default-200 bg-default-50/40 px-3 py-2">
							<p className="text-tiny text-foreground-500">
								存储
							</p>
							<p className="text-small font-medium text-foreground-700">
								{storageModeLabelMap[storageMode]}
							</p>
						</div>
						<div className="rounded-medium border border-default-200 bg-default-50/40 px-3 py-2">
							<p className="text-tiny text-foreground-500">
								跨标签互斥
							</p>
							<p className="text-small font-medium text-foreground-700">
								{supportsNativeLock
									? '浏览器原生'
									: '本地租约兜底'}
							</p>
						</div>
						<div className="rounded-medium border border-default-200 bg-default-50/40 px-3 py-2">
							<p className="text-tiny text-foreground-500">
								跨标签广播
							</p>
							<p className="text-small font-medium text-foreground-700">
								{supportsBroadcast ? '可用' : '不可用'}
							</p>
						</div>
					</div>
					{storageMode !== 'local' && (
						<p className="rounded-medium bg-warning/10 px-3 py-2 text-small leading-5 text-warning-700 dark:text-warning">
							当前存储无法持久跨标签同步队列，关闭页面前请等待同步完成。
						</p>
					)}
					<div className="space-y-2">
						{syncNamespaces.map((namespace) => {
							const dirtyEntry = dirtyEntryMap.get(namespace);
							const hasNamespaceConflict =
								conflictNamespaceSet.has(namespace) ||
								dirtyEntry?.paused === 'conflict';
							const statusLabel = hasNamespaceConflict
								? '冲突待处理'
								: dirtyEntry === undefined
									? '已同步'
									: '待上传';
							const statusClassName = hasNamespaceConflict
								? 'bg-warning/10 text-warning-700 dark:text-warning'
								: dirtyEntry === undefined
									? 'bg-default-100 text-foreground-500 dark:bg-default-50/20'
									: 'bg-primary/10 text-primary-700 dark:text-primary';
							const rowClassName = hasNamespaceConflict
								? 'border-warning/40 bg-warning/5'
								: dirtyEntry === undefined
									? 'border-default-200 bg-default-50/40'
									: 'border-primary/30 bg-primary/5';
							return (
								<div
									key={namespace}
									className={`rounded-medium border px-3 py-2 ${rowClassName}`}
								>
									<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
										<div className="min-w-0 space-y-1">
											<p className="break-words font-mono text-small font-medium text-foreground-700">
												{getNamespaceLabel(namespace)}
											</p>
											<p className="text-tiny text-foreground-500">
												云端版本：
												{sync.meta?.revisions[
													namespace
												] ?? 0}
											</p>
										</div>
										<span
											className={`inline-flex min-w-8 shrink-0 items-center justify-center rounded-full px-2 py-1 text-tiny leading-none ${statusClassName}`}
										>
											{statusLabel}
										</span>
									</div>
									{dirtyEntry !== undefined && (
										<div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-tiny text-foreground-500">
											<span>
												基线版本：
												{dirtyEntry.baseRevision}
											</span>
											<span>
												尝试：{dirtyEntry.attempts}
											</span>
											<span>
												变更时间：
												<TimeAgo
													timestamp={
														dirtyEntry.dirtyAt
													}
												/>
											</span>
											{dirtyEntry.paused !== null && (
												<span>
													暂停：
													{
														pausedReasonLabelMap[
															dirtyEntry.paused
														]
													}
												</span>
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</AccordionItem>
			</Accordion>
		</div>
	);
});
