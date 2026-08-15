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
import type { TDarkPalette, TLightPalette, TTheme } from './types';

const script = (
	media: typeof MEDIA,
	storageKey: typeof STORAGE_KEY,
	darkPaletteStorageKey: typeof DARK_PALETTE_STORAGE_KEY,
	lightPaletteStorageKey: typeof LIGHT_PALETTE_STORAGE_KEY,
	themeMap: typeof THEME_MAP,
	darkPaletteMap: typeof DARK_PALETTE_MAP,
	lightPaletteMap: typeof LIGHT_PALETTE_MAP,
	darkPaletteThemeClassMap: typeof DARK_PALETTE_THEME_CLASS_MAP,
	lightPaletteThemeClassMap: typeof LIGHT_PALETTE_THEME_CLASS_MAP,
	darkPaletteThemeColorMap: typeof DARK_PALETTE_THEME_COLOR_MAP,
	lightPaletteThemeColorMap: typeof LIGHT_PALETTE_THEME_COLOR_MAP,
	themeClassMap: typeof THEME_CLASS_MAP
) => {
	try {
		const systemTheme = globalThis.matchMedia(media).matches
			? themeMap.DARK
			: themeMap.LIGHT;

		let storedDarkPalette: TDarkPalette = darkPaletteMap.IZAKAYA;
		let storedLightPalette: TLightPalette = lightPaletteMap.IZAKAYA;
		let storedTheme: TTheme = themeMap.SYSTEM;
		try {
			const darkPaletteValues = Object.values(darkPaletteMap);
			const rawStoredDarkPalette = localStorage.getItem(
				darkPaletteStorageKey
			);
			storedDarkPalette = darkPaletteValues.includes(
				rawStoredDarkPalette as TDarkPalette
			)
				? (rawStoredDarkPalette as TDarkPalette)
				: darkPaletteMap.IZAKAYA;

			const lightPaletteValues = Object.values(lightPaletteMap);
			const rawStoredLightPalette = localStorage.getItem(
				lightPaletteStorageKey
			);
			storedLightPalette = lightPaletteValues.includes(
				rawStoredLightPalette as TLightPalette
			)
				? (rawStoredLightPalette as TLightPalette)
				: lightPaletteMap.IZAKAYA;

			const themeValues = Object.values(themeMap);
			const rawStoredTheme = localStorage.getItem(storageKey);
			storedTheme = themeValues.includes(rawStoredTheme as TTheme)
				? (rawStoredTheme as TTheme)
				: themeMap.SYSTEM;
		} catch {
			storedDarkPalette = darkPaletteMap.IZAKAYA;
			storedLightPalette = lightPaletteMap.IZAKAYA;
			storedTheme = themeMap.SYSTEM;
		}

		const currentTheme =
			storedTheme === themeMap.SYSTEM ? systemTheme : storedTheme;
		const isDarkTheme = currentTheme === themeMap.DARK;
		const heroUIThemeClass = isDarkTheme
			? darkPaletteThemeClassMap[storedDarkPalette]
			: lightPaletteThemeClassMap[storedLightPalette];

		document.documentElement.classList.remove(
			...Object.values(themeMap),
			...Object.values(themeClassMap)
		);
		document.documentElement.classList.add(currentTheme, heroUIThemeClass);
		document.documentElement.style.colorScheme = currentTheme;

		const metaElement = document.createElement('meta');
		metaElement.content = isDarkTheme
			? darkPaletteThemeColorMap[storedDarkPalette]
			: lightPaletteThemeColorMap[storedLightPalette];
		metaElement.name = 'theme-color';

		document.head.append(metaElement);
	} catch (error) {
		console.error('[design/theme/runtime]:', error);
	}
};

export default function ThemeScript() {
	const scriptArgs = JSON.stringify([
		MEDIA,
		STORAGE_KEY,
		DARK_PALETTE_STORAGE_KEY,
		LIGHT_PALETTE_STORAGE_KEY,
		THEME_MAP,
		DARK_PALETTE_MAP,
		LIGHT_PALETTE_MAP,
		DARK_PALETTE_THEME_CLASS_MAP,
		LIGHT_PALETTE_THEME_CLASS_MAP,
		DARK_PALETTE_THEME_COLOR_MAP,
		LIGHT_PALETTE_THEME_COLOR_MAP,
		THEME_CLASS_MAP,
	]).slice(1, -1);

	return (
		<script
			suppressHydrationWarning
			dangerouslySetInnerHTML={{
				__html: `(${script.toString()})(${scriptArgs})`,
			}}
		/>
	);
}
