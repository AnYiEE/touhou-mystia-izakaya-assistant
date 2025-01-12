/* eslint-disable sort-keys */

import {type Config} from 'tailwindcss';
import {nextui} from '@nextui-org/theme';

import {fontFamily, getExtendConfig, semanticColors} from './app/design/theme';
import {CDN_URL, IS_PRODUCTION} from './scripts/utils.mjs';
import PACKAGE from './package.json';

const nextuiComponents = [
	...Object.keys(PACKAGE.dependencies)
		.filter(
			(dependency) =>
				dependency.startsWith('@nextui-org/') &&
				dependency !== '@nextui-org/system' &&
				dependency !== '@nextui-org/theme'
		)
		.map((dependency) => dependency.replace('@nextui-org/', '')),
	'toggle', // For `@nextui-org/switch`.
];

const config: Config = {
	content: [
		'./app/**/*.{ts,tsx}',
		`./node_modules/@nextui-org/theme/dist/components/(${nextuiComponents.join('|')}).js`,
	],
	darkMode: 'selector',
	safelist: IS_PRODUCTION
		? [
				// For compatible with browsers that do not support the `gap` property.
				{
					pattern: /space-(x|y)/u,
					variants: ['md', 'lg', 'xl'],
				},
			]
		: [],
	theme: {
		extend: getExtendConfig(CDN_URL),
		fontFamily,
	},
	plugins: [
		nextui({
			themes: {
				'izakaya-dark': {
					extend: 'dark',
					colors: semanticColors.dark,
				},
				izakaya: {
					extend: 'light',
					colors: semanticColors.light,
				},
			},
		}),
	],
};

export default config;
