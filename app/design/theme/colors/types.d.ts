import {type BaseColors, type ColorScale, type SemanticBaseColors, type ThemeColors} from '@nextui-org/theme';

export type TColorScale = Required<Omit<Exclude<ColorScale, string>, 'DEFAULT' | 'foreground'>>;

type TColor = TColorScale & Exclude<ColorScale, string>;
type TBaseColors = Record<Exclude<keyof BaseColors, 'content3' | 'content4'>, TColor>;

export type TSemanticBaseColors = Record<keyof SemanticBaseColors, TBaseColors>;
export type TThemeColors = Record<keyof Omit<ThemeColors, keyof TBaseColors | 'content3' | 'content4'>, TColor>;
