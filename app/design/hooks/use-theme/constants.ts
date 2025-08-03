import { defaultBackgrounds } from '@/design/theme/colors/constants/backgroundColors';

export const COLOR_MAP = {
	DARK: defaultBackgrounds.dark,
	LIGHT: defaultBackgrounds.light,
	LIGHT_THEME: defaultBackgrounds.lightTheme,
} as const;

export const MEDIA = '(prefers-color-scheme: dark)';

export const THEME_MAP = {
	DARK: 'dark',
	LIGHT: 'light',
	SYSTEM: 'system',
} as const;

export const STORAGE_KEY = 'theme';
