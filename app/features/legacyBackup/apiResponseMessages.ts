import { type TLocale } from '@/shared/i18n/locale';
import { type TLocalizedMessageTable, translate } from '@/shared/i18n/messages';

export const LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP = {
	backupCodeLockLost: '备份操作状态已变化，请重试',
	backupCodeLockTimeout: '备份正在处理中，请稍后重试',
	dataTooLarge: '备份数据过大',
	fileMissing: '备份文件不存在或已被删除',
	fileReadFailed: '读取备份文件失败',
	fileRecordDeleted: '备份记录已删除',
	fileRecordDeleteFailed: '删除备份记录失败',
	fileRecordMissing: '备份记录不存在或已被删除',
	fileRecordSaveFailed: '保存备份记录失败',
	fileRecordTimeoutUpdateFailed: '更新备份记录过期时间失败',
	fileSaveFailed: '保存备份文件失败',
	invalidCode: '备份码无效',
	invalidContentType: '请求内容类型无效',
	invalidIpAddress: 'IP地址无效',
	invalidObjectStructure: '请求数据结构无效',
	invalidSecret: '备份密钥无效',
	invalidUserAgent: '浏览器标识无效',
	requestsTooFrequent: '请求过于频繁',
} as const;

type TLegacyBackupApiResponseMessageKey =
	keyof typeof LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP;

const LEGACY_BACKUP_API_RESPONSE_MESSAGES = {
	en: {
		backupCodeLockLost: 'The backup operation state changed. Try again.',
		backupCodeLockTimeout:
			'A backup operation is already in progress. Try again later.',
		dataTooLarge: 'The backup data is too large.',
		fileMissing: 'The backup file does not exist or has been deleted.',
		fileReadFailed: 'Failed to read the backup file.',
		fileRecordDeleted: 'The backup record has been deleted.',
		fileRecordDeleteFailed: 'Failed to delete the backup record.',
		fileRecordMissing:
			'The backup record does not exist or has been deleted.',
		fileRecordSaveFailed: 'Failed to save the backup record.',
		fileRecordTimeoutUpdateFailed:
			'Failed to update the backup record expiration time.',
		fileSaveFailed: 'Failed to save the backup file.',
		invalidCode: 'Invalid backup code.',
		invalidContentType: 'Invalid request content type.',
		invalidIpAddress: 'Invalid IP address.',
		invalidObjectStructure: 'Invalid request data structure.',
		invalidSecret: 'Invalid backup secret.',
		invalidUserAgent: 'Invalid browser identifier.',
		requestsTooFrequent: 'Too many requests.',
	},
	ja: {
		backupCodeLockLost:
			'バックアップ操作の状態が変更されました。再試行してください。',
		backupCodeLockTimeout:
			'バックアップを処理中です。しばらくしてから再試行してください。',
		dataTooLarge: 'バックアップデータが大きすぎます。',
		fileMissing: 'バックアップファイルが存在しないか、削除されています。',
		fileReadFailed: 'バックアップファイルを読み込めませんでした。',
		fileRecordDeleted: 'バックアップ記録は削除されています。',
		fileRecordDeleteFailed: 'バックアップ記録を削除できませんでした。',
		fileRecordMissing: 'バックアップ記録が存在しないか、削除されています。',
		fileRecordSaveFailed: 'バックアップ記録を保存できませんでした。',
		fileRecordTimeoutUpdateFailed:
			'バックアップ記録の有効期限を更新できませんでした。',
		fileSaveFailed: 'バックアップファイルを保存できませんでした。',
		invalidCode: 'バックアップコードが無効です。',
		invalidContentType: 'リクエストのContent-Typeが無効です。',
		invalidIpAddress: 'IPアドレスが無効です。',
		invalidObjectStructure: 'リクエストデータの構造が無効です。',
		invalidSecret: 'バックアップシークレットが無効です。',
		invalidUserAgent: 'ブラウザ識別情報が無効です。',
		requestsTooFrequent: 'リクエストが多すぎます。',
	},
	ko: {
		backupCodeLockLost: '백업 작업 상태가 변경되었습니다. 다시 시도하세요.',
		backupCodeLockTimeout: '백업을 처리 중입니다. 잠시 후 다시 시도하세요.',
		dataTooLarge: '백업 데이터가 너무 큽니다.',
		fileMissing: '백업 파일이 없거나 삭제되었습니다.',
		fileReadFailed: '백업 파일을 읽지 못했습니다.',
		fileRecordDeleted: '백업 기록이 삭제되었습니다.',
		fileRecordDeleteFailed: '백업 기록을 삭제하지 못했습니다.',
		fileRecordMissing: '백업 기록이 없거나 삭제되었습니다.',
		fileRecordSaveFailed: '백업 기록을 저장하지 못했습니다.',
		fileRecordTimeoutUpdateFailed:
			'백업 기록 만료 시간을 업데이트하지 못했습니다.',
		fileSaveFailed: '백업 파일을 저장하지 못했습니다.',
		invalidCode: '백업 코드가 유효하지 않습니다.',
		invalidContentType: '요청 콘텐츠 유형이 유효하지 않습니다.',
		invalidIpAddress: 'IP 주소가 유효하지 않습니다.',
		invalidObjectStructure: '요청 데이터 구조가 유효하지 않습니다.',
		invalidSecret: '백업 비밀 키가 유효하지 않습니다.',
		invalidUserAgent: '브라우저 식별자가 유효하지 않습니다.',
		requestsTooFrequent: '요청이 너무 많습니다.',
	},
	'zh-CN': LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP,
	'zh-TW': {
		backupCodeLockLost: '備份操作狀態已變化，請重試',
		backupCodeLockTimeout: '備份正在處理中，請稍後重試',
		dataTooLarge: '備份資料過大',
		fileMissing: '備份檔案不存在或已被刪除',
		fileReadFailed: '讀取備份檔案失敗',
		fileRecordDeleted: '備份記錄已刪除',
		fileRecordDeleteFailed: '刪除備份記錄失敗',
		fileRecordMissing: '備份記錄不存在或已被刪除',
		fileRecordSaveFailed: '儲存備份記錄失敗',
		fileRecordTimeoutUpdateFailed: '更新備份記錄過期時間失敗',
		fileSaveFailed: '儲存備份檔案失敗',
		invalidCode: '備份碼無效',
		invalidContentType: '請求內容類型無效',
		invalidIpAddress: 'IP位址無效',
		invalidObjectStructure: '請求資料結構無效',
		invalidSecret: '備份金鑰無效',
		invalidUserAgent: '瀏覽器標識無效',
		requestsTooFrequent: '請求過於頻繁',
	},
} as const satisfies TLocalizedMessageTable<TLegacyBackupApiResponseMessageKey>;

const LEGACY_BACKUP_API_RESPONSE_MESSAGE_KEYS = new Map<
	string,
	TLegacyBackupApiResponseMessageKey
>(
	Object.entries(LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP).map(
		([key, message]) => [message, key as TLegacyBackupApiResponseMessageKey]
	)
);

export function translateLegacyBackupApiResponseMessage(
	message: string,
	locale: TLocale
) {
	const key = LEGACY_BACKUP_API_RESPONSE_MESSAGE_KEYS.get(message);
	return key === undefined
		? message
		: translate(LEGACY_BACKUP_API_RESPONSE_MESSAGES, locale, key);
}
