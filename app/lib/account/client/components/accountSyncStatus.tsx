'use client';

import { memo, useCallback, useMemo, useState } from 'react';

import { useReducedMotion } from '@/design/ui/hooks';
import { useVibrate } from '@/hooks';

import { Accordion, AccordionItem } from '@heroui/accordion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faChevronDown,
	faCloudArrowUp,
	faRotate,
} from '@fortawesome/free-solid-svg-icons';

import { Button, Tooltip } from '@/design/ui/components';

import AccountConfirmButton from './accountConfirmButton';
import { trackEvent } from '@/components/analytics';
import TimeAgo from '@/components/timeAgo';

import { checkAccountSyncBroadcastSupported } from '@/lib/account/client/broadcast';
import { getAccountClientErrorMessage } from '@/lib/account/client/errorMessage';
import { readDirtyQueueEntries } from '@/lib/account/client/queue';
import { checkAccountSyncResetPrepared } from '@/lib/account/client/resetGeneration';
import {
	rebuildAccountSyncCloudFromLocal,
	retryAccountSyncQueue,
} from '@/lib/account/client/syncClient';
import { ACCOUNT_SYNC_STATUS_MAP } from '@/lib/account/shared/constants';
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
	'cloud-paused': '云同步已暂停',
	conflict: '冲突待处理',
	'delete-data': '清空数据中',
	'importing-backup': '导入旧备份中',
} as const;

function getNamespaceLabel(namespace: TSyncNamespace) {
	return namespace.replace('.', ' / ');
}

export default memo<IProps>(function AccountSyncStatus() {
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();

	const sync = store.shared.sync.use();
	const user = store.shared.user.use();
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [isRebuildConfirmOpen, setIsRebuildConfirmOpen] = useState(false);
	const [isRebuilding, setIsRebuilding] = useState(false);
	const [rebuildError, setRebuildError] = useState<string | null>(null);

	const storageMode = getSafeStorageMode();
	const supportsNativeLock = checkCrossTabNativeLockSupported();
	const supportsBroadcast = checkAccountSyncBroadcastSupported();
	const dirtyEntries = user === null ? [] : readDirtyQueueEntries(user.id);
	const dirtyEntryMap = new Map(
		dirtyEntries.map((entry) => [entry.namespace, entry] as const)
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
	const hasIncompletePauseTransition =
		user !== null &&
		(sync.lastError === 'account-sync-pause-incomplete' ||
			checkAccountSyncResetPrepared(user.id));
	const pauseError = hasIncompletePauseTransition
		? getAccountClientErrorMessage('account-sync-pause-incomplete')
		: rebuildError;

	const handleManualSyncPress = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Account Sync Button',
			'Manual Sync'
		);
		void retryAccountSyncQueue().catch((error: unknown) => {
			console.warn('Manual account sync failed.', {
				errorCode: getLogSafeErrorCode(error),
			});
		});
	}, [vibrate]);

	const handleDetailToggle = useCallback(() => {
		setIsDetailOpen((value) => !value);
	}, []);

	const handleRebuild = useCallback(() => {
		if (isRebuilding) {
			return;
		}
		vibrate();
		setIsRebuilding(true);
		setRebuildError(null);
		void rebuildAccountSyncCloudFromLocal()
			.then((didRebuild) => {
				if (!didRebuild) {
					throw new Error('sync-rebuild-failed');
				}
				setIsRebuildConfirmOpen(false);
			})
			.catch((error: unknown) => {
				setRebuildError(
					getAccountClientErrorMessage(
						error instanceof Error
							? error.message
							: 'sync-rebuild-failed',
						'恢复云同步失败，请稍后重试'
					)
				);
			})
			.finally(() => {
				setIsRebuilding(false);
			});
	}, [isRebuilding, vibrate]);

	const handleRebuildCancel = useCallback(() => {
		setIsRebuildConfirmOpen(false);
	}, []);

	const handleRebuildOpenChange = useCallback((isOpen: boolean) => {
		setIsRebuildConfirmOpen(isOpen);
		if (isOpen) {
			setRebuildError(null);
		}
	}, []);

	if (user?.sync_status === ACCOUNT_SYNC_STATUS_MAP.pausedEmpty) {
		return (
			<div className="space-y-3 rounded-medium border border-warning/40 bg-warning/5 p-3 text-small">
				<div className="flex items-center gap-2 text-warning-700 dark:text-warning">
					<FontAwesomeIcon icon={faCloudArrowUp} className="w-4" />
					<span className="font-medium">云同步已暂停</span>
				</div>
				<p className="leading-5 text-foreground-500">
					云端当前没有数据，本设备的数据仅保存在本地。
				</p>
				<AccountConfirmButton
					buttonLabel={
						isRebuilding
							? '正在恢复云同步'
							: '用本设备数据恢复云同步'
					}
					color="warning"
					confirmColor="warning"
					confirmLabel="确认恢复"
					icon={faCloudArrowUp}
					isDisabled={isRebuilding || hasIncompletePauseTransition}
					isLoading={isRebuilding}
					isOpen={isRebuildConfirmOpen}
					onCancel={handleRebuildCancel}
					onConfirm={handleRebuild}
					onOpenChange={handleRebuildOpenChange}
				/>
				{pauseError !== null && (
					<p
						className="text-danger-600 dark:text-danger"
						role="alert"
					>
						{pauseError}
					</p>
				)}
			</div>
		);
	}

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
							const isAutomaticResolution =
								dirtyEntry?.paused === 'conflict' &&
								dirtyEntry.conflict?.automaticResolution !==
									undefined;
							const terminalError =
								dirtyEntry?.lastError ===
									'sync-account-capacity-exceeded' ||
								dirtyEntry?.lastError ===
									'sync-request-too-large'
									? dirtyEntry.lastError
									: null;
							const hasNamespaceConflict =
								conflictNamespaceSet.has(namespace) ||
								(dirtyEntry?.paused === 'conflict' &&
									!isAutomaticResolution);
							const statusLabel = isAutomaticResolution
								? '正在协调'
								: hasNamespaceConflict
									? '冲突待处理'
									: terminalError ===
										  'sync-account-capacity-exceeded'
										? '容量超限'
										: terminalError ===
											  'sync-request-too-large'
											? '请求过大'
											: dirtyEntry === undefined
												? '已同步'
												: '待上传';
							const statusClassName = hasNamespaceConflict
								? 'bg-warning/10 text-warning-700 dark:text-warning'
								: terminalError === null
									? dirtyEntry === undefined
										? 'bg-default-100 text-foreground-500 dark:bg-default-50/20'
										: 'bg-primary/10 text-primary-700 dark:text-primary'
									: 'bg-danger/10 text-danger-700 dark:text-danger';
							const rowClassName = hasNamespaceConflict
								? 'border-warning/40 bg-warning/5'
								: terminalError === null
									? dirtyEntry === undefined
										? 'border-default-200 bg-default-50/40'
										: 'border-primary/30 bg-primary/5'
									: 'border-danger/40 bg-danger/5';
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
													{isAutomaticResolution
														? '自动协调中'
														: pausedReasonLabelMap[
																dirtyEntry
																	.paused
															]}
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
