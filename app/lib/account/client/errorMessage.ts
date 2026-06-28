import { PASSWORD_RULE_DESCRIPTION } from '@/lib/account/shared/constants';

const ACCOUNT_CLIENT_ERROR_MESSAGE_MAP: Record<string, string> = {
	'account-disabled-offline': '离线包不支持账号功能',
	'backup-code-already-imported': '这个旧备份码已被导入',
	'backup-code-lock-lost': '旧备份码正在被处理，请稍后重试',
	'backup-code-lock-timeout': '旧备份码处理超时，请重试',
	'backup-code-not-found':
		'没有找到这个旧备份码，可能已过期、已导入或已被删除',
	'bootstrap-failed': '账号初始化失败，请刷新页面重试',
	'cannot-revoke-current-session': '不能在这里撤销当前会话，请使用退出登录',
	'challenge-expired': '通行密钥操作已超时，请重试',
	'challenge-not-found': '通行密钥操作已失效，请重试',
	conflict: '数据冲突，请在冲突解决面板中处理',
	'credential-state-stale': '登录状态刚刚变化，请刷新后重试',
	forbidden: '登录状态已变化，请刷新后重试',
	'invalid-api-response': '服务器响应异常，请重试',
	'invalid-backup-code': '旧备份码格式不正确，请检查是否完整复制',
	'invalid-backup-file': '这个旧备份码中的数据无法读取，可能已经损坏',
	'invalid-credentials': '用户名或密码不正确',
	'invalid-nickname': '昵称格式不符合要求',
	'invalid-object-structure': '提交内容格式异常',
	'invalid-passkey-name': '通行密钥名称格式不符合要求',
	'invalid-password': '当前密码不正确',
	'invalid-password-rule': PASSWORD_RULE_DESCRIPTION,
	'invalid-user-status': '账号状态不允许执行此操作',
	'invalid-username': '用户名格式不符合要求',
	'legacy-backup-disabled-offline': '离线包不支持旧云备份功能',
	'legacy-import-failed': '旧备份码导入失败，请重试',
	'local-takeover-failed': '本地数据接管失败，请刷新页面后重试',
	'passkey-not-found': '通行密钥不存在',
	'password-already-set': '已设置登录密码，请使用修改密码',
	'password-must-change': '需要先更新密码后才能继续同步',
	'password-not-set': '请先设置登录密码',
	'payload-too-large': '提交内容过大，请检查输入',
	'server-misconfigured': '服务器账号配置异常',
	'session-not-found': '登录设备已失效，请刷新后重试',
	'session-revoked': '已下线登录设备',
	'state-epoch-mismatch': '账号数据刚刚变化，请刷新后重试',
	'sync-conflict': '账号数据存在冲突，请先处理冲突后重试',
	'sync-failed': '同步失败，请刷新页面重试',
	'sync-refresh-failed': '刷新同步状态失败，请刷新页面重试',
	'too-many-passkeys': '通行密钥数量已达上限，请先删除部分通行密钥',
	'too-many-requests': '尝试次数过多，请稍后再试',
	unauthorized: '登录已过期，请重新登录',
	'user-deleted': '账号已删除',
	'user-disabled': '账号已停用',
	'username-conflict': '用户名已被使用',
	'webauthn-canceled': '通行密钥操作已取消',
	'webauthn-failed': '通行密钥操作失败，请重试',
	'webauthn-timeout':
		'验证尚未完成，若未收到系统提示，请使用用户名和密码注册/登录',
	'webauthn-verification-failed': '通行密钥验证失败，请重试',
};

const LEGACY_BACKUP_IMPORT_ERROR_CODES = new Set<string>([
	'backup-code-lock-lost',
	'backup-code-lock-timeout',
	'backup-code-already-imported',
	'backup-code-not-found',
	'invalid-backup-code',
	'invalid-backup-file',
	'legacy-import-failed',
	'sync-conflict',
]);

const USER_FACING_MESSAGE_REGEXP = /[\u4E00-\u9FFF]/u;

export function isLegacyBackupImportErrorMessage(message: string) {
	return LEGACY_BACKUP_IMPORT_ERROR_CODES.has(message);
}

export function getAccountClientErrorMessage(
	message: string,
	fallback = '操作失败，请稍后重试'
) {
	return (
		ACCOUNT_CLIENT_ERROR_MESSAGE_MAP[message] ??
		(USER_FACING_MESSAGE_REGEXP.test(message) ? message : fallback)
	);
}
