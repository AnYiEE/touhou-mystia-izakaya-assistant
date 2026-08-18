import {
	access,
	copyFile,
	mkdir,
	readFile,
	readdir,
	rename,
	rm,
} from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import { type IOfflinePackagePaths } from './paths';

const offlineFilePattern = /\.offline\.(jsx?|tsx?)$/u;
const routeFilePattern = /^route\.(?:[cm]?js|jsx|ts|tsx)$/u;
const LEGACY_ROUTE_NAMES = [
	'ornaments',
	'recipes',
	'customer-normal',
	'customer-rare',
] as const;

async function checkPathExists(path: string) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

async function restoreRouterFiles(
	backupRootPath: string,
	targetRootPath: string
) {
	if (!(await checkPathExists(backupRootPath))) {
		return;
	}

	async function restore(currentPath: string, targetPath: string) {
		const entries = await readdir(currentPath, { withFileTypes: true });
		for (const entry of entries) {
			const fromPath = join(currentPath, entry.name);
			const toPath = join(targetPath, entry.name);

			if (entry.isDirectory()) {
				await restore(fromPath, toPath);
				continue;
			}
			if (!routeFilePattern.test(entry.name)) {
				continue;
			}

			if (await checkPathExists(toPath)) {
				const [backupContent, targetContent] = await Promise.all([
					readFile(fromPath),
					readFile(toPath),
				]);
				if (!backupContent.equals(targetContent)) {
					throw new Error(
						`offline-router-restore-conflict:${fromPath}:${toPath}`
					);
				}
				await rm(fromPath, { force: true });
				continue;
			}

			await mkdir(dirname(toPath), { recursive: true });
			await rename(fromPath, toPath);
		}
	}

	await restore(backupRootPath, targetRootPath);
	await rm(backupRootPath, { force: true, recursive: true });
}

async function moveRouterFiles(currentPath: string, targetPath: string) {
	if (!(await checkPathExists(currentPath))) {
		return;
	}

	await mkdir(targetPath, { recursive: true });

	const entries = await readdir(currentPath, { withFileTypes: true });
	for (const entry of entries) {
		const fromPath = join(currentPath, entry.name);
		const toPath = join(targetPath, entry.name);

		if (entry.isDirectory()) {
			await moveRouterFiles(fromPath, toPath);
		} else if (routeFilePattern.test(entry.name)) {
			await rename(fromPath, toPath);
		}
	}
}

async function movePathIfExists(currentPath: string, targetPath: string) {
	if (!(await checkPathExists(currentPath))) {
		return;
	}

	await mkdir(dirname(targetPath), { recursive: true });
	await rename(currentPath, targetPath);
}

async function moveTreeIfExists(currentPath: string, targetPath: string) {
	if (!(await checkPathExists(currentPath))) {
		return;
	}

	await mkdir(targetPath, { recursive: true });

	const entries = await readdir(currentPath, { withFileTypes: true });
	for (const entry of entries) {
		const fromPath = join(currentPath, entry.name);
		const toPath = join(targetPath, entry.name);

		await (entry.isDirectory()
			? moveTreeIfExists(fromPath, toPath)
			: movePathIfExists(fromPath, toPath));
	}

	await rm(currentPath, { force: true, recursive: true });
}

async function copyPathIfExists(currentPath: string, targetPath: string) {
	if (!(await checkPathExists(currentPath))) {
		return;
	}

	await mkdir(dirname(targetPath), { recursive: true });
	await copyFile(currentPath, targetPath);
}

async function findOfflineSourceFiles(path: string) {
	const offlineFiles: string[] = [];

	async function search(currentPath: string) {
		if (!(await checkPathExists(currentPath))) {
			return;
		}

		const entries = await readdir(currentPath, { withFileTypes: true });
		for (const entry of entries) {
			const entryPath = join(currentPath, entry.name);
			if (entry.isDirectory()) {
				if (entry.name.startsWith('_')) {
					continue;
				}
				await search(entryPath);
			} else if (offlineFilePattern.test(entry.name)) {
				offlineFiles.push(entryPath);
			}
		}
	}

	await search(path);
	return offlineFiles;
}

async function findFiles(path: string) {
	const files: string[] = [];

	async function search(currentPath: string) {
		if (!(await checkPathExists(currentPath))) {
			return;
		}

		const entries = await readdir(currentPath, { withFileTypes: true });
		for (const entry of entries) {
			const entryPath = join(currentPath, entry.name);
			if (entry.isDirectory()) {
				await search(entryPath);
			} else {
				files.push(entryPath);
			}
		}
	}

	await search(path);
	return files;
}

async function replaceWithOfflineSourceFiles({
	appPath,
	offlineSourceFilesPath,
}: IOfflinePackagePaths) {
	const offlineFiles = await findOfflineSourceFiles(appPath);

	for (const offlineFilePath of offlineFiles) {
		const sourceFilePath = offlineFilePath.replace(
			offlineFilePattern,
			'.$1'
		);
		const backupPath = resolve(
			offlineSourceFilesPath,
			sourceFilePath.slice(appPath.length + 1)
		);

		if (!(await checkPathExists(sourceFilePath))) {
			throw new Error(
				`Offline source replacement is missing source file: ${sourceFilePath}`
			);
		}

		if (await checkPathExists(backupPath)) {
			throw new Error(
				`Offline source replacement backup already exists: ${backupPath}`
			);
		}

		await movePathIfExists(sourceFilePath, backupPath);
		await copyPathIfExists(offlineFilePath, sourceFilePath);
	}
}

async function moveRootMiddlewareForOffline({
	middlewarePath,
	offlineMiddlewarePath,
}: IOfflinePackagePaths) {
	if (!(await checkPathExists(middlewarePath))) {
		return;
	}

	if (await checkPathExists(offlineMiddlewarePath)) {
		throw new Error(
			`Offline middleware backup already exists: ${offlineMiddlewarePath}`
		);
	}

	await movePathIfExists(middlewarePath, offlineMiddlewarePath);
}

async function restoreRootMiddleware({
	middlewarePath,
	offlineMiddlewarePath,
}: IOfflinePackagePaths) {
	if (!(await checkPathExists(offlineMiddlewarePath))) {
		return;
	}

	if (await checkPathExists(middlewarePath)) {
		throw new Error(
			`Offline middleware restore target already exists: ${middlewarePath}`
		);
	}

	await movePathIfExists(offlineMiddlewarePath, middlewarePath);
}

async function restoreOfflineSourceFiles({
	appPath,
	offlineSourceFilesPath,
}: IOfflinePackagePaths) {
	const backupFiles = await findFiles(offlineSourceFilesPath);

	for (const backupPath of backupFiles) {
		const sourceFilePath = resolve(
			appPath,
			backupPath.slice(offlineSourceFilesPath.length + 1)
		);
		const offlineFilePath = sourceFilePath.replace(
			/\.(jsx?|tsx?)$/u,
			'.offline.$1'
		);

		if (await checkPathExists(sourceFilePath)) {
			const sourceContent = await readFile(sourceFilePath).catch(
				() => null
			);
			const offlineContent = await readFile(offlineFilePath).catch(
				() => null
			);

			if (
				sourceContent === null ||
				offlineContent === null ||
				!sourceContent.equals(offlineContent)
			) {
				throw new Error(
					`Offline source replacement cannot be restored safely: ${sourceFilePath}`
				);
			}
		}

		await rm(sourceFilePath, { force: true });
		await movePathIfExists(backupPath, sourceFilePath);
	}

	await rm(offlineSourceFilesPath, { force: true, recursive: true });
}

async function restoreAdminPages({
	adminPath,
	offlineAdminPath,
}: IOfflinePackagePaths) {
	if (!(await checkPathExists(offlineAdminPath))) {
		return;
	}

	await moveTreeIfExists(offlineAdminPath, adminPath);
}

async function restoreOfflineLegacyRoutes({
	appPath,
	offlinePagesPath,
}: IOfflinePackagePaths) {
	for (const routeName of LEGACY_ROUTE_NAMES) {
		await moveTreeIfExists(
			resolve(offlinePagesPath, 'legacy-routes', routeName),
			resolve(appPath, '(pages)', routeName)
		);
	}
}

async function moveOfflineLegacyRoutes({
	appPath,
	offlinePagesPath,
}: IOfflinePackagePaths) {
	for (const routeName of LEGACY_ROUTE_NAMES) {
		await moveTreeIfExists(
			resolve(appPath, '(pages)', routeName),
			resolve(offlinePagesPath, 'legacy-routes', routeName)
		);
	}
}

async function restoreStaticSsoPages({
	appPath,
	offlinePagesPath,
}: IOfflinePackagePaths) {
	await moveTreeIfExists(
		resolve(offlinePagesPath, 'sso'),
		resolve(appPath, '(pages)/sso')
	);
}

async function moveStaticSsoPages({
	appPath,
	offlinePagesPath,
}: IOfflinePackagePaths) {
	await moveTreeIfExists(
		resolve(appPath, '(pages)/sso'),
		resolve(offlinePagesPath, 'sso')
	);
}

async function restoreRouterReplacement(paths: IOfflinePackagePaths) {
	await restoreRootMiddleware(paths);
	await restoreOfflineSourceFiles(paths);
	await restoreRouterFiles(paths.fakeApiPath, paths.apiPath);
	await restoreAdminPages(paths);
	await restoreOfflineLegacyRoutes(paths);
	await restoreStaticSsoPages(paths);
	await rm(paths.offlinePagesPath, { force: true, recursive: true });
}

export async function restoreOfflineRouterReplacement(
	paths: IOfflinePackagePaths
) {
	await restoreRouterReplacement(paths);
}

export async function restoreStaticRouterReplacement(
	paths: IOfflinePackagePaths
) {
	await restoreRouterReplacement(paths);
}

export async function prepareOfflineRouterReplacement(
	paths: IOfflinePackagePaths
) {
	await moveRootMiddlewareForOffline(paths);
	await moveRouterFiles(paths.apiPath, paths.fakeApiPath);
	await moveTreeIfExists(paths.adminPath, paths.offlineAdminPath);
	await moveOfflineLegacyRoutes(paths);
	await replaceWithOfflineSourceFiles(paths);
}

export async function prepareStaticRouterReplacement(
	paths: IOfflinePackagePaths
) {
	await moveRootMiddlewareForOffline(paths);
	await moveRouterFiles(paths.apiPath, paths.fakeApiPath);
	await moveTreeIfExists(paths.adminPath, paths.offlineAdminPath);
	await moveStaticSsoPages(paths);
}
