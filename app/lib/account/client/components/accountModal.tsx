'use client';

import { useCallback } from 'react';

import { useVibrate } from '@/hooks';

import { Modal } from '@/design/ui/components';

import AccountManager from './accountManager';

import { accountStore as store } from '@/stores';

export default function AccountModal() {
	const vibrate = useVibrate();

	const isOpen = store.shared.accountModal.isOpen.use();

	const handleClose = useCallback(() => {
		vibrate();
		store.shared.accountModal.isOpen.set(false);
	}, [vibrate]);

	return (
		<Modal isOpen={isOpen} onClose={handleClose}>
			<AccountManager />
		</Modal>
	);
}
