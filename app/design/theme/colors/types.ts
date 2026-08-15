import {
	type BaseColors,
	type ColorScale,
	type SemanticBaseColors,
	type ThemeColors,
} from '@heroui/theme';

export type THexColor = `#${string}`;

export type TColorScale = Required<
	Omit<Exclude<ColorScale, string>, 'DEFAULT' | 'foreground'>
>;

type TColor = Prettify<TColorScale & Exclude<ColorScale, string>>;
type TBaseColors = Record<
	Exclude<keyof BaseColors, 'content3' | 'content4'>,
	TColor
>;

export type TSemanticBaseColors = Record<keyof SemanticBaseColors, TBaseColors>;
export type TThemeColors = Record<
	keyof Omit<ThemeColors, keyof TBaseColors | 'content3' | 'content4'>,
	TColor
>;
export type TThemeAccentColors = Pick<TBaseColors, 'focus'> &
	Omit<TThemeColors, 'default'>;
export type TThemeSurfaceColors = Pick<
	TSemanticBaseColors['light'],
	'background' | 'content1' | 'content2' | 'divider'
> &
	Pick<TThemeColors, 'default'>;
export type TThemeLightPaletteColors = TThemeAccentColors & TThemeSurfaceColors;
