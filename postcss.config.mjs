// @ts-check
/* eslint-disable sort-keys */

import {IS_PRODUCTION} from './scripts/utils.mjs';

const config = {
	plugins: IS_PRODUCTION
		? {
				tailwindcss: {},
				'postcss-preset-env': {},
			}
		: {
				tailwindcss: {},
			},
};

export default config;
