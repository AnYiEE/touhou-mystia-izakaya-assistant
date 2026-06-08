'use client';

import { useCallback } from 'react';

import { useMounted, useVibrate } from '@/hooks';

import { Modal } from '@/design/ui/components';

import Content from './content';

import { accountStore, globalStore as store } from '@/stores';

export default function PreferencesModal() {
	const isMounted = useMounted();
	const vibrate = useVibrate();

	const isOpen = store.shared.preferencesModal.isOpen.use();
	const isAccountModalOpen = accountStore.shared.accountModal.isOpen.use();

	const handleClose = useCallback(() => {
		vibrate();
		store.setPreferencesModalIsOpen(false);
	}, [vibrate]);

	if (!isMounted) {
		return null;
	}

	return (
		<Modal
			isDismissable={!isAccountModalOpen}
			isOpen={isOpen}
			portalContainer={document.querySelector('#modal-portal-container')}
			onClose={handleClose}
		>
			{(onModalClose) => <Content onModalClose={onModalClose} />}
		</Modal>
	);
}
