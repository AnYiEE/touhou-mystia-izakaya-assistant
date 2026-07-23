import { ServiceApiError, fetchServiceApi } from '@/lib/api/serviceClient';
import type {
	IAccountUserProfile,
	IAdminAuditLogListData,
	IAdminLoginBody,
	IAdminMeData,
	IAdminResetPasswordBody,
	IAdminSsoCallbackDeliveryCleanupData,
	IAdminSsoCallbackDeliveryListData,
	IAdminSsoCallbackQueueListData,
	IAdminSsoCallbackQueueMutationData,
	IAdminSsoClientCreateBody,
	IAdminSsoClientDetailData,
	IAdminSsoClientListData,
	IAdminSsoClientMutationData,
	IAdminSsoClientSecretCreateBody,
	IAdminSsoClientSecretListData,
	IAdminSsoClientSecretMutationData,
	IAdminSsoClientSecretUpdateBody,
	IAdminSsoClientUpdateBody,
	IAdminSsoClientUsersData,
	IAdminSsoGrantEventListData,
	IAdminSsoGrantListData,
	IAdminSsoGrantMutationData,
	IAdminSsoTicketListData,
	IAdminSsoTicketMutationData,
	IAdminSsoUserGrantsData,
	IAdminUserDetailData,
	IAdminUserListData,
	TAccountSyncStatus,
	TAdminSsoCallbackDeliveryStatus,
	TAdminSsoCallbackEvent,
	TAdminSsoCallbackQueueStatus,
	TAdminSsoGrantEvent,
	TAdminSsoTicketStatus,
	TUserStatus,
} from '@/lib/account/shared/types';
import type {
	IAdminAnnouncementBody,
	IAdminAnnouncementCleanupData,
	IAdminAnnouncementListData,
	IAdminAnnouncementMutationData,
	IAdminAnnouncementPreviewData,
	IAdminAnnouncementVersionListData,
	TAnnouncementAudience,
	TAnnouncementComputedStatus,
	TAnnouncementLevel,
} from '@/lib/announcements/shared/types';

export type TAdminApiResult<TData = Record<string, unknown>> =
	| { data: TData; status: 'ok' }
	| {
			data?: Record<string, unknown>;
			displayMessage: string;
			httpStatus: number;
			message: string;
			status: 'error';
	  };

type TAdminAuditActorType =
	IAdminAuditLogListData['logs'][number]['actor_type'];

function readServiceErrorData(error: ServiceApiError) {
	const data =
		error.data !== null &&
		!Array.isArray(error.data) &&
		typeof error.data === 'object'
			? { ...(error.data as Record<string, unknown>) }
			: undefined;
	if (error.retryAfter !== null) {
		return { ...data, retry_after: error.retryAfter };
	}

	return data;
}

const ADMIN_ERROR_MESSAGE_MAP: Record<string, string> = {
	'admin-session-expired': '管理员登录已失效，请重新登录',
	'announcement-conflict': '通知已被其他管理员更新，请刷新后再编辑',
	'announcement-not-found': '通知不存在或已被删除',
	'announcement-not-visible':
		'通知当前不可见，请检查启用状态、时间和受众设置',
	'client-disabled': 'SSO客户端已禁用',
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
	unauthorized: '管理员登录已失效，请重新登录',
	'update-not-applied': '数据已变化，请刷新后重试',
	'user-deleted': '用户已删除，无法完成操作',
};

function getAdminClientErrorMessage(error: ServiceApiError) {
	const mappedMessage = ADMIN_ERROR_MESSAGE_MAP[error.message];
	if (mappedMessage !== undefined) {
		return mappedMessage;
	}
	if (error.status === 0) {
		return '网络连接失败，请稍后重试。';
	}
	if (error.status === 429) {
		return error.retryAfter === null
			? '操作过于频繁，请稍后重试。'
			: `操作过于频繁，请${Math.ceil(error.retryAfter)}秒后重试。`;
	}
	if (error.status >= 500) {
		return '服务器暂时无法完成操作，请稍后重试。';
	}

	return '操作失败，请稍后重试。';
}

export async function fetchAdminApiResult<TData>(
	path: string,
	init: RequestInit = {}
): Promise<TAdminApiResult<TData>> {
	try {
		return { data: await fetchServiceApi<TData>(path, init), status: 'ok' };
	} catch (error) {
		if (error instanceof ServiceApiError) {
			const data = readServiceErrorData(error);
			const displayMessage = getAdminClientErrorMessage(error);
			if (data === undefined) {
				return {
					displayMessage,
					httpStatus: error.status,
					message: error.message,
					status: 'error',
				};
			}

			return {
				data,
				displayMessage,
				httpStatus: error.status,
				message: error.message,
				status: 'error',
			};
		}

		throw error;
	}
}

export function createAdminJsonRequestInit(
	method: string,
	body?: unknown,
	csrfToken?: string
) {
	const init: RequestInit = {
		headers: {
			'Content-Type': 'application/json',
			...(csrfToken === undefined ? {} : { 'X-CSRF-Token': csrfToken }),
		},
		method,
	};
	if (body !== undefined) {
		init.body = JSON.stringify(body);
	}

	return init;
}

export function createAdminCsrfRequestInit(
	method: string,
	csrfToken: string
): RequestInit {
	return { headers: { 'X-CSRF-Token': csrfToken }, method };
}

export function fetchAdminMe() {
	return fetchAdminApiResult<IAdminMeData>('/api/v1/admin/me');
}

export function loginAdmin(body: IAdminLoginBody) {
	return fetchAdminApiResult<IAdminMeData>(
		'/api/v1/admin/auth/login',
		createAdminJsonRequestInit('POST', body)
	);
}

export function logoutAdmin(csrfToken: string) {
	return fetchAdminApiResult<{ message: 'admin-logged-out' }>(
		'/api/v1/admin/auth/logout',
		createAdminCsrfRequestInit('POST', csrfToken)
	);
}

export function listAdminUsers({
	page,
	query = '',
	status = '',
}: { page?: unknown; query?: unknown; status?: unknown } = {}) {
	const searchParams = new URLSearchParams();
	if (typeof page === 'number') {
		searchParams.set('page', String(page));
	}
	if (typeof query === 'string' && query !== '') {
		searchParams.set('query', query);
	}
	if (typeof status === 'string' && status !== '') {
		searchParams.set('status', status);
	}

	const queryString = searchParams.toString();

	return fetchAdminApiResult<IAdminUserListData>(
		`/api/v1/admin/users${queryString === '' ? '' : `?${queryString}`}`
	);
}

export function getAdminUsersByIds(ids: string[]) {
	return fetchAdminApiResult<{ users: IAccountUserProfile[] }>(
		'/api/v1/admin/users/by-ids',
		createAdminJsonRequestInit('POST', { ids })
	);
}

type TAdminUserDetailRefreshApiResult<TData = Record<string, unknown>> =
	| { data: TData; detail: IAdminUserDetailData; status: 'ok' }
	| Extract<TAdminApiResult, { status: 'error' }>;

export type TAdminUserDetailApiResult<TData = Record<string, unknown>> =
	| TAdminUserDetailRefreshApiResult<TData>
	| {
			data: TData;
			detailError: Extract<TAdminApiResult, { status: 'error' }>;
			status: 'mutation-committed-detail-error';
	  }
	| Extract<TAdminApiResult, { status: 'error' }>;

async function fetchAdminUserDetailApiResult<TData>(
	id: string,
	data: TData
): Promise<TAdminUserDetailRefreshApiResult<TData>> {
	const detailResult = await fetchAdminApiResult<IAdminUserDetailData>(
		`/api/v1/admin/users/${encodeURIComponent(id)}`
	);
	if (detailResult.status === 'error') {
		return detailResult;
	}

	return { data, detail: detailResult.data, status: 'ok' };
}

export async function refreshAdminUserDetail(
	id: string
): Promise<TAdminUserDetailRefreshApiResult> {
	return fetchAdminUserDetailApiResult(id, {});
}

async function mutateAdminUserDetail<TData>(
	id: string,
	path: string,
	init: RequestInit
): Promise<TAdminUserDetailApiResult<TData>> {
	const result = await fetchAdminApiResult<TData>(path, init);
	if (result.status === 'error') {
		return result;
	}

	const detailResult = await fetchAdminUserDetailApiResult(id, result.data);
	return detailResult.status === 'error'
		? {
				data: result.data,
				detailError: detailResult,
				status: 'mutation-committed-detail-error',
			}
		: detailResult;
}

export function resetAdminUserPassword(
	id: string,
	body: IAdminResetPasswordBody,
	csrfToken: string
) {
	return mutateAdminUserDetail<{ message: 'password-reset' }>(
		id,
		`/api/v1/admin/users/${encodeURIComponent(id)}/reset-password`,
		createAdminJsonRequestInit('POST', body, csrfToken)
	);
}

export function disableAdminUser(id: string, csrfToken: string) {
	return mutateAdminUserDetail<{ message: 'user-disabled' }>(
		id,
		`/api/v1/admin/users/${encodeURIComponent(id)}/disable`,
		createAdminCsrfRequestInit('POST', csrfToken)
	);
}

export function enableAdminUser(id: string, csrfToken: string) {
	return mutateAdminUserDetail<{ message: 'user-enabled' }>(
		id,
		`/api/v1/admin/users/${encodeURIComponent(id)}/enable`,
		createAdminCsrfRequestInit('POST', csrfToken)
	);
}

export function restoreAdminUser(id: string, csrfToken: string) {
	return mutateAdminUserDetail<{ message: 'user-restored' }>(
		id,
		`/api/v1/admin/users/${encodeURIComponent(id)}/restore`,
		createAdminCsrfRequestInit('POST', csrfToken)
	);
}

export function deleteAdminUserSessions(id: string, csrfToken: string) {
	return mutateAdminUserDetail<{ message: 'sessions-deleted' }>(
		id,
		`/api/v1/admin/users/${encodeURIComponent(id)}/sessions`,
		createAdminCsrfRequestInit('DELETE', csrfToken)
	);
}

export function clearAdminUserData(id: string, csrfToken: string) {
	return mutateAdminUserDetail<{
		state_epoch: number;
		sync_generation: number;
		sync_status: TAccountSyncStatus;
	}>(
		id,
		`/api/v1/admin/users/${encodeURIComponent(id)}/data`,
		createAdminCsrfRequestInit('DELETE', csrfToken)
	);
}

export function listAdminAnnouncements(
	options: {
		audience?: TAnnouncementAudience | '';
		computedStatus?: TAnnouncementComputedStatus | '';
		includeArchived?: boolean;
		level?: TAnnouncementLevel | '';
		page?: number;
		pageSize?: number;
		query?: string;
	} = {}
) {
	const searchParams = new URLSearchParams();
	if (options.includeArchived === true) {
		searchParams.set('include_archived', '1');
	}
	if (options.audience !== undefined && options.audience !== '') {
		searchParams.set('audience', options.audience);
	}
	if (options.computedStatus !== undefined && options.computedStatus !== '') {
		searchParams.set('status', options.computedStatus);
	}
	if (options.level !== undefined && options.level !== '') {
		searchParams.set('level', options.level);
	}
	if (typeof options.page === 'number') {
		searchParams.set('page', String(options.page));
	}
	if (typeof options.pageSize === 'number') {
		searchParams.set('page_size', String(options.pageSize));
	}
	if (typeof options.query === 'string' && options.query !== '') {
		searchParams.set('query', options.query);
	}

	const queryString = searchParams.toString();

	return fetchAdminApiResult<IAdminAnnouncementListData>(
		`/api/v1/admin/announcements${
			queryString === '' ? '' : `?${queryString}`
		}`
	);
}

export function getAdminAnnouncement(id: string) {
	return fetchAdminApiResult<IAdminAnnouncementMutationData>(
		`/api/v1/admin/announcements/${encodeURIComponent(id)}`
	);
}

export function previewAnnouncement(
	body: IAdminAnnouncementBody,
	csrfToken: string
) {
	return fetchAdminApiResult<IAdminAnnouncementPreviewData>(
		'/api/v1/admin/announcements/preview',
		createAdminJsonRequestInit('POST', body, csrfToken)
	);
}

export function createAnnouncement(
	body: IAdminAnnouncementBody,
	csrfToken: string
) {
	return fetchAdminApiResult<IAdminAnnouncementMutationData>(
		'/api/v1/admin/announcements',
		createAdminJsonRequestInit('POST', body, csrfToken)
	);
}

export function updateAnnouncement(
	id: string,
	body: IAdminAnnouncementBody,
	csrfToken: string
) {
	return fetchAdminApiResult<IAdminAnnouncementMutationData>(
		`/api/v1/admin/announcements/${encodeURIComponent(id)}`,
		createAdminJsonRequestInit('PUT', body, csrfToken)
	);
}

export function archiveAnnouncement(id: string, csrfToken: string) {
	return fetchAdminApiResult<IAdminAnnouncementMutationData>(
		`/api/v1/admin/announcements/${encodeURIComponent(id)}`,
		createAdminCsrfRequestInit('DELETE', csrfToken)
	);
}

export function restoreAnnouncement(id: string, csrfToken: string) {
	return fetchAdminApiResult<IAdminAnnouncementMutationData>(
		`/api/v1/admin/announcements/${encodeURIComponent(id)}`,
		createAdminCsrfRequestInit('PATCH', csrfToken)
	);
}

export function cleanupAdminAnnouncementRecords(csrfToken: string) {
	return fetchAdminApiResult<IAdminAnnouncementCleanupData>(
		'/api/v1/admin/announcements/cleanup',
		createAdminCsrfRequestInit('DELETE', csrfToken)
	);
}

export function listAnnouncementVersions(id: string) {
	return fetchAdminApiResult<IAdminAnnouncementVersionListData>(
		`/api/v1/admin/announcements/${encodeURIComponent(id)}/versions`
	);
}

export type TAdminSsoClientApiResult<TData = Record<string, unknown>> =
	TAdminApiResult<TData>;

function appendAdminNumberSearchParam(
	searchParams: URLSearchParams,
	name: string,
	value: number | undefined
) {
	if (typeof value === 'number') {
		searchParams.set(name, String(value));
	}
}

function appendAdminStringSearchParam(
	searchParams: URLSearchParams,
	name: string,
	value: string | undefined
) {
	if (typeof value === 'string' && value !== '') {
		searchParams.set(name, value);
	}
}

function createAdminSearchSuffix(searchParams: URLSearchParams) {
	const queryString = searchParams.toString();

	return queryString === '' ? '' : `?${queryString}`;
}

export function listAdminSsoClients(
	options: {
		callback?: 'configured' | 'missing';
		hasGrants?: boolean;
		page?: number;
		pageSize?: number;
		query?: string;
		status?: 'active' | 'disabled';
	} = {}
) {
	const searchParams = new URLSearchParams();
	appendAdminNumberSearchParam(searchParams, 'page', options.page);
	appendAdminNumberSearchParam(searchParams, 'page_size', options.pageSize);
	appendAdminStringSearchParam(searchParams, 'query', options.query);
	appendAdminStringSearchParam(searchParams, 'status', options.status);
	appendAdminStringSearchParam(searchParams, 'callback', options.callback);
	if (typeof options.hasGrants === 'boolean') {
		searchParams.set('has_grants', options.hasGrants ? '1' : '0');
	}

	return fetchAdminApiResult<IAdminSsoClientListData>(
		`/api/v1/admin/sso/clients${createAdminSearchSuffix(searchParams)}`
	);
}

export function fetchAdminSsoClient(id: string) {
	return fetchAdminApiResult<IAdminSsoClientDetailData>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(id)}`
	);
}

export function createAdminSsoClient(
	body: IAdminSsoClientCreateBody,
	csrfToken: string
) {
	return fetchAdminApiResult<IAdminSsoClientMutationData>(
		'/api/v1/admin/sso/clients',
		createAdminJsonRequestInit('POST', body, csrfToken)
	);
}

export function updateAdminSsoClient(
	id: string,
	body: IAdminSsoClientUpdateBody,
	csrfToken: string
) {
	return fetchAdminApiResult<IAdminSsoClientMutationData>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(id)}`,
		createAdminJsonRequestInit('PUT', body, csrfToken)
	);
}

export function toggleAdminSsoClientDisabled(
	id: string,
	body: IAdminSsoClientUpdateBody,
	disabled: boolean,
	csrfToken: string
) {
	return updateAdminSsoClient(id, { ...body, disabled }, csrfToken);
}

export function listAdminSsoClientSecrets(clientId: string) {
	return fetchAdminApiResult<IAdminSsoClientSecretListData>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(clientId)}/secrets`
	);
}

export function createAdminSsoClientSecret(
	clientId: string,
	body: IAdminSsoClientSecretCreateBody,
	csrfToken: string
) {
	return fetchAdminApiResult<IAdminSsoClientSecretMutationData>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(clientId)}/secrets`,
		createAdminJsonRequestInit('POST', body, csrfToken)
	);
}

export function updateAdminSsoClientSecret(
	clientId: string,
	secretId: string,
	body: IAdminSsoClientSecretUpdateBody,
	csrfToken: string
) {
	return fetchAdminApiResult<IAdminSsoClientSecretMutationData>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(
			clientId
		)}/secrets/${encodeURIComponent(secretId)}`,
		createAdminJsonRequestInit('PATCH', body, csrfToken)
	);
}

export function revokeAdminSsoClientSecret(
	clientId: string,
	secretId: string,
	csrfToken: string
) {
	return fetchAdminApiResult<IAdminSsoClientSecretMutationData>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(
			clientId
		)}/secrets/${encodeURIComponent(secretId)}`,
		createAdminCsrfRequestInit('DELETE', csrfToken)
	);
}

export function deleteAdminSsoClient(id: string, csrfToken: string) {
	return fetchAdminApiResult<{ message: 'sso-client-deleted' }>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(id)}`,
		createAdminCsrfRequestInit('DELETE', csrfToken)
	);
}

function createAdminPaginationSearchParams(
	options: { page?: number; pageSize?: number; query?: string } = {}
) {
	const searchParams = new URLSearchParams();
	if (typeof options.page === 'number') {
		searchParams.set('page', String(options.page));
	}
	if (typeof options.pageSize === 'number') {
		searchParams.set('page_size', String(options.pageSize));
	}
	if (typeof options.query === 'string' && options.query !== '') {
		searchParams.set('query', options.query);
	}

	const queryString = searchParams.toString();

	return queryString === '' ? '' : `?${queryString}`;
}

export function listAdminSsoGrants(
	options: {
		clientId?: string;
		clientStatus?: 'active' | 'disabled';
		page?: number;
		pageSize?: number;
		query?: string;
		userId?: string;
		userStatus?: TUserStatus;
	} = {}
) {
	const searchParams = new URLSearchParams();
	if (typeof options.page === 'number') {
		searchParams.set('page', String(options.page));
	}
	if (typeof options.pageSize === 'number') {
		searchParams.set('page_size', String(options.pageSize));
	}
	if (typeof options.query === 'string' && options.query !== '') {
		searchParams.set('query', options.query);
	}
	if (typeof options.clientId === 'string' && options.clientId !== '') {
		searchParams.set('client_id', options.clientId);
	}
	if (typeof options.clientStatus === 'string') {
		searchParams.set('client_status', options.clientStatus);
	}
	if (typeof options.userId === 'string' && options.userId !== '') {
		searchParams.set('user_id', options.userId);
	}
	if (typeof options.userStatus === 'string') {
		searchParams.set('user_status', options.userStatus);
	}

	const queryString = searchParams.toString();

	return fetchAdminApiResult<IAdminSsoGrantListData>(
		`/api/v1/admin/sso/grants${queryString === '' ? '' : `?${queryString}`}`
	);
}

export function revokeAdminSsoGrant(
	clientId: string,
	userId: string,
	csrfToken: string,
	reason?: string
) {
	return fetchAdminApiResult<IAdminSsoGrantMutationData>(
		`/api/v1/admin/sso/grants/${encodeURIComponent(
			clientId
		)}/${encodeURIComponent(userId)}`,
		createAdminJsonRequestInit(
			'DELETE',
			reason === undefined ? {} : { reason },
			csrfToken
		)
	);
}

export function revokeAdminSsoClientGrants(
	clientId: string,
	csrfToken: string,
	reason?: string
) {
	return fetchAdminApiResult<IAdminSsoGrantMutationData>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(clientId)}/grants`,
		createAdminJsonRequestInit(
			'DELETE',
			reason === undefined ? {} : { reason },
			csrfToken
		)
	);
}

export function revokeAdminUserSsoGrants(
	userId: string,
	csrfToken: string,
	reason?: string
) {
	return fetchAdminApiResult<IAdminSsoGrantMutationData>(
		`/api/v1/admin/users/${encodeURIComponent(userId)}/sso/grants`,
		createAdminJsonRequestInit(
			'DELETE',
			reason === undefined ? {} : { reason },
			csrfToken
		)
	);
}

export function listAdminSsoClientUsers(
	clientId: string,
	options: { page?: number; pageSize?: number; query?: string } = {}
) {
	return fetchAdminApiResult<IAdminSsoClientUsersData>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(
			clientId
		)}/users${createAdminPaginationSearchParams(options)}`
	);
}

export function revokeAdminSsoClientUserGrant(
	clientId: string,
	userId: string,
	csrfToken: string,
	reason?: string
) {
	return fetchAdminApiResult<IAdminSsoGrantMutationData>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(
			clientId
		)}/users/${encodeURIComponent(userId)}`,
		createAdminJsonRequestInit(
			'DELETE',
			reason === undefined ? {} : { reason },
			csrfToken
		)
	);
}

export function listAdminUserSsoGrants(
	userId: string,
	options: { page?: number; pageSize?: number; query?: string } = {}
) {
	return fetchAdminApiResult<IAdminSsoUserGrantsData>(
		`/api/v1/admin/users/${encodeURIComponent(
			userId
		)}/sso/grants${createAdminPaginationSearchParams(options)}`
	);
}

export function revokeAdminUserSsoGrant(
	userId: string,
	clientId: string,
	csrfToken: string,
	reason?: string
) {
	return fetchAdminApiResult<IAdminSsoGrantMutationData>(
		`/api/v1/admin/users/${encodeURIComponent(
			userId
		)}/sso/grants/${encodeURIComponent(clientId)}`,
		createAdminJsonRequestInit(
			'DELETE',
			reason === undefined ? {} : { reason },
			csrfToken
		)
	);
}

export function listAdminSsoCallbacks(
	options: {
		clientId?: string;
		endTime?: number;
		event?: TAdminSsoCallbackEvent;
		page?: number;
		pageSize?: number;
		query?: string;
		startTime?: number;
		status?: TAdminSsoCallbackQueueStatus;
		userId?: string;
	} = {}
) {
	const searchParams = new URLSearchParams();
	appendAdminNumberSearchParam(searchParams, 'page', options.page);
	appendAdminNumberSearchParam(searchParams, 'page_size', options.pageSize);
	appendAdminStringSearchParam(searchParams, 'query', options.query);
	appendAdminStringSearchParam(searchParams, 'client_id', options.clientId);
	appendAdminStringSearchParam(searchParams, 'event', options.event);
	appendAdminNumberSearchParam(searchParams, 'start_time', options.startTime);
	appendAdminNumberSearchParam(searchParams, 'end_time', options.endTime);
	appendAdminStringSearchParam(searchParams, 'status', options.status);
	appendAdminStringSearchParam(searchParams, 'user_id', options.userId);

	return fetchAdminApiResult<IAdminSsoCallbackQueueListData>(
		`/api/v1/admin/sso/callbacks${createAdminSearchSuffix(searchParams)}`
	);
}

export function retryAdminSsoCallback(callbackId: number, csrfToken: string) {
	return fetchAdminApiResult<IAdminSsoCallbackQueueMutationData>(
		`/api/v1/admin/sso/callbacks/${encodeURIComponent(
			String(callbackId)
		)}/retry`,
		createAdminCsrfRequestInit('POST', csrfToken)
	);
}

export function discardAdminSsoCallback(callbackId: number, csrfToken: string) {
	return fetchAdminApiResult<IAdminSsoCallbackQueueMutationData>(
		`/api/v1/admin/sso/callbacks/${encodeURIComponent(String(callbackId))}`,
		createAdminCsrfRequestInit('DELETE', csrfToken)
	);
}

export function dispatchAdminSsoCallbacks(csrfToken: string) {
	return fetchAdminApiResult<{
		deleted_expired_tickets: number;
		deleted_final_failed_callbacks: number;
		failed: number;
		final_failed: number;
		message: string;
		succeeded: number;
	}>(
		'/api/v1/admin/sso/callbacks/dispatch',
		createAdminCsrfRequestInit('POST', csrfToken)
	);
}

export function listAdminSsoCallbackDeliveries(
	options: {
		clientId?: string;
		endTime?: number;
		event?: TAdminSsoCallbackEvent;
		page?: number;
		pageSize?: number;
		query?: string;
		startTime?: number;
		status?: TAdminSsoCallbackDeliveryStatus;
		userId?: string;
	} = {}
) {
	const searchParams = new URLSearchParams();
	appendAdminNumberSearchParam(searchParams, 'page', options.page);
	appendAdminNumberSearchParam(searchParams, 'page_size', options.pageSize);
	appendAdminStringSearchParam(searchParams, 'query', options.query);
	appendAdminStringSearchParam(searchParams, 'client_id', options.clientId);
	appendAdminStringSearchParam(searchParams, 'event', options.event);
	appendAdminNumberSearchParam(searchParams, 'start_time', options.startTime);
	appendAdminNumberSearchParam(searchParams, 'end_time', options.endTime);
	appendAdminStringSearchParam(searchParams, 'status', options.status);
	appendAdminStringSearchParam(searchParams, 'user_id', options.userId);

	return fetchAdminApiResult<IAdminSsoCallbackDeliveryListData>(
		`/api/v1/admin/sso/callbacks/history${createAdminSearchSuffix(
			searchParams
		)}`
	);
}

export function cleanupAdminSsoCallbackDeliveries(
	csrfToken: string,
	options: { before?: number; maxRows?: number } = {}
) {
	const searchParams = new URLSearchParams();
	appendAdminNumberSearchParam(searchParams, 'before', options.before);
	appendAdminNumberSearchParam(searchParams, 'max_rows', options.maxRows);

	return fetchAdminApiResult<IAdminSsoCallbackDeliveryCleanupData>(
		`/api/v1/admin/sso/callbacks/history${createAdminSearchSuffix(
			searchParams
		)}`,
		createAdminCsrfRequestInit('DELETE', csrfToken)
	);
}

export function listAdminSsoTickets(
	options: {
		clientId?: string;
		page?: number;
		pageSize?: number;
		query?: string;
		status?: TAdminSsoTicketStatus;
		userId?: string;
	} = {}
) {
	const searchParams = new URLSearchParams();
	appendAdminNumberSearchParam(searchParams, 'page', options.page);
	appendAdminNumberSearchParam(searchParams, 'page_size', options.pageSize);
	appendAdminStringSearchParam(searchParams, 'query', options.query);
	appendAdminStringSearchParam(searchParams, 'client_id', options.clientId);
	appendAdminStringSearchParam(searchParams, 'status', options.status);
	appendAdminStringSearchParam(searchParams, 'user_id', options.userId);

	return fetchAdminApiResult<IAdminSsoTicketListData>(
		`/api/v1/admin/sso/tickets${createAdminSearchSuffix(searchParams)}`
	);
}

export function cleanupAdminSsoTickets(csrfToken: string, expiredAt?: number) {
	return fetchAdminApiResult<IAdminSsoTicketMutationData>(
		'/api/v1/admin/sso/tickets',
		createAdminJsonRequestInit(
			'DELETE',
			expiredAt === undefined
				? { mode: 'cleanup-expired' }
				: { expired_at: expiredAt, mode: 'cleanup-expired' },
			csrfToken
		)
	);
}

export function revokeAdminSsoClientTickets(
	clientId: string,
	csrfToken: string,
	reason?: string
) {
	return fetchAdminApiResult<IAdminSsoTicketMutationData>(
		`/api/v1/admin/sso/tickets?client_id=${encodeURIComponent(clientId)}`,
		createAdminJsonRequestInit(
			'DELETE',
			reason === undefined
				? { mode: 'revoke-client' }
				: { mode: 'revoke-client', reason },
			csrfToken
		)
	);
}

export function revokeAdminUserSsoTickets(
	userId: string,
	csrfToken: string,
	reason?: string
) {
	return fetchAdminApiResult<IAdminSsoTicketMutationData>(
		`/api/v1/admin/sso/tickets?user_id=${encodeURIComponent(userId)}`,
		createAdminJsonRequestInit(
			'DELETE',
			reason === undefined
				? { mode: 'revoke-user' }
				: { mode: 'revoke-user', reason },
			csrfToken
		)
	);
}

export function listAdminAuditLogs(
	options: {
		action?: string;
		actorId?: string;
		actorType?: TAdminAuditActorType;
		endTime?: number;
		page?: number;
		pageSize?: number;
		query?: string;
		scope?: string;
		startTime?: number;
		targetId?: string;
		targetType?: string;
	} = {}
) {
	const searchParams = new URLSearchParams();
	appendAdminNumberSearchParam(searchParams, 'page', options.page);
	appendAdminNumberSearchParam(searchParams, 'page_size', options.pageSize);
	appendAdminStringSearchParam(searchParams, 'query', options.query);
	appendAdminStringSearchParam(searchParams, 'scope', options.scope);
	appendAdminStringSearchParam(searchParams, 'action', options.action);
	appendAdminStringSearchParam(searchParams, 'actor_type', options.actorType);
	appendAdminStringSearchParam(searchParams, 'actor_id', options.actorId);
	appendAdminStringSearchParam(
		searchParams,
		'target_type',
		options.targetType
	);
	appendAdminStringSearchParam(searchParams, 'target_id', options.targetId);
	appendAdminNumberSearchParam(searchParams, 'start_time', options.startTime);
	appendAdminNumberSearchParam(searchParams, 'end_time', options.endTime);

	return fetchAdminApiResult<IAdminAuditLogListData>(
		`/api/v1/admin/audit-logs${createAdminSearchSuffix(searchParams)}`
	);
}

export function listAdminSsoGrantEvents(
	options: {
		actorId?: string;
		actorType?: TAdminAuditActorType;
		clientId?: string;
		endTime?: number;
		event?: TAdminSsoGrantEvent;
		page?: number;
		pageSize?: number;
		query?: string;
		startTime?: number;
		userId?: string;
	} = {}
) {
	const searchParams = new URLSearchParams();
	appendAdminNumberSearchParam(searchParams, 'page', options.page);
	appendAdminNumberSearchParam(searchParams, 'page_size', options.pageSize);
	appendAdminStringSearchParam(searchParams, 'query', options.query);
	appendAdminStringSearchParam(searchParams, 'event', options.event);
	appendAdminStringSearchParam(searchParams, 'client_id', options.clientId);
	appendAdminStringSearchParam(searchParams, 'user_id', options.userId);
	appendAdminStringSearchParam(searchParams, 'actor_type', options.actorType);
	appendAdminStringSearchParam(searchParams, 'actor_id', options.actorId);
	appendAdminNumberSearchParam(searchParams, 'start_time', options.startTime);
	appendAdminNumberSearchParam(searchParams, 'end_time', options.endTime);

	return fetchAdminApiResult<IAdminSsoGrantEventListData>(
		`/api/v1/admin/sso/grant-events${createAdminSearchSuffix(searchParams)}`
	);
}
