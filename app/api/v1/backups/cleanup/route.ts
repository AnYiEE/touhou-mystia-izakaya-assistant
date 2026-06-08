import { type NextRequest } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from 'node:process';

import {
	checkBackupCodeLockLostError,
	checkBackupCodeLockTimeoutError,
	checkBackupFileNotFoundError,
	deleteExpiredBackupImportRecords,
	deleteFile,
	deleteRecord,
	deleteTemporaryBackupFile,
	getBackupFileName,
	getBackupFiles,
	getExpiredRecords,
	getExpiredTemporaryBackupFileNames,
	getRecord,
	getRecordFileReferences,
	markBackupCodeLockCommitted,
	throwIfBackupCodeLockLost,
	withBackupCodeLock,
	withFreshBackupCodeLock,
} from '@/actions/backup';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	handleOptionsRequest,
} from '@/api/v1/utils';
import { getLogSafeErrorCode, maskBackupCode } from '../utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isExpiredBackupRecord(
	record: { created_at: number; last_accessed: number },
	expiredBefore: number
) {
	const expirationBase =
		record.last_accessed < 0 ? record.created_at : record.last_accessed;

	return expirationBase < expiredBefore;
}

function getSafeRecordFileName(record: {
	code: string;
	file_name: string | null;
}) {
	try {
		return getBackupFileName(record.code, record.file_name);
	} catch (error) {
		console.warn('Invalid backup record file name during cleanup', {
			codeHash: maskBackupCode(record.code),
			errorCode: getLogSafeErrorCode(error),
		});

		return null;
	}
}

function createSecretDigest(secret: string) {
	return createHash('sha256').update(secret).digest();
}

function checkCleanupSecret(secret: string | null, configuredSecret: string) {
	return (
		secret !== null &&
		timingSafeEqual(
			createSecretDigest(secret),
			createSecretDigest(configuredSecret)
		)
	);
}

async function runWithConcurrencyLimit<T>(
	items: T[],
	limit: number,
	worker: (item: T) => Promise<void>
) {
	const iterator = items[Symbol.iterator]();
	const workerCount = Math.min(limit, items.length);
	const fatalErrorRef: { value: Error | null } = { value: null };

	await Promise.all(
		Array.from({ length: workerCount }, async () => {
			for (;;) {
				if (fatalErrorRef.value !== null) {
					return;
				}

				const next = iterator.next();
				if (next.done === true) {
					return;
				}

				try {
					await worker(next.value);
				} catch (error) {
					fatalErrorRef.value ??=
						error instanceof Error
							? error
							: new Error('backup-cleanup-failed');
					return;
				}
			}
		})
	);

	if (fatalErrorRef.value !== null) {
		throw fatalErrorRef.value;
	}
}

export async function DELETE(request: NextRequest) {
	const secret = request.headers.get('x-cleanup-secret');
	const configuredSecret = env.CLEANUP_SECRET;

	if (typeof configuredSecret !== 'string' || configuredSecret.length === 0) {
		return createNoStoreErrorResponse('server-misconfigured', 500);
	}

	if (!checkCleanupSecret(secret, configuredSecret)) {
		return createNoStoreErrorResponse('Invalid secret', 401);
	}

	const now = Date.now();
	const oneHourAgo = now - 60 * 60 * 1000;
	const sixMonthsAgo = now - 181 * 24 * 60 * 60 * 1000;

	const records = await getExpiredRecords(sixMonthsAgo);
	const recordFileReferences = await getRecordFileReferences();
	const invalidRecordCodeSet = new Set<string>();
	const recordFileNameSet = new Set<string>();
	for (const record of recordFileReferences) {
		const fileName = getSafeRecordFileName(record);
		if (fileName === null) {
			invalidRecordCodeSet.add(record.code);
			continue;
		}

		recordFileNameSet.add(fileName);
	}
	const backupFiles = await getBackupFiles();
	const temporaryFileNames =
		await getExpiredTemporaryBackupFileNames(oneHourAgo);
	const orphanFiles = backupFiles.filter(
		(file) => !recordFileNameSet.has(file.fileName)
	);

	let deletedFileCount = 0;
	let deletedImportRecordCount = 0;
	let deletedRecordCount = 0;
	let failedFileCount = 0;
	let failedRecordCount = 0;
	let orphanDeletedCount = 0;
	let temporaryDeletedCount = 0;

	try {
		deletedImportRecordCount =
			await deleteExpiredBackupImportRecords(sixMonthsAgo);
		await runWithConcurrencyLimit(
			temporaryFileNames,
			8,
			async (fileName) => {
				try {
					await deleteTemporaryBackupFile(fileName);
					temporaryDeletedCount++;
				} catch (error) {
					if (checkBackupFileNotFoundError(error)) {
						return;
					}

					failedFileCount++;
					console.warn('Failed to delete temporary backup file', {
						codeHash: maskBackupCode(fileName.split('.')[0] ?? ''),
						errorCode: getLogSafeErrorCode(error),
					});
				}
			}
		);
		await runWithConcurrencyLimit(records, 8, async ({ code }) => {
			await withBackupCodeLock(code, async (signal) => {
				const record = await getRecord(code);
				throwIfBackupCodeLockLost(signal);

				if (
					record.status === 404 ||
					!isExpiredBackupRecord(record, sixMonthsAgo)
				) {
					return;
				}

				const fileName = getSafeRecordFileName(record);

				try {
					await withFreshBackupCodeLock(signal, async (trx) => {
						const deleteResult = await deleteRecord(code, trx);
						if (deleteResult.status !== 200) {
							throw new Error('Failed to delete record');
						}
					});
					markBackupCodeLockCommitted(signal);
					deletedRecordCount++;
				} catch (error) {
					if (checkBackupCodeLockLostError(error)) {
						throw error;
					}

					failedRecordCount++;
					console.warn('Failed to delete expired backup record', {
						codeHash: maskBackupCode(code),
						errorCode: getLogSafeErrorCode(error),
					});
					return;
				}

				if (fileName === null) {
					failedFileCount++;
					return;
				}

				try {
					await deleteFile(code, fileName);
					deletedFileCount++;
				} catch (error) {
					if (!checkBackupFileNotFoundError(error)) {
						failedFileCount++;
						console.warn('Failed to delete expired backup file', {
							codeHash: maskBackupCode(code),
							errorCode: getLogSafeErrorCode(error),
						});
					}
				}
			});
		});
		await runWithConcurrencyLimit(orphanFiles, 8, async (file) => {
			await withBackupCodeLock(file.code, async (signal) => {
				if (invalidRecordCodeSet.has(file.code)) {
					failedFileCount++;
					console.warn(
						'Skipped orphan backup file cleanup because an invalid record file name existed when cleanup started.',
						{
							codeHash: maskBackupCode(file.code),
							fileName: file.fileName,
						}
					);
					return;
				}

				const record = await getRecord(file.code);
				throwIfBackupCodeLockLost(signal);

				const recordFileName =
					record.status === 404
						? null
						: getSafeRecordFileName(record);

				if (record.status !== 404 && recordFileName === null) {
					failedFileCount++;
					console.warn(
						'Skipped orphan backup file cleanup because the record file name is invalid.',
						{
							codeHash: maskBackupCode(file.code),
							fileName: file.fileName,
						}
					);
					return;
				}

				if (recordFileName === file.fileName) {
					return;
				}

				try {
					throwIfBackupCodeLockLost(signal);
					await deleteFile(file.code, file.fileName);
					throwIfBackupCodeLockLost(signal);
					markBackupCodeLockCommitted(signal);
					orphanDeletedCount++;
				} catch (error) {
					if (checkBackupCodeLockLostError(error)) {
						throw error;
					}
					if (checkBackupFileNotFoundError(error)) {
						markBackupCodeLockCommitted(signal);
						return;
					}

					failedFileCount++;
					console.warn('Failed to delete orphan backup file', {
						codeHash: maskBackupCode(file.code),
						errorCode: getLogSafeErrorCode(error),
					});
				}
			});
		});
	} catch (error) {
		if (checkBackupCodeLockLostError(error)) {
			return createNoStoreErrorResponse('backup-code-lock-lost', 409);
		}
		if (checkBackupCodeLockTimeoutError(error)) {
			return createNoStoreErrorResponse('backup-code-lock-timeout', 409);
		}

		throw error;
	}

	return createNoStoreJsonResponse({
		deletedFileCount,
		deletedImportRecordCount,
		deletedRecordCount,
		failedFileCount,
		failedRecordCount,
		orphanDeletedCount,
		orphanFoundCount: orphanFiles.length,
		temporaryDeletedCount,
		temporaryFoundCount: temporaryFileNames.length,
	});
}

export function OPTIONS() {
	return handleOptionsRequest();
}
