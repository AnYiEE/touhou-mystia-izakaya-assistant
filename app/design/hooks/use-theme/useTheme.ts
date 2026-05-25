'use client';

import { useCallback, useEffect, useState } from 'react';

import { useMounted } from '@/hooks';

import { COLOR_MAP, MEDIA, STORAGE_KEY, THEME_MAP } from './constants';
import type { TTheme } from './types';
import { addSafeMediaQueryEventListener } from '@/design/utils';
import { safeStorage } from '@/utilities';

// eslint-disable-next-line unicorn/prefer-global-this
const isServer = typeof window === 'undefined';

const themeListeners = new Set<(theme: TTheme) => void>();
const themeValues = new Set<string>(Object.values(THEME_MAP));

export function parseTheme(value: unknown): TTheme {
	return typeof value === 'string' && themeValues.has(value)
		? (value as TTheme)
		: THEME_MAP.SYSTEM;
}

function getSystemTheme(mediaQueryList?: MediaQueryListEvent) {
	const queryList = mediaQueryList ?? globalThis.matchMedia(MEDIA);

	return queryList.matches ? THEME_MAP.DARK : THEME_MAP.LIGHT;
}

export function getStoredTheme() {
	if (isServer) {
		return;
	}

	const storedTheme = safeStorage.getItem(STORAGE_KEY);

	return storedTheme === null ? null : parseTheme(storedTheme);
}

export function applyTheme(selectedTheme: TTheme, isFromEvent?: boolean) {
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
	themeListeners.forEach((listener) => {
		listener(selectedTheme);
	});
}

export function addThemeChangeListener(listener: (theme: TTheme) => void) {
	themeListeners.add(listener);

	return () => {
		themeListeners.delete(listener);
	};
}

export function useTheme() {
	const [theme, setThemeState] = useState<TTheme>(
		() => getStoredTheme() ?? THEME_MAP.SYSTEM
	);

	const setTheme = useCallback((newTheme: typeof theme) => {
		applyTheme(newTheme);
	}, []);

	useEffect(() => {
		const storedTheme = getStoredTheme();
		if (storedTheme === undefined) {
			return;
		}

		applyTheme(storedTheme ?? THEME_MAP.SYSTEM, true);
	}, []);

	useMounted(() => {
		const mediaQueryList = globalThis.matchMedia(MEDIA);

		return addSafeMediaQueryEventListener(mediaQueryList, (event) => {
			const storedTheme = getStoredTheme();
			if (storedTheme === null || storedTheme === THEME_MAP.SYSTEM) {
				applyTheme(getSystemTheme(event), true);
			}
		});
	});

	useMounted(() => addThemeChangeListener(setThemeState));

	useMounted(() => {
		const EVENT_TYPE = 'storage';

		const handleStorage = (event: StorageEvent) => {
			if (event.key !== STORAGE_KEY) {
				return;
			}

			const newTheme =
				event.newValue === null
					? THEME_MAP.SYSTEM
					: parseTheme(event.newValue);
			applyTheme(newTheme, true);
			setThemeState(newTheme);
		};

		globalThis.addEventListener(EVENT_TYPE, handleStorage);

		return () => {
			globalThis.removeEventListener(EVENT_TYPE, handleStorage);
		};
	});

	return [theme, setTheme] as const;
}
