import {access, mkdir, readFile, unlink, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {cwd} from 'node:process';

import type {IBackupFileRecord} from '@/lib/types';

const dir = join(cwd(), 'upload/backups');

function generateFilePath(code: IBackupFileRecord['code']) {
	return join(dir, `${code}.json`);
}

export async function deleteFile(code: IBackupFileRecord['code']) {
	const filePath = generateFilePath(code);

	try {
		await unlink(filePath);
	} catch {
		/* empty */
	}
}

export async function getFile(code: IBackupFileRecord['code']) {
	const filePath = generateFilePath(code);

	try {
		return await readFile(filePath, 'utf8');
	} catch {
		return null;
	}
}

export async function saveFile(code: IBackupFileRecord['code'], content: string) {
	try {
		await access(dir);
	} catch {
		await mkdir(dir, {
			recursive: true,
		});
	}

	const filePath = generateFilePath(code);

	await writeFile(filePath, content, 'utf8');
}
