import { type NextRequest } from 'next/server';
import { env } from 'node:process';

import {
	checkBackupCodeLockLostError,
	deleteFile,
	deleteRecord,
	getBackupFileCodes,
	getExpiredRecords,
	getRecord,
	getRecordCodes,
	throwIfBackupCodeLockLost,
	withBackupCodeLock,
} from '@/actions/backup';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	handleOptionsRequest,
} from '@/api/v1/utils';
import { maskBackupCode } from '../../utils';

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

	await Promise.all(
		Array.from({ length: workerCount }, async () => {
			for (;;) {
				const next = iterator.next();
				if (next.done === true) {
					return;
				}

				await worker(next.value);
			}
		})
	);
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
	const sixMonthsAgo = now - 181 * 24 * 60 * 60 * 1000;

	const records = await getExpiredRecords(sixMonthsAgo);
	const recordCodeSet = new Set(await getRecordCodes());
	const backupFileCodes = await getBackupFileCodes();
	const orphanCodes = backupFileCodes.filter(
		(code) => !recordCodeSet.has(code)
	);

	let deletedFileCount = 0;
	let deletedRecordCount = 0;
	let failedFileCount = 0;
	let failedRecordCount = 0;
	let orphanDeletedCount = 0;

	try {
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
					await deleteFile(code);
					throwIfBackupCodeLockLost(signal);
					deletedFileCount++;
				} catch (error) {
					if (
						error instanceof Error &&
						error.message === 'backup-code-lock-lost'
					) {
						throw error;
					}

					failedFileCount++;
					console.warn('Failed to delete expired backup file', {
						code: maskBackupCode(code),
						error,
					});
				}

				try {
					throwIfBackupCodeLockLost(signal);
					await deleteRecord(code);
					throwIfBackupCodeLockLost(signal);
					deletedRecordCount++;
				} catch (error) {
					if (
						error instanceof Error &&
						error.message === 'backup-code-lock-lost'
					) {
						throw error;
					}

					failedRecordCount++;
					console.warn('Failed to delete expired backup record', {
						code: maskBackupCode(code),
						error,
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
					await deleteFile(code);
					throwIfBackupCodeLockLost(signal);
					orphanDeletedCount++;
				} catch (error) {
					if (
						error instanceof Error &&
						error.message === 'backup-code-lock-lost'
					) {
						throw error;
					}

					failedFileCount++;
					console.warn('Failed to delete orphan backup file', {
						code: maskBackupCode(code),
						error,
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
		deletedRecordCount,
		failedFileCount,
		failedRecordCount,
		orphanDeletedCount,
		orphanFoundCount: orphanCodes.length,
	});
}

export function OPTIONS() {
	return handleOptionsRequest();
}
