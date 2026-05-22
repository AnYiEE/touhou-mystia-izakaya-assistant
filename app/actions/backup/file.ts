import {
	mkdir,
	readFile,
	readdir,
	rename,
	stat,
	unlink,
	writeFile,
} from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { validate as validateUuid } from 'uuid';

import type { TBackupFileRecord } from '@/lib/db/types';

const dir = join(cwd(), 'upload/backups');
const encoding: BufferEncoding = 'utf8';

function generateFilePath(code: TBackupFileRecord['code']) {
	if (!validateUuid(code)) {
		throw new Error('invalid-backup-code');
	}

	return join(dir, `${code}.json`);
}

export function checkBackupFileNotFoundError(error: unknown) {
	return (error as NodeJS.ErrnoException).code === 'ENOENT';
}

export async function deleteFile(code: TBackupFileRecord['code']) {
	const filePath = generateFilePath(code);

	await unlink(filePath);
}

export async function getFile(code: TBackupFileRecord['code']) {
	const filePath = generateFilePath(code);

	return await readFile(filePath, encoding);
}

export async function getFileSize(code: TBackupFileRecord['code']) {
	const filePath = generateFilePath(code);
	const fileStat = await stat(filePath);

	return fileStat.size;
}

export async function getFileIdentity(code: TBackupFileRecord['code']) {
	const filePath = generateFilePath(code);
	const fileStat = await stat(filePath, { bigint: true });

	return `${fileStat.size}:${fileStat.mtimeNs}`;
}

export async function getBackupFileCodes() {
	try {
		const entries = await readdir(dir, { withFileTypes: true });
		return entries
			.filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
			.map((entry) => entry.name.slice(0, -'.json'.length))
			.filter((code) => validateUuid(code));
	} catch (error) {
		if (checkBackupFileNotFoundError(error)) {
			return [];
		}

		throw error;
	}
}

function checkTemporaryBackupFileName(fileName: string) {
	const [code, id, extension, ...rest] = fileName.split('.');

	return (
		rest.length === 0 &&
		extension === 'tmp' &&
		validateUuid(code) &&
		validateUuid(id)
	);
}

export async function getExpiredTemporaryBackupFileNames(
	expiredBefore: number
) {
	try {
		const entries = await readdir(dir, { withFileTypes: true });
		const fileNames: string[] = [];

		await Promise.all(
			entries
				.filter(
					(entry) =>
						entry.isFile() &&
						checkTemporaryBackupFileName(entry.name)
				)
				.map(async (entry) => {
					const fileStat = await stat(join(dir, entry.name));
					if (fileStat.mtimeMs < expiredBefore) {
						fileNames.push(entry.name);
					}
				})
		);

		return fileNames;
	} catch (error) {
		if (checkBackupFileNotFoundError(error)) {
			return [];
		}

		throw error;
	}
}

export async function deleteTemporaryBackupFile(fileName: string) {
	if (!checkTemporaryBackupFileName(fileName)) {
		throw new Error('invalid-temporary-backup-file');
	}

	await unlink(join(dir, fileName));
}

export async function saveFile(
	code: TBackupFileRecord['code'],
	content: string
) {
	await mkdir(dir, { recursive: true });
	const filePath = generateFilePath(code);
	const tempFilePath = join(dir, `${code}.${randomUUID()}.tmp`);

	try {
		await writeFile(tempFilePath, content, encoding);
		await rename(tempFilePath, filePath);
	} catch (error) {
		try {
			await unlink(tempFilePath);
		} catch (cleanupError) {
			if (!checkBackupFileNotFoundError(cleanupError)) {
				console.warn('Failed to clean up temporary backup file.', {
					errorCode:
						(cleanupError as NodeJS.ErrnoException).code ??
						'unknown',
				});
			}
		}

		throw error;
	}
}
