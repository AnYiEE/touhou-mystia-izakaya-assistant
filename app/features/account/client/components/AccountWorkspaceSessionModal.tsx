'use client';

import {
	faArrowLeft,
	faRightFromBracket,
	faRightToBracket,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCallback, useEffect, useState } from 'react';

import Button from '@/design/ui/components/button';
import Heading from '@/design/ui/components/heading';

import LegalStatement from '@/features/about/client/components/LegalStatement';
import AccountConfirmButton from '@/features/account/client/components/AccountConfirmButton';
import AccountManager from '@/features/account/client/components/accountManager/AccountManager';
import { accountMessages } from '@/features/account/client/messages';
import {
	completeAccountMismatchExit,
	completeExpiredSessionLogout,
} from '@/features/account/client/workspace/lifecycle';
import {
	captureAccountWorkspace,
	workspaceStore,
} from '@/features/account/client/workspace/workspaceStore';
import { workspaceUiStore } from '@/features/account/client/workspace/workspaceUiStore';
import { CoordinatedModal } from '@/features/overlays/client';

import { useI18n } from '@/shared/i18n/useI18n';

import { ACCOUNT_MODAL_CLASS_NAMES } from './accountModalSpacing';

const SESSION_MODAL_COORDINATION = { id: 'account.session-required' } as const;
const LEGAL_MODAL_COORDINATION = { id: 'account.legal-required' } as const;

type TSessionView = 'choice' | 'relogin';

export default function AccountWorkspaceSessionModal() {
	const { t } = useI18n(accountMessages);
	const blocker = workspaceStore.blocker.use();
	const isReady = workspaceStore.isReady.use();
	const phase = workspaceStore.phase.use();
	const isAuthRequestPending = workspaceUiStore.isAuthRequestPending.use();
	const [view, setView] = useState<TSessionView>('choice');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		setView('choice');
		setIsConfirmOpen(false);
		setMessage(null);
	}, [blocker, phase]);

	const handleLogout = useCallback(() => {
		if (isSubmitting || blocker === null) {
			return;
		}
		setIsSubmitting(true);
		setMessage(null);
		const expected = captureAccountWorkspace();
		const operation =
			blocker === 'account-mismatch'
				? completeAccountMismatchExit(expected)
				: completeExpiredSessionLogout(expected);
		void operation
			.then((result) => {
				if (result !== 'guest') {
					setIsConfirmOpen(false);
					setMessage(t('account.client.logoutFailed'));
				}
			})
			.catch(() => {
				setIsConfirmOpen(false);
				setMessage(t('account.client.logoutFailed'));
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [blocker, isSubmitting, t]);

	const isOpen =
		blocker !== null && !isReady && phase !== 'password-required';
	const isMismatch = blocker === 'account-mismatch';
	const title = isMismatch
		? t('account.workspace.session.mismatchTitle')
		: t('account.workspace.session.sessionTitle');
	const description = isMismatch
		? t('account.workspace.session.mismatchDescription')
		: t('account.workspace.session.sessionDescription');
	const exitHint = isMismatch
		? t('account.workspace.session.mismatchExitHint')
		: t('account.workspace.session.sessionExitHint');
	const reloginLabel = t('account.workspace.session.reloginOriginal');
	const exitLabel = t('account.workspace.session.exitAndReset');

	return (
		<CoordinatedModal
			aria-label={title}
			classNames={ACCOUNT_MODAL_CLASS_NAMES}
			coordination={SESSION_MODAL_COORDINATION}
			hideCloseButton
			isKeyboardDismissDisabled
			isOpen={isOpen}
			isDismissable={false}
		>
			<div className="px-1.5">
				{view === 'choice' ? (
					<div className="space-y-4">
						<div>
							<Heading as="h2" isFirst subTitle={description}>
								{title}
							</Heading>
						</div>
						<div className="grid gap-2 sm:grid-cols-2">
							<AccountConfirmButton
								buttonLabel={exitLabel}
								className="order-1 justify-center"
								color="danger"
								confirmLabel={t(
									'account.workspace.session.confirmExit'
								)}
								description={exitHint}
								icon={faRightFromBracket}
								isDisabled={isSubmitting}
								isInline
								isLoading={isSubmitting}
								isOpen={isConfirmOpen}
								onCancel={() => {
									if (!isSubmitting) {
										setIsConfirmOpen(false);
									}
								}}
								onConfirm={handleLogout}
								onOpenChange={(nextOpen) => {
									if (!isSubmitting) {
										setIsConfirmOpen(nextOpen);
									}
								}}
							/>
							<Button
								fullWidth
								className="order-2 justify-center"
								color="primary"
								isDisabled={isSubmitting}
								startContent={
									<FontAwesomeIcon
										icon={faRightToBracket}
										className="w-4"
									/>
								}
								variant="flat"
								onPress={() => {
									setMessage(null);
									setView('relogin');
								}}
							>
								{reloginLabel}
							</Button>
						</div>
						{message !== null && (
							<p
								className="text-small text-danger-600 dark:text-danger"
								role="alert"
							>
								{message}
							</p>
						)}
					</div>
				) : (
					<div className="space-y-3">
						<div>
							<Button
								isDisabled={isAuthRequestPending}
								startContent={
									<FontAwesomeIcon
										icon={faArrowLeft}
										className="w-3.5"
									/>
								}
								size="sm"
								variant="light"
								onPress={() => {
									setMessage(null);
									setView('choice');
								}}
							>
								{t('account.workspace.session.back')}
							</Button>
						</div>
						<AccountManager authPurpose="required-account" />
					</div>
				)}
			</div>
		</CoordinatedModal>
	);
}

export function AccountWorkspaceLegalRequiredModal() {
	const blocker = workspaceStore.blocker.use();
	const isOpen = workspaceUiStore.isLegalRequiredOpen.use();

	useEffect(() => {
		if (blocker === null) {
			workspaceUiStore.isLegalRequiredOpen.set(false);
		}
	}, [blocker]);

	return (
		<CoordinatedModal
			classNames={ACCOUNT_MODAL_CLASS_NAMES}
			coordination={{
				...LEGAL_MODAL_COORDINATION,
				canActivate: () => blocker !== null,
			}}
			isOpen={isOpen}
			onClose={() => {
				workspaceUiStore.isLegalRequiredOpen.set(false);
			}}
			size="2xl"
		>
			<div className="px-1.5">
				<LegalStatement />
			</div>
		</CoordinatedModal>
	);
}
