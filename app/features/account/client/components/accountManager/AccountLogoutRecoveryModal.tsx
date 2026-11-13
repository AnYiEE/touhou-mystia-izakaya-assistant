'use client';

import {
	faDownload,
	faRightFromBracket,
	faRotate,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCallback, useEffect, useState } from 'react';

import Button from '@/design/ui/components/button';
import Heading from '@/design/ui/components/heading';

import AccountConfirmButton from '@/features/account/client/components/AccountConfirmButton';
import { AccountPanel } from '@/features/account/client/components/accountManager/accountPanelLayout';
import { ACCOUNT_MODAL_CLASS_NAMES } from '@/features/account/client/components/accountModalSpacing';
import { accountMessages } from '@/features/account/client/messages';
import { refreshAccountState } from '@/features/account/client/session';
import { accountStore } from '@/features/account/client/state/accountStore';
import { flushAccountSyncQueueUntilIdle } from '@/features/account/client/sync/flush';
import { executeAccountLogoutWorkspace } from '@/features/account/client/workspace/lifecycle';
import {
	captureAccountWorkspace,
	workspaceStore,
} from '@/features/account/client/workspace/workspaceStore';
import {
	CoordinatedModal,
	requestOverlayClose,
} from '@/features/overlays/client';
import { downloadGuestDataExport } from '@/features/preferences/client/dataManagement/guestDataTransfer';

import { useI18n } from '@/shared/i18n/useI18n';

import { logoutRecoveryStore } from './logoutRecoveryStore';

const LOGOUT_RECOVERY_COORDINATION = { id: 'account.logout-recovery' } as const;

export default function AccountLogoutRecoveryModal() {
	const { t } = useI18n(accountMessages);
	const operation = logoutRecoveryStore.operation.use();
	const reason = logoutRecoveryStore.reason.use();
	const blocker = workspaceStore.blocker.use();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDiscardOpen, setIsDiscardOpen] = useState(false);
	const [modalContent, setModalContent] = useState<HTMLDivElement | null>(
		null
	);
	const [isPendingRecovery, setIsPendingRecovery] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const canRetry = reason === 'sync-failed';
	const canClose = !isSubmitting && !isPendingRecovery;

	useEffect(() => {
		setIsSubmitting(false);
		setIsDiscardOpen(false);
		setIsPendingRecovery(false);
		setMessage(null);
	}, [operation, reason]);

	useEffect(() => {
		if (blocker === null) {
			return;
		}
		logoutRecoveryStore.set({ operation: null, reason: null });
		requestOverlayClose('account.logout-recovery');
	}, [blocker]);

	const close = useCallback(() => {
		if (!canClose) {
			return;
		}
		logoutRecoveryStore.set({ operation: null, reason: null });
		setIsDiscardOpen(false);
		setMessage(null);
		requestOverlayClose('account.logout-recovery');
	}, [canClose]);

	const performLogout = useCallback(
		async (discard: boolean) => {
			const user = accountStore.shared.user.get();
			if (operation === null || user === null) {
				throw new Error('account-logout-context-unavailable');
			}
			if (!discard) {
				const flushed = await flushAccountSyncQueueUntilIdle();
				if (!flushed) {
					throw new Error('account-sync-pending');
				}
			}

			const completion = await executeAccountLogoutWorkspace({
				action: operation,
				discardUnsyncedChanges: discard,
				expected: captureAccountWorkspace(),
			});
			if (completion === 'pending-recovery') {
				setIsPendingRecovery(true);
				setMessage(t('account.workspace.readiness.transitioning'));
				return;
			}
			if (completion === 'busy') {
				throw new Error('account-operation-busy');
			}
			if (typeof completion === 'object') {
				throw new TypeError(completion.message);
			}
			if (['account-mismatch', 'locked', 'ready'].includes(completion)) {
				logoutRecoveryStore.set({ operation: null, reason: null });
				requestOverlayClose('account.logout-recovery');
				return;
			}
			if (completion !== 'guest') {
				throw new Error('account-logout-transition-failed');
			}
			logoutRecoveryStore.set({ operation: null, reason: null });
			requestOverlayClose('account.logout-recovery');
		},
		[operation, t]
	);

	const handleRetry = useCallback(() => {
		if (isSubmitting) {
			return;
		}
		setIsSubmitting(true);
		setMessage(null);
		void performLogout(false)
			.catch(() => {
				setMessage(t('account.logoutRecovery.error'));
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [isSubmitting, performLogout, t]);

	const handleDiscard = useCallback(() => {
		if (isSubmitting) {
			return;
		}
		setIsSubmitting(true);
		setMessage(null);
		void performLogout(true)
			.catch(() => {
				setMessage(t('account.logoutRecovery.error'));
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [isSubmitting, performLogout, t]);

	const handleExport = useCallback(() => {
		downloadGuestDataExport();
		setMessage(
			t(
				canRetry
					? 'account.logoutRecovery.exportComplete'
					: 'account.logoutRecovery.exportCompleteUnavailable'
			)
		);
	}, [canRetry, t]);

	const handleRecheck = useCallback(() => {
		if (isSubmitting) {
			return;
		}
		setIsSubmitting(true);
		setMessage(null);
		void refreshAccountState()
			.then(() => {
				if (
					workspaceStore.isReady.get() ||
					workspaceStore.blocker.get() !== null
				) {
					logoutRecoveryStore.set({ operation: null, reason: null });
					requestOverlayClose('account.logout-recovery');
					return;
				}
				setMessage(t('account.logoutRecovery.error'));
			})
			.catch(() => {
				setMessage(t('account.logoutRecovery.error'));
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [isSubmitting, t]);

	return (
		<CoordinatedModal
			aria-label={t('account.logoutRecovery.title')}
			classNames={ACCOUNT_MODAL_CLASS_NAMES}
			coordination={LOGOUT_RECOVERY_COORDINATION}
			isOpen={operation !== null}
			hideCloseButton={!canClose}
			isDismissable={canClose}
			isKeyboardDismissDisabled={!canClose}
			size="2xl"
			onClose={close}
		>
			<div ref={setModalContent} className="space-y-4 px-1.5">
				<Heading
					as="h2"
					isFirst
					subTitle={t(
						canRetry
							? 'account.logoutRecovery.description'
							: 'account.logoutRecovery.descriptionUnavailable'
					)}
				>
					{t('account.logoutRecovery.title')}
				</Heading>
				<AccountPanel className="space-y-3">
					{isPendingRecovery && (
						<Button
							fullWidth
							className="justify-center"
							color="primary"
							isDisabled={isSubmitting}
							isLoading={isSubmitting}
							variant="flat"
							onPress={handleRecheck}
						>
							{t('account.logoutRecovery.recheck')}
						</Button>
					)}
					{canRetry && (
						<Button
							fullWidth
							className="justify-center"
							color="primary"
							isDisabled={!canClose}
							isLoading={isSubmitting}
							startContent={
								isSubmitting ? null : (
									<FontAwesomeIcon
										icon={faRotate}
										className="w-4"
									/>
								)
							}
							variant="flat"
							onPress={handleRetry}
						>
							{t('account.logoutRecovery.retry')}
						</Button>
					)}
					<Button
						fullWidth
						className="justify-center"
						color="primary"
						isDisabled={!canClose}
						startContent={
							<FontAwesomeIcon
								icon={faDownload}
								className="w-4"
							/>
						}
						variant="flat"
						onPress={handleExport}
					>
						{t('account.logoutRecovery.export')}
					</Button>
					<p className="text-tiny leading-5 text-foreground-500">
						{t('account.logoutRecovery.exportScope')}
					</p>
					<AccountConfirmButton
						{...(modalContent === null
							? {}
							: { portalContainer: modalContent })}
						buttonLabel={t('account.logoutRecovery.discard')}
						className="justify-center"
						color="danger"
						confirmLabel={t(
							'account.logoutRecovery.confirmDiscard'
						)}
						icon={faRightFromBracket}
						isDisabled={!canClose}
						isCancelDisabled={!canClose}
						isLoading={isSubmitting}
						isOpen={isDiscardOpen}
						onCancel={() => {
							if (canClose) {
								setIsDiscardOpen(false);
							}
						}}
						onConfirm={handleDiscard}
						onOpenChange={(nextOpen) => {
							if (canClose) {
								setIsDiscardOpen(nextOpen);
							}
						}}
					/>
					<p className="text-tiny leading-5 text-danger-600 dark:text-danger">
						{t('account.logoutRecovery.discardConfirm')}
					</p>
					<Button
						fullWidth
						className="justify-center"
						isDisabled={!canClose}
						variant="flat"
						onPress={close}
					>
						{t('account.logoutRecovery.cancel')}
					</Button>
					{message !== null && (
						<p
							className="text-small text-foreground-600"
							role="status"
						>
							{message}
						</p>
					)}
				</AccountPanel>
			</div>
		</CoordinatedModal>
	);
}
