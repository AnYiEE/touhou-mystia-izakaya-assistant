import { type NextRequest } from 'next/server';
import { v7 as uuid, validate } from 'uuid';

import {
	checkBackupCodeLockLostError,
	checkBackupCodeLockTimeoutError,
	checkBackupFileNotFoundError,
	checkIpFrequency,
	deleteBackupImportRecordByCode,
	deleteFile,
	getRecord,
	markBackupCodeLockCommitted,
	saveFile,
	setRecord,
	throwIfBackupCodeLockLost,
	updateRecord,
	withBackupCodeLock,
	withFreshBackupCodeLock,
} from '@/actions/backup';
import {
	createRetryAfterHeaders,
	readJsonBodyResult,
} from '@/api/v1/accountRouteUtils';
import { FREQUENCY_TTL } from '@/api/v1/backups/constants';
import type {
	IBackupUploadBody,
	IBackupUploadSuccessResponse,
} from '@/api/v1/backups/types';
import {
	getLogSafeErrorCode,
	getRequestMeta,
	maskBackupCode,
} from '@/api/v1/backups/utils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	handleOptionsRequest,
} from '@/api/v1/utils';
import { isPlainObject } from '@/lib/account/sync/serializers/utils';
import {
	MAX_BACKUP_DATA_BYTES,
	MAX_BACKUP_UPLOAD_JSON_BODY_BYTES,
} from '@/lib/account/shared/requestLimits';
import { FILE_TYPE_JSON } from '@/utilities';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeMediaType(contentType: string | null) {
	return contentType?.split(';', 1).at(0)?.trim().toLowerCase() ?? null;
}

async function cleanupSavedBackupFile(
	code: string,
	fileName: Parameters<typeof deleteFile>[1],
	codeHash: string
) {
	try {
		await deleteFile(code, fileName);
	} catch (error) {
		if (!checkBackupFileNotFoundError(error)) {
			console.warn('Failed to clean up uncommitted backup file.', {
				codeHash,
				errorCode: getLogSafeErrorCode(error),
			});
		}
	}
}

export async function POST(request: NextRequest) {
	const requestMeta = getRequestMeta(request);
	const { contentType, ip, ua } = requestMeta;

	if (normalizeMediaType(contentType) !== FILE_TYPE_JSON) {
		return createNoStoreErrorResponse('Invalid content type', 400);
	}
	if (ip === null) {
		return createNoStoreErrorResponse('Invalid IP address', 400);
	}
	if (ua === null) {
		return createNoStoreErrorResponse('Invalid user agent', 400);
	}

	const jsonResult = await readJsonBodyResult<IBackupUploadBody>(
		request,
		MAX_BACKUP_UPLOAD_JSON_BODY_BYTES
	);
	if (jsonResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('The data is too large', 413);
	}
	const json = jsonResult.status === 'ok' ? jsonResult.data : null;
	const backupData = isPlainObject(json) ? json.data : null;
	const rawUserId = isPlainObject(json) ? json.user_id : null;
	if (
		!isPlainObject(json) ||
		!isPlainObject(backupData) ||
		!('customer_normal' in backupData) ||
		!('customer_rare' in backupData) ||
		!isPlainObject(backupData.customer_normal) ||
		!isPlainObject(backupData.customer_rare) ||
		!('user_id' in json) ||
		(typeof rawUserId !== 'string' && rawUserId !== null) ||
		('code' in json && json.code !== null && typeof json.code !== 'string')
	) {
		return createNoStoreErrorResponse('Invalid object structure', 400);
	}

	let code = uuid();
	if ('code' in json && typeof json.code === 'string') {
		const normalizedCode = json.code.trim();
		const isValid = validate(normalizedCode);
		if (isValid) {
			code = normalizedCode.toLowerCase();
		} else if (normalizedCode === 'null') {
			// Legacy clients may have persisted the literal string "null".
			// Keep treating it like a missing code so uploads can recover.
		} else {
			return createNoStoreErrorResponse('Invalid code', 400);
		}
	}

	const jsonString = JSON.stringify(backupData);
	if (new Blob([jsonString]).size > MAX_BACKUP_DATA_BYTES) {
		return createNoStoreErrorResponse('The data is too large', 413);
	}

	let userId = rawUserId ?? '';
	if (userId === 'null') {
		userId = '';
	}

	const now = Date.now();

	const recentRecord = await checkIpFrequency(
		'created_at',
		now - FREQUENCY_TTL,
		{ ip, ua, userId }
	);
	if (recentRecord.status === 429) {
		return createNoStoreErrorResponse(
			'Requests are too frequent',
			429,
			undefined,
			{ headers: createRetryAfterHeaders(FREQUENCY_TTL / 1000) }
		);
	}

	try {
		return await withBackupCodeLock(code, async (signal) => {
			const codeHash = maskBackupCode(code);
			const record = await getRecord(code);
			throwIfBackupCodeLockLost(signal);
			const oldFileName =
				record.status === 200 ? record.file_name : undefined;

			let savedFile: Awaited<ReturnType<typeof saveFile>>;
			try {
				savedFile = await saveFile(code, jsonString);
			} catch {
				return createNoStoreErrorResponse('Failed to save file', 500);
			}

			try {
				await withFreshBackupCodeLock(signal, async (trx) => {
					const nextRecord = await (record.status === 404
						? setRecord(
								{
									code,
									created_at: now,
									file_name: savedFile.fileName,
									ip_address: ip,
									last_accessed: -1,
									user_agent: ua,
									user_id: userId,
								},
								trx
							)
						: updateRecord(
								code,
								{
									created_at: now,
									file_name: savedFile.fileName,
									ip_address: ip,
									last_accessed: -1,
									user_agent: ua,
									user_id: userId,
								},
								trx
							));

					if (nextRecord.status !== 200) {
						throw new Error('Failed to save record');
					}

					await deleteBackupImportRecordByCode(code, trx);
				});
				markBackupCodeLockCommitted(signal);
			} catch (error) {
				if (!signal.committed) {
					await cleanupSavedBackupFile(
						code,
						savedFile.fileName,
						codeHash
					);
				}

				if (checkBackupCodeLockLostError(error)) {
					return createNoStoreErrorResponse(
						'backup-code-lock-lost',
						409
					);
				}

				console.warn('Failed to save backup record', {
					codeHash,
					errorCode: getLogSafeErrorCode(error),
				});

				return createNoStoreErrorResponse('Failed to save record', 500);
			}

			if (
				oldFileName !== undefined &&
				oldFileName !== savedFile.fileName
			) {
				await cleanupSavedBackupFile(code, oldFileName, codeHash);
			}

			return createNoStoreJsonResponse({
				code,
			} satisfies IBackupUploadSuccessResponse);
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
