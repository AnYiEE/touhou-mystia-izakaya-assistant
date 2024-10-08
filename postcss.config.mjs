// @ts-check
/* eslint-disable sort-keys */

import {IS_PRODUCTION} from './scripts/utils.mjs';

/** @type {import('postcss-load-config').Config} */
const config = {
	plugins: IS_PRODUCTION
		? {
				tailwindcss: {},
				'postcss-flexbugs-fixes': {},
				'postcss-preset-env': {},
			}
		: {
				tailwindcss: {},
			},
};

export default config;
