'use client';

import { useSyncExternalStore } from 'react';

import { addSafeMediaQueryEventListener } from '@/infrastructure/browser/compatibility/mediaQuery';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const EMPTY_UNSUBSCRIBE = () => {};

function getMediaQueryList() {
	if (typeof globalThis.matchMedia !== 'function') {
		return null;
	}

	return globalThis.matchMedia(REDUCED_MOTION_QUERY);
}

function subscribe(onStoreChange: () => void) {
	const mediaQueryList = getMediaQueryList();
	if (mediaQueryList === null) {
		return EMPTY_UNSUBSCRIBE;
	}

	return addSafeMediaQueryEventListener(mediaQueryList, onStoreChange);
}

function getSnapshot() {
	return getMediaQueryList()?.matches ?? false;
}

function getServerSnapshot() {
	return false;
}

export function useReducedMotion() {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
