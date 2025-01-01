import {readableColor} from 'color2k';

import {colors} from './constants';
import type {TSemanticBaseColors, TThemeColors} from './types';

const base = {
	light: {
		background: {
			...colors.brown,
			DEFAULT: colors.brown[50],
		},
		content1: {
			...colors.brownShifted1,
			DEFAULT: colors.brownShifted1[50],
			foreground: colors.black[900],
		},
		content2: {
			...colors.brownShifted2,
			DEFAULT: colors.brownShifted2[50],
			foreground: colors.black[800],
		},
		divider: {
			...colors.black,
			DEFAULT: colors.divider.light,
		},
		focus: {
			...colors.blue,
			DEFAULT: colors.blue[500],
		},
		foreground: {
			...colors.black,
			DEFAULT: colors.black[900],
		},
		overlay: {
			...colors.black,
			DEFAULT: colors.constants.BLACK,
		},
	},
} as const satisfies TSemanticBaseColors;

const themeColorsLight = {
	...base.light,
	danger: {
		...colors.pink,
		DEFAULT: colors.pink[500],
		foreground: readableColor(colors.pink[500]),
	},
	default: {
		...colors.brownShifted1,
		DEFAULT: colors.brownShifted1[200],
		foreground: colors.black[700],
	},
	primary: {
		...colors.brownShifted2,
		DEFAULT: colors.brownShifted2[400],
		foreground: readableColor(colors.brownShifted2[400]),
	},
	secondary: {
		...colors.purple,
		DEFAULT: colors.purple[500],
		foreground: readableColor(colors.purple[500]),
	},
	success: {
		...colors.green,
		DEFAULT: colors.green[500],
		foreground: readableColor(colors.green[500]),
	},
	warning: {
		...colors.orange,
		DEFAULT: colors.orange[500],
		foreground: readableColor(colors.orange[500]),
	},
} as const satisfies TThemeColors;

export const semanticColors = {
	light: themeColorsLight,
};
