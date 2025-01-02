import {semanticColors} from '@/design/theme';

export const COLOR_MAP = {
	DARK: semanticColors.dark.background.DEFAULT,
	LIGHT: semanticColors.light.background.DEFAULT,
};

export const MEDIA = '(prefers-color-scheme: dark)';

export const THEME_MAP = {
	DARK: 'dark',
	LIGHT: 'light',
	SYSTEM: 'system',
} as const;

export const STORAGE_KEY = 'theme';
