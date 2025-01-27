// @ts-check

import AdmZip from 'adm-zip';
import dotenv from 'dotenv';
import {copyFileSync, existsSync, unlinkSync} from 'node:fs';
import {resolve} from 'node:path';

import {getSha} from './utils.mjs';
import PACKAGE from '../package.json' with {type: 'json'};

dotenv.config({
	path: ['.env.local', '.env'],
});

const filesToDelete = ['registerServiceWorker.js', 'robots.txt', 'serviceWorker.js', 'sitemap.xml'];
const filesToRename = ['LICENSE', 'README.md'];

const outputPath = resolve(import.meta.dirname, '../out');
const rootPath = resolve(import.meta.dirname, '..');
const scriptPath = resolve(import.meta.dirname);

if (process.env.OFFLINE) {
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
