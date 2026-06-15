export { LEGACY_BACKUP_FREQUENCY_TTL } from '@/lib/account/legacyBackup/shared';
import type {
	IBackupCheckSuccessResponse,
	IBackupUploadBody,
	IBackupUploadSuccessResponse,
	ILegacyBackupErrorPayload,
} from '@/lib/account/legacyBackup/shared';
import { ServiceApiError, fetchServiceApi } from '@/lib/api/serviceClient';

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
				headers: { 'Content-Type': 'application/json' },
				method: 'POST',
			}
		);
	} catch (error) {
		readLegacyBackupError(error);
	}
}
