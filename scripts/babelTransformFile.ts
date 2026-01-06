/**
 * @file Transform all JavaScript operators and syntaxes, **not methods**.
 */

import { transformFileAsync } from '@babel/core';
import fg from 'fast-glob';
import lodash from 'lodash';
import { writeFile } from 'node:fs/promises';

function logError(filePath: string, error: unknown) {
	console.error(`Error transforming file: ${filePath}`, error);
}

const filePaths = await fg.glob(['out/**/*.js', 'public/**/*.js']);

for (const filePath of filePaths) {
	try {
		const result = await transformFileAsync(filePath, {
			comments: false,
			compact: true,
			presets: [['@babel/preset-env', { modules: false }]],
			/** @see {@link https://nextjs.org/docs/15/architecture/supported-browsers} */
			targets: [
				'chrome 64',
				'edge 79',
				'firefox 67',
				'opera 51',
				'safari 12',
			],
		});

		if (!lodash.isNil(result) && lodash.isString(result.code)) {
			await writeFile(filePath, result.code);
		} else {
			logError(filePath, 'No transformation result.');
		}
	} catch (error) {
		logError(filePath, error);
	}
}
