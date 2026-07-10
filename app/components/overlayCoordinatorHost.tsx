'use client';

import { useEffect } from 'react';

import { handleOverlayCoordinatorKeyDown } from '@/lib/overlayCoordinator';

export default function OverlayCoordinatorHost() {
	useEffect(() => {
		globalThis.addEventListener(
			'keydown',
			handleOverlayCoordinatorKeyDown,
			{ capture: true }
		);

		return () => {
			globalThis.removeEventListener(
				'keydown',
				handleOverlayCoordinatorKeyDown,
				{ capture: true }
			);
		};
	}, []);

	return null;
}
