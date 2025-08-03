import { access, mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cwd } from 'node:process';

import type { TBackupFileRecord } from '@/lib/db/types';

const dir = join(cwd(), 'upload/backups');
const encoding = 'utf8';

function generateFilePath(code: TBackupFileRecord['code']) {
	return join(dir, `${code}.json`);
}

export async function deleteFile(code: TBackupFileRecord['code']) {
	const filePath = generateFilePath(code);

	await unlink(filePath);
}

export async function getFile(code: TBackupFileRecord['code']) {
	const filePath = generateFilePath(code);

	return await readFile(filePath, encoding);
}

export async function saveFile(
	code: TBackupFileRecord['code'],
	content: string
) {
	try {
		await access(dir);
	} catch {
		await mkdir(dir, { recursive: true });
	}

	const filePath = generateFilePath(code);

	await writeFile(filePath, content, encoding);
}
