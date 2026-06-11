import nextEnv from '@next/env';
import AdmZip from 'adm-zip';
import minimist from 'minimist';
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
import { argv, cwd } from 'node:process';

import { getSha } from './utils';
import { checkOfflineEnv } from '../app/lib/environment';
import PACKAGE from '../package.json';

nextEnv.loadEnvConfig(cwd());

const isOffline = checkOfflineEnv(process.env.OFFLINE);
const { prepare: isPrepare, 'restore-only': isRestoreOnly } = minimist<{
	prepare?: boolean;
	'restore-only'?: boolean;
}>(argv.slice(2));

const filesToDelete = [
	'registerServiceWorker.js',
	'robots.txt',
	'serviceWorker.js',
	'sitemap.xml',
] as const;
const filesToRename = ['LICENSE', 'README.md'] as const;
const forbiddenOutputPatterns = [
	'/api/v1',
	'/admin',
	'_api',
	'_offline_pages',
	'_offline_source_files',
	'_offline_stub_files',
] as const;
const ignoredOutputFileNames = ['.DS_Store'] as const;
const offlineFilePattern = /\.offline\.(jsx?|tsx?)$/u;
const routeFilePattern = /^route\.(?:[cm]?js|jsx|ts|tsx)$/u;

const appPath = resolve(import.meta.dirname, '../app');
const nextBuildPath = resolve(import.meta.dirname, '../.next');
const outputPath = resolve(import.meta.dirname, '../out');
const rootPath = resolve(import.meta.dirname, '..');
const scriptPath = resolve(import.meta.dirname);

const apiPath = resolve(appPath, 'api');
const fakeApiPath = resolve(appPath, '_api');
const adminPath = resolve(appPath, '(pages)/(layout)/admin');
const offlinePagesPath = resolve(appPath, '_offline_pages');
const offlineAdminPath = resolve(offlinePagesPath, 'admin');
const offlineSourceFilesPath = resolve(appPath, '_offline_source_files');

async function checkPathExists(path: string) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

function normalizePath(path: string) {
	return path.replaceAll('\\', '/');
}

function findForbiddenPattern(value: Buffer | string) {
	return forbiddenOutputPatterns.find((pattern) => value.includes(pattern));
}

function isIgnoredOutputPath(path: string) {
	const parts = normalizePath(path).split('/');
	return ignoredOutputFileNames.some((fileName) => parts.includes(fileName));
}

function findIgnoredOutputFileName(path: string) {
	const parts = normalizePath(path).split('/');
	return ignoredOutputFileNames.find((fileName) => parts.includes(fileName));
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

async function replaceWithOfflineSourceFiles() {
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

async function removeIgnoredOutputFiles(path: string) {
	if (!(await checkPathExists(path))) {
		return;
	}

	const entries = await readdir(path, { withFileTypes: true });
	for (const entry of entries) {
		const entryPath = join(path, entry.name);
		if (entry.isDirectory()) {
			await removeIgnoredOutputFiles(entryPath);
		} else if (isIgnoredOutputPath(entryPath)) {
			await rm(entryPath, { force: true });
		}
	}
}

async function restoreOfflineSourceFiles() {
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

async function scanForbiddenOutputFiles(path: string) {
	const matches: string[] = [];

	async function scan(currentPath: string) {
		if (!(await checkPathExists(currentPath))) {
			return;
		}

		const entries = await readdir(currentPath, { withFileTypes: true });
		for (const entry of entries) {
			const entryPath = join(currentPath, entry.name);
			const ignoredFileName = findIgnoredOutputFileName(entryPath);
			if (ignoredFileName !== undefined) {
				matches.push(`${entryPath}: path includes ${ignoredFileName}`);
			}

			const pathPattern = findForbiddenPattern(normalizePath(entryPath));
			if (pathPattern !== undefined) {
				matches.push(`${entryPath}: path includes ${pathPattern}`);
			}

			if (entry.isDirectory()) {
				await scan(entryPath);
				continue;
			}

			const content = await readFile(entryPath).catch(() => null);
			if (content === null) {
				continue;
			}

			const pattern = findForbiddenPattern(content);
			if (pattern !== undefined) {
				matches.push(`${entryPath}: content includes ${pattern}`);
			}
		}
	}

	await scan(path);
	return matches;
}

function scanForbiddenZipEntries(zip: AdmZip) {
	const matches: string[] = [];

	for (const entry of zip.getEntries()) {
		const { entryName, isDirectory } = entry;
		const ignoredFileName = findIgnoredOutputFileName(entryName);
		if (ignoredFileName !== undefined) {
			matches.push(`${entryName}: path includes ${ignoredFileName}`);
		}

		const pathPattern = findForbiddenPattern(normalizePath(entryName));
		if (pathPattern !== undefined) {
			matches.push(`${entryName}: path includes ${pathPattern}`);
		}

		if (isDirectory) {
			continue;
		}

		const pattern = findForbiddenPattern(entry.getData());
		if (pattern !== undefined) {
			matches.push(`${entryName}: content includes ${pattern}`);
		}
	}

	return matches;
}

async function addOutputFilesToZip(
	zip: AdmZip,
	sourcePath: string,
	zipPath: string
) {
	const entries = await readdir(sourcePath, { withFileTypes: true });
	for (const entry of entries) {
		const entryPath = join(sourcePath, entry.name);
		if (isIgnoredOutputPath(entryPath)) {
			continue;
		}

		if (entry.isDirectory()) {
			await addOutputFilesToZip(
				zip,
				entryPath,
				`${zipPath}${entry.name}/`
			);
		} else {
			zip.addFile(`${zipPath}${entry.name}`, await readFile(entryPath));
		}
	}
}

async function removeExistingOfflineZipFiles() {
	const entries = await readdir(rootPath, { withFileTypes: true });
	const zipFileNamePrefix = `${PACKAGE.name}_${PACKAGE.version}_`;

	for (const entry of entries) {
		if (
			entry.isFile() &&
			entry.name.startsWith(zipFileNamePrefix) &&
			entry.name.endsWith('_offline-Windows.zip')
		) {
			await rm(resolve(rootPath, entry.name), { force: true });
		}
	}
}

async function restoreRouterFiles() {
	if (!(await checkPathExists(fakeApiPath))) {
		return;
	}

	async function restore(currentPath: string, targetPath: string) {
		const entries = await readdir(currentPath, { withFileTypes: true });
		for (const entry of entries) {
			const fromPath = join(currentPath, entry.name);
			const toPath = join(targetPath, entry.name);

			if (entry.isDirectory()) {
				await restore(fromPath, toPath);
			} else if (routeFilePattern.test(entry.name)) {
				await ((await checkPathExists(toPath))
					? rm(fromPath, { force: true })
					: movePathIfExists(fromPath, toPath));
			}
		}
	}

	await restore(fakeApiPath, apiPath);

	await rm(fakeApiPath, { force: true, recursive: true });
}

async function restoreAdminPages() {
	if (!(await checkPathExists(offlineAdminPath))) {
		return;
	}

	if (!(await checkPathExists(adminPath))) {
		await movePathIfExists(offlineAdminPath, adminPath);
	}
}

async function restoreOfflineFiles() {
	await restoreOfflineSourceFiles();
	await restoreRouterFiles();
	await restoreAdminPages();
	await rm(offlinePagesPath, { force: true, recursive: true });
}

async function prepareOfflineFiles() {
	await restoreOfflineFiles();
	await rm(nextBuildPath, { force: true, recursive: true });
	await rm(outputPath, { force: true, recursive: true });
	await moveRouterFiles(apiPath, fakeApiPath);
	await movePathIfExists(adminPath, offlineAdminPath);
	await replaceWithOfflineSourceFiles();
}

if (isOffline && isPrepare) {
	await prepareOfflineFiles();
}

if (isOffline && isRestoreOnly) {
	await restoreOfflineFiles();
}

if (isOffline && !isPrepare && !isRestoreOnly) {
	await restoreOfflineFiles();

	const replaceExtension = (fileName: string) => {
		const f = fileName.split('.');
		if (f.length > 1) {
			f.pop();
		}
		return `${f.join('')}.txt`;
	};

	for (const file of filesToDelete) {
		await rm(resolve(outputPath, file), { force: true });
	}

	for (const file of filesToRename) {
		await copyFile(
			resolve(rootPath, file),
			resolve(outputPath, replaceExtension(file))
		);
	}

	await removeIgnoredOutputFiles(outputPath);

	const forbiddenOutputFiles = await scanForbiddenOutputFiles(outputPath);
	if (forbiddenOutputFiles.length > 0) {
		throw new Error(
			`Offline output contains API/admin artifacts:\n${forbiddenOutputFiles.join('\n')}`
		);
	}

	const zipFileName = `${PACKAGE.name}_${PACKAGE.version}_${await getSha()}_offline-Windows`;
	const zipTemplateFileName = 'offline-template';
	const zipPath = resolve(rootPath, `${zipFileName}.zip`);

	const templateZip = new AdmZip(
		resolve(scriptPath, `${zipTemplateFileName}.zip`)
	);
	const zip = new AdmZip();

	templateZip.getEntries().forEach((entry) => {
		const { entryName } = entry;
		if (isIgnoredOutputPath(entryName)) {
			return;
		}

		if (entryName.startsWith(`${zipTemplateFileName}/`)) {
			const newEntryName = entryName.replace(
				zipTemplateFileName,
				zipFileName
			);
			zip.addFile(newEntryName, entry.getData());
		} else {
			zip.addFile(entryName, entry.getData());
		}
	});

	await addOutputFilesToZip(zip, outputPath, `${zipFileName}/out/`);

	const forbiddenZipEntries = scanForbiddenZipEntries(zip);
	if (forbiddenZipEntries.length > 0) {
		throw new Error(
			`Offline zip contains API/admin artifacts:\n${forbiddenZipEntries.join('\n')}`
		);
	}

	await removeExistingOfflineZipFiles();
	zip.writeZip(zipPath);
}
