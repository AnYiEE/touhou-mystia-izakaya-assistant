export const ACCOUNT_MANAGER_MESSAGE_MAP = {
	accountDeleteFailed: '删除账号失败',
	authenticationCredentialsRequired: '请输入用户名和密码',
	authenticationFailed: '认证失败',
	cloudDataChangedReconfirm: '云端数据已发生变化，请重新确认后再清空',
	cloudDataChangedRefreshing: '云端数据已发生变化，正在刷新账号状态…',
	cloudDataCleared: '云端数据已清空',
	cloudDataClearFailed: '清空云端数据失败',
	loginSuccess: '登录成功',
	logoutSyncFailed: '退出前同步失败',
	passkeyAdded: '通行密钥已添加',
	passkeyAddFailed: '通行密钥添加失败',
	passkeyDeleted: '通行密钥已删除',
	passkeyDeleteFailed: '通行密钥删除失败',
	passkeyRefreshFailed: '通行密钥刷新失败',
	passkeyRenamed: '通行密钥已重命名',
	passkeyRenameFailed: '通行密钥重命名失败',
	passwordSet: '登录密码已设置',
	passwordUpdated: '密码已更新',
	profileUpdated: '资料已更新',
	profileUpdateFailed: '资料修改失败',
	registrationFailed: '注册失败',
	registrationSuccess: '注册成功',
	sessionRefreshFailed: '登录设备刷新失败',
	sessionRevoked: '已下线登录设备',
	sessionRevokeFailed: '登录设备撤销失败',
	ssoGrantRefreshFailed: '已授权应用刷新失败',
	ssoGrantRevoked: '已撤销授权',
	ssoGrantRevokeFailed: '撤销授权失败',
	syncPendingBeforeLogout: '同步尚未完成，请先重试同步后再退出',
	termsRequired: '请先阅读并同意法律声明',
} as const;

export const ACCOUNT_MANAGER_SUCCESS_MESSAGE_SET = new Set<string>([
	ACCOUNT_MANAGER_MESSAGE_MAP.cloudDataCleared,
	ACCOUNT_MANAGER_MESSAGE_MAP.loginSuccess,
	ACCOUNT_MANAGER_MESSAGE_MAP.passkeyAdded,
	ACCOUNT_MANAGER_MESSAGE_MAP.passkeyDeleted,
	ACCOUNT_MANAGER_MESSAGE_MAP.passkeyRenamed,
	ACCOUNT_MANAGER_MESSAGE_MAP.passwordSet,
	ACCOUNT_MANAGER_MESSAGE_MAP.passwordUpdated,
	ACCOUNT_MANAGER_MESSAGE_MAP.profileUpdated,
	ACCOUNT_MANAGER_MESSAGE_MAP.registrationSuccess,
	ACCOUNT_MANAGER_MESSAGE_MAP.sessionRevoked,
	ACCOUNT_MANAGER_MESSAGE_MAP.ssoGrantRevoked,
]);

export const ACCOUNT_MANAGER_STATUS_LABEL_MAP = {
	awaitingSystemVerification: '正在等待系统验证…',
	connected: '账号同步已连接',
	noPasskeys: '暂无通行密钥',
	noSessions: '暂无可见会话',
	noSsoGrants: '暂无已授权应用',
	passkeyPrompt: '无需输入密码，按系统提示确认即可',
	passkeysUnsupported: '当前环境不支持通行密钥',
	paused: '云同步已暂停',
	readingPasskeys: '正在读取通行密钥',
	readingSessions: '正在读取登录设备',
	readingSsoGrants: '正在读取已授权应用',
} as const;

const ACCOUNT_BOOTSTRAP_ERROR_MESSAGE_MAP: Record<string, string> = {
	'bootstrap-failed': '账号服务初始化失败，请刷新页面重试',
	'server-misconfigured': '服务器配置异常',
};

export function getAccountBootstrapErrorMessage(errorCode: string | null) {
	if (errorCode === null) {
		return '账号功能暂不可用：服务器配置异常';
	}
	return `账号功能暂不可用：${ACCOUNT_BOOTSTRAP_ERROR_MESSAGE_MAP[errorCode] ?? errorCode}`;
}
