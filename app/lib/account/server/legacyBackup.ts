import { v7 as uuid, validate } from 'uuid';

import {
	checkBackupCodeLockLostError,
	checkBackupCodeLockTimeoutError,
	checkBackupFileNotFoundError,
	checkIpFrequency,
	deleteBackupImportRecordByCode,
	deleteFile,
	deleteRecord,
	getFile,
	getRecord,
	markBackupCodeLockCommitted,
	saveFile,
	setRecord,
	throwIfBackupCodeLockLost,
	updateRecord,
	updateRecordTimeout,
	withBackupCodeLock,
	withFreshBackupCodeLock,
} from '@/actions/backup';
import {
	type IBackupCheckSuccessResponse,
	type IBackupUploadBody,
	type IBackupUploadSuccessResponse,
	LEGACY_BACKUP_FREQUENCY_TTL,
	type TLegacyBackupResult,
	createLegacyBackupErrorResult,
} from '@/lib/account/legacyBackup/shared';
import { maskBackupCode } from '@/lib/account/server/backupCode';
import { isPlainObject } from '@/lib/account/sync/serializers/utils';
import { MAX_BACKUP_DATA_BYTES } from '@/lib/account/shared/requestLimits';
import { getLogSafeErrorCode } from '@/lib/logging';

export interface ILegacyBackupRequestMeta {
	contentType?: string | null;
	ip: string | null;
	ua?: string | null;
}

export type TLegacyBackupDownloadResult =
	| { content: string; status: 'ok' }
	| Extract<TLegacyBackupResult, { status: 'error' }>;

function createLegacyBackupServerError(message: string, status: number) {
	return createLegacyBackupErrorResult(message, status);
}

function normalizeMediaType(contentType: string | null | undefined) {
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

function createBackupCode(rawCode: unknown) {
	let code = uuid();
	if (typeof rawCode !== 'string') {
		return { code, status: 'ok' as const };
	}

	const normalizedCode = rawCode.trim();
	if (validate(normalizedCode)) {
		code = normalizedCode.toLowerCase();
		return { code, status: 'ok' as const };
	}
	if (normalizedCode === 'null') {
		return { code, status: 'ok' as const };
	}

	return createLegacyBackupServerError('Invalid code', 400);
}

function normalizeBackupUserId(rawUserId: unknown) {
	let userId = typeof rawUserId === 'string' ? rawUserId : '';
	if (userId === 'null') {
		userId = '';
	}

	return userId;
}

export function parseLegacyBackupCode(rawCode: string) {
	const normalizedCode = rawCode.trim();
	if (!validate(normalizedCode)) {
		return null;
	}

	return normalizedCode.toLowerCase();
}

export async function uploadLegacyBackupData({
	body,
	meta,
}: {
	body: Partial<IBackupUploadBody> | null;
	meta: ILegacyBackupRequestMeta;
}): Promise<TLegacyBackupResult<IBackupUploadSuccessResponse>> {
	const { contentType, ip, ua } = meta;

	if (normalizeMediaType(contentType) !== 'application/json') {
		return createLegacyBackupServerError('Invalid content type', 400);
	}
	if (ip === null) {
		return createLegacyBackupServerError('Invalid IP address', 400);
	}
	if (ua === null || ua === undefined) {
		return createLegacyBackupServerError('Invalid user agent', 400);
	}

	const backupData = isPlainObject(body) ? body.data : null;
	const rawUserId = isPlainObject(body) ? body.user_id : null;
	if (
		!isPlainObject(body) ||
		!isPlainObject(backupData) ||
		!('customer_normal' in backupData) ||
		!('customer_rare' in backupData) ||
		!isPlainObject(backupData.customer_normal) ||
		!isPlainObject(backupData.customer_rare) ||
		!('user_id' in body) ||
		(typeof rawUserId !== 'string' && rawUserId !== null) ||
		('code' in body && body.code !== null && typeof body.code !== 'string')
	) {
		return createLegacyBackupServerError('Invalid object structure', 400);
	}

	const codeResult = createBackupCode(body.code);
	if (codeResult.status === 'error') {
		return codeResult;
	}
	const { code } = codeResult;

	const jsonString = JSON.stringify(backupData);
	if (new Blob([jsonString]).size > MAX_BACKUP_DATA_BYTES) {
		return createLegacyBackupServerError('The data is too large', 413);
	}

	const userId = normalizeBackupUserId(rawUserId);
	const now = Date.now();
	const recentRecord = await checkIpFrequency(
		'created_at',
		now - LEGACY_BACKUP_FREQUENCY_TTL,
		{ ip, ua, userId }
	);
	if (recentRecord.status === 429) {
		return createLegacyBackupServerError('Requests are too frequent', 429);
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
				return createLegacyBackupServerError(
					'Failed to save file',
					500
				);
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
					return createLegacyBackupServerError(
						'backup-code-lock-lost',
						409
					);
				}

				console.warn('Failed to save backup record', {
					codeHash,
					errorCode: getLogSafeErrorCode(error),
				});

				return createLegacyBackupServerError(
					'Failed to save record',
					500
				);
			}

			if (
				oldFileName !== undefined &&
				oldFileName !== savedFile.fileName
			) {
				await cleanupSavedBackupFile(code, oldFileName, codeHash);
			}

			return { data: { code }, status: 'ok' };
		});
	} catch (error) {
		if (checkBackupCodeLockLostError(error)) {
			return createLegacyBackupServerError('backup-code-lock-lost', 409);
		}
		if (checkBackupCodeLockTimeoutError(error)) {
			return createLegacyBackupServerError(
				'backup-code-lock-timeout',
				409
			);
		}

		throw error;
	}
}

export async function fetchLegacyBackupMetadata(
	code: string
): Promise<TLegacyBackupResult<IBackupCheckSuccessResponse>> {
	const record = await getRecord(code);
	if (record.status === 404) {
		return createLegacyBackupServerError(
			'The file record does not exist or has been deleted',
			404
		);
	}

	const { created_at, last_accessed } = record;

	return { data: { created_at, last_accessed }, status: 'ok' };
}

export async function downloadLegacyBackupData({
	code,
	ip,
}: {
	code: string;
	ip: string | null;
}): Promise<TLegacyBackupDownloadResult> {
	if (ip === null) {
		return createLegacyBackupServerError('Invalid IP address', 400);
	}

	const now = Date.now();
	const recentRecord = await checkIpFrequency(
		'last_accessed',
		now - LEGACY_BACKUP_FREQUENCY_TTL,
		{ ip }
	);
	if (recentRecord.status === 429) {
		return createLegacyBackupServerError('Requests are too frequent', 429);
	}

	try {
		return await withBackupCodeLock(code, async (signal) => {
			const record = await getRecord(code);
			throwIfBackupCodeLockLost(signal);

			if (record.status === 404) {
				return createLegacyBackupServerError(
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
					return createLegacyBackupServerError(
						'backup-code-lock-lost',
						409
					);
				}
				if (checkBackupFileNotFoundError(error)) {
					return createLegacyBackupServerError(
						'The file does not exist or has been deleted',
						404
					);
				}

				console.warn('Failed to read backup file', {
					codeHash: maskBackupCode(code),
					errorCode: getLogSafeErrorCode(error),
				});
				return createLegacyBackupServerError(
					'Failed to read file',
					500
				);
			}

			const timeoutResult = await withFreshBackupCodeLock(
				signal,
				async (trx) => updateRecordTimeout(code, now, trx)
			);
			if (timeoutResult.status !== 200) {
				return createLegacyBackupServerError(
					'Failed to update record timeout',
					500
				);
			}

			return { content: fileContent, status: 'ok' };
		});
	} catch (error) {
		if (checkBackupCodeLockLostError(error)) {
			return createLegacyBackupServerError('backup-code-lock-lost', 409);
		}
		if (checkBackupCodeLockTimeoutError(error)) {
			return createLegacyBackupServerError(
				'backup-code-lock-timeout',
				409
			);
		}

		throw error;
	}
}

export async function deleteLegacyBackupData(
	code: string
): Promise<TLegacyBackupResult<{ deletedFile: boolean; message: string }>> {
	try {
		return await withBackupCodeLock(code, async (signal) => {
			const record = await getRecord(code);
			throwIfBackupCodeLockLost(signal);

			if (record.status === 404) {
				return createLegacyBackupServerError(
					'The file record does not exist or has been deleted',
					404
				);
			}

			let deletedFile = false;
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
					return createLegacyBackupServerError(
						'backup-code-lock-lost',
						409
					);
				}
				if (checkBackupCodeLockTimeoutError(error)) {
					return createLegacyBackupServerError(
						'backup-code-lock-timeout',
						409
					);
				}

				console.warn('Failed to delete backup record', {
					codeHash: maskBackupCode(code),
					errorCode: getLogSafeErrorCode(error),
				});

				return createLegacyBackupServerError(
					'Failed to delete record',
					500
				);
			}

			try {
				await deleteFile(code, record.file_name);
				deletedFile = true;
			} catch (error) {
				if (!checkBackupFileNotFoundError(error)) {
					console.warn('Failed to delete backup file', {
						codeHash: maskBackupCode(code),
						errorCode: getLogSafeErrorCode(error),
					});
				}
			}

			return {
				data: {
					deletedFile,
					message: 'The file record has been deleted',
				},
				status: 'ok',
			};
		});
	} catch (error) {
		if (checkBackupCodeLockLostError(error)) {
			return createLegacyBackupServerError('backup-code-lock-lost', 409);
		}
		if (checkBackupCodeLockTimeoutError(error)) {
			return createLegacyBackupServerError(
				'backup-code-lock-timeout',
				409
			);
		}

		throw error;
	}
}
