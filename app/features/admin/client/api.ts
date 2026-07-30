import { type TAccountSyncStatus } from '@/domain/account/contracts';

import type {
	IAccountUserProfile,
	IAdminAuditLogListData,
	IAdminLoginBody,
	IAdminMeData,
	IAdminResetPasswordBody,
	IAdminUserDetailData,
	IAdminUserListData,
} from '@/features/account/contracts';
import type {
	TAdminApiResult,
	TAdminUserDetailApiResult,
} from '@/features/admin/contracts';

import { createJsonRequestInit } from '@/infrastructure/http/client/createJsonRequestInit';
import { fetchServiceApi } from '@/infrastructure/http/client/fetchServiceApi';
import {
	ServiceApiError,
	readServiceApiErrorData,
} from '@/infrastructure/http/client/serviceApiError';

import {
	appendAdminNumberSearchParam,
	appendAdminStringSearchParam,
	createAdminSearchSuffix,
} from './searchParams';

type TAdminAuditActorType =
	IAdminAuditLogListData['logs'][number]['actor_type'];

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
			const data = readServiceApiErrorData(error);
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
		createJsonRequestInit('POST', body)
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
		createJsonRequestInit('POST', { ids })
	);
}

type TAdminUserDetailRefreshApiResult<TData = Record<string, unknown>> =
	| { data: TData; detail: IAdminUserDetailData; status: 'ok' }
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
		createJsonRequestInit('POST', body, csrfToken)
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
