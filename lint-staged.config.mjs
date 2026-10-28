// @ts-check

import { relative } from 'node:path';
import { cwd } from 'node:process';

const buildEslintCommand = (/** @type {ReadonlyArray<string>} */ filenames) =>
	`eslint --fix ${filenames.map((filename) => relative(cwd(), filename)).join(' ')}`;

const buildImportsFixCommand = (
	/** @type {ReadonlyArray<string>} */ filenames
) =>
	`tsx scripts/validation/validateImportConventions.ts --fix ${filenames.map((filename) => relative(cwd(), filename)).join(' ')}`;

/** @type {import('lint-staged').Configuration} */
const config = {
	'!*.{cjs,cts,css,js,jsx,mjs,mts,scss,ts,tsx}':
		'prettier --ignore-unknown --write',
	'*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}': [
		buildImportsFixCommand,
		'prettier --write',
		buildEslintCommand,
	],
	'*.{css,scss}': ['prettier --write', 'stylelint --allow-empty-input --fix'],
};

export default config;
