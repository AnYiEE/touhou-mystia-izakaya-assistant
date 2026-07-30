import { faDesktop, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { type FontAwesomeIconProps } from '@fortawesome/react-fontawesome';

import { THEME_MAP } from '@/design/theme/runtime/constants';
import type { TTheme } from '@/design/theme/runtime/types';

export const NAVBAR_THEME_ITEMS = [
	{
		icon: faDesktop,
		key: 'theme:system',
		label: '跟随系统',
		theme: THEME_MAP.SYSTEM,
	},
	{
		icon: faSun,
		key: 'theme:light',
		label: '浅色主题',
		theme: THEME_MAP.LIGHT,
	},
	{
		icon: faMoon,
		key: 'theme:dark',
		label: '深色主题',
		theme: THEME_MAP.DARK,
	},
] as const satisfies ReadonlyArray<{
	icon: FontAwesomeIconProps['icon'];
	key: string;
	label: string;
	theme: TTheme;
}>;
