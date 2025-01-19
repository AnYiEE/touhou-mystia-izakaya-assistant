'use client';

import {useEffect, useState} from 'react';

export function useReducedMotion() {
	const [isReducedMotion, setIsReducedMotion] = useState(false);

	useEffect(() => {
		const EVENT_TYPE = 'change';

		const mediaQueryList = globalThis.matchMedia('(prefers-reduced-motion: reduce)');

		setIsReducedMotion(mediaQueryList.matches);

		const handleChange = () => {
			setIsReducedMotion(mediaQueryList.matches);
		};

		mediaQueryList.addEventListener(EVENT_TYPE, handleChange);

		return () => {
			mediaQueryList.removeEventListener(EVENT_TYPE, handleChange);
		};
	}, []);

	return isReducedMotion;
}
