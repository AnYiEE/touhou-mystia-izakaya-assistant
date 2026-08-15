import { heroui } from '@heroui/theme';
import { type Config } from 'tailwindcss';

import {
	fontFamily,
	getExtendConfig,
	semanticColors,
} from './app/design/theme';
import PACKAGE from './package.json';
import { CDN_URL, IS_PRODUCTION } from './scripts/shared/environment';

const herouiComponents = [
	...Object.keys(PACKAGE.dependencies)
		.filter(
			(dependency) =>
				dependency.startsWith('@heroui/') &&
				dependency !== '@heroui/system' &&
				dependency !== '@heroui/theme'
		)
		.map((dependency) => dependency.replace('@heroui/', '')),
	'toggle', // For `@heroui/switch`.
];

const config: Config = {
	content: [
		'./app/**/*.{ts,tsx}',
		`./node_modules/@heroui/theme/dist/components/(${herouiComponents.join('|')}).js`,
	],
	darkMode: 'selector',
	future: { hoverOnlyWhenSupported: true },
	plugins: [
		heroui({
			themes: {
				black: { extend: 'dark' },
				green: { colors: semanticColors.green, extend: 'light' },
				izakaya: { colors: semanticColors.light, extend: 'light' },
				'izakaya-dark': { colors: semanticColors.dark, extend: 'dark' },
				pink: { colors: semanticColors.pink, extend: 'light' },
				white: { colors: semanticColors.white, extend: 'light' },
			},
		}),
	],
	safelist: IS_PRODUCTION
		? [
				// For compatible with browsers that do not support the `gap` property.
				{ pattern: /space-(x|y)/u, variants: ['md', 'lg', 'xl'] },
			]
		: [],
	theme: { extend: getExtendConfig(CDN_URL), fontFamily },
};

export default config;
