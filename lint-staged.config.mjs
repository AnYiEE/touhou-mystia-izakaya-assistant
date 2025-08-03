// @ts-check

import { relative } from 'node:path';

const buildEslintCommand = (/** @type {string[]} */ filenames) =>
	`next lint --fix --file ${filenames.map((f) => relative(process.cwd(), f)).join(' --file ')}`;

/** @type {import('lint-staged').Configuration} */
const config = {
	'!*.{scss,cjs,mjs,js,jsx,ts,tsx}': 'prettier --ignore-unknown --write',
	'*.{cjs,mjs,js,jsx,ts,tsx}': ['prettier --write', buildEslintCommand],
	'*.scss': ['prettier --write', 'stylelint --allow-empty-input --fix'],
};

export default config;
