// @ts-check

import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import compat from 'eslint-plugin-compat';
import sortDestructureKeys from 'eslint-plugin-sort-destructure-keys';
import unicorn from 'eslint-plugin-unicorn';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import { builtinModules } from 'node:module';
import tsEslint from 'typescript-eslint';

import packageJson from './package.json' with { type: 'json' };

const flatCompat = new FlatCompat({ baseDirectory: import.meta.dirname });

/** @param {string} ownerName */
const getOwnerImportPatterns = (ownerName) => [
	`@/${ownerName}`,
	`@/${ownerName}/**`,
];

const DESIGN_IMPORT_PATTERNS = getOwnerImportPatterns('design');
const DOMAIN_IMPORT_PATTERNS = getOwnerImportPatterns('domain');
const FEATURE_IMPORT_PATTERNS = getOwnerImportPatterns('features');
const INFRASTRUCTURE_IMPORT_PATTERNS = getOwnerImportPatterns('infrastructure');
/** @type {ReadonlyArray<readonly [string, 'ts' | 'tsx']>} */
const APP_ROOT_COMPOSITION_ENTRY_FILES = [
	['global-error', 'tsx'],
	['layout', 'tsx'],
	['loading', 'tsx'],
	['manifest', 'ts'],
	['not-found', 'tsx'],
	['polyfills', 'tsx'],
	['providers', 'tsx'],
	['robots', 'ts'],
	['sitemap', 'ts'],
];
const APP_ROOT_COMPOSITION_IMPORT_PATTERNS =
	APP_ROOT_COMPOSITION_ENTRY_FILES.flatMap(([baseName, extension]) => [
		`@/${baseName}`,
		`@/${baseName}.${extension}`,
	]);
const ROUTE_IMPORT_PATTERNS = [
	...getOwnerImportPatterns('(home)'),
	...getOwnerImportPatterns('(pages)'),
	...getOwnerImportPatterns('api'),
	...APP_ROOT_COMPOSITION_IMPORT_PATTERNS,
];
const PARENT_RELATIVE_IMPORT_RESTRICTION = {
	message:
		'app 模块不能使用父级相对静态 import；同目录/子目录使用 ./，目录树外使用 @/ 别名。',
	regex: String.raw`^\.\.(?:/|$)`,
};
const FEATURE_CLIENT_SERVER_IMPORT_PATTERNS = [
	'@/features/**/server',
	'@/features/**/server.*',
	'@/features/**/server/**',
];
const SERVER_INFRASTRUCTURE_IMPORT_PATTERNS = [
	'@/infrastructure/database',
	'@/infrastructure/database/**',
	'@/infrastructure/environment/serverValidation',
	'@/infrastructure/environment/serverValidation.*',
	'@/infrastructure/filesystem',
	'@/infrastructure/filesystem/**',
	'@/infrastructure/**/server',
	'@/infrastructure/**/server.*',
	'@/infrastructure/**/server/**',
];
const SERVER_PACKAGE_IMPORT_ROOTS = [
	'@node-rs/argon2',
	'@simplewebauthn/server',
	'better-sqlite3',
	'kysely',
	'next/cache',
	'next/headers',
	'next/og',
	'next/server',
	'server-only',
];
const SERVER_PACKAGE_IMPORT_PATTERNS = SERVER_PACKAGE_IMPORT_ROOTS.map(
	(packageName) => `${packageName}/**`
);
const SERVER_PACKAGE_IMPORTS = [
	...builtinModules.filter((moduleName) => !moduleName.startsWith('node:')),
	...SERVER_PACKAGE_IMPORT_ROOTS,
];
const SERVER_IMPORT_MESSAGE =
	'feature client 入口不能通过别名依赖服务端实现；公开环境模块与 runtime-neutral contracts 仍可使用。';

export default defineConfig(
	{
		ignores: [
			'node_modules/**',
			'.deploy/**',
			'.next/**',
			'build/**',
			'out/**',
			'next-env.d.ts',
			'public/*.js',
		],
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
			parserOptions: { projectService: true },
		},

		rules: {
			'array-callback-return': ['error', { allowImplicit: true }],
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
				{ enforceForIfStatements: true },
			],
			'no-else-return': 'error',
			'no-extra-bind': 'error',
			'no-implicit-coercion': ['error', { boolean: false }],
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
			'no-restricted-syntax': [
				'error',
				{
					message:
						'String.prototype.replaceAll is unavailable in Safari 12. Use replace with a global regular expression, an allocation-aware loop, or an existing suitable helper.',
					selector:
						"CallExpression > MemberExpression.callee:matches([property.name='replaceAll'], [property.value='replaceAll'])",
				},
			],
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
			'no-void': ['error', { allowAsStatement: true }],
			'object-shorthand': 'error',
			'operator-assignment': 'error',
			'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
			'prefer-const': 'error',
			'prefer-exponentiation-operator': 'error',
			'prefer-object-has-own': 'error',
			'prefer-object-spread': 'error',
			'prefer-regex-literals': 'error',
			'prefer-rest-params': 'error',
			'prefer-spread': 'error',
			'prefer-template': 'error',
			quotes: ['error', 'single', { avoidEscape: true }],
			'require-unicode-regexp': 'error',
			'sort-imports': [
				'error',
				{ allowSeparatedGroups: true, ignoreDeclarationSort: true },
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

			'getter-return': ['error', { allowImplicit: true }],

			'@eslint-community/eslint-comments/disable-enable-pair': 'off',
			'@eslint-community/eslint-comments/no-unlimited-disable': 'off',
			'@eslint-community/eslint-comments/no-unused-disable': 'warn',

			'@typescript-eslint/array-type': [
				'error',
				{ default: 'array-simple', readonly: 'generic' },
			],
			'@typescript-eslint/no-deprecated': 'warn',
			'@typescript-eslint/no-empty-function': [
				'error',
				{ allow: ['arrowFunctions'] },
			],
			'@typescript-eslint/no-empty-object-type': [
				'error',
				{ allowInterfaces: 'always' },
			],
			'@typescript-eslint/no-floating-promises': [
				'warn',
				{ ignoreIIFE: true },
			],
			'@typescript-eslint/no-loop-func': 'error',
			'@typescript-eslint/no-shadow': 'off',
			'@typescript-eslint/no-unsafe-argument': 'warn',
			'@typescript-eslint/no-unsafe-assignment': 'warn',
			'@typescript-eslint/no-unsafe-call': 'warn',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return': 'warn',
			'@typescript-eslint/no-unused-expressions': [
				'error',
				{ enforceForJSX: true },
			],
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{ varsIgnorePattern: '^_' },
			],
			'@typescript-eslint/no-use-before-define': 'error',
			'@typescript-eslint/non-nullable-type-assertion-style': 'off',
			'@typescript-eslint/prefer-destructuring': [
				'error',
				{
					AssignmentExpression: { array: false, object: false },
					VariableDeclarator: { array: true, object: true },
				},
			],
			'@typescript-eslint/restrict-template-expressions': [
				'error',
				{ allowNumber: true },
			],
			'@typescript-eslint/unbound-method': 'off',

			/** @see {@link https://nextjs.org/docs/15/architecture/supported-browsers} */
			'compat/compat': ['error', packageJson.browserslist.join(', ')],

			'sort-destructure-keys/sort-destructure-keys': 'error',

			'unicorn/consistent-compound-words': 'off',
			'unicorn/consistent-destructuring': 'error',
			'unicorn/consistent-function-scoping': 'off',
			'unicorn/custom-error-definition': 'error',
			'unicorn/filename-case': 'off',
			'unicorn/import-style': 'off',
			'unicorn/no-abusive-eslint-disable': 'warn',
			'unicorn/no-array-callback-reference': 'off',
			'unicorn/no-array-for-each': 'off',
			'unicorn/no-array-reduce': 'off',
			'unicorn/no-array-reverse': 'off',
			'unicorn/no-array-sort': 'off',
			'unicorn/no-document-cookie': 'off',
			'unicorn/no-keyword-prefix': 'off',
			'unicorn/no-named-default': 'off',
			'unicorn/no-nested-ternary': 'off',
			'unicorn/no-new-array': 'off',
			'unicorn/no-null': 'off',
			'unicorn/no-this-assignment': 'off',
			'unicorn/no-this-outside-of-class': 'off',
			'unicorn/no-unreadable-array-destructuring': 'off',
			'unicorn/no-unused-properties': 'error',
			'unicorn/numeric-separators-style': [
				'error',
				{ onlyIfContainsSeparator: true },
			],
			'unicorn/prefer-set-has': 'off',
			'unicorn/prefer-string-replace-all': 'off',
			'unicorn/prevent-abbreviations': 'off',
			'unicorn/switch-case-braces': ['error', 'avoid'],
		},
	},

	{
		extends: [tsEslint.configs.disableTypeChecked],
		files: ['**/*.mjs', '**/*.js'],
	},

	{
		files: ['app/**/*.ts', 'app/**/*.tsx'],
		rules: {
			'no-restricted-imports': [
				'error',
				{ patterns: [PARENT_RELATIVE_IMPORT_RESTRICTION] },
			],
		},
		settings: {
			polyfills: [
				'AbortController',
				'Array.flat',
				'Array.flatMap',
				'HTMLElement.prototype.inert',
				'Object.hasOwn',
				'Promise.allSettled',
				'String.trimEnd',
				'String.trimStart',
				'URL.toJSON',
			],
		},
	},

	{
		files: ['app/design/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						PARENT_RELATIVE_IMPORT_RESTRICTION,
						{
							group: [
								...FEATURE_IMPORT_PATTERNS,
								...ROUTE_IMPORT_PATTERNS,
							],
							message:
								'设计系统模块不能通过别名依赖 feature 或路由入口。',
						},
					],
				},
			],
		},
	},

	{
		files: ['app/design/theme/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['@/**'],
							message:
								'design/theme 必须保留工具链可解析的相对 import，不能使用 @/ 别名。',
						},
					],
				},
			],
		},
	},

	{
		files: ['app/domain/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						PARENT_RELATIVE_IMPORT_RESTRICTION,
						{
							group: [
								...FEATURE_IMPORT_PATTERNS,
								...INFRASTRUCTURE_IMPORT_PATTERNS,
								...ROUTE_IMPORT_PATTERNS,
								...DESIGN_IMPORT_PATTERNS,
							],
							message:
								'领域模块不能通过别名依赖 feature、基础设施、路由或 UI。',
						},
					],
				},
			],
		},
	},

	{
		files: ['app/features/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						PARENT_RELATIVE_IMPORT_RESTRICTION,
						{
							group: ROUTE_IMPORT_PATTERNS,
							message:
								'feature 模块不能通过别名反向依赖路由入口。',
						},
					],
				},
			],
		},
	},

	{
		files: [
			'app/features/**/client.{ts,tsx}',
			'app/features/**/client.offline.{ts,tsx}',
			'app/features/**/client/**/*.{ts,tsx}',
		],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					paths: SERVER_PACKAGE_IMPORTS.map((name) => ({
						message: SERVER_IMPORT_MESSAGE,
						name,
					})),
					patterns: [
						PARENT_RELATIVE_IMPORT_RESTRICTION,
						{
							group: [
								...ROUTE_IMPORT_PATTERNS,
								...FEATURE_CLIENT_SERVER_IMPORT_PATTERNS,
								...SERVER_INFRASTRUCTURE_IMPORT_PATTERNS,
								...SERVER_PACKAGE_IMPORT_PATTERNS,
								'node:*',
							],
							message: SERVER_IMPORT_MESSAGE,
						},
					],
				},
			],
		},
	},

	{
		files: ['app/infrastructure/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						PARENT_RELATIVE_IMPORT_RESTRICTION,
						{
							group: [
								...FEATURE_IMPORT_PATTERNS,
								...ROUTE_IMPORT_PATTERNS,
								...DESIGN_IMPORT_PATTERNS,
							],
							message:
								'基础设施模块不能通过别名依赖 feature、设计系统或路由入口。',
						},
					],
				},
			],
		},
	},

	{
		files: ['app/shared/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						PARENT_RELATIVE_IMPORT_RESTRICTION,
						{
							group: [
								...FEATURE_IMPORT_PATTERNS,
								...DOMAIN_IMPORT_PATTERNS,
								...INFRASTRUCTURE_IMPORT_PATTERNS,
								...DESIGN_IMPORT_PATTERNS,
								...ROUTE_IMPORT_PATTERNS,
							],
							message:
								'共享模块不能通过别名依赖 feature、领域、基础设施、设计系统或路由入口。',
						},
					],
				},
			],
		},
	}
);
