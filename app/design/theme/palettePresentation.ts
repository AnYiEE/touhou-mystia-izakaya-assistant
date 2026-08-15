import { DARK_PALETTE_MAP, LIGHT_PALETTE_MAP } from './runtime/constants';
import type { TDarkPalette, TLightPalette } from './runtime/types';

export const DARK_PALETTE_PRESENTATION_MAP = {
	[DARK_PALETTE_MAP.IZAKAYA]: {
		label: '雀食堂',
		swatchClassName: 'border border-default-500 bg-[#262626]',
	},
	[DARK_PALETTE_MAP.BLACK]: {
		label: '深邃黑',
		swatchClassName: 'border border-default-500 bg-black',
	},
} as const satisfies Record<
	TDarkPalette,
	{ label: string; swatchClassName: string }
>;

export const LIGHT_PALETTE_PRESENTATION_MAP = {
	[LIGHT_PALETTE_MAP.IZAKAYA]: {
		label: '雀食堂',
		swatchClassName: 'bg-[#d7b681]',
	},
	[LIGHT_PALETTE_MAP.WHITE]: {
		label: '简约白',
		swatchClassName: 'border border-default-300 bg-white',
	},
	[LIGHT_PALETTE_MAP.GREEN]: {
		label: '清新绿',
		swatchClassName: 'bg-[#a8d8b9]',
	},
	[LIGHT_PALETTE_MAP.PINK]: {
		label: '少女粉',
		swatchClassName: 'bg-[#fedfe1]',
	},
} as const satisfies Record<
	TLightPalette,
	{ label: string; swatchClassName: string }
>;
