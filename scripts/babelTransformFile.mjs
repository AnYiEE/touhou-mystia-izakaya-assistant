/**
 * @file Transform all JavaScript operators and syntaxes, **not methods**.
 */
// @ts-check

import {globSync} from 'glob';
import lodash from 'lodash';
import {transformFile} from '@babel/core';
import {writeFileSync} from 'node:fs';

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
			if (!lodash.isNil(error) || !lodash.isString(result?.code)) {
				console.error(`Error transforming file: ${filePath}`, error);
				return;
			}

			writeFileSync(filePath, result.code);
		}
	);
});
