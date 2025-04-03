// @ts-check

import AdmZip from 'adm-zip';
import dotenv from 'dotenv';
import minimist from 'minimist';
import {copyFileSync, existsSync, renameSync, unlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {argv} from 'node:process';

import {getSha} from './utils.mjs';
import PACKAGE from '../package.json' with {type: 'json'};

dotenv.config({
	path: ['.env.local', '.env'],
});

const isOffline = !!process.env.OFFLINE;
const {prepare: isPrepare} = minimist(argv.slice(2));

const filesToDelete = ['registerServiceWorker.js', 'robots.txt', 'serviceWorker.js', 'sitemap.xml'];
const filesToRename = ['LICENSE', 'README.md'];

const appPath = resolve(import.meta.dirname, '../app');
const outputPath = resolve(import.meta.dirname, '../out');
const rootPath = resolve(import.meta.dirname, '..');
const scriptPath = resolve(import.meta.dirname);

if (isOffline && isPrepare) {
	renameSync(resolve(appPath, 'api'), resolve(appPath, '_api'));
}

if (isOffline && !isPrepare) {
	renameSync(resolve(appPath, '_api'), resolve(appPath, 'api'));

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

	const templateZip = new AdmZip(resolve(scriptPath, `${zipTemplateFileName}.zip`));
	const zip = new AdmZip();

	templateZip.getEntries().forEach((entry) => {
		const {entryName} = entry;
		if (entryName.startsWith(`${zipTemplateFileName}/`)) {
			const newEntryName = entryName.replace(zipTemplateFileName, zipFileName);
			zip.addFile(newEntryName, entry.getData());
		} else {
			zip.addFile(entryName, entry.getData());
		}
	});

	zip.addLocalFolder(outputPath, `${zipFileName}/out/`);
	zip.writeZip(resolve(rootPath, `${zipFileName}.zip`));
}
