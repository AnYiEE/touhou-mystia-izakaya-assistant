import { type NextRequest } from 'next/server';
import { v7 as uuid, validate } from 'uuid';

import {
	checkBackupCodeLockLostError,
	checkBackupFileNotFoundError,
	checkIpFrequency,
	deleteFile,
	getFile,
	getFileIdentity,
	getRecord,
	saveFile,
	setRecord,
	throwIfBackupCodeLockLost,
	updateRecord,
	withBackupCodeLock,
} from '@/actions/backup';
import { readJsonBody } from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	handleOptionsRequest,
} from '@/api/v1/utils';
import { FILE_TYPE_JSON } from '@/utilities';
import { FREQUENCY_TTL, MAX_DATA_SIZE } from './constants';
import type { IBackupUploadBody, IBackupUploadSuccessResponse } from './types';
import { getRequestMeta, maskBackupCode } from './utils';

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function restoreBackupFile({
	code,
	hadPreviousFile,
	maskedCode,
	previousFileContent,
}: {
	code: string;
	hadPreviousFile: boolean;
	maskedCode: string;
	previousFileContent: string | null;
}) {
	try {
		await (hadPreviousFile && previousFileContent !== null
			? saveFile(code, previousFileContent)
			: deleteFile(code));
	} catch (restoreError) {
		if (!checkBackupFileNotFoundError(restoreError)) {
			console.warn('Failed to restore backup file', {
				code: maskedCode,
				error: restoreError,
			});
		}
	}
}

export async function POST(request: NextRequest) {
	const { contentType, ip, ua } = getRequestMeta(request);

	if (contentType !== FILE_TYPE_JSON) {
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
		(typeof rawUserId !== 'string' && rawUserId !== null)
	) {
		return createNoStoreErrorResponse('Invalid object structure', 400);
	}

	let code = uuid();
	if ('code' in json && typeof json.code === 'string') {
		const normalizedCode = json.code.trim();
		const isValid = validate(normalizedCode);
		if (isValid) {
			code = normalizedCode;
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
		return createNoStoreErrorResponse('Requests are too frequent', 429);
	}

	try {
		return await withBackupCodeLock(code, async (signal) => {
			const maskedCode = maskBackupCode(code);
			const record = await getRecord(code);
			throwIfBackupCodeLockLost(signal);

			let previousFileContent: string | null = null;
			let hadPreviousFile = false;

			if (record.status !== 404) {
				try {
					previousFileContent = await getFile(code);
					throwIfBackupCodeLockLost(signal);
					hadPreviousFile = true;
				} catch (error) {
					if (
						error instanceof Error &&
						error.message === 'backup-code-lock-lost'
					) {
						return createNoStoreErrorResponse(
							'backup-code-lock-lost',
							409
						);
					}

					if (!checkBackupFileNotFoundError(error)) {
						return createNoStoreErrorResponse(
							'Failed to read file',
							500
						);
					}
				}
			}

			let writtenFileIdentity: string;
			try {
				throwIfBackupCodeLockLost(signal);
				await saveFile(code, jsonString);
				throwIfBackupCodeLockLost(signal);
			} catch (error) {
				if (
					error instanceof Error &&
					error.message === 'backup-code-lock-lost'
				) {
					return createNoStoreErrorResponse(
						'backup-code-lock-lost',
						409
					);
				}

				return createNoStoreErrorResponse('Failed to save file', 500);
			}

			try {
				writtenFileIdentity = await getFileIdentity(code);
				throwIfBackupCodeLockLost(signal);
			} catch (error) {
				if (
					error instanceof Error &&
					error.message === 'backup-code-lock-lost'
				) {
					return createNoStoreErrorResponse(
						'backup-code-lock-lost',
						409
					);
				}

				await restoreBackupFile({
					code,
					hadPreviousFile,
					maskedCode,
					previousFileContent,
				});
				console.warn('Failed to identify backup file', {
					code: maskedCode,
					error,
				});

				return createNoStoreErrorResponse('Failed to save file', 500);
			}

			try {
				throwIfBackupCodeLockLost(signal);
				const nextRecord = await (record.status === 404
					? setRecord({
							code,
							created_at: now,
							ip_address: ip,
							last_accessed: -1,
							user_agent: ua,
							user_id: userId,
						})
					: updateRecord(code, {
							created_at: now,
							ip_address: ip,
							last_accessed: -1,
							user_agent: ua,
							user_id: userId,
						}));

				if (nextRecord.status !== 200) {
					throw new Error('Failed to save record');
				}
				throwIfBackupCodeLockLost(signal);
			} catch (error) {
				if (
					error instanceof Error &&
					error.message === 'backup-code-lock-lost'
				) {
					return createNoStoreErrorResponse(
						'backup-code-lock-lost',
						409
					);
				}

				try {
					const currentFileIdentity = await getFileIdentity(code);
					if (currentFileIdentity === writtenFileIdentity) {
						await (hadPreviousFile && previousFileContent !== null
							? saveFile(code, previousFileContent)
							: deleteFile(code));
					}
				} catch (restoreError) {
					if (!checkBackupFileNotFoundError(restoreError)) {
						console.warn('Failed to restore backup file', {
							code: maskedCode,
							error: restoreError,
						});
					}
				}

				console.warn('Failed to save backup record', {
					code: maskedCode,
					error,
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

		throw error;
	}
}

export function OPTIONS() {
	return handleOptionsRequest();
}
