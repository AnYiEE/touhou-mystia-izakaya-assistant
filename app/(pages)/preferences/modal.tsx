'use client';

import { useCallback } from 'react';

import { useRouter } from 'next/navigation';
import { useMounted, useVibrate } from '@/hooks';

import { Modal } from '@/design/ui/components';

import Content from './content';

export function PreferencesModalDefault() {
	return null;
}

export default function PreferencesModal() {
	const isMounted = useMounted();
	const router = useRouter();
	const vibrate = useVibrate();

	const handleClose = useCallback(() => {
		vibrate();
		// Delay closing to allow time for exit animation.
		setTimeout(() => {
			router.back();
		}, 300);
	}, [router, vibrate]);

	if (!isMounted) {
		return null;
	}

	return (
		<Modal
			defaultOpen
			portalContainer={document.querySelector('#modal-portal-container')}
			onClose={handleClose}
		>
			{(onModalClose) => <Content onModalClose={onModalClose} />}
		</Modal>
	);
}
