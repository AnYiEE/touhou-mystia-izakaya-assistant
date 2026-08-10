/**
 * @file Transform all JavaScript operators and syntaxes, **not methods**.
 */

import fg from 'fast-glob';
import { readFile, writeFile } from 'node:fs/promises';

import { transformJavaScript } from './transformJavaScript';

function logError(filePath: string, error: unknown) {
	console.error(`Error transforming file: ${filePath}`, error);
}

const filePaths = await fg.glob(['out/**/*.js', 'public/**/*.js'], {
	ignore: ['out/_next/static/**/*.js'],
});
let hasTransformErrors = false;

for (const filePath of filePaths) {
	try {
		const sourceCode = await readFile(filePath, 'utf8');
		const transformedCode = await transformJavaScript(sourceCode, {
			filePath,
			isClassicScript: false,
		});
		await writeFile(filePath, transformedCode);
	} catch (error) {
		logError(filePath, error);
		hasTransformErrors = true;
	}
}

if (hasTransformErrors) {
	throw new Error('babel-transform-failed');
}
