import type { IAdminAuditLogListData } from '@/features/account/contracts';

export type TActorTypeFilter =
	| ''
	| IAdminAuditLogListData['logs'][number]['actor_type'];

export type TScopeFilter = '' | 'account' | 'sso';

export const actorTypeOptions = [
	{ label: '全部操作者', value: '' },
	{ label: '管理员', value: 'admin' },
	{ label: '客户端', value: 'client' },
	{ label: '系统', value: 'system' },
	{ label: '用户', value: 'user' },
] as const;

export const scopeOptions = [
	{ label: '全部范围', value: '' },
	{ label: '账号', value: 'account' },
	{ label: 'SSO', value: 'sso' },
] as const;

const auditScopeLabelMap = { account: '账号', sso: 'SSO' } as const;

const auditActorTypeLabelMap = {
	admin: '管理员',
	client: '客户端',
	system: '系统',
	user: '用户',
} as const;

const auditTargetTypeLabelMap: Record<string, string> = {
	announcement_records: '通知维护记录',
	sso_callback_queue: 'SSO Callback队列',
	sso_client: 'SSO客户端',
	sso_client_secret: 'SSO客户端密钥',
	sso_grant: 'SSO授权关系',
	sso_ticket: 'SSO Ticket',
	user: '用户',
};

const auditActionLabelMap: Record<string, string> = {
	'account-sync-rebuilt': '用户重建云端同步数据',
	'admin-cleanup-announcement-records': '管理员清理通知历史',
	'admin-cleanup-expired-sso-tickets': '管理员清理过期SSO Ticket',
	'admin-cleanup-sso-callback-deliveries': '管理员清理SSO Callback历史',
	'admin-clear-user-data': '管理员清空用户云端数据',
	'admin-create-sso-client': '管理员创建SSO客户端',
	'admin-create-sso-client-secret': '管理员生成SSO客户端密钥',
	'admin-delete-sso-client': '管理员删除SSO客户端',
	'admin-delete-user-sessions': '管理员踢出用户登录设备',
	'admin-disable-user': '管理员禁用用户',
	'admin-discard-sso-callback': '管理员丢弃SSO Callback队列项',
	'admin-dispatch-sso-callbacks': '管理员立即投递SSO Callback',
	'admin-enable-user': '管理员启用用户',
	'admin-reset-user-password': '管理员重置用户密码',
	'admin-restore-user': '管理员恢复用户',
	'admin-retry-sso-callback': '管理员重试SSO Callback队列项',
	'admin-revoke-sso-client-grants': '管理员撤销客户端全部授权',
	'admin-revoke-sso-client-secret': '管理员撤销SSO客户端密钥',
	'admin-revoke-sso-client-tickets': '管理员撤销客户端SSO Ticket',
	'admin-revoke-sso-grant': '管理员撤销单个SSO授权',
	'admin-revoke-user-sso-grants': '管理员撤销用户全部SSO授权',
	'admin-revoke-user-sso-tickets': '管理员撤销用户SSO Ticket',
	'admin-update-sso-client': '管理员更新SSO客户端',
	'admin-update-sso-client-secret': '管理员更新SSO客户端密钥',
	'user-authorize-sso-client': '用户授权SSO客户端',
	'user-change-nickname': '用户修改昵称',
	'user-change-password': '用户修改密码',
	'user-change-username': '用户修改用户名',
	'user-clear-account-data': '用户清空云端数据',
	'user-delete-account': '用户删除账号',
	'user-delete-passkey': '用户删除通行密钥',
	'user-export-account-data': '用户导出账号数据',
	'user-login-failed': '用户登录失败',
	'user-login-succeeded': '用户登录成功',
	'user-logout-all-sessions': '用户退出全部设备',
	'user-logout-session': '用户退出登录',
	'user-register-account': '用户注册账号',
	'user-register-account-with-passkey': '用户使用通行密钥注册账号',
	'user-register-passkey': '用户添加通行密钥',
	'user-revoke-session': '用户撤销登录设备',
	'user-revoke-sso-grant': '用户撤销SSO授权',
	'user-set-initial-password': '用户设置初始密码',
};

export const auditFilterReferenceGroups = [
	{
		label: '范围',
		values: scopeOptions
			.filter((option) => option.value !== '')
			.map((option) => ({ label: option.label, value: option.value })),
	},
	{
		label: '动作',
		values: Object.entries(auditActionLabelMap).map(([value, label]) => ({
			label,
			value,
		})),
	},
	{
		label: '操作者类型',
		values: actorTypeOptions
			.filter((option) => option.value !== '')
			.map((option) => ({ label: option.label, value: option.value })),
	},
	{
		label: '目标类型',
		values: Object.entries(auditTargetTypeLabelMap).map(
			([value, label]) => ({ label, value })
		),
	},
] as const;

export function getScopeLabel(scope: TScopeFilter) {
	return (
		scopeOptions.find((option) => option.value === scope)?.label ?? scope
	);
}

export function getAuditScopeLabel(scope: string) {
	return auditScopeLabelMap[scope as keyof typeof auditScopeLabelMap];
}

export function getAuditActorTypeLabel(actorType: string) {
	return auditActorTypeLabelMap[
		actorType as keyof typeof auditActorTypeLabelMap
	];
}

export function getAuditTargetTypeLabel(targetType: string) {
	return auditTargetTypeLabelMap[targetType] ?? targetType;
}

export function getAuditActionLabel(action: string) {
	return auditActionLabelMap[action] ?? action;
}

export function createAdminAuditUserHref(userId: string) {
	return `/admin/users/${encodeURIComponent(userId)}`;
}
