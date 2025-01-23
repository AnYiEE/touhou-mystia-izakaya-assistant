'use client';

import {useEffect, useState} from 'react';

import {addSafeMediaQueryEventListener} from '@/design/utils';

export function useReducedMotion() {
	const [isReducedMotion, setIsReducedMotion] = useState(false);

	useEffect(() => {
		const mediaQueryList = globalThis.matchMedia('(prefers-reduced-motion: reduce)');

		setIsReducedMotion(mediaQueryList.matches);

		return addSafeMediaQueryEventListener(mediaQueryList, () => {
			setIsReducedMotion(mediaQueryList.matches);
		});
	}, []);

	return isReducedMotion;
}
