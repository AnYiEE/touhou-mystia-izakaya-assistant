import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { access, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { getConfiguredSqliteDatabasePath } from '@/infrastructure/database/config';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

export async function checkSqliteDirectoryWritable(
	databasePath = process.env.SQLITE_DATABASE_PATH
) {
	const sqlitePath = getConfiguredSqliteDatabasePath(databasePath);
	const directory = dirname(sqlitePath);
	const probePath = resolve(directory, `.sqlite-write-probe-${randomUUID()}`);

	await access(directory, constants.R_OK | constants.W_OK);
	try {
		const sqliteStat = await stat(sqlitePath);
		if (!sqliteStat.isFile()) {
			throw new Error('sqlite-database-path-is-not-file');
		}
		await access(sqlitePath, constants.R_OK | constants.W_OK);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
			throw error;
		}
	}
	await writeFile(probePath, 'ok');
	try {
		await rm(probePath);
	} catch (error) {
		console.warn('SQLite write probe cleanup failed.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}
}
