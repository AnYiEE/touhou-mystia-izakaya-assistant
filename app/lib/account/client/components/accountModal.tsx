'use client';

import { useCallback } from 'react';

import { useVibrate } from '@/hooks';

import { Modal } from '@/design/ui/components';

import AccountManager from './accountManager';

import { accountStore as store } from '@/stores';

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

	const isOpen = store.shared.accountModal.isOpen.use();

	const handleClose = useCallback(() => {
		vibrate();
		store.shared.accountModal.isOpen.set(false);
	}, [vibrate]);

	return (
		<Modal
			isOpen={isOpen}
			motionProps={ACCOUNT_MODAL_MOTION_PROPS}
			onClose={handleClose}
			classNames={{ body: 'px-[18px] py-0.5' }}
		>
			<AccountManager />
		</Modal>
	);
}
