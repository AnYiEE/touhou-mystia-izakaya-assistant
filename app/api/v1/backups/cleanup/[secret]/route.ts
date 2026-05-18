import { type NextRequest } from 'next/server';
import { env } from 'node:process';

import {
	deleteFile,
	deleteRecord,
	getBackupFileCodes,
	getExpiredRecords,
	getRecord,
	getRecordCodes,
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

	await runWithConcurrencyLimit(records, 8, async ({ code }) => {
		await withBackupCodeLock(code, async () => {
			const record = await getRecord(code);
			if (
				record.status === 404 ||
				!isExpiredBackupRecord(record, sixMonthsAgo)
			) {
				return;
			}

			try {
				await deleteFile(code);
				deletedFileCount++;
			} catch (error) {
				failedFileCount++;
				console.warn('Failed to delete expired backup file', {
					code: maskBackupCode(code),
					error,
				});
			}

			try {
				await deleteRecord(code);
				deletedRecordCount++;
			} catch (error) {
				failedRecordCount++;
				console.warn('Failed to delete expired backup record', {
					code: maskBackupCode(code),
					error,
				});
			}
		});
	});
	await runWithConcurrencyLimit(orphanCodes, 8, async (code) => {
		await withBackupCodeLock(code, async () => {
			const record = await getRecord(code);
			if (record.status !== 404) {
				return;
			}

			try {
				await deleteFile(code);
				orphanDeletedCount++;
			} catch (error) {
				failedFileCount++;
				console.warn('Failed to delete orphan backup file', {
					code: maskBackupCode(code),
					error,
				});
			}
		});
	});

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
