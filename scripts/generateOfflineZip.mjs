// @ts-check

import AdmZip from 'adm-zip';
import dotenv from 'dotenv';
import minimist from 'minimist';
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readdirSync,
	renameSync,
	rmSync,
	unlinkSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { argv } from 'node:process';

import { getSha } from './utils.mjs';
import PACKAGE from '../package.json' with { type: 'json' };

dotenv.config({ path: ['.env.local', '.env'], quiet: true });

const isOffline = !!process.env.OFFLINE;
const { prepare: isPrepare } = minimist(argv.slice(2));

const filesToDelete = [
	'registerServiceWorker.js',
	'robots.txt',
	'serviceWorker.js',
	'sitemap.xml',
];
const filesToRename = ['LICENSE', 'README.md'];

const appPath = resolve(import.meta.dirname, '../app');
const outputPath = resolve(import.meta.dirname, '../out');
const rootPath = resolve(import.meta.dirname, '..');
const scriptPath = resolve(import.meta.dirname);

const apiPath = resolve(appPath, 'api');
const fakeApiPath = resolve(appPath, '_api');

function moveRouterFiles(
	/** @type {string} */ currentPath,
	/** @type {string} */ targetPath
) {
	if (!existsSync(targetPath)) {
		mkdirSync(targetPath, { recursive: true });
	}

	const entries = readdirSync(currentPath, { withFileTypes: true });

	for (const entry of entries) {
		const fromPath = join(currentPath, entry.name);
		const toPath = join(targetPath, entry.name);

		if (entry.isDirectory()) {
			moveRouterFiles(fromPath, toPath);
		} else if (entry.name === 'route.ts') {
			renameSync(fromPath, toPath);
		}
	}
}

if (isOffline && isPrepare) {
	moveRouterFiles(apiPath, fakeApiPath);
}

if (isOffline && !isPrepare) {
	moveRouterFiles(fakeApiPath, apiPath);
	rmSync(fakeApiPath, { recursive: true });

	const replaceExtension = (/** @type {string} */ fileName) => {
		const f = fileName.split('.');
		if (f.length > 1) {
			f.pop();
		}
		return `${f.join('')}.txt`;
	};

	filesToDelete.forEach((file) => {
		const filePath = resolve(outputPath, file);
		if (existsSync(filePath)) {
			unlinkSync(filePath);
		}
	});
	filesToRename.forEach((file) => {
		if (existsSync(outputPath)) {
			const filePath = resolve(rootPath, file);
			copyFileSync(filePath, resolve(outputPath, replaceExtension(file)));
		}
	});

	const zipFileName = `${PACKAGE.name}_${PACKAGE.version}_${getSha()}_offline-Windows`;
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
