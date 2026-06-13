import { type TAccountActionResult } from '@/lib/account/actions/utils';
import type {
	IBackupCheckSuccessResponse,
	IBackupUploadBody,
	IBackupUploadSuccessResponse,
} from '@/lib/account/legacyBackup/shared';

export type TLegacyBackupActionResult<TData = Record<string, unknown>> =
	TAccountActionResult<TData>;

function createOfflineLegacyBackupActionError<
	TData = Record<string, unknown>,
>(): Extract<TLegacyBackupActionResult<TData>, { status: 'error' }> {
	return {
		httpStatus: 503,
		message: 'legacy-backup-disabled-offline',
		status: 'error',
	};
}

export function fetchLegacyBackupMetadataAction(code: string) {
	void code;
	return Promise.resolve(
		createOfflineLegacyBackupActionError<IBackupCheckSuccessResponse>()
	);
}

export function deleteLegacyBackupAction(code: string) {
	void code;
	return Promise.resolve(createOfflineLegacyBackupActionError());
}

export function downloadLegacyBackupAction<TData>(
	code: string
): Promise<TLegacyBackupActionResult<TData>> {
	void code;
	return Promise.resolve(createOfflineLegacyBackupActionError<TData>());
}

export function uploadLegacyBackupAction(body: IBackupUploadBody) {
	void body;
	return Promise.resolve(
		createOfflineLegacyBackupActionError<IBackupUploadSuccessResponse>()
	);
}
