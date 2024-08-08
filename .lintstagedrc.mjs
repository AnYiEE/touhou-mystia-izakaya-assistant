// @ts-check

import {relative} from 'node:path';

/**
 * @param {string[]} filenames
 */
const buildEslintCommand = (filenames) =>
	`next lint --fix --file ${filenames.map((f) => relative(process.cwd(), f)).join(' --file ')}`;

export default {
	'*.scss': ['prettier --write', 'stylelint --allow-empty-input --fix'],
	'*.{cjs,mjs,js,jsx,ts,tsx}': ['prettier --write', buildEslintCommand],
	'!*.{scss,cjs,mjs,js,jsx,ts,tsx}': 'prettier --ignore-unknown --write',
};
