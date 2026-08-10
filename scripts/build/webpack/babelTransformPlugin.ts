import { transformJavaScript } from '../transformJavaScript';

interface IAssetSource {
	source: () => string | Uint8Array;
}

interface ICompilation {
	hooks: {
		processAssets: {
			tapPromise: (
				options: { name: string; stage: number },
				callback: (
					assets: Record<string, IAssetSource>
				) => Promise<void>
			) => void;
		};
	};
	updateAsset: (filePath: string, source: IAssetSource) => void;
}

interface ICompiler {
	hooks: {
		thisCompilation: {
			tap: (
				pluginName: string,
				callback: (compilation: ICompilation) => void
			) => void;
		};
	};
	webpack: {
		Compilation: { PROCESS_ASSETS_STAGE_OPTIMIZE: number };
		sources: { RawSource: new (code: string) => IAssetSource };
	};
}

const NEXT_STATIC_JAVASCRIPT_PATTERN = /^static\/.*\.js$/u;
const PLUGIN_NAME = 'BabelTransformPlugin';

export class BabelTransformPlugin {
	apply(compiler: ICompiler) {
		const { Compilation, sources } = compiler.webpack;
		compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
			compilation.hooks.processAssets.tapPromise(
				{
					name: PLUGIN_NAME,
					stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
				},
				async (assets) => {
					for (const [filePath, source] of Object.entries(assets)) {
						if (!NEXT_STATIC_JAVASCRIPT_PATTERN.test(filePath)) {
							continue;
						}

						const sourceValue = source.source();
						const sourceCode =
							typeof sourceValue === 'string'
								? sourceValue
								: Buffer.from(sourceValue).toString('utf8');
						const transformedCode = await transformJavaScript(
							sourceCode,
							{ filePath, isClassicScript: true }
						);
						compilation.updateAsset(
							filePath,
							new sources.RawSource(transformedCode)
						);
					}
				}
			);
		});
	}
}
