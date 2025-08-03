declare module '@eslint-community/eslint-plugin-eslint-comments/configs' {
	import { type Linter } from 'eslint';

	const recommended: Linter.Config;
	export = { recommended };
}

declare module 'eslint-plugin-sort-destructure-keys' {
	import { plugin } from 'typescript-eslint';

	const sortDestructureKeys: typeof plugin;
	export = sortDestructureKeys;
}
