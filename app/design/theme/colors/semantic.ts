import { readableColor } from 'color2k';

import { colors } from './constants';
import type { TSemanticBaseColors, TThemeColors } from './types';
import { swapColorScale } from './utils';

function checkBackgroundColor(
	target: Record<keyof typeof colors.defaultBackgrounds, string>
) {
	if (
		target.dark !== colors.constants.BLACK ||
		target.light !== colors.brown[50] ||
		target.lightTheme !== colors.brown[200]
	) {
		throw new Error(
			'[design/theme/semantic]: `defaultBackgrounds` does not match `colors.constants`'
		);
	}
}

function getBackgroundColor(
	target: typeof colors.defaultBackgrounds,
	key: keyof typeof colors.defaultBackgrounds
) {
	checkBackgroundColor(target);

	return colors.defaultBackgrounds[key];
}

const base = {
	dark: {
		background: {
			...swapColorScale(colors.black),
			DEFAULT: getBackgroundColor(colors.defaultBackgrounds, 'dark'),
		},
		content1: {
			...swapColorScale(colors.black),
			DEFAULT: swapColorScale(colors.black)[100],
			foreground: swapColorScale(colors.black)[900],
		},
		content2: {
			...swapColorScale(colors.black),
			DEFAULT: swapColorScale(colors.black)[200],
			foreground: swapColorScale(colors.black)[800],
		},
		divider: {
			...swapColorScale(colors.black),
			DEFAULT: colors.divider.dark,
		},
		focus: {
			...swapColorScale(colors.blue),
			DEFAULT: swapColorScale(colors.blue)[500],
		},
		foreground: {
			...swapColorScale(colors.black),
			DEFAULT: colors.constants.BLACK_LIGHT,
		},
		overlay: {
			...swapColorScale(colors.black),
			DEFAULT: colors.constants.BLACK,
		},
	},
	light: {
		background: {
			...colors.brown,
			DEFAULT: getBackgroundColor(colors.defaultBackgrounds, 'light'),
		},
		content1: {
			...colors.brown,
			DEFAULT: colors.brown[100],
			foreground: colors.black[900],
		},
		content2: {
			...colors.brown,
			DEFAULT: colors.brown[200],
			foreground: colors.black[800],
		},
		divider: { ...colors.black, DEFAULT: colors.divider.light },
		focus: { ...colors.blue, DEFAULT: colors.blue[500] },
		foreground: { ...colors.black, DEFAULT: colors.black[900] },
		overlay: { ...colors.black, DEFAULT: colors.constants.BLACK },
	},
} as const satisfies TSemanticBaseColors;

const themeColorsDark = {
	...base.dark,
	danger: {
		...colors.pink,
		DEFAULT: colors.pink[500],
		foreground: readableColor(colors.pink[500]),
	},
	default: {
		...swapColorScale(colors.black),
		DEFAULT: swapColorScale(colors.black)[300],
		foreground: swapColorScale(colors.black)[700],
	},
	primary: {
		...colors.blue,
		DEFAULT: colors.blue[500],
		foreground: readableColor(colors.blue[500]),
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

const themeColorsLight = {
	...base.light,
	danger: {
		...colors.pink,
		DEFAULT: colors.pink[500],
		foreground: readableColor(colors.pink[500]),
	},
	default: {
		...colors.brown,
		DEFAULT: colors.brown[300],
		foreground: colors.black[700],
	},
	primary: {
		...colors.brown,
		DEFAULT: colors.brown[500],
		foreground: readableColor(colors.brown[500]),
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
	dark: themeColorsDark,
	light: themeColorsLight,
};
