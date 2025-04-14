// @ts-check

import {FlatCompat} from '@eslint/eslintrc';
import eslint from '@eslint/js';
import tsEslint from 'typescript-eslint';

import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import compat from 'eslint-plugin-compat';
import prettier from 'eslint-config-prettier';
import sortDestructureKeys from 'eslint-plugin-sort-destructure-keys';
import unicorn from 'eslint-plugin-unicorn';

import globals from 'globals';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const flatCompat = new FlatCompat({
	baseDirectory: __dirname,
});

export default tsEslint.config(
	{
		ignores: ['public/*.js'],
	},
	{
		extends: [
			comments.recommended,
			eslint.configs.recommended,
			tsEslint.configs.strictTypeChecked,
			tsEslint.configs.stylisticTypeChecked,
			unicorn.configs.recommended,
			...flatCompat.extends('next/core-web-vitals', 'next/typescript'),
			prettier,
		],
		plugins: {
			'@typescript-eslint': tsEslint.plugin,
			compat,
			'sort-destructure-keys': sortDestructureKeys,
		},

		languageOptions: {
			ecmaVersion: 'latest',
			globals: globals.es2025,
			parser: tsEslint.parser,
			parserOptions: {
				projectService: true,
			},
		},

		rules: {
			'array-callback-return': [
				'error',
				{
					allowImplicit: true,
				},
			],
			'no-constructor-return': 'error',
			'no-duplicate-imports': 'error',
			'no-promise-executor-return': 'error',
			'no-self-compare': 'error',
			'no-unmodified-loop-condition': 'error',
			'no-unreachable-loop': 'error',
			'require-atomic-updates': 'error',

			'accessor-pairs': 'error',
			'arrow-body-style': ['error', 'as-needed'],
			'block-scoped-var': 'error',
			curly: 'error',
			'default-case-last': 'error',
			eqeqeq: 'error',
			'func-name-matching': 'error',
			'func-names': ['error', 'as-needed'],
			'grouped-accessor-pairs': ['error', 'getBeforeSet'],
			'guard-for-in': 'error',
			'logical-assignment-operators': [
				'error',
				'always',
				{
					enforceForIfStatements: true,
				},
			],
			'no-else-return': 'error',
			'no-extra-bind': 'error',
			'no-implicit-coercion': [
				'error',
				{
					boolean: false,
				},
			],
			'no-iterator': 'error',
			'no-labels': 'error',
			'no-lone-blocks': 'error',
			'no-lonely-if': 'error',
			'no-multi-assign': 'error',
			'no-multi-str': 'error',
			'no-negated-condition': 'error',
			'no-new-func': 'error',
			'no-new-wrappers': 'error',
			'no-object-constructor': 'error',
			'no-octal-escape': 'error',
			'no-proto': 'error',
			'no-return-assign': 'error',
			'no-undef-init': 'error',
			'no-unneeded-ternary': 'error',
			'no-useless-call': 'error',
			'no-useless-computed-key': 'error',
			'no-useless-concat': 'error',
			'no-useless-constructor': 'error',
			'no-useless-rename': 'error',
			'no-useless-return': 'error',
			'no-var': 'error',
			'no-void': [
				'error',
				{
					allowAsStatement: true,
				},
			],
			'object-shorthand': 'error',
			'operator-assignment': 'error',
			'prefer-arrow-callback': [
				'error',
				{
					allowNamedFunctions: true,
				},
			],
			'prefer-const': 'error',
			'prefer-exponentiation-operator': 'error',
			'prefer-object-has-own': 'error',
			'prefer-object-spread': 'error',
			'prefer-regex-literals': 'error',
			'prefer-rest-params': 'error',
			'prefer-spread': 'error',
			'prefer-template': 'error',
			quotes: [
				'error',
				'single',
				{
					avoidEscape: true,
				},
			],
			'require-unicode-regexp': 'error',
			'sort-imports': [
				'error',
				{
					allowSeparatedGroups: true,
					ignoreDeclarationSort: true,
				},
			],
			'sort-keys': [
				'error',
				'asc',
				{
					allowLineSeparatedGroups: true,
					caseSensitive: false,
					natural: true,
				},
			],
			'symbol-description': 'error',
			'template-curly-spacing': ['error', 'never'],
			'vars-on-top': 'error',
			yoda: 'error',

			'getter-return': [
				'error',
				{
					allowImplicit: true,
				},
			],

			'@eslint-community/eslint-comments/disable-enable-pair': 'off',
			'@eslint-community/eslint-comments/no-unlimited-disable': 'off',
			'@eslint-community/eslint-comments/no-unused-disable': 'warn',

			'@typescript-eslint/array-type': [
				'error',
				{
					default: 'array-simple',
					readonly: 'generic',
				},
			],
			'@typescript-eslint/no-deprecated': 'warn',
			'@typescript-eslint/no-empty-function': [
				'error',
				{
					allow: ['arrowFunctions'],
				},
			],
			'@typescript-eslint/no-empty-object-type': [
				'error',
				{
					allowInterfaces: 'always',
				},
			],
			'@typescript-eslint/no-floating-promises': [
				'warn',
				{
					ignoreIIFE: true,
				},
			],
			'@typescript-eslint/no-loop-func': 'error',
			'@typescript-eslint/no-shadow': 'error',
			'@typescript-eslint/no-unsafe-argument': 'warn',
			'@typescript-eslint/no-unsafe-assignment': 'warn',
			'@typescript-eslint/no-unsafe-call': 'warn',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return': 'warn',
			'@typescript-eslint/no-unused-expressions': [
				'error',
				{
					enforceForJSX: true,
				},
			],
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					varsIgnorePattern: '^_',
				},
			],
			'@typescript-eslint/no-use-before-define': 'error',
			'@typescript-eslint/non-nullable-type-assertion-style': 'off',
			'@typescript-eslint/prefer-destructuring': [
				'error',
				{
					AssignmentExpression: {
						array: false,
						object: false,
					},
					VariableDeclarator: {
						array: true,
						object: true,
					},
				},
			],
			'@typescript-eslint/restrict-template-expressions': [
				'error',
				{
					allowNumber: true,
				},
			],
			'@typescript-eslint/unbound-method': 'off',

			/** @see {@link https://nextjs.org/docs/architecture/supported-browsers} */
			'compat/compat': ['error', 'chrome 64, edge 79, firefox 67, opera 51, safari 12'],

			'sort-destructure-keys/sort-destructure-keys': 'error',

			'unicorn/consistent-destructuring': 'error',
			'unicorn/consistent-function-scoping': 'off',
			'unicorn/custom-error-definition': 'error',
			'unicorn/filename-case': 'off',
			'unicorn/import-style': 'off',
			'unicorn/no-abusive-eslint-disable': 'warn',
			'unicorn/no-array-callback-reference': 'off',
			'unicorn/no-array-for-each': 'off',
			'unicorn/no-array-reduce': 'off',
			'unicorn/no-document-cookie': 'off',
			'unicorn/no-keyword-prefix': 'off',
			'unicorn/no-named-default': 'off',
			'unicorn/no-nested-ternary': 'off',
			'unicorn/no-new-array': 'off',
			'unicorn/no-null': 'off',
			'unicorn/no-this-assignment': 'off',
			'unicorn/no-unreadable-array-destructuring': 'off',
			'unicorn/no-unused-properties': 'error',
			'unicorn/numeric-separators-style': [
				'error',
				{
					onlyIfContainsSeparator: true,
				},
			],
			'unicorn/prefer-array-find': 'off',
			'unicorn/prefer-set-has': 'off',
			'unicorn/prefer-ternary': 'off',
			'unicorn/prevent-abbreviations': 'off',
			'unicorn/require-post-message-target-origin': 'off',
			'unicorn/switch-case-braces': ['error', 'avoid'],
		},
	},

	{
		extends: [tsEslint.configs.disableTypeChecked],
		files: ['**/*.js'],
	},

	{
		files: ['app/**/*.ts', 'app/**/*.tsx'],
		settings: {
			polyfills: [
				'Array.flat',
				'Array.flatMap',
				'Object.hasOwn',
				'Promise.allSettled',
				'String.trimEnd',
				'String.trimStart',
				'URL.toJSON',
			],
		},
	}
);
