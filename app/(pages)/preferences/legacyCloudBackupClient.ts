export { FREQUENCY_TTL as LEGACY_BACKUP_FREQUENCY_TTL } from '@/api/v1/backups/constants';
import type {
	IBackupCheckSuccessResponse,
	IBackupUploadSuccessResponse,
} from '@/api/v1/backups/types';
import { FILE_TYPE_JSON } from '@/utilities';

interface ILegacyBackupUploadBody {
	code: string | null;
	data: { customer_normal: object; customer_rare: object };
	user_id: string | null;
}

function readLegacyBackupResponse<T>(response: Response) {
	if (!response.ok) {
		return response
			.text()
			.catch(() => '')
			.then((text) => {
				let error: object;
				try {
					const json = JSON.parse(text);
					error =
						json !== null && typeof json === 'object'
							? json
							: {
									message:
										response.statusText || 'Unknown error',
								};
				} catch {
					error = {
						message:
							text.trim() ||
							response.statusText ||
							'Unknown error',
					};
				}
				// eslint-disable-next-line @typescript-eslint/only-throw-error
				throw { data: error, status: response.status };
			});
	}

	return response
		.json()
		.catch(() => {
			throw new Error('Invalid legacy backup response');
		})
		.then((json) => {
			if (
				json !== null &&
				typeof json === 'object' &&
				'data' in json &&
				'status' in json &&
				json.status === 'ok'
			) {
				return json.data as T;
			}
			return json as T;
		});
}

export async function fetchLegacyBackupMetadata(code: string) {
	return readLegacyBackupResponse<IBackupCheckSuccessResponse>(
		await fetch(`/api/v1/backups/${encodeURIComponent(code)}/metadata`)
	);
}

export async function deleteLegacyBackup(code: string) {
	return readLegacyBackupResponse(
		await fetch(`/api/v1/backups/${encodeURIComponent(code)}`, {
			method: 'DELETE',
		})
	);
}

export async function downloadLegacyBackup<T>(code: string) {
	return readLegacyBackupResponse<T>(
		await fetch(`/api/v1/backups/${encodeURIComponent(code)}`, {
			cache: 'no-cache',
		})
	);
}

export async function uploadLegacyBackup(body: ILegacyBackupUploadBody) {
	return readLegacyBackupResponse<IBackupUploadSuccessResponse>(
		await fetch('/api/v1/backups', {
			body: JSON.stringify(body),
			headers: { 'Content-Type': FILE_TYPE_JSON },
			method: 'POST',
		})
	);
}
