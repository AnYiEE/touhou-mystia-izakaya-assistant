'use client';

import { useCallback } from 'react';

import { CoordinatedModal } from '@/features/overlays/client';
import { closePreferencesModal } from '@/features/preferences/client/overlayCommands';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { useHydrated } from '@/shared/react/useHydrated';

import Content from './PreferencesContent';

export default function PreferencesModal() {
	const isMounted = useHydrated();
	const vibrate = useVibrate();

	const isPreferencesModalOpen =
		globalStore.shared.preferencesModal.isOpen.use();
	const handleClose = useCallback(() => {
		vibrate();
		closePreferencesModal();
	}, [vibrate]);

	if (!isMounted) {
		return null;
	}

	return (
		<CoordinatedModal
			coordination={{ id: 'preferences' }}
			isOpen={isPreferencesModalOpen}
			onClose={handleClose}
		>
			{(onModalClose) => <Content onModalClose={onModalClose} />}
		</CoordinatedModal>
	);
}
