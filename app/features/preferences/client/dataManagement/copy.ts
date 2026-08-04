export const LEGACY_CLOUD_DELETE_BUTTON_LABEL_MAP = {
	delete: '删除云备份',
	deleting: '正在删除数据',
	fail: '删除失败',
	success: '删除成功',
} as const;

export const LEGACY_CLOUD_DOWNLOAD_BUTTON_LABEL_MAP = {
	download: '还原云备份',
	downloading: '正在获取数据',
	fail: '还原失败',
	success: '还原成功',
} as const;

export const LEGACY_CLOUD_UPLOAD_BUTTON_LABEL_MAP = {
	fail: '上传失败',
	success: '上传成功',
	upload: '备份至云端',
	uploading: '正在上传数据',
} as const;

export const LEGACY_CLOUD_BACKUP_MESSAGE_MAP = {
	busy: '备份正在处理中，请稍后重试',
	codeInfoFailed: '获取备份码信息失败',
	codeNotFound: '云端未记录此备份码，可能已于他处删除？',
	invalidCode: '无效的备份码',
	targetNotFound: '目标文件不存在',
} as const;

export function createLegacyCloudBackupRetryMessage(minutes: number) {
	return `请${minutes}分钟后再试`;
}
