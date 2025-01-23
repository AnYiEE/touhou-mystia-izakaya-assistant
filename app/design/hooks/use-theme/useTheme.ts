'use client';

import {useCallback, useEffect, useState} from 'react';

import {COLOR_MAP, MEDIA, STORAGE_KEY, THEME_MAP} from './constants';
import type {TTheme} from './types';
import {addSafeMediaQueryEventListener} from '@/design/utils';

// eslint-disable-next-line unicorn/prefer-global-this
const isServer = typeof window === 'undefined';

function getSystemTheme(mediaQueryList?: MediaQueryListEvent) {
	const queryList = mediaQueryList ?? globalThis.matchMedia(MEDIA);

	return queryList.matches ? THEME_MAP.DARK : THEME_MAP.LIGHT;
}

function getThemeCallback() {
	if (isServer) {
		return;
	}

	let theme;
	try {
		theme = localStorage.getItem(STORAGE_KEY) as TTheme | null;
	} catch {
		/* empty */
	}

	return theme;
}

function setThemeCallback(selectedTheme: TTheme, isFromEvent?: boolean) {
	const targetTheme = selectedTheme === THEME_MAP.SYSTEM ? getSystemTheme() : selectedTheme;
	const isTargetDarkTheme = targetTheme === THEME_MAP.DARK;

	document.documentElement.classList.remove(...Object.values(THEME_MAP));
	document.documentElement.classList.add(targetTheme);
	document.documentElement.style.colorScheme = targetTheme;

	document.querySelectorAll('meta[name="theme-color"]').forEach((metaElement) => {
		metaElement.remove();
	});

	const metaElement = document.createElement('meta');
	metaElement.content = isTargetDarkTheme ? COLOR_MAP.DARK : COLOR_MAP.LIGHT;
	metaElement.name = 'theme-color';

	document.head.append(metaElement);

	if (isFromEvent) {
		return;
	}

	try {
		localStorage.setItem(STORAGE_KEY, selectedTheme);
	} catch {
		/* empty */
	}
}

export function useTheme() {
	const [theme, setThemeState] = useState<TTheme>(() => {
		const storedTheme = getThemeCallback();

		if (storedTheme === null) {
			setThemeCallback(THEME_MAP.SYSTEM);
			return THEME_MAP.SYSTEM;
		}
		if (storedTheme === undefined) {
			return THEME_MAP.SYSTEM;
		}

		return storedTheme;
	});

	const setTheme = useCallback((newTheme: typeof theme) => {
		setThemeCallback(newTheme);
		setThemeState(newTheme);
	}, []);

	useEffect(() => {
		if (isServer) {
			return;
		}

		const mediaQueryList = globalThis.matchMedia(MEDIA);

		return addSafeMediaQueryEventListener(mediaQueryList, (event) => {
			const storedTheme = getThemeCallback();
			if (storedTheme === THEME_MAP.SYSTEM) {
				setThemeCallback(getSystemTheme(event), true);
			}
		});
	}, []);

	useEffect(() => {
		if (isServer) {
			return;
		}

		const EVENT_TYPE = 'storage';

		const handleStorage = (event: StorageEvent) => {
			if (event.key !== STORAGE_KEY) {
				return;
			}

			const newTheme = event.newValue as TTheme | null;
			if (newTheme !== null) {
				setThemeCallback(newTheme, true);
				setThemeState(newTheme);
			}
		};

		globalThis.addEventListener(EVENT_TYPE, handleStorage);

		return () => {
			globalThis.removeEventListener(EVENT_TYPE, handleStorage);
		};
	}, []);

	return [theme, setTheme] as const;
}
