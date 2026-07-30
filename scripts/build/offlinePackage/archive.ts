import AdmZip from 'adm-zip';
import { readFile, readdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import {
	checkIgnoredOfflineOutputPath,
	scanForbiddenOfflineZipEntries,
} from './outputValidation';

interface IWriteOfflineArchiveOptions {
	archiveBaseName: string;
	outputPath: string;
	rootPath: string;
	templatePath: string;
}

async function addOutputFilesToZip(
	zip: AdmZip,
	sourcePath: string,
	zipPath: string
) {
	const entries = await readdir(sourcePath, { withFileTypes: true });
	for (const entry of entries) {
		const entryPath = join(sourcePath, entry.name);
		if (checkIgnoredOfflineOutputPath(entryPath)) {
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

async function removeExistingOfflineZipFiles(
	archiveBaseName: string,
	rootPath: string
) {
	const entries = await readdir(rootPath, { withFileTypes: true });
	const platformSeparatorIndex = archiveBaseName.lastIndexOf('_');
	const shaSeparatorIndex = archiveBaseName.lastIndexOf(
		'_',
		platformSeparatorIndex - 1
	);
	const zipFileNamePrefix = archiveBaseName.slice(0, shaSeparatorIndex + 1);

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

export async function writeOfflineArchive({
	archiveBaseName,
	outputPath,
	rootPath,
	templatePath,
}: IWriteOfflineArchiveOptions) {
	const zipTemplateFileName = 'offline-template';
	const zipPath = resolve(rootPath, `${archiveBaseName}.zip`);
	const templateZip = new AdmZip(templatePath);
	const zip = new AdmZip();

	templateZip.getEntries().forEach((entry) => {
		const { entryName } = entry;
		if (checkIgnoredOfflineOutputPath(entryName)) {
			return;
		}

		if (entryName.startsWith(`${zipTemplateFileName}/`)) {
			const newEntryName = entryName.replace(
				zipTemplateFileName,
				archiveBaseName
			);
			zip.addFile(newEntryName, entry.getData());
		} else {
			zip.addFile(entryName, entry.getData());
		}
	});

	await addOutputFilesToZip(zip, outputPath, `${archiveBaseName}/out/`);

	const forbiddenZipEntries = scanForbiddenOfflineZipEntries(zip);
	if (forbiddenZipEntries.length > 0) {
		throw new Error(
			`Offline zip contains API/admin artifacts:\n${forbiddenZipEntries.join('\n')}`
		);
	}

	await removeExistingOfflineZipFiles(archiveBaseName, rootPath);
	zip.writeZip(zipPath);
}
