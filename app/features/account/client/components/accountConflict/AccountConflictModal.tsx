'use client';

import {
	faChevronDown,
	faCloud,
	faCode,
	faLaptop,
	faTriangleExclamation,
	faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { motion } from 'framer-motion';
import {
	type PropsWithChildren,
	memo,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import FadeMotionDiv from '@/design/ui/components/fadeMotionDiv';
import Heading from '@/design/ui/components/heading';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { getAccountClientErrorMessage } from '@/features/account/client/errorMessage';
import { accountStore } from '@/features/account/client/state/accountStore';
import {
	type TSyncConflictResolution,
	resolveAccountSyncConflict,
} from '@/features/account/client/sync/conflict';
import { scheduleAccountSyncFlush } from '@/features/account/client/sync/flush';
import type { ISyncConflictItem } from '@/features/account/sync/types';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { CoordinatedModal } from '@/features/overlays/client';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import ConflictPreview from './ConflictPreview';
import ConflictVersionCard from './ConflictVersionCard';
import {
	checkConflictResolutionPresentationAttemptCurrent,
	checkConflictSnapshotUnchanged,
	createConflictResolutionPresentationAttempt,
	createConflictSnapshotKey,
} from './identity';
import {
	SYNC_NAMESPACE_LABEL_MAP,
	formatFriendlyConflictValue,
	getConflictDifferences,
	getConflictResolutionTrackName,
} from './presentation';

const CONFLICT_MODAL_MOTION_PROPS = {
	variants: {
		enter: {
			opacity: 1,
			scale: 1,
			transition: { duration: 0.16, ease: 'easeOut' },
		},
		exit: {
			opacity: 0,
			scale: 0.985,
			transition: { duration: 0.12, ease: 'easeIn' },
		},
		initial: { opacity: 0, scale: 0.985 },
	},
} as const;

const CONFLICT_COLLAPSE_MOTION_TRANSITION = {
	duration: 0.14,
	ease: 'easeInOut',
} as const;

interface IConflictCollapseProps {
	className?: string;
	isOpen: boolean;
	isReducedMotion: boolean;
	onAnimationComplete?: () => void;
	onUpdate?: () => void;
}

const ConflictCollapse = memo<PropsWithChildren<IConflictCollapseProps>>(
	function ConflictCollapse({
		children,
		className,
		isOpen,
		isReducedMotion,
		onAnimationComplete,
		onUpdate,
	}) {
		return (
			<motion.div
				animate={{
					gridTemplateRows: isOpen ? '1fr' : '0fr',
					opacity: isOpen ? 1 : 0,
				}}
				aria-hidden={!isOpen}
				className={cn('grid', className)}
				initial={false}
				inert={isOpen ? undefined : true}
				transition={
					isReducedMotion
						? { duration: 0 }
						: CONFLICT_COLLAPSE_MOTION_TRANSITION
				}
				{...(onAnimationComplete === undefined
					? {}
					: { onAnimationComplete })}
				{...(onUpdate === undefined ? {} : { onUpdate })}
			>
				<div className="min-h-0 overflow-hidden">{children}</div>
			</motion.div>
		);
	}
);

interface IProps {}

export default memo<IProps>(function AccountConflictModal() {
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();

	const { isHighAppearance } = useDesignPreferences();
	const conflicts = accountStore.shared.sync.conflicts.use();
	const hasIsolatedState = accountStore.shared.sync.hasIsolatedState.use();
	const lastError = accountStore.shared.sync.lastError.use();
	const remoteConflictNamespaces =
		accountStore.shared.sync.remoteConflictNamespaces.use();
	const user = accountStore.shared.user.use();

	const [resolvingResolution, setResolvingResolution] =
		useState<TSyncConflictResolution | null>(null);
	const [displayedConflict, setDisplayedConflict] =
		useState<ISyncConflictItem | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [pendingResolution, setPendingResolution] =
		useState<TSyncConflictResolution | null>(null);
	const [isTechnicalDetailsOpen, setIsTechnicalDetailsOpen] = useState(false);

	const resolvingTokenRef = useRef<symbol | null>(null);
	const technicalDetailsRef = useRef<HTMLDivElement>(null);

	const conflict = conflicts.find((item) => item.userId === user?.id);
	const conflictSnapshotKey =
		conflict === undefined ? null : createConflictSnapshotKey(conflict);
	const isModalOpen =
		user !== null &&
		(conflict !== undefined ||
			hasIsolatedState ||
			remoteConflictNamespaces.length > 0);
	const visibleConflict = conflict ?? displayedConflict;
	const visibleConflictKey =
		visibleConflict === null
			? null
			: createConflictSnapshotKey(visibleConflict);

	useEffect(() => {
		setDisplayedConflict(null);
	}, [user?.id]);

	useEffect(() => {
		if (conflict !== undefined) {
			setDisplayedConflict(conflict);
		} else if (hasIsolatedState || remoteConflictNamespaces.length > 0) {
			setDisplayedConflict(null);
		}
	}, [conflict, hasIsolatedState, remoteConflictNamespaces.length]);

	useEffect(() => {
		resolvingTokenRef.current = null;
		setResolvingResolution(null);
		setMessage(null);
		setPendingResolution(null);
		setIsTechnicalDetailsOpen(false);
	}, [conflictSnapshotKey, user?.id]);

	useEffect(() => {
		if (isModalOpen && visibleConflictKey !== null) {
			trackEvent(trackEvent.category.show, 'Modal', 'Account Conflict');
		}
	}, [isModalOpen, visibleConflictKey]);

	const resolveConflict = useCallback(
		async (resolution: TSyncConflictResolution) => {
			if (
				resolvingTokenRef.current !== null ||
				conflict === undefined ||
				user === null
			) {
				return;
			}

			vibrate();

			trackEvent(
				trackEvent.category.click,
				'Account Conflict Button',
				getConflictResolutionTrackName(resolution)
			);

			const resolvingToken = Symbol('conflict-resolution');
			const resolutionAttempt =
				createConflictResolutionPresentationAttempt({
					conflict,
					resolutionToken: resolvingToken,
					userId: user.id,
				});
			const checkPresentationAttemptCurrent = () => {
				const currentUserId =
					accountStore.shared.user.get()?.id ?? null;
				const currentConflict =
					currentUserId === null
						? undefined
						: accountStore.shared.sync.conflicts
								.get()
								.find((item) => item.userId === currentUserId);

				return checkConflictResolutionPresentationAttemptCurrent({
					attempt: resolutionAttempt,
					conflictSnapshotKey:
						currentConflict === undefined
							? null
							: createConflictSnapshotKey(currentConflict),
					resolutionToken: resolvingTokenRef.current,
					userId: currentUserId,
				});
			};
			resolvingTokenRef.current = resolvingToken;
			setResolvingResolution(resolution);
			setMessage(null);

			try {
				const currentConflict = accountStore.shared.sync.conflicts
					.get()
					.find(
						(item) =>
							createConflictSnapshotKey(item) ===
							resolutionAttempt.conflictSnapshotKey
					);

				if (
					currentConflict === undefined ||
					!checkConflictSnapshotUnchanged(currentConflict, conflict)
				) {
					setMessage('冲突状态已变化，请重新选择');
					return;
				}

				const didResolve = await resolveAccountSyncConflict({
					conflict: currentConflict,
					resolution,
					userId: user.id,
				});

				if (!didResolve) {
					if (!checkPresentationAttemptCurrent()) {
						return;
					}
					setMessage('冲突暂时无法保存，请稍后重试');
					return;
				}

				if (
					resolvingTokenRef.current !==
						resolutionAttempt.resolutionToken ||
					accountStore.shared.user.get()?.id !==
						resolutionAttempt.userId
				) {
					return;
				}
				scheduleAccountSyncFlush();
			} catch (error) {
				console.error('Failed to resolve conflict.', {
					errorCode: getLogSafeErrorCode(error),
				});
				if (!checkPresentationAttemptCurrent()) {
					return;
				}
				setMessage('冲突保存失败，请稍后重试');
			} finally {
				if (resolvingTokenRef.current === resolvingToken) {
					resolvingTokenRef.current = null;
					setResolvingResolution(null);
				}
			}
		},
		[conflict, user, vibrate]
	);

	const handleUseCloud = useCallback(() => {
		setMessage(null);
		setPendingResolution('cloud');
	}, []);

	const handleUseLocal = useCallback(() => {
		setMessage(null);
		setPendingResolution('local');
	}, []);

	const handleUseMerged = useCallback(() => {
		void resolveConflict('merged');
	}, [resolveConflict]);

	const handleCancelResolution = useCallback(() => {
		setPendingResolution(null);
	}, []);

	const handleConfirmResolution = useCallback(() => {
		if (pendingResolution === null) {
			return;
		}

		void resolveConflict(pendingResolution);
	}, [pendingResolution, resolveConflict]);

	const handleToggleTechnicalDetails = useCallback(() => {
		setIsTechnicalDetailsOpen((isOpen) => !isOpen);
	}, []);

	const scrollTechnicalDetailsToBottom = useCallback(() => {
		const scrollElement =
			technicalDetailsRef.current?.closest<HTMLElement>(
				'[data-scroll-mask]'
			);

		if (scrollElement !== null && scrollElement !== undefined) {
			scrollElement.scrollTop = scrollElement.scrollHeight;
		}
	}, []);

	const handleTechnicalDetailsAnimationUpdate = useCallback(() => {
		if (isTechnicalDetailsOpen) {
			scrollTechnicalDetailsToBottom();
		}
	}, [isTechnicalDetailsOpen, scrollTechnicalDetailsToBottom]);

	const handleTechnicalDetailsAnimationComplete = useCallback(() => {
		if (!isTechnicalDetailsOpen) {
			return;
		}

		requestAnimationFrame(scrollTechnicalDetailsToBottom);
	}, [isTechnicalDetailsOpen, scrollTechnicalDetailsToBottom]);

	if (visibleConflict === null) {
		if (remoteConflictNamespaces.length > 0) {
			return (
				<CoordinatedModal
					aria-label="云同步冲突待处理"
					coordination={{
						id: 'account.sync-conflict',
						requestOwnership: 'external',
					}}
					hideCloseButton
					isDismissable={false}
					isKeyboardDismissDisabled
					isOpen={isModalOpen}
				>
					<div className="space-y-4 p-1.5">
						<Heading
							as="h2"
							isFirst
							subTitle="冲突内容保存在另一个标签页中。请回到产生冲突的标签页完成处理；解决后此处会自动恢复。"
						>
							云同步冲突待处理
						</Heading>
						<p className="text-small text-foreground-600">
							涉及：
							{remoteConflictNamespaces
								.map(
									(namespace) =>
										SYNC_NAMESPACE_LABEL_MAP[namespace]
								)
								.join('、')}
						</p>
					</div>
				</CoordinatedModal>
			);
		}
		if (hasIsolatedState) {
			const isolatedStateMessage = getAccountClientErrorMessage(
				lastError ?? 'sync-client-update-required'
			);
			const isInvalidResetMarker =
				lastError === 'sync-reset-marker-invalid';
			const isQuarantineStorageFailed =
				lastError === 'quarantine-storage-failed';
			const isolatedStateTitle = isInvalidResetMarker
				? '本地同步状态需要处理'
				: isQuarantineStorageFailed
					? '本地同步数据无法安全隔离'
					: '需要更新同步客户端';

			return (
				<CoordinatedModal
					aria-label={isolatedStateTitle}
					coordination={{
						id: 'account.sync-conflict',
						requestOwnership: 'external',
					}}
					hideCloseButton
					isDismissable={false}
					isKeyboardDismissDisabled
					isOpen={isModalOpen}
				>
					<div className="space-y-4 p-1.5">
						<Heading
							as="h2"
							isFirst
							subTitle={isolatedStateMessage}
						>
							{isolatedStateTitle}
						</Heading>
						<p className="text-small text-foreground-600">
							{isInvalidResetMarker
								? '原始数据仍保留在当前浏览器中。请先导出需要保留的数据，再通过明确的数据清理操作重置此状态。'
								: isQuarantineStorageFailed
									? '原始数据仍保留在当前浏览器中。请释放本地存储空间后刷新页面重试。'
									: '请刷新页面确认已加载最新版本；若仍然出现此提示，请更新应用后重试。'}
						</p>
					</div>
				</CoordinatedModal>
			);
		}
		return (
			<CoordinatedModal
				aria-label="云同步冲突"
				coordination={{
					id: 'account.sync-conflict',
					requestOwnership: 'external',
				}}
				isOpen={false}
			>
				<div />
			</CoordinatedModal>
		);
	}

	const { cloud, local, localCollision, merged, namespace } = visibleConflict;
	const differences = getConflictDifferences(cloud, local, merged);
	const namespaceLabel = SYNC_NAMESPACE_LABEL_MAP[namespace];
	const unresolvedConflictCount = conflicts.filter(
		(item) => item.userId === user?.id
	).length;
	const isResolving = resolvingResolution !== null;
	const canUseMergedResult = merged !== null;
	const confirmationText =
		pendingResolution === 'cloud'
			? `保留云端版本后，当前设备上的${namespaceLabel}修改将被替换。`
			: `保留当前设备版本后，它会上传到云端并替换云端的${namespaceLabel}修改。`;
	const technicalDetailsContent = (
		<div className="grid gap-4 border-t border-default-200/70 p-4 lg:grid-cols-3">
			<ConflictPreview label="云端原始数据" value={cloud} />
			<ConflictPreview label="当前设备原始数据" value={local} />
			<ConflictPreview
				label="合并后的原始数据"
				value={merged ?? '无法自动合并'}
			/>
		</div>
	);
	if (localCollision !== undefined) {
		return (
			<CoordinatedModal
				aria-label="跨标签页同步冲突"
				coordination={{
					id: 'account.sync-conflict',
					requestOwnership: 'external',
				}}
				hideCloseButton
				isDismissable={false}
				isKeyboardDismissDisabled
				isOpen={isModalOpen}
				motionProps={CONFLICT_MODAL_MOTION_PROPS}
				scrollMode="mask"
				size="5xl"
			>
				<div className="w-full space-y-4">
					<Heading
						as="h2"
						classNames={{ subTitle: 'mb-0' }}
						isFirst
						subTitle={`多个标签页同时修改了“${namespaceLabel}”。所有候选都已保留，请明确选择一个版本。`}
					>
						跨标签页同步冲突
					</Heading>
					<div className="rounded-medium border border-warning/30 bg-warning/10 px-4 py-3 text-small leading-6 text-warning-800 dark:text-warning-500">
						选择前不会上传任何候选。选择后，系统会先保存选择结果，再继续与云端版本比较。
						{localCollision.invalidEvidenceCount > 0 &&
							` 另有 ${localCollision.invalidEvidenceCount} 份无法解析的旧证据仍会保留。`}
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						{localCollision.candidates.map((candidate, index) => {
							const resolution =
								`collision:${candidate.id}` as TSyncConflictResolution;
							return (
								<div
									key={candidate.id}
									className="space-y-3 rounded-medium border border-default-200/70 bg-content1/50 p-4"
								>
									<div>
										<h3 className="font-medium text-foreground-700">
											候选 {index + 1}
										</h3>
										<p className="text-small text-foreground-500">
											{candidate.label}
										</p>
									</div>
									<ConflictPreview
										label="候选原始数据"
										value={candidate.data}
									/>
									<Button
										className="w-full"
										color="primary"
										isDisabled={isResolving}
										isLoading={
											resolvingResolution === resolution
										}
										variant="flat"
										onPress={() => {
											void resolveConflict(resolution);
										}}
									>
										保留此候选
									</Button>
								</div>
							);
						})}
					</div>
					{message !== null && (
						<p className="text-small text-danger">{message}</p>
					)}
				</div>
			</CoordinatedModal>
		);
	}

	return (
		<CoordinatedModal
			aria-label="云同步冲突"
			coordination={{
				id: 'account.sync-conflict',
				requestOwnership: 'external',
			}}
			hideCloseButton
			isDismissable={false}
			isKeyboardDismissDisabled
			isOpen={isModalOpen}
			motionProps={CONFLICT_MODAL_MOTION_PROPS}
			scrollMode="mask"
			size="5xl"
		>
			<FadeMotionDiv
				className="w-full space-y-4"
				target={visibleConflictKey ?? namespace}
			>
				<div className="flex items-start justify-between gap-4">
					<div className="min-w-0">
						<Heading
							as="h2"
							classNames={{ subTitle: 'mb-0' }}
							isFirst
							subTitle={`当前设备和云端都修改过“${namespaceLabel}”，请选择要保留的内容。`}
						>
							云同步冲突
						</Heading>
					</div>
					<span className="shrink-0 rounded-full bg-warning/15 px-2.5 py-1 text-tiny font-medium text-warning-700 dark:text-warning-600">
						{unresolvedConflictCount}项待处理
					</span>
				</div>
				<div
					className={cn(
						'flex items-start gap-3 rounded-medium border border-warning/30 bg-warning/10 px-4 py-3 text-small leading-6 text-warning-800 dark:text-warning-500',
						isHighAppearance && 'backdrop-blur'
					)}
				>
					<FontAwesomeIcon
						icon={faTriangleExclamation}
						className="mt-1 w-4 shrink-0"
					/>
					<p>
						这部分数据的同步已暂停。完成选择前，两份数据都会保留，不会自动覆盖。
					</p>
				</div>

				{canUseMergedResult ? (
					<div
						className={cn(
							'flex flex-col gap-4 rounded-medium border border-primary/30 bg-primary/10 p-4 shadow-small',
							isHighAppearance && 'backdrop-blur'
						)}
					>
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex min-w-0 items-center gap-3">
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary-600 dark:text-primary">
									<FontAwesomeIcon
										icon={faWandMagicSparkles}
										className="mx-auto block !h-4 !w-4"
									/>
								</div>
								<div>
									<div className="flex flex-wrap items-center gap-2">
										<h3 className="font-medium text-foreground-700">
											合并双方的修改
										</h3>
										<span className="rounded-full bg-primary/20 px-2 py-0.5 text-tiny font-medium text-primary-700 dark:text-primary">
											推荐
										</span>
									</div>
									<p className="mt-1 text-small leading-5 text-foreground-600">
										系统已经整理出一份合并结果，可同时保留双方能够兼容的修改。
									</p>
								</div>
							</div>
							<Button
								className="w-full sm:w-auto"
								color="primary"
								isDisabled={isResolving}
								isLoading={resolvingResolution === 'merged'}
								variant="solid"
								onPress={handleUseMerged}
							>
								使用此合并结果
							</Button>
						</div>
						<div className="rounded-small border border-primary/20 bg-background/25 px-3 py-2.5 dark:bg-content1/20">
							<p className="text-tiny font-medium text-foreground-500">
								合并后将保留
							</p>
							<div className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">
								{differences.items.map((difference, index) => (
									<div
										key={`${difference.label}-${index}`}
										className="grid grid-cols-[minmax(0,1fr)_minmax(4rem,auto)] items-center gap-3 text-small"
									>
										<span className="min-w-0 text-foreground-500">
											{difference.label}
										</span>
										<span className="break-words text-right font-medium text-foreground-700">
											{formatFriendlyConflictValue(
												difference.merged,
												difference.path
											)}
										</span>
									</div>
								))}
							</div>
							{differences.hasMore && (
								<p className="mt-2 text-tiny text-foreground-500">
									还有更多合并内容，可在技术详情中查看
								</p>
							)}
						</div>
					</div>
				) : (
					<div
						className={cn(
							'rounded-medium border border-default-200/70 px-4 py-3 text-small leading-6 text-foreground-600',
							isHighAppearance
								? 'bg-content1/40 backdrop-blur'
								: 'bg-content1 dark:bg-content1/70'
						)}
					>
						这两份修改无法安全地自动合并，请比较下方差异后选择其中一个版本。
					</div>
				)}

				<section className="space-y-3">
					<div>
						<h3 className="font-medium text-foreground-700">
							比较两个版本
						</h3>
						<p className="mt-1 text-small text-foreground-500">
							这里只展示有差异的内容，选择后另一份修改会被替换。
						</p>
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						<ConflictVersionCard
							buttonLabel="保留云端版本"
							description="来自账号云端的数据，将覆盖当前设备上的对应修改。"
							differences={differences}
							icon={faCloud}
							isDisabled={isResolving}
							isHighAppearance={isHighAppearance}
							isLoading={resolvingResolution === 'cloud'}
							title="云端版本"
							valueKey="cloud"
							onSelect={handleUseCloud}
						/>
						<ConflictVersionCard
							buttonLabel="保留当前设备版本"
							description="当前浏览器中尚未同步的数据，将上传并覆盖云端修改。"
							differences={differences}
							icon={faLaptop}
							isDisabled={isResolving}
							isHighAppearance={isHighAppearance}
							isLoading={resolvingResolution === 'local'}
							title="当前设备版本"
							valueKey="local"
							onSelect={handleUseLocal}
						/>
					</div>
				</section>

				<ConflictCollapse
					className="!mt-0"
					isOpen={pendingResolution !== null}
					isReducedMotion={isReducedMotion}
				>
					<div className="pt-4">
						<div
							aria-live="polite"
							className={cn(
								'flex flex-col gap-3 rounded-medium border border-warning/40 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between',
								isHighAppearance && 'backdrop-blur'
							)}
						>
							<div className="min-w-0">
								<p className="font-medium text-warning-800 dark:text-warning-500">
									确认覆盖另一份修改？
								</p>
								<p className="mt-1 text-small leading-5 text-foreground-600">
									{confirmationText}
								</p>
							</div>
							<div className="flex shrink-0 justify-end gap-2">
								<Button
									className="data-[hover=true]:backdrop-blur-none data-[pressed=true]:backdrop-blur-none"
									isDisabled={isResolving}
									variant="light"
									onPress={handleCancelResolution}
								>
									取消
								</Button>
								<Button
									className="bg-opacity-100 backdrop-blur-none"
									color="warning"
									isDisabled={isResolving}
									isLoading={
										pendingResolution !== null &&
										resolvingResolution ===
											pendingResolution
									}
									variant="solid"
									onPress={handleConfirmResolution}
								>
									确认保留
								</Button>
							</div>
						</div>
					</div>
				</ConflictCollapse>

				<ConflictCollapse
					className="!mt-0"
					isOpen={message !== null}
					isReducedMotion={isReducedMotion}
				>
					<div className="pt-4">
						<p
							aria-live="assertive"
							className="rounded-small bg-danger/10 px-3 py-2 text-small text-danger-700 dark:text-danger"
							role="alert"
						>
							{message}
						</p>
					</div>
				</ConflictCollapse>

				<div
					ref={technicalDetailsRef}
					className={cn(
						'group scroll-m-4 overflow-hidden rounded-medium border border-default-200/70',
						isHighAppearance
							? 'bg-content1/40 backdrop-blur'
							: 'bg-content1 dark:bg-content1/70'
					)}
				>
					<button
						aria-expanded={isTechnicalDetailsOpen}
						className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left text-small font-medium text-foreground-600 transition-background hover:bg-default-100/60 active:bg-default-100/60 motion-reduce:transition-none"
						type="button"
						onClick={handleToggleTechnicalDetails}
					>
						<span className="flex items-center gap-2">
							<FontAwesomeIcon icon={faCode} className="w-4" />
							查看技术详情
						</span>
						<FontAwesomeIcon
							icon={faChevronDown}
							className={cn(
								'w-3.5 transition-transform motion-reduce:transition-none',
								isTechnicalDetailsOpen && 'rotate-180'
							)}
						/>
					</button>
					<ConflictCollapse
						isOpen={isTechnicalDetailsOpen}
						isReducedMotion={isReducedMotion}
						onAnimationComplete={
							handleTechnicalDetailsAnimationComplete
						}
						onUpdate={handleTechnicalDetailsAnimationUpdate}
					>
						{technicalDetailsContent}
					</ConflictCollapse>
				</div>
			</FadeMotionDiv>
		</CoordinatedModal>
	);
});
