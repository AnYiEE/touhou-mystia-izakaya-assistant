import { type NextRequest } from 'next/server';
import { env } from 'node:process';

import {
	checkBackupCodeLockLostError,
	checkBackupFileNotFoundError,
	deleteExpiredBackupImportRecords,
	deleteFile,
	deleteRecord,
	deleteTemporaryBackupFile,
	getBackupFileCodes,
	getExpiredRecords,
	getExpiredTemporaryBackupFileNames,
	getRecord,
	getRecordCodes,
	markBackupCodeLockCommitted,
	throwIfBackupCodeLockLost,
	withBackupCodeLock,
} from '@/actions/backup';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	handleOptionsRequest,
} from '@/api/v1/utils';
import { getLogSafeErrorCode, maskBackupCode } from '../../utils';

function isExpiredBackupRecord(
	record: { created_at: number; last_accessed: number },
	expiredBefore: number
) {
	const expirationBase =
		record.last_accessed < 0 ? record.created_at : record.last_accessed;

	return expirationBase < expiredBefore;
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

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ secret: string }> }
) {
	const { secret } = await params;

	if (secret !== env.CLEANUP_SECRET) {
		return createNoStoreErrorResponse('Invalid secret', 401);
	}

	const now = Date.now();
	const oneHourAgo = now - 60 * 60 * 1000;
	const sixMonthsAgo = now - 181 * 24 * 60 * 60 * 1000;

	const records = await getExpiredRecords(sixMonthsAgo);
	const recordCodeSet = new Set(await getRecordCodes());
	const backupFileCodes = await getBackupFileCodes();
	const temporaryFileNames =
		await getExpiredTemporaryBackupFileNames(oneHourAgo);
	const orphanCodes = backupFileCodes.filter(
		(code) => !recordCodeSet.has(code)
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

				try {
					throwIfBackupCodeLockLost(signal);
					markBackupCodeLockCommitted(signal);
					await deleteFile(code);
					deletedFileCount++;
				} catch (error) {
					if (checkBackupCodeLockLostError(error)) {
						throw error;
					}
					if (!checkBackupFileNotFoundError(error)) {
						failedFileCount++;
						console.warn('Failed to delete expired backup file', {
							codeHash: maskBackupCode(code),
							errorCode: getLogSafeErrorCode(error),
						});
						return;
					}
				}

				try {
					throwIfBackupCodeLockLost(signal);
					await deleteRecord(code);
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
				}
			});
		});
		await runWithConcurrencyLimit(orphanCodes, 8, async (code) => {
			await withBackupCodeLock(code, async (signal) => {
				const record = await getRecord(code);
				throwIfBackupCodeLockLost(signal);

				if (record.status !== 404) {
					return;
				}

				try {
					throwIfBackupCodeLockLost(signal);
					markBackupCodeLockCommitted(signal);
					await deleteFile(code);
					orphanDeletedCount++;
				} catch (error) {
					if (checkBackupCodeLockLostError(error)) {
						throw error;
					}

					failedFileCount++;
					console.warn('Failed to delete orphan backup file', {
						codeHash: maskBackupCode(code),
						errorCode: getLogSafeErrorCode(error),
					});
				}
			});
		});
	} catch (error) {
		if (checkBackupCodeLockLostError(error)) {
			return createNoStoreErrorResponse('backup-code-lock-lost', 409);
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
		orphanFoundCount: orphanCodes.length,
		temporaryDeletedCount,
		temporaryFoundCount: temporaryFileNames.length,
	});
}

export function OPTIONS() {
	return handleOptionsRequest();
}
