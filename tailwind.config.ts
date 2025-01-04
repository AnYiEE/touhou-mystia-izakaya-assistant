/* eslint-disable sort-keys */

import {type Config} from 'tailwindcss';
import reactAriaComponentsPlugin from 'tailwindcss-react-aria-components';
import {withTV} from 'tailwind-variants/transformer';

import {createThemes, fontFamily, getExtendConfig, semanticColors} from './app/design/theme';
import {CDN_URL, IS_PRODUCTION} from './scripts/utils.mjs';

const config: Config = withTV({
	content: ['./app/**/*.tsx'],
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
		createThemes(semanticColors),
		reactAriaComponentsPlugin({
			prefix: 'rac',
		}),
	],
});

export default config;
