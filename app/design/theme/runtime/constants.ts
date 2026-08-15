import { commonColors } from '@heroui/theme';

import { colors } from '../colors/palette';

export const COLOR_MAP = {
	BLACK: commonColors.black,
	DARK: colors.defaultBackgrounds.dark,
	GREEN: colors.softGreen[200],
	LIGHT: colors.defaultBackgrounds.light,
	LIGHT_THEME: colors.defaultBackgrounds.lightTheme,
	PINK: colors.softPink[50],
	WHITE: commonColors.zinc[50],
} as const;

export const THEME_CLASS_MAP = {
	BLACK: 'black',
	DARK: 'izakaya-dark',
	GREEN: 'green',
	IZAKAYA: 'izakaya',
	PINK: 'pink',
	WHITE: 'white',
} as const;

export const DARK_PALETTE_MAP = {
	IZAKAYA: 'izakaya',
	// eslint-disable-next-line sort-keys -- Preserve the product-defined palette order used by Object.values.
	BLACK: 'black',
} as const;

export const DARK_PALETTE_THEME_CLASS_MAP = {
	[DARK_PALETTE_MAP.BLACK]: THEME_CLASS_MAP.BLACK,
	[DARK_PALETTE_MAP.IZAKAYA]: THEME_CLASS_MAP.DARK,
} as const;

export const DARK_PALETTE_THEME_COLOR_MAP = {
	[DARK_PALETTE_MAP.BLACK]: COLOR_MAP.BLACK,
	[DARK_PALETTE_MAP.IZAKAYA]: COLOR_MAP.DARK,
} as const;

export const LIGHT_PALETTE_MAP = {
	IZAKAYA: 'izakaya',
	WHITE: 'white',
	// eslint-disable-next-line sort-keys -- Preserve the product-defined palette order used by Object.values.
	GREEN: 'green',
	PINK: 'pink',
} as const;

export const LIGHT_PALETTE_THEME_CLASS_MAP = {
	[LIGHT_PALETTE_MAP.GREEN]: THEME_CLASS_MAP.GREEN,
	[LIGHT_PALETTE_MAP.IZAKAYA]: THEME_CLASS_MAP.IZAKAYA,
	[LIGHT_PALETTE_MAP.PINK]: THEME_CLASS_MAP.PINK,
	[LIGHT_PALETTE_MAP.WHITE]: THEME_CLASS_MAP.WHITE,
} as const;

export const LIGHT_PALETTE_THEME_COLOR_MAP = {
	[LIGHT_PALETTE_MAP.GREEN]: COLOR_MAP.GREEN,
	[LIGHT_PALETTE_MAP.IZAKAYA]: COLOR_MAP.LIGHT_THEME,
	[LIGHT_PALETTE_MAP.PINK]: COLOR_MAP.PINK,
	[LIGHT_PALETTE_MAP.WHITE]: COLOR_MAP.WHITE,
} as const;

export const MEDIA = '(prefers-color-scheme: dark)';

export const THEME_MAP = {
	DARK: 'dark',
	LIGHT: 'light',
	SYSTEM: 'system',
} as const;

export const DARK_PALETTE_STORAGE_KEY = 'theme-dark-palette';
export const LIGHT_PALETTE_STORAGE_KEY = 'theme-light-palette';
export const STORAGE_KEY = 'theme';
