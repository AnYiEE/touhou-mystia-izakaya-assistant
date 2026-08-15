import { DARK_PALETTE_MAP, LIGHT_PALETTE_MAP, THEME_MAP } from './constants';

export type TDarkPalette =
	(typeof DARK_PALETTE_MAP)[keyof typeof DARK_PALETTE_MAP];
export type TLightPalette =
	(typeof LIGHT_PALETTE_MAP)[keyof typeof LIGHT_PALETTE_MAP];
export type TTheme = (typeof THEME_MAP)[keyof typeof THEME_MAP];
export type TResolvedTheme = Exclude<TTheme, typeof THEME_MAP.SYSTEM>;

export interface IThemePreferences {
	darkPalette: TDarkPalette;
	lightPalette: TLightPalette;
	mode: TTheme;
}

export interface IThemeRuntimeState extends IThemePreferences {
	resolvedMode: TResolvedTheme;
}
