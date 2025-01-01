import {semanticColors} from '@/design/theme';
import {colors} from '@/design/theme/colors/constants';

export const COLOR_MAP = {
	DARK: colors.constants.BLACK,
	LIGHT: semanticColors.light.background.DEFAULT,
};

export const MEDIA = '(prefers-color-scheme: dark)';

export const THEME_MAP = {
	DARK: 'dark',
	LIGHT: 'light',
	SYSTEM: 'system',
} as const;

export const STORAGE_KEY = 'theme';
