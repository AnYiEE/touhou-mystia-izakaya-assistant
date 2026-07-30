export { LEGACY_BACKUP_FREQUENCY_TTL } from '@/features/legacyBackup/contracts';
import {
	type IBackupCheckSuccessResponse,
	type IBackupUploadBody,
	type IBackupUploadSuccessResponse,
	type ILegacyBackupErrorPayload,
} from '@/features/legacyBackup/contracts';

import { fetchServiceApi } from '@/infrastructure/http/client/fetchServiceApi';
import { ServiceApiError } from '@/infrastructure/http/client/serviceApiError';
import { FILE_TYPE_JSON } from '@/infrastructure/http/mediaTypes';

function readLegacyBackupError(error: unknown): never {
	if (error instanceof ServiceApiError) {
		// eslint-disable-next-line @typescript-eslint/only-throw-error
		throw {
			data: {
				message: error.message,
				status: 'error',
				...(error.data !== null &&
				!Array.isArray(error.data) &&
				typeof error.data === 'object'
					? (error.data as Record<string, unknown>)
					: {}),
			},
			message: error.message,
			status: error.status,
		} satisfies ILegacyBackupErrorPayload;
	}

	throw error;
}

export async function fetchLegacyBackupMetadata(code: string) {
	try {
		return await fetchServiceApi<IBackupCheckSuccessResponse>(
			`/api/v1/backups/${encodeURIComponent(code)}/metadata`
		);
	} catch (error) {
		readLegacyBackupError(error);
	}
}

export async function deleteLegacyBackup(code: string) {
	try {
		return await fetchServiceApi(
			`/api/v1/backups/${encodeURIComponent(code)}`,
			{ method: 'DELETE' }
		);
	} catch (error) {
		readLegacyBackupError(error);
	}
}

export async function downloadLegacyBackup<T>(code: string) {
	try {
		return await fetchServiceApi<T>(
			`/api/v1/backups/${encodeURIComponent(code)}`
		);
	} catch (error) {
		readLegacyBackupError(error);
	}
}

export async function uploadLegacyBackup(body: IBackupUploadBody) {
	try {
		return await fetchServiceApi<IBackupUploadSuccessResponse>(
			'/api/v1/backups',
			{
				body: JSON.stringify(body),
				headers: { 'Content-Type': FILE_TYPE_JSON },
				method: 'POST',
			}
		);
	} catch (error) {
		readLegacyBackupError(error);
	}
}
