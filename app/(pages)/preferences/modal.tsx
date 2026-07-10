'use client';

import { useCallback } from 'react';

import { useMounted, useVibrate } from '@/hooks';

import { Modal } from '@/design/ui/components';

import Content from './content';

import { globalStore as store } from '@/stores';

export default function PreferencesModal() {
	const isMounted = useMounted();
	const vibrate = useVibrate();

	const isPreferencesModalOpen = store.shared.preferencesModal.isOpen.use();
	const handleClose = useCallback(() => {
		vibrate();
		store.setPreferencesModalIsOpen(false);
	}, [vibrate]);

	if (!isMounted) {
		return null;
	}

	return (
		<Modal
			coordination={{ id: 'preferences' }}
			isOpen={isPreferencesModalOpen}
			onClose={handleClose}
		>
			{(onModalClose) => <Content onModalClose={onModalClose} />}
		</Modal>
	);
}
