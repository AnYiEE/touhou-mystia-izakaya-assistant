export const LEGACY_BACKUP_FREQUENCY_TTL = 3 * 60 * 1000;

export interface IBackupCheckSuccessResponse {
	created_at: number;
	last_accessed: number;
}

export interface IBackupUploadBody {
	code: string | null;
	data: { customer_normal: object; customer_rare: object };
	user_id: string | null;
}

export interface IBackupUploadSuccessResponse {
	code: string;
}

export interface ILegacyBackupErrorPayload {
	data?: Record<string, unknown>;
	message: string;
	status: number;
}

export type TLegacyBackupResult<TData = Record<string, unknown>> =
	| { data: TData; status: 'ok' }
	| {
			data?: Record<string, unknown>;
			httpStatus: number;
			message: string;
			status: 'error';
	  };

export function createLegacyBackupErrorResult(
	message: string,
	status: number,
	data?: Record<string, unknown>
): Extract<TLegacyBackupResult, { status: 'error' }> {
	return data === undefined
		? { httpStatus: status, message, status: 'error' }
		: { data, httpStatus: status, message, status: 'error' };
}
