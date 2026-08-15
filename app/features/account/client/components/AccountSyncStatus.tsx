'use client';

import {
	faChevronDown,
	faCloudArrowUp,
	faRotate,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { memo, useCallback, useMemo, useState } from 'react';

import Button from '@/design/ui/components/button';
import TimeAgo from '@/design/ui/components/timeAgo';
import Tooltip from '@/design/ui/components/tooltip';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import {
	ACCOUNT_SYNC_STATUS_MAP,
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
} from '@/domain/account/contracts';

import { getAccountClientErrorMessage } from '@/features/account/client/errorMessage';
import { accountStore } from '@/features/account/client/state/accountStore';
import { checkAccountSyncBroadcastSupported } from '@/features/account/client/sync/broadcast';
import {
	ACCOUNT_SYNC_CONTROL_LABEL_MAP,
	ACCOUNT_SYNC_NAMESPACE_STATUS_LABEL_MAP,
	ACCOUNT_SYNC_PAUSED_REASON_LABEL_MAP,
	ACCOUNT_SYNC_STATUS_FALLBACK_MESSAGE_MAP,
	ACCOUNT_SYNC_STATUS_MESSAGE_MAP,
	ACCOUNT_SYNC_STORAGE_MODE_LABEL_MAP,
	createAccountSyncFailedAttemptsMessage,
	getAccountSyncNamespaceStatusLabel,
} from '@/features/account/client/sync/conflictCopy';
import { readDirtyQueueEntries } from '@/features/account/client/sync/dirtyQueue/collisionEvidence';
import { retryAccountSyncQueue } from '@/features/account/client/sync/flush';
import { rebuildAccountSyncCloudFromLocal } from '@/features/account/client/sync/rebuild';
import { checkAccountSyncResetPrepared } from '@/features/account/client/sync/resetGeneration';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { checkCrossTabNativeLockSupported } from '@/infrastructure/browser/crossTab/withCrossTabLock';
import { getSafeStorageMode } from '@/infrastructure/browser/storage/safeStorage';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import AccountConfirmButton from './AccountConfirmButton';

interface IProps {}

const SYNC_DETAIL_ACCORDION_KEY = 'sync-detail';
const CLOSED_SYNC_DETAIL_KEYS: ReadonlyArray<string> = [];
const OPEN_SYNC_DETAIL_KEYS: ReadonlyArray<string> = [
	SYNC_DETAIL_ACCORDION_KEY,
];
const SYNC_DETAIL_ITEM_CLASSES = {
	base: 'p-0',
	content: 'space-y-3 border-t border-default-200/80 pt-3',
	trigger: 'hidden',
} as const;
const syncNamespaces = Object.values(SYNC_NAMESPACE_MAP);

function getNamespaceLabel(namespace: TSyncNamespace) {
	return namespace.replace('.', ' / ');
}

export default memo<IProps>(function AccountSyncStatus() {
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();

	const sync = accountStore.shared.sync.use();
	const user = accountStore.shared.user.use();
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
						Error.isError(error)
							? error.message
							: 'sync-rebuild-failed',
						ACCOUNT_SYNC_STATUS_FALLBACK_MESSAGE_MAP.rebuildFailed
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
					{ACCOUNT_SYNC_STATUS_MESSAGE_MAP.pausedEmptyDescription}
				</p>
				<AccountConfirmButton
					buttonLabel={
						isRebuilding
							? ACCOUNT_SYNC_CONTROL_LABEL_MAP.restoring
							: ACCOUNT_SYNC_CONTROL_LABEL_MAP.restore
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
							content={
								sync.isSyncing
									? ACCOUNT_SYNC_CONTROL_LABEL_MAP.syncing
									: ACCOUNT_SYNC_CONTROL_LABEL_MAP.sync
							}
							placement="left"
						>
							<span className="inline-flex shrink-0">
								<Button
									isIconOnly
									aria-label={
										sync.isSyncing
											? ACCOUNT_SYNC_CONTROL_LABEL_MAP.syncing
											: ACCOUNT_SYNC_CONTROL_LABEL_MAP.sync
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
						content={
							isDetailOpen
								? ACCOUNT_SYNC_CONTROL_LABEL_MAP.collapseDetails
								: ACCOUNT_SYNC_CONTROL_LABEL_MAP.expandDetails
						}
						placement="left"
					>
						<span className="inline-flex shrink-0">
							<Button
								isIconOnly
								aria-label={
									isDetailOpen
										? ACCOUNT_SYNC_CONTROL_LABEL_MAP.collapseDetails
										: ACCOUNT_SYNC_CONTROL_LABEL_MAP.expandDetails
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
				<p className="leading-5 text-foreground-500">
					{ACCOUNT_SYNC_STATUS_MESSAGE_MAP.noPendingData}
				</p>
			) : (
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-foreground-500">
					<span>待上传：{sync.pendingCount}</span>
					<span>冲突：{sync.conflicts.length}</span>
					{sync.isSyncing ? (
						<span>{ACCOUNT_SYNC_CONTROL_LABEL_MAP.syncing}</span>
					) : (
						<span>
							最近同步：
							{sync.lastSyncedAt === null ? (
								ACCOUNT_SYNC_STATUS_MESSAGE_MAP.noSuccessfulRecord
							) : (
								<TimeAgo timestamp={sync.lastSyncedAt} />
							)}
						</span>
					)}
				</div>
			)}
			{storageMode !== 'local' && (
				<p className="leading-5 text-foreground-500">
					{ACCOUNT_SYNC_STATUS_MESSAGE_MAP.sessionQueueFallback}
				</p>
			)}
			{sync.lastError !== null && (
				<p className="leading-5 text-danger-600 dark:text-danger">
					{getAccountClientErrorMessage(
						sync.lastError,
						ACCOUNT_SYNC_STATUS_FALLBACK_MESSAGE_MAP.syncFailed
					)}
					{sync.failedAttempts > 0
						? createAccountSyncFailedAttemptsMessage(
								sync.failedAttempts
							)
						: ''}
				</p>
			)}
			<Accordion
				disableAnimation={isReducedMotion}
				hideIndicator
				isCompact
				selectedKeys={
					isDetailOpen
						? OPEN_SYNC_DETAIL_KEYS
						: CLOSED_SYNC_DETAIL_KEYS
				}
				selectionMode="multiple"
				className="p-0"
				itemClasses={SYNC_DETAIL_ITEM_CLASSES}
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
								{
									ACCOUNT_SYNC_STORAGE_MODE_LABEL_MAP[
										storageMode
									]
								}
							</p>
						</div>
						<div className="rounded-medium border border-default-200 bg-default-50/40 px-3 py-2">
							<p className="text-tiny text-foreground-500">
								跨标签互斥
							</p>
							<p className="text-small font-medium text-foreground-700">
								{supportsNativeLock
									? ACCOUNT_SYNC_CONTROL_LABEL_MAP.nativeLock
									: ACCOUNT_SYNC_CONTROL_LABEL_MAP.compatibleLock}
							</p>
						</div>
						<div className="rounded-medium border border-default-200 bg-default-50/40 px-3 py-2">
							<p className="text-tiny text-foreground-500">
								跨标签广播
							</p>
							<p className="text-small font-medium text-foreground-700">
								{supportsBroadcast
									? ACCOUNT_SYNC_CONTROL_LABEL_MAP.broadcastAvailable
									: ACCOUNT_SYNC_CONTROL_LABEL_MAP.broadcastUnavailable}
							</p>
						</div>
					</div>
					{storageMode !== 'local' && (
						<p className="rounded-medium bg-warning/10 px-3 py-2 text-small leading-5 text-warning-700 dark:text-warning">
							{
								ACCOUNT_SYNC_STATUS_MESSAGE_MAP.sessionQueueWarning
							}
						</p>
					)}
					<div className="space-y-2">
						{syncNamespaces.map((namespace) => {
							const dirtyEntry = dirtyEntryMap.get(namespace);
							const resolutionReadiness =
								sync.resolutionReadiness[namespace];
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
							const statusLabel =
								getAccountSyncNamespaceStatusLabel({
									hasConflict: hasNamespaceConflict,
									isAutomaticResolution,
									isDirty: dirtyEntry !== undefined,
									resolutionReadiness,
									terminalError,
								});
							const isResolutionUnavailable =
								resolutionReadiness === 'storage-unavailable' ||
								resolutionReadiness === 'unsupported';
							const statusClassName = isResolutionUnavailable
								? 'bg-danger/10 text-danger-700 dark:text-danger'
								: hasNamespaceConflict
									? 'bg-warning/10 text-warning-700 dark:text-warning'
									: terminalError === null
										? dirtyEntry === undefined
											? 'bg-default-100 text-foreground-500 dark:bg-default-50/20'
											: 'bg-primary/10 text-primary-700 dark:text-primary'
										: 'bg-danger/10 text-danger-700 dark:text-danger';
							const rowClassName = isResolutionUnavailable
								? 'border-danger/40 bg-danger/5'
								: hasNamespaceConflict
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
														? ACCOUNT_SYNC_NAMESPACE_STATUS_LABEL_MAP.automaticResolutionPaused
														: ACCOUNT_SYNC_PAUSED_REASON_LABEL_MAP[
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
