// @ts-check
/* eslint-disable sort-keys, @typescript-eslint/no-require-imports, unicorn/prefer-module */
'use strict';

const {IS_PRODUCTION} = require('./scripts/utils');

module.exports = {
	plugins: {
		tailwindcss: {},
		'postcss-preset-env': IS_PRODUCTION
			? {
					/** @see {@link https://nextjs.org/docs/architecture/supported-browsers} */
					browsers: 'chrome 64, edge 79, firefox 67, opera 51, safari 12',
				}
			: {},
	},
};
