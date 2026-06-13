export { LEGACY_BACKUP_FREQUENCY_TTL } from '@/lib/account/legacyBackup/shared';
import type {
	IBackupCheckSuccessResponse,
	IBackupUploadBody,
	IBackupUploadSuccessResponse,
	ILegacyBackupErrorPayload,
} from '@/lib/account/legacyBackup/shared';
import {
	type TLegacyBackupActionResult,
	deleteLegacyBackupAction,
	downloadLegacyBackupAction,
	fetchLegacyBackupMetadataAction,
	uploadLegacyBackupAction,
} from '@/lib/account/actions/legacyBackups';

function readLegacyBackupActionResult<T>(result: TLegacyBackupActionResult<T>) {
	if (result.status === 'error') {
		// eslint-disable-next-line @typescript-eslint/only-throw-error
		throw {
			data: { message: result.message, status: 'error', ...result.data },
			message: result.message,
			status: result.httpStatus,
		} satisfies ILegacyBackupErrorPayload;
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
