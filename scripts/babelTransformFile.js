// @ts-check
/* eslint-disable @typescript-eslint/no-require-imports, unicorn/prefer-module */
/**
 * @file Transform all JavaScript operators and syntaxes, **not methods**.
 */
const {globSync} = require('glob');
const {transformFile} = require('@babel/core');
const {writeFileSync} = require('node:fs');

globSync(['out/**/*.js', 'public/**/*.js']).forEach((filePath) => {
	transformFile(
		filePath,
		{
			comments: false,
			compact: true,
			presets: [
				[
					'@babel/preset-env',
					{
						modules: false,
					},
				],
			],
			/** @see {@link https://nextjs.org/docs/architecture/supported-browsers} */
			targets: ['chrome 64', 'edge 79', 'firefox 67', 'opera 51', 'safari 12'],
		},
		(error, result) => {
			if (error || !result || !result.code) {
				console.error(`Error transforming file: ${filePath}`, error);
				return;
			}

			writeFileSync(filePath, result.code);
		}
	);
});
