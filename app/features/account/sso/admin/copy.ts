import {
	type IAdminSsoClientSecretRecord,
	type TAdminSsoCallbackDeliveryStatus,
	type TAdminSsoCallbackEvent,
	type TAdminSsoCallbackQueueStatus,
	type TAdminSsoTicketStatus,
} from '@/features/account/contracts';

export const ADMIN_SSO_MESSAGE_MAP = {
	callbackCleanupFailed: '清理投递历史失败',
	callbackDiscarded: 'SSO Callback已丢弃',
	callbackDispatchFailed: '投递SSO Callback失败',
	callbackHistoryReadFailed: '读取SSO投递历史失败',
	callbackHistoryReading: '正在读取投递历史',
	callbackQueueReadFailed: '读取SSO Callback队列失败',
	callbackQueueReading: '正在读取Callback队列',
	callbackResetForRetry: 'SSO Callback已重置为待投递',
	callbackUpdateFailed: '更新SSO Callback失败',
	clientConfigReading: '正在读取SSO客户端配置',
	clientCreatedSaveSecret: 'SSO客户端已创建，请保存本次显示的客户端Secret',
	clientDeleteFailed: '删除SSO客户端失败',
	clientEnabled: 'SSO客户端已启用',
	clientListReading: '正在读取SSO客户端',
	clientReadFailed: '读取SSO客户端失败',
	clientSaved: 'SSO客户端和Secret备注已保存',
	clientSavedOnly: 'SSO客户端已保存',
	clientSavedSavingSecret: 'SSO客户端已保存，正在保存Secret备注',
	clientSaveFailed: '保存SSO客户端或Secret备注失败',
	clientSecretCreationNotice:
		'创建后会显示一次客户端Secret，后台仅展示Secret元数据和Hash前缀',
	clientSecretDisabled: 'SSO客户端Secret已禁用',
	clientSecretEnabled: 'SSO客户端Secret已启用',
	clientSecretGenerateFailed: '生成SSO客户端Secret失败',
	clientSecretReadFailed: '读取SSO客户端Secret失败',
	clientSecretRevoked: 'SSO客户端Secret已撤销',
	clientSecretRevokeFailed: '撤销SSO客户端Secret失败',
	clientSecretsEmpty: '暂无客户端Secret',
	clientSecretStatusUpdateFailed: '更新SSO客户端Secret状态失败',
	clientStatusUpdateFailed: '更新SSO客户端状态失败',
	clientSummaryReadFailed: '读取SSO客户端摘要失败',
	grantBatchRevokeFailed: '批量撤销SSO授权失败',
	grantListReading: '正在读取授权关系',
	grantReadFailed: '读取SSO授权关系失败',
	grantUsersEmpty: '暂无授权用户',
	grantUsersReadFailed: '读取授权用户失败',
	notRead: '未读取',
	ticketFilterRequired: '请先填写客户端ID或用户ID',
	ticketListReading: '正在读取SSO Tickets',
	ticketReadFailed: '读取SSO Ticket失败',
	ticketUpdateFailed: '更新SSO Ticket失败',
} as const;

export const ADMIN_SSO_CLIENT_STATUS_LABEL_MAP = {
	active: '已启用',
	disabled: '已禁用',
} as const;

export const ADMIN_SSO_CLIENT_SECRET_STATUS_LABEL_MAP = {
	active: '可用',
	disabled: '已禁用',
	revoked: '已撤销',
} as const satisfies Record<IAdminSsoClientSecretRecord['status'], string>;

export const ADMIN_SSO_CALLBACK_CONFIGURATION_LABEL_MAP = {
	configured: '已配置',
	missing: '无',
	paused: '已暂停',
} as const;

export const ADMIN_SSO_CALLBACK_EVENT_LABEL_MAP = {
	client_deleted: '客户端删除',
	client_disabled: '客户端禁用',
	grant_revoked: '授权撤销',
	secret_rotated: 'Secret轮换',
	user_deleted: '用户删除',
	user_disabled: '用户禁用',
	user_profile_updated: '资料更新',
} as const satisfies Record<TAdminSsoCallbackEvent, string>;

export const ADMIN_SSO_CALLBACK_QUEUE_STATUS_LABEL_MAP = {
	final_failed: '最终失败',
	pending: '待投递',
	retrying: '重试中',
} as const satisfies Record<TAdminSsoCallbackQueueStatus, string>;

export const ADMIN_SSO_CALLBACK_DELIVERY_STATUS_LABEL_MAP = {
	failed: '失败',
	final_failed: '最终失败',
	succeeded: '成功',
} as const satisfies Record<TAdminSsoCallbackDeliveryStatus, string>;

export const ADMIN_SSO_TICKET_STATUS_LABEL_MAP = {
	expired: '已过期',
	pending: '未消费',
	revoked: '已撤销',
	used: '已消费',
} as const satisfies Record<TAdminSsoTicketStatus, string>;

export const ADMIN_SSO_CLIENT_STATUS_FILTER_OPTIONS = [
	{ label: '全部状态', value: '' },
	{ label: ADMIN_SSO_CLIENT_STATUS_LABEL_MAP.active, value: 'active' },
	{ label: ADMIN_SSO_CLIENT_STATUS_LABEL_MAP.disabled, value: 'disabled' },
] as const;

export const ADMIN_SSO_CALLBACK_CONFIGURATION_FILTER_OPTIONS = [
	{ label: '全部Callback', value: '' },
	{
		label: `${ADMIN_SSO_CALLBACK_CONFIGURATION_LABEL_MAP.configured}Callback`,
		value: 'configured',
	},
	{ label: '未配置Callback', value: 'missing' },
] as const;

export const ADMIN_SSO_GRANT_PRESENCE_FILTER_OPTIONS = [
	{ label: '全部授权', value: '' },
	{ label: '已有授权', value: 'has' },
	{ label: '暂无授权', value: 'none' },
] as const;

export const ADMIN_SSO_GRANT_CLIENT_STATUS_FILTER_OPTIONS = [
	{ label: '全部客户端', value: '' },
	{ label: '正常客户端', value: 'active' },
	{ label: '已禁用客户端', value: 'disabled' },
] as const;

export const ADMIN_SSO_GRANT_USER_STATUS_FILTER_OPTIONS = [
	{ label: '全部用户', value: '' },
	{ label: '正常用户', value: 'active' },
	{ label: '已禁用用户', value: 'disabled' },
	{ label: '已删除用户', value: 'deleted' },
] as const;

export const ADMIN_SSO_TICKET_STATUS_FILTER_OPTIONS = [
	{ label: '全部状态', value: '' },
	{ label: ADMIN_SSO_TICKET_STATUS_LABEL_MAP.pending, value: 'pending' },
	{ label: ADMIN_SSO_TICKET_STATUS_LABEL_MAP.used, value: 'used' },
	{ label: ADMIN_SSO_TICKET_STATUS_LABEL_MAP.revoked, value: 'revoked' },
	{ label: ADMIN_SSO_TICKET_STATUS_LABEL_MAP.expired, value: 'expired' },
] as const;

export const ADMIN_SSO_CALLBACK_EVENT_FILTER_OPTIONS = [
	{ label: '全部事件', value: '' },
	{
		label: ADMIN_SSO_CALLBACK_EVENT_LABEL_MAP.client_deleted,
		value: 'client_deleted',
	},
	{
		label: ADMIN_SSO_CALLBACK_EVENT_LABEL_MAP.client_disabled,
		value: 'client_disabled',
	},
	{
		label: ADMIN_SSO_CALLBACK_EVENT_LABEL_MAP.grant_revoked,
		value: 'grant_revoked',
	},
	{
		label: ADMIN_SSO_CALLBACK_EVENT_LABEL_MAP.secret_rotated,
		value: 'secret_rotated',
	},
	{
		label: ADMIN_SSO_CALLBACK_EVENT_LABEL_MAP.user_deleted,
		value: 'user_deleted',
	},
	{
		label: ADMIN_SSO_CALLBACK_EVENT_LABEL_MAP.user_disabled,
		value: 'user_disabled',
	},
	{
		label: ADMIN_SSO_CALLBACK_EVENT_LABEL_MAP.user_profile_updated,
		value: 'user_profile_updated',
	},
] as const;

export const ADMIN_SSO_CALLBACK_QUEUE_STATUS_FILTER_OPTIONS = [
	{ label: '全部状态', value: '' },
	{
		label: ADMIN_SSO_CALLBACK_QUEUE_STATUS_LABEL_MAP.pending,
		value: 'pending',
	},
	{
		label: ADMIN_SSO_CALLBACK_QUEUE_STATUS_LABEL_MAP.retrying,
		value: 'retrying',
	},
	{
		label: ADMIN_SSO_CALLBACK_QUEUE_STATUS_LABEL_MAP.final_failed,
		value: 'final_failed',
	},
] as const;

export const ADMIN_SSO_CALLBACK_DELIVERY_STATUS_FILTER_OPTIONS = [
	{ label: '全部状态', value: '' },
	{
		label: ADMIN_SSO_CALLBACK_DELIVERY_STATUS_LABEL_MAP.succeeded,
		value: 'succeeded',
	},
	{
		label: ADMIN_SSO_CALLBACK_DELIVERY_STATUS_LABEL_MAP.failed,
		value: 'failed',
	},
	{
		label: ADMIN_SSO_CALLBACK_DELIVERY_STATUS_LABEL_MAP.final_failed,
		value: 'final_failed',
	},
] as const;

export function createAdminSsoCallbackDispatchMessage({
	deletedExpiredTickets,
	deletedFinalFailedCallbacks,
	failed,
	finalFailed,
	succeeded,
}: {
	deletedExpiredTickets: number;
	deletedFinalFailedCallbacks: number;
	failed: number;
	finalFailed: number;
	succeeded: number;
}) {
	return `已投递${succeeded}条，失败${failed}条，最终失败${finalFailed}条，清理过期Ticket${deletedExpiredTickets}条，清理最终失败Callback${deletedFinalFailedCallbacks}条`;
}

export function createAdminSsoCallbackHistoryCleanupMessage({
	deletedByAge,
	deletedByCap,
	deletedCount,
}: {
	deletedByAge: number;
	deletedByCap: number;
	deletedCount: number;
}) {
	return `已清理${deletedCount}条投递历史，按时间${deletedByAge}条，按上限${deletedByCap}条`;
}

export function createAdminSsoGrantBatchResultMessage({
	failedCount,
	failureMessage,
	successfulCount,
}: {
	failedCount: number;
	failureMessage: string | null;
	successfulCount: number;
}) {
	if (failedCount === 0) {
		return `已撤销${successfulCount}条SSO授权`;
	}

	return `已撤销${successfulCount}条SSO授权，${failedCount}条失败${failureMessage === null ? '' : `：${failureMessage}`}`;
}

export function createAdminSsoTicketCleanupSuccessMessage(
	deletedCount: number
) {
	return `已清理${deletedCount}条过期Ticket`;
}

export function createAdminSsoTicketRevokeSuccessMessage(revokedCount: number) {
	return `已撤销${revokedCount}条未消费Ticket`;
}
