/**
 * @file Transform all JavaScript operators and syntaxes, **not methods**.
 */

import { transformFileAsync } from '@babel/core';
import fg from 'fast-glob';
import lodash from 'lodash';
import { readFile, writeFile } from 'node:fs/promises';

const scopedClassicScriptMarker = '"next-static-script-scope";';

function logError(filePath: string, error: unknown) {
	console.error(`Error transforming file: ${filePath}`, error);
}

function normalizePath(filePath: string) {
	return filePath.replaceAll('\\', '/');
}

function isNextStaticScript(filePath: string) {
	return normalizePath(filePath).startsWith('out/_next/static/');
}

function isClassicScriptScopeWrapped(code: string) {
	return code.trimStart().startsWith(scopedClassicScriptMarker);
}

function wrapClassicScriptScope(code: string) {
	return `${scopedClassicScriptMarker}(function(){${code}\n}).call(self);`;
}

const filePaths = await fg.glob(['out/**/*.js', 'public/**/*.js']);
let hasTransformErrors = false;

for (const filePath of filePaths) {
	try {
		const sourceCode = await readFile(filePath, 'utf8');
		const isScopedClassicScript = isClassicScriptScopeWrapped(sourceCode);
		const result = await transformFileAsync(filePath, {
			comments: false,
			compact: true,
			presets: [['@babel/preset-env', { modules: false }]],
		});

		if (!lodash.isNil(result) && lodash.isString(result.code)) {
			await writeFile(
				filePath,
				isNextStaticScript(filePath) && !isScopedClassicScript
					? wrapClassicScriptScope(result.code)
					: result.code
			);
		} else {
			logError(filePath, 'No transformation result.');
			hasTransformErrors = true;
		}
	} catch (error) {
		logError(filePath, error);
		hasTransformErrors = true;
	}
}

if (hasTransformErrors) {
	throw new Error('babel-transform-failed');
}
