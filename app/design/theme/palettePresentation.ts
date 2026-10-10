import { DARK_PALETTE_MAP, LIGHT_PALETTE_MAP } from './runtime/constants';
import type { TDarkPalette, TLightPalette } from './runtime/types';

export const DARK_PALETTE_PRESENTATION_MAP = {
	[DARK_PALETTE_MAP.IZAKAYA]: {
		swatchClassName: 'border border-default-500 bg-[#262626]',
	},
	[DARK_PALETTE_MAP.BLACK]: {
		swatchClassName: 'border border-default-500 bg-black',
	},
} as const satisfies Record<TDarkPalette, { swatchClassName: string }>;

export const LIGHT_PALETTE_PRESENTATION_MAP = {
	[LIGHT_PALETTE_MAP.IZAKAYA]: { swatchClassName: 'bg-[#d7b681]' },
	[LIGHT_PALETTE_MAP.WHITE]: {
		swatchClassName: 'border border-default-300 bg-white',
	},
	[LIGHT_PALETTE_MAP.GREEN]: { swatchClassName: 'bg-[#a8d8b9]' },
	[LIGHT_PALETTE_MAP.PINK]: { swatchClassName: 'bg-[#fedfe1]' },
} as const satisfies Record<TLightPalette, { swatchClassName: string }>;
