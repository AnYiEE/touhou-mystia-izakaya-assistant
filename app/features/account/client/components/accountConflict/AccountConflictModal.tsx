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
	useMemo,
	useRef,
	useState,
} from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import FadeMotionDiv from '@/design/ui/components/fadeMotionDiv';
import Heading from '@/design/ui/components/heading';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';
import { MOTION_DURATION_S, MOTION_EASE } from '@/design/ui/motion';

import { getAccountClientErrorMessage } from '@/features/account/client/errorMessage';
import {
	type TAccountMessageKey,
	accountMessages,
} from '@/features/account/client/messages';
import { accountStore } from '@/features/account/client/state/accountStore';
import {
	type TSyncConflictResolution,
	resolveAccountSyncConflict,
} from '@/features/account/client/sync/conflict';
import {
	ACCOUNT_SYNC_CONFLICT_ISOLATED_STATE_COPY_KEYS,
	ACCOUNT_SYNC_CONFLICT_MESSAGE_KEYS,
	ACCOUNT_SYNC_CONFLICT_READINESS_MESSAGE_KEYS,
	ACCOUNT_SYNC_CONFLICT_RESULT_MESSAGE_KEYS,
	ACCOUNT_SYNC_CONTROL_LABEL_KEYS,
} from '@/features/account/client/sync/conflictCopy';
import { setAccountSyncConflictResolutionReadiness } from '@/features/account/client/sync/syncRuntimeState';
import type { ISyncConflictItem } from '@/features/account/sync/types';
import { trackEventWithoutInteractionCount } from '@/features/analytics/client/trackEvent';
import { CoordinatedModal } from '@/features/overlays/client';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import { useI18n } from '@/shared/i18n/useI18n';

import ConflictPreview from './ConflictPreview';
import ConflictVersionCard from './ConflictVersionCard';
import {
	checkConflictResolutionPresentationAttemptCurrent,
	checkConflictSnapshotUnchanged,
	createConflictResolutionPresentationAttempt,
	createConflictSnapshotKey,
} from './identity';
import { getConflictResolutionTrackName } from './presentation';
import { useConflictPresentation } from './useConflictPresentation';

const CONFLICT_COLLAPSE_MOTION_TRANSITION = {
	duration: MOTION_DURATION_S.base,
	ease: MOTION_EASE.standard,
} as const;
const CONFLICT_COLLAPSE_REDUCED_MOTION_TRANSITION = { duration: 0 } as const;
const CONFLICT_HEADING_CLASS_NAMES = { subTitle: 'mb-0' } as const;
const CONFLICT_MODAL_COORDINATION = {
	id: 'account.sync-conflict',
	requestOwnership: 'external',
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
		const animate = useMemo(
			() => ({
				gridTemplateRows: isOpen ? '1fr' : '0fr',
				opacity: isOpen ? 1 : 0,
			}),
			[isOpen]
		);

		return (
			<motion.div
				animate={animate}
				aria-hidden={!isOpen}
				className={cn('grid', className)}
				initial={false}
				inert={isOpen ? undefined : true}
				transition={
					isReducedMotion
						? CONFLICT_COLLAPSE_REDUCED_MOTION_TRANSITION
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
	const { isHighAppearance } = useDesignPreferences();
	const isReducedMotion = useReducedMotion();
	const vibrate = useVibrate();
	const { locale, t } = useI18n(accountMessages);
	const {
		formatValue,
		getCollisionSourceLabel,
		getDifferences,
		getNamespaceLabel,
	} = useConflictPresentation();

	const conflicts = accountStore.shared.sync.conflicts.use();
	const hasIsolatedState = accountStore.shared.sync.hasIsolatedState.use();
	const lastError = accountStore.shared.sync.lastError.use();
	const remoteConflictNamespaces =
		accountStore.shared.sync.remoteConflictNamespaces.use();
	const resolutionReadinessMap =
		accountStore.shared.sync.resolutionReadiness.use();
	const user = accountStore.shared.user.use();

	const [resolvingResolution, setResolvingResolution] =
		useState<TSyncConflictResolution | null>(null);
	const [displayedConflict, setDisplayedConflict] =
		useState<ISyncConflictItem | null>(null);
	const [message, setMessage] = useState<TAccountMessageKey | null>(null);
	const messageText = message === null ? null : t(message);
	const [pendingResolution, setPendingResolution] =
		useState<TSyncConflictResolution | null>(null);
	const [resolutionIntent, setResolutionIntent] =
		useState<TSyncConflictResolution | null>(null);
	const [isTechnicalDetailsOpen, setIsTechnicalDetailsOpen] = useState(false);

	const resolutionIntentSnapshotKeyRef = useRef<string | null>(null);
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
		resolutionIntentSnapshotKeyRef.current = null;
		resolvingTokenRef.current = null;
		setResolvingResolution(null);
		setMessage(null);
		setPendingResolution(null);
		setResolutionIntent(null);
		setIsTechnicalDetailsOpen(false);
	}, [conflictSnapshotKey, user?.id]);

	useEffect(() => {
		if (isModalOpen && visibleConflictKey !== null) {
			trackEventWithoutInteractionCount(
				trackEventWithoutInteractionCount.category.show,
				'Modal',
				'Account Conflict'
			);
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

			const resolvingToken = Symbol('conflict-resolution');
			const resolutionAttempt =
				createConflictResolutionPresentationAttempt({
					conflict,
					resolutionToken: resolvingToken,
					userId: user.id,
				});
			resolutionIntentSnapshotKeyRef.current =
				resolutionAttempt.conflictSnapshotKey;
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
			setResolutionIntent(resolution);
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
					resolutionIntentSnapshotKeyRef.current = null;
					setResolutionIntent(null);
					setMessage(ACCOUNT_SYNC_CONFLICT_MESSAGE_KEYS.stale);
					return;
				}

				const result = await resolveAccountSyncConflict({
					conflict: currentConflict,
					resolution,
					userId: user.id,
				});

				if (
					resolvingTokenRef.current !==
						resolutionAttempt.resolutionToken ||
					accountStore.shared.user.get()?.id !==
						resolutionAttempt.userId
				) {
					return;
				}
				if (
					result.status === 'resolved' ||
					result.status === 'resolved-elsewhere'
				) {
					resolutionIntentSnapshotKeyRef.current = null;
					trackEventWithoutInteractionCount(
						trackEventWithoutInteractionCount.category.click,
						'Account Conflict Button',
						getConflictResolutionTrackName(resolution)
					);
					setResolutionIntent(null);
					return;
				}
				setMessage(
					ACCOUNT_SYNC_CONFLICT_RESULT_MESSAGE_KEYS[result.status]
				);
				if (result.status === 'busy') {
					return;
				}
				resolutionIntentSnapshotKeyRef.current = null;
				setResolutionIntent(null);
			} catch (error) {
				console.error('Failed to resolve conflict.', {
					errorCode: getLogSafeErrorCode(error),
				});
				if (!checkPresentationAttemptCurrent()) {
					return;
				}
				resolutionIntentSnapshotKeyRef.current = null;
				setResolutionIntent(null);
				setMessage(ACCOUNT_SYNC_CONFLICT_MESSAGE_KEYS.unexpected);
			} finally {
				if (resolvingTokenRef.current === resolvingToken) {
					resolvingTokenRef.current = null;
					setResolvingResolution(null);
				}
			}
		},
		[conflict, user]
	);

	const currentResolutionReadiness =
		conflict === undefined
			? null
			: (resolutionReadinessMap[conflict.namespace] ?? 'ready');

	useEffect(() => {
		if (
			currentResolutionReadiness !== 'ready' ||
			resolutionIntent === null ||
			resolutionIntentSnapshotKeyRef.current !== conflictSnapshotKey ||
			resolvingTokenRef.current !== null
		) {
			return;
		}

		void resolveConflict(resolutionIntent);
	}, [
		conflictSnapshotKey,
		currentResolutionReadiness,
		resolutionIntent,
		resolveConflict,
	]);

	useEffect(() => {
		if (
			currentResolutionReadiness !== 'stale' ||
			conflict === undefined ||
			user === null
		) {
			return;
		}

		setMessage(ACCOUNT_SYNC_CONFLICT_MESSAGE_KEYS.stale);
		setAccountSyncConflictResolutionReadiness(
			user.id,
			conflict.namespace,
			'ready'
		);
	}, [currentResolutionReadiness, conflict, user]);

	const handleUseCloud = useCallback(() => {
		setMessage(null);
		setPendingResolution('cloud');
	}, []);

	const handleUseLocal = useCallback(() => {
		setMessage(null);
		setPendingResolution('local');
	}, []);

	const handleUseMerged = useCallback(() => {
		vibrate();
		setMessage(null);
		setPendingResolution(null);
		void resolveConflict('merged');
	}, [resolveConflict, vibrate]);

	const handleCancelResolution = useCallback(() => {
		setPendingResolution(null);
	}, []);

	const handleConfirmResolution = useCallback(() => {
		if (pendingResolution === null) {
			return;
		}

		vibrate();
		void resolveConflict(pendingResolution);
	}, [pendingResolution, resolveConflict, vibrate]);

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
					aria-label={t('account.conflict.aria.pendingRemote')}
					coordination={CONFLICT_MODAL_COORDINATION}
					hideCloseButton
					isDismissable={false}
					isKeyboardDismissDisabled
					isOpen={isModalOpen}
				>
					<div className="space-y-4 p-1.5">
						<Heading
							as="h2"
							isFirst
							subTitle={t(
								'account.conflict.pendingRemote.subTitle'
							)}
						>
							{t('account.conflict.title.pendingRemote')}
						</Heading>
						<p className="text-small text-foreground-600">
							{t('account.conflict.namespaces')}
							{remoteConflictNamespaces
								.map((namespace) =>
									getNamespaceLabel(namespace)
								)
								.join(t('account.conflict.listSeparator'))}
						</p>
					</div>
				</CoordinatedModal>
			);
		}
		if (hasIsolatedState) {
			const isolatedStateMessage = getAccountClientErrorMessage(
				lastError ?? 'sync-client-update-required',
				locale
			);
			const isolatedStateCopy =
				lastError !== null &&
				lastError in ACCOUNT_SYNC_CONFLICT_ISOLATED_STATE_COPY_KEYS
					? ACCOUNT_SYNC_CONFLICT_ISOLATED_STATE_COPY_KEYS[
							lastError as keyof typeof ACCOUNT_SYNC_CONFLICT_ISOLATED_STATE_COPY_KEYS
						]
					: ACCOUNT_SYNC_CONFLICT_ISOLATED_STATE_COPY_KEYS.default;

			return (
				<CoordinatedModal
					aria-label={t(isolatedStateCopy.title)}
					coordination={CONFLICT_MODAL_COORDINATION}
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
							{t(isolatedStateCopy.title)}
						</Heading>
						<p className="text-small text-foreground-600">
							{t(isolatedStateCopy.detail)}
						</p>
					</div>
				</CoordinatedModal>
			);
		}
		return (
			<CoordinatedModal
				aria-label={t('account.conflict.aria.sync')}
				coordination={CONFLICT_MODAL_COORDINATION}
				isOpen={false}
			>
				<div />
			</CoordinatedModal>
		);
	}

	const { cloud, local, localCollision, merged, namespace } = visibleConflict;
	const differences = getDifferences(cloud, local, merged);
	const namespaceLabel = getNamespaceLabel(namespace);
	const unresolvedConflictCount = conflicts.filter(
		(item) => item.userId === user?.id
	).length;
	const resolutionReadiness = currentResolutionReadiness ?? 'ready';
	const isResolutionReady = resolutionReadiness === 'ready';
	const isResolving =
		resolvingResolution !== null || resolutionIntent !== null;
	const readinessMessage =
		ACCOUNT_SYNC_CONFLICT_READINESS_MESSAGE_KEYS[resolutionReadiness];
	const canUseMergedResult = merged !== null;
	const confirmationText =
		pendingResolution === 'cloud'
			? t('account.conflict.confirmation.cloud', {
					namespace: namespaceLabel,
				})
			: t('account.conflict.confirmation.local', {
					namespace: namespaceLabel,
				});
	const technicalDetailsContent = (
		<div className="grid gap-4 border-t border-default-200/70 p-4 lg:grid-cols-3">
			<ConflictPreview
				label={t('account.conflict.detail.remote')}
				value={cloud}
			/>
			<ConflictPreview
				label={t('account.conflict.detail.local')}
				value={local}
			/>
			<ConflictPreview
				label={t('account.conflict.detail.merged')}
				value={
					merged ??
					t(ACCOUNT_SYNC_CONTROL_LABEL_KEYS.mergedUnavailable)
				}
			/>
		</div>
	);
	if (localCollision !== undefined) {
		return (
			<CoordinatedModal
				aria-label={t('account.conflict.aria.crossTab')}
				coordination={CONFLICT_MODAL_COORDINATION}
				hideCloseButton
				isDismissable={false}
				isKeyboardDismissDisabled
				isOpen={isModalOpen}
				scrollMode="mask"
				size="5xl"
			>
				<div className="w-full space-y-4">
					<Heading
						as="h2"
						classNames={CONFLICT_HEADING_CLASS_NAMES}
						isFirst
						subTitle={t('account.conflict.candidatesSubtitle', {
							namespace: namespaceLabel,
						})}
					>
						{t('account.conflict.title.crossTab')}
					</Heading>
					<div className="rounded-medium border border-warning/30 bg-warning/10 px-4 py-3 text-small leading-6 text-warning-800 dark:text-warning-500">
						{t('account.conflict.candidatesIntro')}
						{localCollision.invalidEvidenceCount > 0 &&
							t('account.conflict.invalidEvidence', {
								count: localCollision.invalidEvidenceCount,
							})}
					</div>
					{readinessMessage !== null && (
						<p
							aria-live="polite"
							className="rounded-medium bg-warning/10 px-4 py-3 text-small text-warning-800 dark:text-warning-500"
						>
							{t(readinessMessage)}
						</p>
					)}
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
											{t(
												'account.conflict.candidate.label',
												{ number: index + 1 }
											)}
										</h3>
										<p className="text-small text-foreground-500">
											{getCollisionSourceLabel(
												candidate.label
											)}
										</p>
									</div>
									<ConflictPreview
										label={t(
											'account.conflict.candidate.rawData'
										)}
										value={candidate.data}
									/>
									<Button
										className="w-full"
										color="primary"
										isDisabled={
											isResolving || !isResolutionReady
										}
										isLoading={
											resolvingResolution === resolution
										}
										variant="flat"
										onPress={() => {
											vibrate();
											void resolveConflict(resolution);
										}}
									>
										{t('account.conflict.candidate.keep')}
									</Button>
								</div>
							);
						})}
					</div>
					{message !== null && (
						<p className="text-small text-danger">{messageText}</p>
					)}
				</div>
			</CoordinatedModal>
		);
	}

	return (
		<CoordinatedModal
			aria-label={t('account.conflict.aria.sync')}
			coordination={CONFLICT_MODAL_COORDINATION}
			hideCloseButton
			isDismissable={false}
			isKeyboardDismissDisabled
			isOpen={isModalOpen}
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
							classNames={CONFLICT_HEADING_CLASS_NAMES}
							isFirst
							subTitle={t('account.conflict.syncSubtitle', {
								namespace: namespaceLabel,
							})}
						>
							{t('account.conflict.title.sync')}
						</Heading>
					</div>
					<span className="shrink-0 rounded-full bg-warning/15 px-2.5 py-1 text-tiny font-medium text-warning-700 dark:text-warning-600">
						{t('account.conflict.unresolvedCount', {
							count: unresolvedConflictCount,
						})}
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
					<p>{t('account.conflict.syncPausedNote')}</p>
				</div>

				{readinessMessage !== null && (
					<p
						aria-live="polite"
						className="rounded-medium bg-warning/10 px-4 py-3 text-small text-warning-800 dark:text-warning-500"
					>
						{t(readinessMessage)}
					</p>
				)}

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
											{t('account.conflict.merge.button')}
										</h3>
										<span className="rounded-full bg-primary/20 px-2 py-0.5 text-tiny font-medium text-primary-700 dark:text-primary">
											{t(
												'account.conflict.merge.recommended'
											)}
										</span>
									</div>
									<p className="mt-1 text-small leading-5 text-foreground-600">
										{t('account.conflict.merge.note')}
									</p>
								</div>
							</div>
							<Button
								className="w-full sm:w-auto"
								color="primary"
								isDisabled={isResolving || !isResolutionReady}
								isLoading={resolvingResolution === 'merged'}
								variant="solid"
								onPress={handleUseMerged}
							>
								{t('account.conflict.merge.apply')}
							</Button>
						</div>
						<div className="rounded-small border border-primary/20 bg-background/25 px-3 py-2.5 dark:bg-content1/20">
							<p className="text-tiny font-medium text-foreground-500">
								{t('account.conflict.merge.keepNote')}
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
											{formatValue(
												difference.merged,
												difference.path
											)}
										</span>
									</div>
								))}
							</div>
							{differences.hasMore && (
								<p className="mt-2 text-tiny text-foreground-500">
									{t('account.conflict.merge.more')}
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
						{t('account.conflict.unmergeableNote')}
					</div>
				)}

				<section className="space-y-3">
					<div>
						<h3 className="font-medium text-foreground-700">
							{t('account.conflict.compare.button')}
						</h3>
						<p className="mt-1 text-small text-foreground-500">
							{t('account.conflict.compare.note')}
						</p>
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						<ConflictVersionCard
							buttonLabel={t(
								'account.conflict.resolution.cloud.button'
							)}
							description={t(
								'account.conflict.resolution.cloud.description'
							)}
							differences={differences}
							icon={faCloud}
							isDisabled={isResolving || !isResolutionReady}
							isHighAppearance={isHighAppearance}
							isLoading={resolvingResolution === 'cloud'}
							title={t('account.conflict.resolution.cloud.title')}
							valueKey="cloud"
							onSelect={handleUseCloud}
						/>
						<ConflictVersionCard
							buttonLabel={t(
								'account.conflict.resolution.local.button'
							)}
							description={t(
								'account.conflict.resolution.local.description'
							)}
							differences={differences}
							icon={faLaptop}
							isDisabled={isResolving || !isResolutionReady}
							isHighAppearance={isHighAppearance}
							isLoading={resolvingResolution === 'local'}
							title={t('account.conflict.resolution.local.title')}
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
									{t('account.conflict.confirm.title')}
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
									{t('account.conflict.confirm.cancel')}
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
									{t('account.conflict.confirm.confirm')}
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
							{messageText}
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
							{t('account.conflict.technicalDetails')}
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
