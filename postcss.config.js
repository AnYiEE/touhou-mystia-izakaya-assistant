// @ts-check
/* eslint-disable sort-keys, unicorn/prefer-module */
'use strict';

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
	plugins: {
		tailwindcss: {},
		'postcss-preset-env': isProduction
			? {
					/** @see {@link https://nextjs.org/docs/architecture/supported-browsers} */
					browsers: 'chrome 64, edge 79, firefox 67, opera 51, safari 12',
				}
			: {},
	},
};
