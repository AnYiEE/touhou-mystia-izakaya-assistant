import { type NextRequest } from 'next/server';
import { v7 as uuid, validate } from 'uuid';

import {
	checkBackupCodeLockLostError,
	checkBackupCodeLockTimeoutError,
	checkBackupFileNotFoundError,
	checkIpFrequency,
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
	readJsonBody,
} from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	handleOptionsRequest,
} from '@/api/v1/utils';
import { FILE_TYPE_JSON } from '@/utilities';
import { FREQUENCY_TTL, MAX_DATA_SIZE } from './constants';
import type { IBackupUploadBody, IBackupUploadSuccessResponse } from './types';
import { getLogSafeErrorCode, getRequestMeta, maskBackupCode } from './utils';

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeMediaType(contentType: string | null) {
	return contentType?.split(';', 1).at(0)?.trim().toLowerCase() ?? null;
}

async function cleanupSavedBackupFile(
	code: string,
	fileName: string,
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
	if (requestMeta === null) {
		return createNoStoreErrorResponse('server-misconfigured', 500);
	}
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

	const json = await readJsonBody<IBackupUploadBody>(
		request,
		MAX_DATA_SIZE + 64 * 1024
	);
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
		} else if (normalizedCode !== 'null') {
			return createNoStoreErrorResponse('Invalid code', 400);
		}
	}

	const jsonString = JSON.stringify(backupData);
	if (new Blob([jsonString]).size > MAX_DATA_SIZE) {
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
