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

interface IBackupFileReference {
	code: TBackupFileRecord['code'];
	fileName: string;
}

function formatFileIdentity(fileStat: { mtimeNs: bigint; size: bigint }) {
	return `${fileStat.size}:${fileStat.mtimeNs}`;
}

function parseBackupFileName(fileName: string): IBackupFileReference | null {
	const [code, uniqueIdOrExtension, extension, ...rest] = fileName.split('.');

	if (code === undefined || !validateUuid(code) || rest.length > 0) {
		return null;
	}

	if (uniqueIdOrExtension === 'json' && extension === undefined) {
		return { code: code.toLowerCase(), fileName };
	}

	if (extension === 'json' && validateUuid(uniqueIdOrExtension)) {
		return { code: code.toLowerCase(), fileName };
	}

	return null;
}

export function getBackupFileName(
	code: TBackupFileRecord['code'],
	fileName: TBackupFileRecord['file_name'] = null
) {
	if (!validateUuid(code)) {
		throw new Error('invalid-backup-code');
	}

	if (fileName === null || fileName === '') {
		return `${code}.json`;
	}

	const parsed = parseBackupFileName(fileName);
	if (parsed?.code !== code.toLowerCase()) {
		throw new Error('invalid-backup-file-name');
	}

	return fileName;
}

function createBackupFileName(code: TBackupFileRecord['code']) {
	return `${code}.${randomUUID()}.json`;
}

function generateFilePath(
	code: TBackupFileRecord['code'],
	fileName?: TBackupFileRecord['file_name']
) {
	return join(dir, getBackupFileName(code, fileName ?? null));
}

export function checkBackupFileNotFoundError(error: unknown) {
	return (error as NodeJS.ErrnoException | null)?.code === 'ENOENT';
}

export async function deleteFile(
	code: TBackupFileRecord['code'],
	fileName?: TBackupFileRecord['file_name']
) {
	const filePath = generateFilePath(code, fileName);

	await unlink(filePath);
}

export async function getFile(
	code: TBackupFileRecord['code'],
	fileName?: TBackupFileRecord['file_name']
) {
	const filePath = generateFilePath(code, fileName);

	return await readFile(filePath, encoding);
}

export async function getFileSize(
	code: TBackupFileRecord['code'],
	fileName?: TBackupFileRecord['file_name']
) {
	const filePath = generateFilePath(code, fileName);
	const fileStat = await stat(filePath);

	return fileStat.size;
}

export async function getFileIdentity(
	code: TBackupFileRecord['code'],
	fileName?: TBackupFileRecord['file_name']
) {
	const filePath = generateFilePath(code, fileName);
	const fileStat = await stat(filePath, { bigint: true });

	return formatFileIdentity(fileStat);
}

export async function getBackupFiles() {
	try {
		const entries = await readdir(dir, { withFileTypes: true });
		return entries
			.filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
			.map((entry) => parseBackupFileName(entry.name))
			.filter((file): file is IBackupFileReference => file !== null);
	} catch (error) {
		if (checkBackupFileNotFoundError(error)) {
			return [];
		}

		throw error;
	}
}

export async function getBackupFileCodes() {
	const backupFiles = await getBackupFiles();

	return backupFiles.map((file) => file.code);
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

		for (const entry of entries) {
			if (!entry.isFile() || !checkTemporaryBackupFileName(entry.name)) {
				continue;
			}

			let fileStat;
			try {
				fileStat = await stat(join(dir, entry.name));
			} catch (error) {
				if (checkBackupFileNotFoundError(error)) {
					continue;
				}

				throw error;
			}

			if (fileStat.mtimeMs < expiredBefore) {
				fileNames.push(entry.name);
			}
		}

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
	const fileName = createBackupFileName(code);
	const filePath = generateFilePath(code, fileName);
	const tempFilePath = join(dir, `${code}.${randomUUID()}.tmp`);

	try {
		await writeFile(tempFilePath, content, encoding);
		const fileIdentity = formatFileIdentity(
			await stat(tempFilePath, { bigint: true })
		);
		await rename(tempFilePath, filePath);
		return { fileName, identity: fileIdentity };
	} catch (error) {
		try {
			await unlink(tempFilePath);
		} catch (cleanupError) {
			if (!checkBackupFileNotFoundError(cleanupError)) {
				const errCode =
					cleanupError !== null && typeof cleanupError === 'object'
						? ((cleanupError as NodeJS.ErrnoException).code ??
							'unknown')
						: 'unknown';
				console.warn('Failed to clean up temporary backup file.', {
					errorCode: errCode,
				});
			}
		}

		throw error;
	}
}
