import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

export interface IOfflinePackagePaths {
	adminPath: string;
	apiPath: string;
	appPath: string;
	fakeApiPath: string;
	middlewarePath: string;
	nextBuildPath: string;
	offlineAdminPath: string;
	offlineMiddlewarePath: string;
	offlinePagesPath: string;
	offlineSourceFilesPath: string;
	outputPath: string;
	publicPath: string;
	rootPath: string;
	templatePath: string;
}

export function getOfflinePackagePaths(): IOfflinePackagePaths {
	const scriptPath = resolve(import.meta.dirname);
	const rootPath = resolve(scriptPath, '../../..');
	const appPath = resolve(rootPath, 'app');
	const offlinePagesPath = resolve(appPath, '_offline_pages');

	return {
		adminPath: resolve(appPath, '(pages)/admin'),
		apiPath: resolve(appPath, 'api'),
		appPath,
		fakeApiPath: resolve(appPath, '_api'),
		middlewarePath: resolve(rootPath, 'middleware.ts'),
		nextBuildPath: resolve(rootPath, '.next'),
		offlineAdminPath: resolve(offlinePagesPath, 'admin'),
		offlineMiddlewarePath: resolve(rootPath, '_offline_middleware.ts'),
		offlinePagesPath,
		offlineSourceFilesPath: resolve(appPath, '_offline_source_files'),
		outputPath: resolve(rootPath, 'out'),
		publicPath: resolve(rootPath, 'public'),
		rootPath,
		templatePath: resolve(scriptPath, 'offline-template.zip'),
	};
}

function normalizeRelativePath(path: string, rootPath: string) {
	return path.slice(rootPath.length + 1).replaceAll('\\', '/');
}

export async function checkOfflinePackagePaths() {
	const paths = getOfflinePackagePaths();
	const expectedPaths: IOfflinePackagePaths = {
		adminPath: resolve(paths.rootPath, 'app/(pages)/admin'),
		apiPath: resolve(paths.rootPath, 'app/api'),
		appPath: resolve(paths.rootPath, 'app'),
		fakeApiPath: resolve(paths.rootPath, 'app/_api'),
		middlewarePath: resolve(paths.rootPath, 'middleware.ts'),
		nextBuildPath: resolve(paths.rootPath, '.next'),
		offlineAdminPath: resolve(paths.rootPath, 'app/_offline_pages/admin'),
		offlineMiddlewarePath: resolve(
			paths.rootPath,
			'_offline_middleware.ts'
		),
		offlinePagesPath: resolve(paths.rootPath, 'app/_offline_pages'),
		offlineSourceFilesPath: resolve(
			paths.rootPath,
			'app/_offline_source_files'
		),
		outputPath: resolve(paths.rootPath, 'out'),
		publicPath: resolve(paths.rootPath, 'public'),
		rootPath: paths.rootPath,
		templatePath: resolve(
			paths.rootPath,
			'scripts/build/offlinePackage/offline-template.zip'
		),
	};

	assert.deepEqual(paths, expectedPaths);
	await Promise.all([
		access(paths.appPath),
		access(paths.publicPath),
		access(paths.templatePath),
	]);
	const pathNames = [
		'adminPath',
		'apiPath',
		'appPath',
		'fakeApiPath',
		'middlewarePath',
		'nextBuildPath',
		'offlineAdminPath',
		'offlineMiddlewarePath',
		'offlinePagesPath',
		'offlineSourceFilesPath',
		'outputPath',
		'publicPath',
		'rootPath',
		'templatePath',
	] as const satisfies ReadonlyArray<keyof IOfflinePackagePaths>;
	pathNames.forEach((name) => {
		const path = paths[name];
		console.log(
			`${name.replace(/Path$/u, '')}: ${
				path === paths.rootPath
					? '.'
					: normalizeRelativePath(path, paths.rootPath)
			}`
		);
	});
}
