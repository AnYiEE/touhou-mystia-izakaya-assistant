/* eslint-disable sort-keys */

import {type Config} from 'tailwindcss';
import {nextui} from '@nextui-org/react';

import {fontFamily, getExtendConfig, semanticColors} from './app/design/theme';
import {CDN_URL, IS_PRODUCTION} from './scripts/utils.mjs';

const config: Config = {
	content: ['./app/**/*.tsx', './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}'],
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
				izakaya: {
					extend: 'light',
					colors: semanticColors.light,
				},
			},
		}),
	],
};

export default config;
