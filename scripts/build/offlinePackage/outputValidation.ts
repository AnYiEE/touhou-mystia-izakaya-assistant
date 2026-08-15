import AdmZip from 'adm-zip';
import { access, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const forbiddenOutputPatterns = [
	'/api/v1',
	'/admin',
	'_api',
	'_offline_pages',
	'_offline_source_files',
	'_offline_stub_files',
] as const;
const forbiddenOutputPathPatterns = [
	...forbiddenOutputPatterns,
	'/customer-normal',
	'/customer-rare',
	'/ornaments',
	'/recipes',
] as const;
const ignoredOutputFileNames = ['.DS_Store'] as const;

function normalizePath(path: string) {
	return path.replaceAll('\\', '/');
}

function findForbiddenPattern(value: Buffer | string) {
	return forbiddenOutputPatterns.find((pattern) => value.includes(pattern));
}

function findForbiddenPathPattern(value: string) {
	return forbiddenOutputPathPatterns.find((pattern) =>
		value.includes(pattern)
	);
}

export function checkIgnoredOfflineOutputPath(path: string) {
	const parts = normalizePath(path).split('/');
	return ignoredOutputFileNames.some((fileName) => parts.includes(fileName));
}

function findIgnoredOutputFileName(path: string) {
	const parts = normalizePath(path).split('/');
	return ignoredOutputFileNames.find((fileName) => parts.includes(fileName));
}

async function checkPathExists(path: string) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

export async function removeIgnoredOfflineOutputFiles(path: string) {
	if (!(await checkPathExists(path))) {
		return;
	}

	const entries = await readdir(path, { withFileTypes: true });
	for (const entry of entries) {
		const entryPath = join(path, entry.name);
		if (entry.isDirectory()) {
			await removeIgnoredOfflineOutputFiles(entryPath);
		} else if (checkIgnoredOfflineOutputPath(entryPath)) {
			await rm(entryPath, { force: true });
		}
	}
}

export async function scanForbiddenOfflineOutputFiles(path: string) {
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

			const pathPattern = findForbiddenPathPattern(
				normalizePath(entryPath)
			);
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

export function scanForbiddenOfflineZipEntries(zip: AdmZip) {
	const matches: string[] = [];

	for (const entry of zip.getEntries()) {
		const { entryName, isDirectory } = entry;
		const ignoredFileName = findIgnoredOutputFileName(entryName);
		if (ignoredFileName !== undefined) {
			matches.push(`${entryName}: path includes ${ignoredFileName}`);
		}

		const pathPattern = findForbiddenPathPattern(normalizePath(entryName));
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
