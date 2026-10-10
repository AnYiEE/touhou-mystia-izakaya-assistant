import type { TPreferencesMessageKey } from '@/features/preferences/client/messages';

export const LEGACY_CLOUD_DELETE_BUTTON_LABEL_KEYS = {
	delete: 'preferences.cloud.delete',
	deleting: 'preferences.cloud.deleting',
	fail: 'preferences.cloud.delete.fail',
	success: 'preferences.cloud.delete.success',
} as const satisfies Record<
	'delete' | 'deleting' | 'fail' | 'success',
	TPreferencesMessageKey
>;

export const LEGACY_CLOUD_DOWNLOAD_BUTTON_LABEL_KEYS = {
	download: 'preferences.cloud.download',
	downloading: 'preferences.cloud.downloading',
	fail: 'preferences.cloud.download.fail',
	success: 'preferences.cloud.download.success',
} as const satisfies Record<
	'download' | 'downloading' | 'fail' | 'success',
	TPreferencesMessageKey
>;

export const LEGACY_CLOUD_UPLOAD_BUTTON_LABEL_KEYS = {
	fail: 'preferences.cloud.upload.fail',
	success: 'preferences.cloud.upload.success',
	upload: 'preferences.cloud.upload',
	uploading: 'preferences.cloud.uploading',
} as const satisfies Record<
	'fail' | 'success' | 'upload' | 'uploading',
	TPreferencesMessageKey
>;

export const LEGACY_CLOUD_BACKUP_MESSAGE_KEYS = {
	busy: 'preferences.cloud.message.busy',
	codeInfoFailed: 'preferences.cloud.message.codeInfoFailed',
	codeNotFound: 'preferences.cloud.message.codeNotFound',
	invalidCode: 'preferences.cloud.message.invalidCode',
	retry: 'preferences.cloud.retry',
	targetNotFound: 'preferences.cloud.message.targetNotFound',
} as const satisfies Record<
	| 'busy'
	| 'codeInfoFailed'
	| 'codeNotFound'
	| 'invalidCode'
	| 'retry'
	| 'targetNotFound',
	TPreferencesMessageKey
>;
