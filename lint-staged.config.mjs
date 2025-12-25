// @ts-check

import { relative } from 'node:path';
import { cwd } from 'node:process';

const buildEslintCommand = (/** @type {ReadonlyArray<string>} */ filenames) =>
	`eslint --fix ${filenames.map((filename) => relative(cwd(), filename)).join(' ')}`;

/** @type {import('lint-staged').Configuration} */
const config = {
	'!*.{scss,mjs,js,jsx,ts,tsx}': 'prettier --ignore-unknown --write',
	'*.{mjs,js,jsx,ts,tsx}': ['prettier --write', buildEslintCommand],
	'*.scss': ['prettier --write', 'stylelint --allow-empty-input --fix'],
};

export default config;
