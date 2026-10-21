'use client';

import { useEffect, useState } from 'react';

export function useDocumentVisibility() {
	const [isDocumentVisible, setIsDocumentVisible] = useState(true);

	useEffect(() => {
		const handleVisibilityChange = () => {
			setIsDocumentVisible(document.visibilityState === 'visible');
		};

		handleVisibilityChange();
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener(
				'visibilitychange',
				handleVisibilityChange
			);
		};
	}, []);

	return isDocumentVisible;
}
