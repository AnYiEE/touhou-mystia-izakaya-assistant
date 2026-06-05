import { type NextRequest, NextResponse } from 'next/server';
import { validate } from 'uuid';

import {
	checkBackupCodeLockLostError,
	checkBackupCodeLockTimeoutError,
	checkBackupFileNotFoundError,
	checkIpFrequency,
	deleteRecord,
	getFile,
	getRecord,
	markBackupCodeLockCommitted,
	throwIfBackupCodeLockLost,
	updateRecordTimeout,
	withBackupCodeLock,
	withFreshBackupCodeLock,
} from '@/actions/backup';
import {
	NO_STORE_HEADERS,
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	handleOptionsRequest,
} from '@/api/v1/utils';
import { FILE_TYPE_JSON } from '@/utilities';
import { FREQUENCY_TTL } from '../constants';
import { getLogSafeErrorCode, getRequestMeta, maskBackupCode } from '../utils';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ code: string }> }
) {
	const { code: rawCode } = await params;
	const normalizedCode = rawCode.trim();
	if (!validate(normalizedCode)) {
		return createNoStoreErrorResponse('Invalid code', 400);
	}
	const code = normalizedCode.toLowerCase();

	const requestMeta = getRequestMeta(request);
	if (requestMeta === null) {
		return createNoStoreErrorResponse('server-misconfigured', 500);
	}
	const { ip } = requestMeta;
	if (ip === null) {
		return createNoStoreErrorResponse('Invalid IP address', 400);
	}

	const now = Date.now();

	const recentRecord = await checkIpFrequency(
		'last_accessed',
		now - FREQUENCY_TTL,
		{ ip }
	);
	if (recentRecord.status === 429) {
		return createNoStoreErrorResponse('Requests are too frequent', 429);
	}

	try {
		return await withBackupCodeLock(code, async (signal) => {
			const record = await getRecord(code);
			throwIfBackupCodeLockLost(signal);

			if (record.status === 404) {
				return createNoStoreErrorResponse(
					'The file record does not exist or has been deleted',
					404
				);
			}

			let fileContent: string;
			try {
				fileContent = await getFile(code, record.file_name);
				throwIfBackupCodeLockLost(signal);
			} catch (error) {
				if (checkBackupCodeLockLostError(error)) {
					return createNoStoreErrorResponse(
						'backup-code-lock-lost',
						409
					);
				}
				if (checkBackupFileNotFoundError(error)) {
					return createNoStoreErrorResponse(
						'The file does not exist or has been deleted',
						404
					);
				}

				console.warn('Failed to read backup file', {
					codeHash: maskBackupCode(code),
					errorCode: getLogSafeErrorCode(error),
				});
				return createNoStoreErrorResponse('Failed to read file', 500);
			}

			const timeoutResult = await withFreshBackupCodeLock(
				signal,
				async (trx) => updateRecordTimeout(code, now, trx)
			);
			if (timeoutResult.status !== 200) {
				return createNoStoreErrorResponse(
					'Failed to update record timeout',
					500
				);
			}

			return new NextResponse(fileContent, {
				headers: {
					...NO_STORE_HEADERS,
					'Content-Type': FILE_TYPE_JSON,
				},
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
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ code: string }> }
) {
	const { code: rawCode } = await params;
	const normalizedCode = rawCode.trim();
	if (!validate(normalizedCode)) {
		return createNoStoreErrorResponse('Invalid code', 400);
	}
	const code = normalizedCode.toLowerCase();

	try {
		return await withBackupCodeLock(code, async (signal) => {
			const { status } = await getRecord(code);
			throwIfBackupCodeLockLost(signal);

			if (status === 404) {
				return createNoStoreErrorResponse(
					'The file record does not exist or has been deleted',
					404
				);
			}

			try {
				await withFreshBackupCodeLock(signal, async (trx) => {
					const deleteResult = await deleteRecord(code, trx);
					if (deleteResult.status !== 200) {
						throw new Error('Failed to delete record');
					}
				});
				markBackupCodeLockCommitted(signal);
			} catch (error) {
				if (checkBackupCodeLockLostError(error)) {
					return createNoStoreErrorResponse(
						'backup-code-lock-lost',
						409
					);
				}
				if (checkBackupCodeLockTimeoutError(error)) {
					return createNoStoreErrorResponse(
						'backup-code-lock-timeout',
						409
					);
				}

				console.warn('Failed to delete backup record', {
					codeHash: maskBackupCode(code),
					errorCode: getLogSafeErrorCode(error),
				});

				return createNoStoreErrorResponse(
					'Failed to delete record',
					500
				);
			}

			return createNoStoreJsonResponse({
				deletedFile: false,
				message: 'The file record has been deleted',
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
}

export function OPTIONS() {
	return handleOptionsRequest();
}
