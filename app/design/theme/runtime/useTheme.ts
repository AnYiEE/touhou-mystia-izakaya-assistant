'use client';

import { useCallback, useEffect, useState } from 'react';

import { addSafeMediaQueryEventListener } from '../../../infrastructure/browser/compatibility/mediaQuery';
import { safeStorage } from '../../../infrastructure/browser/storage/safeStorage';
import {
	DARK_PALETTE_MAP,
	DARK_PALETTE_STORAGE_KEY,
	DARK_PALETTE_THEME_CLASS_MAP,
	DARK_PALETTE_THEME_COLOR_MAP,
	LIGHT_PALETTE_MAP,
	LIGHT_PALETTE_STORAGE_KEY,
	LIGHT_PALETTE_THEME_CLASS_MAP,
	LIGHT_PALETTE_THEME_COLOR_MAP,
	MEDIA,
	STORAGE_KEY,
	THEME_CLASS_MAP,
	THEME_MAP,
} from './constants';
import type {
	IThemePreferences,
	IThemeRuntimeState,
	TDarkPalette,
	TLightPalette,
	TResolvedTheme,
	TTheme,
} from './types';

// eslint-disable-next-line unicorn/prefer-global-this
const isServer = typeof window === 'undefined';

const persistenceListeners = new Set<
	(preferences: IThemePreferences) => void
>();
const runtimeListeners = new Set<(state: IThemeRuntimeState) => void>();
const darkPaletteValues = new Set<string>(Object.values(DARK_PALETTE_MAP));
const lightPaletteValues = new Set<string>(Object.values(LIGHT_PALETTE_MAP));
const themeValues = new Set<string>(Object.values(THEME_MAP));

export function parseDarkPalette(value: unknown): TDarkPalette {
	return typeof value === 'string' && darkPaletteValues.has(value)
		? (value as TDarkPalette)
		: DARK_PALETTE_MAP.IZAKAYA;
}

export function parseLightPalette(value: unknown): TLightPalette {
	return typeof value === 'string' && lightPaletteValues.has(value)
		? (value as TLightPalette)
		: LIGHT_PALETTE_MAP.IZAKAYA;
}

export function parseTheme(value: unknown): TTheme {
	return typeof value === 'string' && themeValues.has(value)
		? (value as TTheme)
		: THEME_MAP.SYSTEM;
}

function getSystemTheme(
	mediaQueryList?: MediaQueryListEvent | MediaQueryList
): TResolvedTheme {
	const queryList = mediaQueryList ?? globalThis.matchMedia(MEDIA);

	return queryList.matches ? THEME_MAP.DARK : THEME_MAP.LIGHT;
}

export function getStoredDarkPalette() {
	if (isServer) {
		return;
	}

	const storedDarkPalette = safeStorage.getItem(DARK_PALETTE_STORAGE_KEY);

	return storedDarkPalette === null
		? null
		: parseDarkPalette(storedDarkPalette);
}

export function getStoredLightPalette() {
	if (isServer) {
		return;
	}

	const storedLightPalette = safeStorage.getItem(LIGHT_PALETTE_STORAGE_KEY);

	return storedLightPalette === null
		? null
		: parseLightPalette(storedLightPalette);
}

export function getStoredTheme() {
	if (isServer) {
		return;
	}

	const storedTheme = safeStorage.getItem(STORAGE_KEY);

	return storedTheme === null ? null : parseTheme(storedTheme);
}

export function readThemePreferences(): IThemePreferences {
	return {
		darkPalette: getStoredDarkPalette() ?? DARK_PALETTE_MAP.IZAKAYA,
		lightPalette: getStoredLightPalette() ?? LIGHT_PALETTE_MAP.IZAKAYA,
		mode: getStoredTheme() ?? THEME_MAP.SYSTEM,
	};
}

function createThemeRuntimeState(
	preferences: IThemePreferences,
	mediaQueryList?: MediaQueryListEvent | MediaQueryList
): IThemeRuntimeState {
	return {
		...preferences,
		resolvedMode:
			preferences.mode === THEME_MAP.SYSTEM
				? isServer
					? THEME_MAP.LIGHT
					: getSystemTheme(mediaQueryList)
				: preferences.mode,
	};
}

export function applyThemePreferences(
	preferences: IThemePreferences,
	isFromEvent = false,
	mediaQueryList?: MediaQueryListEvent | MediaQueryList
) {
	if (isServer) {
		return;
	}

	const state = createThemeRuntimeState(preferences, mediaQueryList);
	const heroUIThemeClass =
		state.resolvedMode === THEME_MAP.DARK
			? DARK_PALETTE_THEME_CLASS_MAP[state.darkPalette]
			: LIGHT_PALETTE_THEME_CLASS_MAP[state.lightPalette];

	document.documentElement.classList.remove(
		...Object.values(THEME_MAP),
		...Object.values(THEME_CLASS_MAP)
	);
	document.documentElement.classList.add(
		state.resolvedMode,
		heroUIThemeClass
	);
	document.documentElement.style.colorScheme = state.resolvedMode;

	document
		.querySelectorAll('meta[name="theme-color"]')
		.forEach((metaElement) => {
			metaElement.remove();
		});

	const metaElement = document.createElement('meta');
	metaElement.content =
		state.resolvedMode === THEME_MAP.DARK
			? DARK_PALETTE_THEME_COLOR_MAP[state.darkPalette]
			: LIGHT_PALETTE_THEME_COLOR_MAP[state.lightPalette];
	metaElement.name = 'theme-color';

	document.head.append(metaElement);

	if (!isFromEvent) {
		safeStorage.setItem(DARK_PALETTE_STORAGE_KEY, state.darkPalette);
		safeStorage.setItem(LIGHT_PALETTE_STORAGE_KEY, state.lightPalette);
		safeStorage.setItem(STORAGE_KEY, state.mode);
		persistenceListeners.forEach((listener) => {
			listener(state);
		});
	}

	runtimeListeners.forEach((listener) => {
		listener(state);
	});

	return state;
}

export function applyDarkPalette(
	darkPalette: TDarkPalette,
	isFromEvent = false
) {
	return applyThemePreferences(
		{
			darkPalette,
			lightPalette: getStoredLightPalette() ?? LIGHT_PALETTE_MAP.IZAKAYA,
			mode: getStoredTheme() ?? THEME_MAP.SYSTEM,
		},
		isFromEvent
	);
}

export function applyLightPalette(
	lightPalette: TLightPalette,
	isFromEvent = false
) {
	return applyThemePreferences(
		{
			darkPalette: getStoredDarkPalette() ?? DARK_PALETTE_MAP.IZAKAYA,
			lightPalette,
			mode: getStoredTheme() ?? THEME_MAP.SYSTEM,
		},
		isFromEvent
	);
}

export function applyTheme(selectedTheme: TTheme, isFromEvent = false) {
	return applyThemePreferences(
		{
			darkPalette: getStoredDarkPalette() ?? DARK_PALETTE_MAP.IZAKAYA,
			lightPalette: getStoredLightPalette() ?? LIGHT_PALETTE_MAP.IZAKAYA,
			mode: selectedTheme,
		},
		isFromEvent
	);
}

export function addThemePersistenceChangeListener(
	listener: (preferences: IThemePreferences) => void
) {
	persistenceListeners.add(listener);

	return () => {
		persistenceListeners.delete(listener);
	};
}

function addThemeRuntimeListener(
	listener: (state: IThemeRuntimeState) => void
) {
	runtimeListeners.add(listener);

	return () => {
		runtimeListeners.delete(listener);
	};
}

export function useTheme() {
	const [state, setState] = useState<IThemeRuntimeState>(() =>
		createThemeRuntimeState(readThemePreferences())
	);

	const setDarkPalette = useCallback((darkPalette: TDarkPalette) => {
		applyDarkPalette(darkPalette);
	}, []);
	const setLightPalette = useCallback((lightPalette: TLightPalette) => {
		applyLightPalette(lightPalette);
	}, []);
	const setTheme = useCallback((newTheme: TTheme) => {
		applyTheme(newTheme);
	}, []);

	const syncSystemTheme = useCallback(() => {
		const mediaQueryList = globalThis.matchMedia(MEDIA);

		return addSafeMediaQueryEventListener(mediaQueryList, (event) => {
			const preferences = readThemePreferences();
			if (preferences.mode === THEME_MAP.SYSTEM) {
				applyThemePreferences(preferences, true, event);
			}
		});
	}, []);

	const syncThemeState = useCallback(
		() => addThemeRuntimeListener(setState),
		[]
	);

	const syncStorageTheme = useCallback(() => {
		const EVENT_TYPE = 'storage';

		const handleStorage = (event: StorageEvent) => {
			if (
				event.key !== DARK_PALETTE_STORAGE_KEY &&
				event.key !== LIGHT_PALETTE_STORAGE_KEY &&
				event.key !== STORAGE_KEY
			) {
				return;
			}

			applyThemePreferences(readThemePreferences(), true);
		};

		globalThis.addEventListener(EVENT_TYPE, handleStorage);

		return () => {
			globalThis.removeEventListener(EVENT_TYPE, handleStorage);
		};
	}, []);

	useEffect(() => {
		applyThemePreferences(readThemePreferences(), true);
	}, []);

	useEffect(syncSystemTheme, [syncSystemTheme]);
	useEffect(syncThemeState, [syncThemeState]);
	useEffect(syncStorageTheme, [syncStorageTheme]);

	return [
		state.mode,
		setTheme,
		state.lightPalette,
		setLightPalette,
		state.darkPalette,
		setDarkPalette,
		state.resolvedMode,
	] as const;
}
