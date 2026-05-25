import { type NextRequest, NextResponse } from 'next/server';
import { validate } from 'uuid';

import {
	checkBackupCodeLockLostError,
	checkBackupCodeLockTimeoutError,
	checkBackupFileNotFoundError,
	checkIpFrequency,
	deleteFile,
	deleteRecord,
	getFile,
	getRecord,
	markBackupCodeLockCommitted,
	throwIfBackupCodeLockLost,
	updateRecordTimeout,
	withBackupCodeLock,
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
	const code = rawCode.trim();
	if (!validate(code)) {
		return createNoStoreErrorResponse('Invalid code', 400);
	}

	const { ip, ua } = getRequestMeta(request);
	if (ip === null) {
		return createNoStoreErrorResponse('Invalid IP address', 400);
	}
	if (ua === null) {
		return createNoStoreErrorResponse('Invalid user agent', 400);
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
			const { status } = await getRecord(code);
			throwIfBackupCodeLockLost(signal);

			if (status === 404) {
				return createNoStoreErrorResponse(
					'The file record does not exist or has been deleted',
					404
				);
			}

			await updateRecordTimeout(code, now);
			throwIfBackupCodeLockLost(signal);

			let fileContent: string;
			try {
				fileContent = await getFile(code);
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
	const code = rawCode.trim();
	if (!validate(code)) {
		return createNoStoreErrorResponse('Invalid code', 400);
	}

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

			let deletedFile = true;
			try {
				throwIfBackupCodeLockLost(signal);
				await deleteRecord(code);
				throwIfBackupCodeLockLost(signal);
				await deleteFile(code);
				throwIfBackupCodeLockLost(signal);
			} catch (error) {
				if (checkBackupCodeLockLostError(error)) {
					return createNoStoreErrorResponse(
						'backup-code-lock-lost',
						409
					);
				}
				throwIfBackupCodeLockLost(signal);

				if (!checkBackupFileNotFoundError(error)) {
					console.warn('Failed to delete backup file', {
						codeHash: maskBackupCode(code),
						errorCode: getLogSafeErrorCode(error),
					});

					return createNoStoreErrorResponse(
						'Failed to delete file',
						500
					);
				}

				deletedFile = false;
			}

			markBackupCodeLockCommitted(signal);

			return createNoStoreJsonResponse({
				deletedFile,
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
