// @ts-check

import { relative } from 'node:path';

const buildEslintCommand = (/** @type {ReadonlyArray<string>} */ filenames) =>
	`next lint --fix --file ${filenames.map((f) => relative(process.cwd(), f)).join(' --file ')}`;

/** @type {import('lint-staged').Configuration} */
const config = {
	'!*.{scss,mjs,js,jsx,ts,tsx}': 'prettier --ignore-unknown --write',
	'*.{mjs,js,jsx,ts,tsx}': ['prettier --write', buildEslintCommand],
	'*.scss': ['prettier --write', 'stylelint --allow-empty-input --fix'],
};

export default config;
