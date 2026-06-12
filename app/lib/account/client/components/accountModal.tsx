'use client';

import { useCallback } from 'react';

import { Modal } from '@/design/ui/components';

import AccountManager from './accountManager';

import { accountStore as store } from '@/stores';

export default function AccountModal() {
	const isOpen = store.shared.accountModal.isOpen.use();

	const handleClose = useCallback(() => {
		store.shared.accountModal.isOpen.set(false);
	}, []);

	return (
		<Modal isOpen={isOpen} onClose={handleClose}>
			<AccountManager />
		</Modal>
	);
}
