'use client';

import { useCallback, useState } from 'react';

import { useMounted } from '@/hooks';

import { COLOR_MAP, MEDIA, STORAGE_KEY, THEME_MAP } from './constants';
import type { TTheme } from './types';
import { addSafeMediaQueryEventListener } from '@/design/utils';
import { safeStorage } from '@/utilities';

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

	return safeStorage.getItem<TTheme>(STORAGE_KEY);
}

function setThemeCallback(selectedTheme: TTheme, isFromEvent?: boolean) {
	if (isServer) {
		return;
	}

	const targetTheme =
		selectedTheme === THEME_MAP.SYSTEM ? getSystemTheme() : selectedTheme;
	const isTargetDarkTheme = targetTheme === THEME_MAP.DARK;

	document.documentElement.classList.remove(...Object.values(THEME_MAP));
	document.documentElement.classList.add(targetTheme);
	document.documentElement.style.colorScheme = targetTheme;

	document
		.querySelectorAll('meta[name="theme-color"]')
		.forEach((metaElement) => {
			metaElement.remove();
		});

	const metaElement = document.createElement('meta');
	metaElement.content = isTargetDarkTheme
		? COLOR_MAP.DARK
		: COLOR_MAP.LIGHT_THEME;
	metaElement.name = 'theme-color';

	document.head.append(metaElement);

	if (isFromEvent) {
		return;
	}

	safeStorage.setItem(STORAGE_KEY, selectedTheme);
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

	useMounted(() => {
		const mediaQueryList = globalThis.matchMedia(MEDIA);

		return addSafeMediaQueryEventListener(mediaQueryList, (event) => {
			const storedTheme = getThemeCallback();
			if (storedTheme === THEME_MAP.SYSTEM) {
				setThemeCallback(getSystemTheme(event), true);
			}
		});
	});

	useMounted(() => {
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
	});

	return [theme, setTheme] as const;
}
