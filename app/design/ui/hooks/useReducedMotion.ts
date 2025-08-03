'use client';

import { useState } from 'react';

import { useMounted } from '@/hooks';

import { addSafeMediaQueryEventListener } from '@/design/utils';

export function useReducedMotion() {
	const [isReducedMotion, setIsReducedMotion] = useState(false);

	useMounted(() => {
		const mediaQueryList = globalThis.matchMedia(
			'(prefers-reduced-motion: reduce)'
		);

		setIsReducedMotion(mediaQueryList.matches);

		return addSafeMediaQueryEventListener(mediaQueryList, () => {
			setIsReducedMotion(mediaQueryList.matches);
		});
	});

	return isReducedMotion;
}
