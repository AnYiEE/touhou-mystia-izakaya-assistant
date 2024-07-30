import {useEffect, useRef, useState} from 'react';

export function useIsTouchOnlyDevice() {
	const [isTouchOnlyDevice, setIsTouchOnlyDevice] = useState(false);
	const isLegacySafari = useRef(false);

	useEffect(() => {
		const mediaQueryList = window.matchMedia('(hover: none), (pointer: coarse)');

		const handleMediaChange = (event: MediaQueryListEvent) => {
			setIsTouchOnlyDevice(event.matches);
		};

		setIsTouchOnlyDevice(mediaQueryList.matches);

		if (typeof mediaQueryList.addEventListener === 'function') {
			mediaQueryList.addEventListener('change', handleMediaChange);
		} else {
			isLegacySafari.current = true;
			mediaQueryList.addListener(handleMediaChange);
		}

		return () => {
			if (isLegacySafari.current) {
				mediaQueryList.removeListener(handleMediaChange);
			} else {
				mediaQueryList.removeEventListener('change', handleMediaChange);
			}
		};
	}, []);

	return isTouchOnlyDevice;
}
