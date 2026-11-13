'use client';

import { useCallback } from 'react';

import { accountStore } from '@/features/account/client/state/accountStore';
import { accountWorkspacePendingAuthStore } from '@/features/account/client/workspace/authRuntime';
import { workspaceStore } from '@/features/account/client/workspace/workspaceStore';
import { workspaceUiStore } from '@/features/account/client/workspace/workspaceUiStore';
import { CoordinatedModal } from '@/features/overlays/client';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import AccountManager from './accountManager/AccountManager';
import { logoutRecoveryStore } from './accountManager/logoutRecoveryStore';
import { ACCOUNT_MODAL_CLASS_NAMES } from './accountModalSpacing';

const ACCOUNT_MODAL_COORDINATION = { id: 'account.main' } as const;

export default function AccountModal() {
	const vibrate = useVibrate();

	const isOpen = accountStore.shared.accountModal.isOpen.use();
	const pendingAuth = accountWorkspacePendingAuthStore.value.use();
	const authPurpose = accountStore.shared.accountModal.authPurpose.use();
	const blocker = workspaceStore.blocker.use();
	const phase = workspaceStore.phase.use();
	const isAuthRequestPending = workspaceUiStore.isAuthRequestPending.use();
	const logoutRecoveryOperation = logoutRecoveryStore.operation.use();
	const isGuestAdoptionPending =
		phase === 'transitioning' && pendingAuth?.reason === 'guest-adoption';
	const shouldRenderAccountManager =
		blocker === null &&
		phase !== 'password-required' &&
		(phase !== 'transitioning' ||
			isGuestAdoptionPending ||
			logoutRecoveryOperation !== null);
	const isDismissable =
		shouldRenderAccountManager &&
		!isAuthRequestPending &&
		phase !== 'transitioning';

	const handleClose = useCallback(() => {
		vibrate();
		accountStore.closeAccountModal();
	}, [vibrate]);

	return (
		<CoordinatedModal
			coordination={ACCOUNT_MODAL_COORDINATION}
			isOpen={isOpen && shouldRenderAccountManager}
			hideCloseButton={!isDismissable}
			isDismissable={isDismissable}
			isKeyboardDismissDisabled={!isDismissable}
			onClose={handleClose}
			classNames={ACCOUNT_MODAL_CLASS_NAMES}
		>
			{shouldRenderAccountManager && (
				<AccountManager authPurpose={authPurpose} />
			)}
		</CoordinatedModal>
	);
}
