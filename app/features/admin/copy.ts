import { type TUserStatus } from '@/domain/account/contracts';

export const ADMIN_MESSAGE_MAP = {
	adminAuthCheckFailed: '检查管理员登录状态失败',
	adminLoginFailed: '管理员登录失败',
	adminLogoutFailed: '退出管理员失败',
	adminSessionCheckFailed: '管理员会话检查失败',
	adminSessionChecking: '正在校验管理员会话',
	adminSessionExpired: '管理员登录已失效，请重新登录',
	adminSessionReading: '正在读取管理员会话',
	adminSignInRequired: '请先返回管理员页登录',
	adminStateReadFailed: '读取管理员状态失败',
	auditLogReadFailed: '读取审计日志失败',
	auditLogReading: '正在读取审计日志',
	auditQueryTooShort: '搜索关键字至少需要2个字符',
	operationFailed: '操作失败',
	ssoClientDisabled: 'SSO客户端已禁用',
	ssoGrantEmpty: '暂无SSO授权',
	ssoGrantReadFailed: '读取SSO授权失败',
	ssoGrantRevokeAllFailed: '撤销全部SSO授权失败',
	ssoGrantRevoked: 'SSO授权已撤销',
	ssoGrantRevokeFailed: '撤销SSO授权失败',
	ssoGrantUserDisabledCallbackNotice:
		'禁用用户会为仍有授权且配置了回调的SSO客户端入队user_disabled callback，可在Callback队列中查看投递状态。',
	userDetailReadFailed: '读取用户详情失败',
	userDetailReading: '正在读取账号资料',
	userDetailTargetSwitching: '正在切换目标用户',
	userDetailTargetSyncing: '同步目标用户资料',
	userDetailWaiting: '等待详情数据',
	userListReadFailed: '读取用户列表失败',
	userListReading: '正在读取用户列表',
} as const;

export const ADMIN_STATUS_LABEL_MAP = {
	loading: '加载中',
	reading: '读取中',
	retry: '重试',
	sessionReading: '读取会话状态',
} as const;

export const ADMIN_USER_STATUS_LABEL_MAP = {
	active: '正常',
	deleted: '已删除',
	disabled: '已禁用',
} as const satisfies Record<TUserStatus, string>;

export const ADMIN_CLIENT_ERROR_MESSAGE_MAP: Record<string, string> = {
	'admin-session-expired': ADMIN_MESSAGE_MAP.adminSessionExpired,
	'announcement-conflict': '通知已被其他管理员更新，请刷新后再编辑',
	'announcement-not-found': '通知不存在或已被删除',
	'announcement-not-visible':
		'通知当前不可见，请检查启用状态、时间和受众设置',
	'client-disabled': ADMIN_MESSAGE_MAP.ssoClientDisabled,
	'feature-disabled': '功能暂不可用',
	'invalid-object-structure': '提交内容格式无效，请检查后重试',
	'invalid-password-rule': '新密码不符合密码规则',
	'invalid-user-status': '用户状态无效，无法完成操作',
	'last-active-secret': '至少需要保留一个可用的客户端Secret',
	'payload-too-large': '提交内容过大',
	'rate-limit': '操作过于频繁，请稍后重试',
	'server-misconfigured': '服务器配置异常，请查看服务端日志',
	'sso-callback-queue-busy': '回调正在处理中，请稍后重试',
	'sso-callback-queue-not-found': '回调队列记录不存在或已处理',
	'sso-client-conflict': 'SSO客户端ID已存在，请更换后重试',
	'sso-client-not-found': 'SSO客户端不存在或已被删除',
	'sso-client-secret-not-found': 'SSO客户端Secret不存在或已被删除',
	'sso-grant-not-found': 'SSO授权不存在或已被撤销',
	'target-user-not-found': '目标用户不存在或已被删除',
	unauthorized: ADMIN_MESSAGE_MAP.adminSessionExpired,
	'update-not-applied': '数据已变化，请刷新后重试',
	'user-deleted': '用户已删除，无法完成操作',
};

export const ADMIN_CLIENT_REQUEST_FALLBACK_MESSAGE_MAP = {
	networkFailed: '网络连接失败，请稍后重试。',
	rateLimited: '操作过于频繁，请稍后重试。',
	serverFailed: '服务器暂时无法完成操作，请稍后重试。',
	unexpected: '操作失败，请稍后重试。',
} as const;

export const ADMIN_USER_STATUS_FILTER_OPTIONS = [
	{ label: '全部状态', value: 'all' },
	{ label: ADMIN_USER_STATUS_LABEL_MAP.active, value: 'active' },
	{ label: ADMIN_USER_STATUS_LABEL_MAP.disabled, value: 'disabled' },
	{ label: ADMIN_USER_STATUS_LABEL_MAP.deleted, value: 'deleted' },
] as const satisfies Array<{ label: string; value: TUserStatus | 'all' }>;

export function createAdminSsoGrantRevokeAllSuccessMessage(
	revokedCount: number | undefined
) {
	return `SSO授权已全部撤销${
		revokedCount === undefined ? '' : `：${revokedCount}个`
	}`;
}

export function createAdminRateLimitErrorMessage(retryAfterSeconds: number) {
	return `操作过于频繁，请${Math.ceil(retryAfterSeconds)}秒后重试。`;
}

export function createAdminSuccessWithDetailRefreshFailureMessage(
	successMessage: string,
	detailErrorMessage: string
) {
	return `${successMessage}，但详情刷新失败：${detailErrorMessage}`;
}
