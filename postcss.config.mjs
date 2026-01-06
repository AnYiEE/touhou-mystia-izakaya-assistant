// @ts-check
/* eslint-disable sort-keys */

import { env } from 'node:process';

/** @type {import('postcss-load-config').Config} */
const config = {
	plugins:
		env.NODE_ENV === 'production'
			? {
					tailwindcss: {},
					'postcss-flexbugs-fixes': {},
					'postcss-preset-env': {},
				}
			: { tailwindcss: {} },
};

export default config;
