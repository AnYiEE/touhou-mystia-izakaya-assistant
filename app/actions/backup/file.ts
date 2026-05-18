import {
	mkdir,
	readFile,
	readdir,
	stat,
	unlink,
	writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import { cwd } from 'node:process';

import type { TBackupFileRecord } from '@/lib/db/types';

const dir = join(cwd(), 'upload/backups');
const encoding: BufferEncoding = 'utf8';

function generateFilePath(code: TBackupFileRecord['code']) {
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
			.map((entry) => entry.name.slice(0, -'.json'.length));
	} catch (error) {
		if (checkBackupFileNotFoundError(error)) {
			return [];
		}

		throw error;
	}
}

export async function saveFile(
	code: TBackupFileRecord['code'],
	content: string
) {
	await mkdir(dir, { recursive: true });
	await writeFile(generateFilePath(code), content, encoding);
}
