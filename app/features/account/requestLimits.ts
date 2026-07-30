export const KIBIBYTE = 1024;
export const MEBIBYTE = 1024 * KIBIBYTE;

export const MAX_ACCOUNT_SMALL_JSON_BODY_BYTES = 16 * KIBIBYTE;
export const MAX_ACCOUNT_JSON_BODY_BYTES = 128 * KIBIBYTE;

export const MAX_BACKUP_DATA_BYTES = 10 * MEBIBYTE;
export const MAX_BACKUP_UPLOAD_JSON_BODY_BYTES =
	MAX_BACKUP_DATA_BYTES + 64 * KIBIBYTE;

export const SEND_BEACON_SYNC_BODY_BYTES = 48 * KIBIBYTE;
const SYNC_PROTOCOL_OVERHEAD_BYTES = 16 * KIBIBYTE;

export const ACCOUNT_SYNC_STATE_TOTAL_MAX_BYTES = MAX_BACKUP_DATA_BYTES;
export const ACCOUNT_SYNC_REQUEST_MAX_BYTES =
	ACCOUNT_SYNC_STATE_TOTAL_MAX_BYTES + SYNC_PROTOCOL_OVERHEAD_BYTES;

const SERVER_ACTION_BODY_OVERHEAD_BYTES = 2 * MEBIBYTE;
export function getServerActionBodySizeLimitBytes(syncRequestMaxBytes: number) {
	return (
		Math.ceil(
			(Math.max(MAX_BACKUP_UPLOAD_JSON_BODY_BYTES, syncRequestMaxBytes) +
				SERVER_ACTION_BODY_OVERHEAD_BYTES) /
				MEBIBYTE
		) * MEBIBYTE
	);
}

export function getServerActionBodySizeLimit(syncRequestMaxBytes: number) {
	const bytes = getServerActionBodySizeLimitBytes(syncRequestMaxBytes);
	return `${bytes / MEBIBYTE}mb` as const;
}
