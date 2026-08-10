import { transformAsync } from '@babel/core';

interface ITransformJavaScriptOptions {
	filePath: string;
	isClassicScript: boolean;
}

const SCOPED_CLASSIC_SCRIPT_MARKER = '"next-static-script-scope";';

function isClassicScriptScopeWrapped(code: string) {
	return code.trimStart().startsWith(SCOPED_CLASSIC_SCRIPT_MARKER);
}

function wrapClassicScriptScope(code: string) {
	return `${SCOPED_CLASSIC_SCRIPT_MARKER}(function(){${code}\n}).call(self);`;
}

export async function transformJavaScript(
	sourceCode: string,
	{ filePath, isClassicScript }: ITransformJavaScriptOptions
) {
	const result = await transformAsync(sourceCode, {
		comments: false,
		compact: true,
		filename: filePath,
		presets: [['@babel/preset-env', { modules: false }]],
	});

	if (result === null || typeof result.code !== 'string') {
		throw new Error('babel-transform-no-result');
	}

	return isClassicScript && !isClassicScriptScopeWrapped(result.code)
		? wrapClassicScriptScope(result.code)
		: result.code;
}
