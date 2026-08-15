import { faDesktop, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { type FontAwesomeIconProps } from '@fortawesome/react-fontawesome';

import {
	DARK_PALETTE_PRESENTATION_MAP,
	LIGHT_PALETTE_PRESENTATION_MAP,
} from '@/design/theme/palettePresentation';
import {
	DARK_PALETTE_MAP,
	LIGHT_PALETTE_MAP,
	THEME_MAP,
} from '@/design/theme/runtime/constants';
import type {
	TDarkPalette,
	TLightPalette,
	TTheme,
} from '@/design/theme/runtime/types';

export interface INavbarPaletteItem {
	key: string;
	label: string;
	palette: TDarkPalette | TLightPalette;
	swatchClassName: string;
}

export const NAVBAR_DARK_PALETTE_ITEMS = [
	{
		key: 'dark-palette:izakaya',
		label: DARK_PALETTE_PRESENTATION_MAP.izakaya.label,
		palette: DARK_PALETTE_MAP.IZAKAYA,
		swatchClassName: DARK_PALETTE_PRESENTATION_MAP.izakaya.swatchClassName,
	},
	{
		key: 'dark-palette:black',
		label: DARK_PALETTE_PRESENTATION_MAP.black.label,
		palette: DARK_PALETTE_MAP.BLACK,
		swatchClassName: DARK_PALETTE_PRESENTATION_MAP.black.swatchClassName,
	},
] as const satisfies ReadonlyArray<INavbarPaletteItem>;

export const NAVBAR_LIGHT_PALETTE_ITEMS = [
	{
		key: 'light-palette:izakaya',
		label: LIGHT_PALETTE_PRESENTATION_MAP.izakaya.label,
		palette: LIGHT_PALETTE_MAP.IZAKAYA,
		swatchClassName: LIGHT_PALETTE_PRESENTATION_MAP.izakaya.swatchClassName,
	},
	{
		key: 'light-palette:white',
		label: LIGHT_PALETTE_PRESENTATION_MAP.white.label,
		palette: LIGHT_PALETTE_MAP.WHITE,
		swatchClassName: LIGHT_PALETTE_PRESENTATION_MAP.white.swatchClassName,
	},
	{
		key: 'light-palette:green',
		label: LIGHT_PALETTE_PRESENTATION_MAP.green.label,
		palette: LIGHT_PALETTE_MAP.GREEN,
		swatchClassName: LIGHT_PALETTE_PRESENTATION_MAP.green.swatchClassName,
	},
	{
		key: 'light-palette:pink',
		label: LIGHT_PALETTE_PRESENTATION_MAP.pink.label,
		palette: LIGHT_PALETTE_MAP.PINK,
		swatchClassName: LIGHT_PALETTE_PRESENTATION_MAP.pink.swatchClassName,
	},
] as const satisfies ReadonlyArray<INavbarPaletteItem>;

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
