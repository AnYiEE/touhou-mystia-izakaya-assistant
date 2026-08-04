import { type IAccountUserProfile } from '@/features/account/contracts';

import { type TAccountBootstrapStatus } from './state/accountStore';

export const ACCOUNT_CLIENT_MESSAGE_MAP = {
	accountStateRefreshFailed: '账号状态刷新失败，请稍后重试',
	logoutFailed: '退出失败',
	operationBusy: '账号数据操作正在其他标签页进行，请稍后重试',
	passwordChangeFailed: '改密失败',
	passwordMustChangeAccountPaused:
		'密码更新前，账号同步、云端数据操作和冲突处理会暂时暂停。',
	passwordMustChangeAuthorizePaused:
		'密码更新前无法完成SSO授权，也不会签发登录票据。',
	passwordMustChangeLogoutAccount:
		'如果暂时不处理，可以退出当前账号；本设备未完成的同步队列会留在本地，之后重新登录再继续。',
	passwordMustChangeLogoutAuthorize:
		'如果暂时不处理，可以退出当前账号返回首页。',
} as const;

const ACCOUNT_ACTION_STATUS_LABEL_MAP = {
	signedOut: '未登录',
	unavailable: '账号不可用',
	welcome: '欢迎您',
} as const;

export function getAccountActionLabel(
	bootstrapStatus: TAccountBootstrapStatus,
	user: IAccountUserProfile | null
) {
	if (bootstrapStatus === 'error') {
		return ACCOUNT_ACTION_STATUS_LABEL_MAP.unavailable;
	}
	if (bootstrapStatus === 'unknown') {
		return ACCOUNT_ACTION_STATUS_LABEL_MAP.welcome;
	}
	if (user === null) {
		return ACCOUNT_ACTION_STATUS_LABEL_MAP.signedOut;
	}
	return user.nickname ?? user.username;
}

export const LEGACY_BACKUP_IMPORT_MESSAGE_MAP = {
	failed: '导入失败，请稍后重试',
	localTakeoverFailed: '本地数据接管失败，请刷新页面后重试',
	success: '导入成功，可继续导入下一个旧备份码',
	syncPending: '当前账号同步尚未完成，请稍后重试',
} as const;
