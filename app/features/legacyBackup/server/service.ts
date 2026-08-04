import { v7 as uuid, validate } from 'uuid';

import { MAX_BACKUP_DATA_BYTES } from '@/features/account/requestLimits';
import { LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP } from '@/features/legacyBackup/apiResponseMessages';
import {
	type IBackupCheckSuccessResponse,
	type IBackupUploadBody,
	type IBackupUploadSuccessResponse,
	LEGACY_BACKUP_FREQUENCY_TTL,
	type TLegacyBackupResult,
	createLegacyBackupErrorResult,
} from '@/features/legacyBackup/contracts';

import {
	FILE_TYPE_JSON,
	normalizeMediaType,
} from '@/infrastructure/http/mediaTypes';
import { checkRateLimit } from '@/infrastructure/http/rateLimit/inMemory';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import { maskBackupCode } from './logging';
import {
	checkBackupFileNotFoundError,
	deleteFile,
	getFile,
	saveFile,
} from './persistence/backupFileRepository';

export interface ILegacyBackupRequestMeta {
	contentType?: string | null;
	ip: string | null;
	ua?: string | null;
}

export type TLegacyBackupDownloadResult =
	| { content: string; status: 'ok' }
	| Extract<TLegacyBackupResult, { status: 'error' }>;

const LEGACY_BACKUP_CODE_RATE_LIMIT_OPTIONS = {
	limit: 20,
	windowMs: LEGACY_BACKUP_FREQUENCY_TTL,
} as const;

type TBackupDbModule = typeof import('./persistence/backupRepository');
type TBackupLockModule = typeof import('./backupCodeLock');

let backupDbModulePromise: Promise<TBackupDbModule> | undefined;
let backupLockModulePromise: Promise<TBackupLockModule> | undefined;

function loadBackupDbModule() {
	backupDbModulePromise ??= import('./persistence/backupRepository');

	return backupDbModulePromise;
}

function loadBackupLockModule() {
	backupLockModulePromise ??= import('./backupCodeLock');

	return backupLockModulePromise;
}

function createLegacyBackupServerError(message: string, status: number) {
	return createLegacyBackupErrorResult(message, status);
}

function createLegacyBackupRateLimitError(retryAfter: number) {
	return createLegacyBackupErrorResult(
		LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.requestsTooFrequent,
		429,
		{ retry_after: retryAfter }
	);
}

function checkLegacyBackupCodeRateLimit({
	code,
	ip,
	scope,
}: {
	code: string;
	ip: string | null;
	scope: string;
}) {
	if (ip === null) {
		return createLegacyBackupServerError(
			LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.invalidIpAddress,
			400
		);
	}

	const result = checkRateLimit(JSON.stringify([scope, code, ip]), {
		...LEGACY_BACKUP_CODE_RATE_LIMIT_OPTIONS,
		capacityGroup: `legacy-backup:${scope}`,
	});

	return result.allowed
		? null
		: createLegacyBackupRateLimitError(result.retryAfter);
}

function checkLegacyBackupUploadRateLimit(ip: string | null) {
	if (ip === null) {
		return createLegacyBackupServerError(
			LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.invalidIpAddress,
			400
		);
	}

	const result = checkRateLimit(JSON.stringify(['upload', ip]), {
		...LEGACY_BACKUP_CODE_RATE_LIMIT_OPTIONS,
		capacityGroup: 'legacy-backup:upload',
	});

	return result.allowed
		? null
		: createLegacyBackupRateLimitError(result.retryAfter);
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

	return createLegacyBackupServerError(
		LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.invalidCode,
		400
	);
}

function normalizeBackupUserId(rawUserId: unknown) {
	let userId = typeof rawUserId === 'string' ? rawUserId : '';
	if (userId === 'null') {
		userId = '';
	}

	return userId;
}

export async function uploadLegacyBackupData({
	body,
	meta,
}: {
	body: Partial<IBackupUploadBody> | null;
	meta: ILegacyBackupRequestMeta;
}): Promise<TLegacyBackupResult<IBackupUploadSuccessResponse>> {
	const { contentType, ip, ua } = meta;

	if (normalizeMediaType(contentType) !== FILE_TYPE_JSON) {
		return createLegacyBackupServerError(
			LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.invalidContentType,
			400
		);
	}
	if (ip === null) {
		return createLegacyBackupServerError(
			LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.invalidIpAddress,
			400
		);
	}
	if (ua === null || ua === undefined) {
		return createLegacyBackupServerError(
			LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.invalidUserAgent,
			400
		);
	}
	const uploadRateLimitError = checkLegacyBackupUploadRateLimit(ip);
	if (uploadRateLimitError !== null) {
		return uploadRateLimitError;
	}

	const backupData = isObjectTagRecord(body) ? body.data : null;
	const rawUserId = isObjectTagRecord(body) ? body.user_id : null;
	if (
		!isObjectTagRecord(body) ||
		!isObjectTagRecord(backupData) ||
		!('customer_normal' in backupData) ||
		!('customer_rare' in backupData) ||
		!isObjectTagRecord(backupData.customer_normal) ||
		!isObjectTagRecord(backupData.customer_rare) ||
		!('user_id' in body) ||
		(typeof rawUserId !== 'string' && rawUserId !== null) ||
		('code' in body && body.code !== null && typeof body.code !== 'string')
	) {
		return createLegacyBackupServerError(
			LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.invalidObjectStructure,
			400
		);
	}

	const codeResult = createBackupCode(body.code);
	if (codeResult.status === 'error') {
		return codeResult;
	}
	const { code } = codeResult;

	const jsonString = JSON.stringify(backupData);
	if (new Blob([jsonString]).size > MAX_BACKUP_DATA_BYTES) {
		return createLegacyBackupServerError(
			LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.dataTooLarge,
			413
		);
	}

	const userId = normalizeBackupUserId(rawUserId);
	const now = Date.now();
	const [backupDbModule, backupLockModule] = await Promise.all([
		loadBackupDbModule(),
		loadBackupLockModule(),
	]);
	const {
		checkRecentBackupAccessByIp,
		deleteBackupImportRecordByCode,
		getRecord,
		setRecord,
		updateRecord,
	} = backupDbModule;
	const {
		checkBackupCodeLockLostError,
		checkBackupCodeLockTimeoutError,
		markBackupCodeLockCommitted,
		throwIfBackupCodeLockLost,
		withBackupCodeLock,
		withFreshBackupCodeLock,
	} = backupLockModule;
	const recentRecord = await checkRecentBackupAccessByIp(
		'created_at',
		now - LEGACY_BACKUP_FREQUENCY_TTL,
		{ ip, ua, userId }
	);
	if (recentRecord.status === 429) {
		return createLegacyBackupServerError(
			LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.requestsTooFrequent,
			429
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
				return createLegacyBackupServerError(
					LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.fileSaveFailed,
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
						LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.backupCodeLockLost,
						409
					);
				}

				console.warn('Failed to save backup record', {
					codeHash,
					errorCode: getLogSafeErrorCode(error),
				});

				return createLegacyBackupServerError(
					LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.fileRecordSaveFailed,
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
			return createLegacyBackupServerError(
				LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.backupCodeLockLost,
				409
			);
		}
		if (checkBackupCodeLockTimeoutError(error)) {
			return createLegacyBackupServerError(
				LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.backupCodeLockTimeout,
				409
			);
		}

		throw error;
	}
}

export async function fetchLegacyBackupMetadata({
	code,
	ip,
}: {
	code: string;
	ip: string | null;
}): Promise<TLegacyBackupResult<IBackupCheckSuccessResponse>> {
	const rateLimitError = checkLegacyBackupCodeRateLimit({
		code,
		ip,
		scope: 'metadata',
	});
	if (rateLimitError !== null) {
		return rateLimitError;
	}

	const { getRecord } = await loadBackupDbModule();
	const record = await getRecord(code);
	if (record.status === 404) {
		return createLegacyBackupServerError(
			LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.fileRecordMissing,
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
		return createLegacyBackupServerError(
			LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.invalidIpAddress,
			400
		);
	}

	const now = Date.now();
	const [backupDbModule, backupLockModule] = await Promise.all([
		loadBackupDbModule(),
		loadBackupLockModule(),
	]);
	const { checkRecentBackupAccessByIp, getRecord, updateRecordTimeout } =
		backupDbModule;
	const {
		checkBackupCodeLockLostError,
		checkBackupCodeLockTimeoutError,
		throwIfBackupCodeLockLost,
		withBackupCodeLock,
		withFreshBackupCodeLock,
	} = backupLockModule;
	const recentRecord = await checkRecentBackupAccessByIp(
		'last_accessed',
		now - LEGACY_BACKUP_FREQUENCY_TTL,
		{ ip }
	);
	if (recentRecord.status === 429) {
		return createLegacyBackupServerError(
			LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.requestsTooFrequent,
			429
		);
	}

	try {
		return await withBackupCodeLock(code, async (signal) => {
			const record = await getRecord(code);
			throwIfBackupCodeLockLost(signal);

			if (record.status === 404) {
				return createLegacyBackupServerError(
					LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.fileRecordMissing,
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
						LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.backupCodeLockLost,
						409
					);
				}
				if (checkBackupFileNotFoundError(error)) {
					return createLegacyBackupServerError(
						LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.fileMissing,
						404
					);
				}

				console.warn('Failed to read backup file', {
					codeHash: maskBackupCode(code),
					errorCode: getLogSafeErrorCode(error),
				});
				return createLegacyBackupServerError(
					LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.fileReadFailed,
					500
				);
			}

			const timeoutResult = await withFreshBackupCodeLock(
				signal,
				async (trx) => updateRecordTimeout(code, now, trx)
			);
			if (timeoutResult.status !== 200) {
				return createLegacyBackupServerError(
					LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.fileRecordTimeoutUpdateFailed,
					500
				);
			}

			return { content: fileContent, status: 'ok' };
		});
	} catch (error) {
		if (checkBackupCodeLockLostError(error)) {
			return createLegacyBackupServerError(
				LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.backupCodeLockLost,
				409
			);
		}
		if (checkBackupCodeLockTimeoutError(error)) {
			return createLegacyBackupServerError(
				LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.backupCodeLockTimeout,
				409
			);
		}

		throw error;
	}
}

export async function deleteLegacyBackupData({
	code,
	ip,
}: {
	code: string;
	ip: string | null;
}): Promise<TLegacyBackupResult<{ deletedFile: boolean; message: string }>> {
	const rateLimitError = checkLegacyBackupCodeRateLimit({
		code,
		ip,
		scope: 'delete',
	});
	if (rateLimitError !== null) {
		return rateLimitError;
	}

	const [backupDbModule, backupLockModule] = await Promise.all([
		loadBackupDbModule(),
		loadBackupLockModule(),
	]);
	const { deleteRecord, getRecord } = backupDbModule;
	const {
		checkBackupCodeLockLostError,
		checkBackupCodeLockTimeoutError,
		markBackupCodeLockCommitted,
		throwIfBackupCodeLockLost,
		withBackupCodeLock,
		withFreshBackupCodeLock,
	} = backupLockModule;

	try {
		return await withBackupCodeLock(code, async (signal) => {
			const record = await getRecord(code);
			throwIfBackupCodeLockLost(signal);

			if (record.status === 404) {
				return createLegacyBackupServerError(
					LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.fileRecordMissing,
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
						LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.backupCodeLockLost,
						409
					);
				}
				if (checkBackupCodeLockTimeoutError(error)) {
					return createLegacyBackupServerError(
						LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.backupCodeLockTimeout,
						409
					);
				}

				console.warn('Failed to delete backup record', {
					codeHash: maskBackupCode(code),
					errorCode: getLogSafeErrorCode(error),
				});

				return createLegacyBackupServerError(
					LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.fileRecordDeleteFailed,
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
					message:
						LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.fileRecordDeleted,
				},
				status: 'ok',
			};
		});
	} catch (error) {
		if (checkBackupCodeLockLostError(error)) {
			return createLegacyBackupServerError(
				LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.backupCodeLockLost,
				409
			);
		}
		if (checkBackupCodeLockTimeoutError(error)) {
			return createLegacyBackupServerError(
				LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.backupCodeLockTimeout,
				409
			);
		}

		throw error;
	}
}
