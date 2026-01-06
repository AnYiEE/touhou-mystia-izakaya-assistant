import nextEnv from '@next/env';
import AdmZip from 'adm-zip';
import minimist from 'minimist';
import { access, copyFile, mkdir, readdir, rename, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { argv, cwd } from 'node:process';

import { getSha } from './utils';
import PACKAGE from '../package.json';

nextEnv.loadEnvConfig(cwd());

const isOffline = Boolean(process.env.OFFLINE);
const { prepare: isPrepare } = minimist<{ prepare?: boolean }>(argv.slice(2));

const filesToDelete = [
	'registerServiceWorker.js',
	'robots.txt',
	'serviceWorker.js',
	'sitemap.xml',
] as const;
const filesToRename = ['LICENSE', 'README.md'] as const;

const appPath = resolve(import.meta.dirname, '../app');
const outputPath = resolve(import.meta.dirname, '../out');
const rootPath = resolve(import.meta.dirname, '..');
const scriptPath = resolve(import.meta.dirname);

const apiPath = resolve(appPath, 'api');
const fakeApiPath = resolve(appPath, '_api');

async function checkPathExists(path: string) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

async function moveRouterFiles(currentPath: string, targetPath: string) {
	if (!(await checkPathExists(targetPath))) {
		await mkdir(targetPath, { recursive: true });
	}

	const entries = await readdir(currentPath, { withFileTypes: true });
	for (const entry of entries) {
		const fromPath = join(currentPath, entry.name);
		const toPath = join(targetPath, entry.name);

		if (entry.isDirectory()) {
			await moveRouterFiles(fromPath, toPath);
		} else if (entry.name === 'route.ts') {
			await rename(fromPath, toPath);
		}
	}
}

if (isOffline && isPrepare) {
	await moveRouterFiles(apiPath, fakeApiPath);
}

if (isOffline && !isPrepare) {
	await moveRouterFiles(fakeApiPath, apiPath);
	await rm(fakeApiPath, { recursive: true });

	const replaceExtension = (fileName: string) => {
		const f = fileName.split('.');
		if (f.length > 1) {
			f.pop();
		}
		return `${f.join('')}.txt`;
	};

	for (const file of filesToDelete) {
		const filePath = resolve(outputPath, file);
		if (await checkPathExists(filePath)) {
			await rm(filePath);
		}
	}

	for (const file of filesToRename) {
		if (await checkPathExists(outputPath)) {
			const filePath = resolve(rootPath, file);
			await copyFile(
				filePath,
				resolve(outputPath, replaceExtension(file))
			);
		}
	}

	const zipFileName = `${PACKAGE.name}_${PACKAGE.version}_${await getSha()}_offline-Windows`;
	const zipTemplateFileName = 'offline-template';

	const templateZip = new AdmZip(
		resolve(scriptPath, `${zipTemplateFileName}.zip`)
	);
	const zip = new AdmZip();

	templateZip.getEntries().forEach((entry) => {
		const { entryName } = entry;
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

	zip.addLocalFolder(outputPath, `${zipFileName}/out/`);
	zip.writeZip(resolve(rootPath, `${zipFileName}.zip`));
}
