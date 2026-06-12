export { FREQUENCY_TTL as LEGACY_BACKUP_FREQUENCY_TTL } from '@/api/v1/backups/constants';
import type {
	IBackupCheckSuccessResponse,
	IBackupUploadBody,
	IBackupUploadSuccessResponse,
} from '@/api/v1/backups/types';
import {
	type TLegacyBackupActionResult,
	deleteLegacyBackupAction,
	downloadLegacyBackupAction,
	fetchLegacyBackupMetadataAction,
	uploadLegacyBackupAction,
} from '@/lib/account/actions/legacyBackups';

class LegacyBackupClientError extends Error {
	readonly data: Record<string, unknown>;
	readonly status: number;

	constructor({
		data,
		message,
		status,
	}: {
		data: Record<string, unknown>;
		message: string;
		status: number;
	}) {
		super(message);
		this.name = 'LegacyBackupClientError';
		this.data = data;
		this.status = status;
	}
}

function readLegacyBackupActionResult<T>(result: TLegacyBackupActionResult<T>) {
	if (result.status === 'error') {
		throw new LegacyBackupClientError({
			data: result.data ?? { message: result.message },
			message: result.message,
			status: result.httpStatus,
		});
	}

	return result.data;
}

export async function fetchLegacyBackupMetadata(code: string) {
	return readLegacyBackupActionResult<IBackupCheckSuccessResponse>(
		await fetchLegacyBackupMetadataAction(code)
	);
}

export async function deleteLegacyBackup(code: string) {
	return readLegacyBackupActionResult(await deleteLegacyBackupAction(code));
}

export async function downloadLegacyBackup<T>(code: string) {
	return readLegacyBackupActionResult<T>(
		await downloadLegacyBackupAction<T>(code)
	);
}

export async function uploadLegacyBackup(body: IBackupUploadBody) {
	return readLegacyBackupActionResult<IBackupUploadSuccessResponse>(
		await uploadLegacyBackupAction(body)
	);
}
