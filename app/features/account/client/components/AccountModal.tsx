'use client';

import { useCallback } from 'react';

import { accountStore } from '@/features/account/client/state/accountStore';
import { CoordinatedModal } from '@/features/overlays/client';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import AccountManager from './accountManager/AccountManager';

const ACCOUNT_MODAL_CLASS_NAMES = { body: 'px-[18px] py-0.5' } as const;
const ACCOUNT_MODAL_COORDINATION = { id: 'account.main' } as const;
const ACCOUNT_MODAL_MOTION_PROPS = {
	variants: {
		enter: {
			opacity: 1,
			scale: 1,
			transition: { duration: 0.16, ease: 'easeOut' },
		},
		exit: {
			opacity: 0,
			scale: 1,
			transition: { duration: 0.12, ease: 'easeIn' },
		},
	},
} as const;

export default function AccountModal() {
	const vibrate = useVibrate();

	const isOpen = accountStore.shared.accountModal.isOpen.use();

	const handleClose = useCallback(() => {
		vibrate();
		accountStore.closeAccountModal();
	}, [vibrate]);

	return (
		<CoordinatedModal
			coordination={ACCOUNT_MODAL_COORDINATION}
			isOpen={isOpen}
			motionProps={ACCOUNT_MODAL_MOTION_PROPS}
			onClose={handleClose}
			classNames={ACCOUNT_MODAL_CLASS_NAMES}
		>
			<AccountManager />
		</CoordinatedModal>
	);
}
