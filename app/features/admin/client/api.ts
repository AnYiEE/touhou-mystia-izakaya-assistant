import { type TAccountSyncStatus } from '@/domain/account/contracts';

import { type ACCOUNT_API_RESPONSE_CODE_MAP } from '@/features/account/apiResponseCodes';
import type {
	IAccountUserProfile,
	IAdminAuditLogListData,
	IAdminLoginBody,
	IAdminMeData,
	IAdminResetPasswordBody,
	IAdminUserDetailData,
	IAdminUserListData,
} from '@/features/account/contracts';
import { type ADMIN_API_RESPONSE_CODE_MAP } from '@/features/admin/apiResponseCodes';
import type {
	TAdminApiResult,
	TAdminUserDetailApiResult,
} from '@/features/admin/contracts';
import {
	ADMIN_CLIENT_ERROR_MESSAGE_MAP,
	ADMIN_CLIENT_REQUEST_FALLBACK_MESSAGE_MAP,
	createAdminRateLimitErrorMessage,
} from '@/features/admin/copy';

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

function getAdminClientErrorMessage(error: ServiceApiError) {
	const mappedMessage = ADMIN_CLIENT_ERROR_MESSAGE_MAP[error.message];
	if (mappedMessage !== undefined) {
		return mappedMessage;
	}
	if (error.status === 0) {
		return ADMIN_CLIENT_REQUEST_FALLBACK_MESSAGE_MAP.networkFailed;
	}
	if (error.status === 429) {
		return error.retryAfter === null
			? ADMIN_CLIENT_REQUEST_FALLBACK_MESSAGE_MAP.rateLimited
			: createAdminRateLimitErrorMessage(error.retryAfter);
	}
	if (error.status >= 500) {
		return ADMIN_CLIENT_REQUEST_FALLBACK_MESSAGE_MAP.serverFailed;
	}

	return ADMIN_CLIENT_REQUEST_FALLBACK_MESSAGE_MAP.unexpected;
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
	return fetchAdminApiResult<{
		message: typeof ADMIN_API_RESPONSE_CODE_MAP.loggedOut;
	}>(
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
	return mutateAdminUserDetail<{
		message: typeof ACCOUNT_API_RESPONSE_CODE_MAP.passwordReset;
	}>(
		id,
		`/api/v1/admin/users/${encodeURIComponent(id)}/reset-password`,
		createJsonRequestInit('POST', body, csrfToken)
	);
}

export function disableAdminUser(id: string, csrfToken: string) {
	return mutateAdminUserDetail<{
		message: typeof ACCOUNT_API_RESPONSE_CODE_MAP.userDisabled;
	}>(
		id,
		`/api/v1/admin/users/${encodeURIComponent(id)}/disable`,
		createAdminCsrfRequestInit('POST', csrfToken)
	);
}

export function enableAdminUser(id: string, csrfToken: string) {
	return mutateAdminUserDetail<{
		message: typeof ACCOUNT_API_RESPONSE_CODE_MAP.userEnabled;
	}>(
		id,
		`/api/v1/admin/users/${encodeURIComponent(id)}/enable`,
		createAdminCsrfRequestInit('POST', csrfToken)
	);
}

export function restoreAdminUser(id: string, csrfToken: string) {
	return mutateAdminUserDetail<{
		message: typeof ACCOUNT_API_RESPONSE_CODE_MAP.userRestored;
	}>(
		id,
		`/api/v1/admin/users/${encodeURIComponent(id)}/restore`,
		createAdminCsrfRequestInit('POST', csrfToken)
	);
}

export function deleteAdminUserSessions(id: string, csrfToken: string) {
	return mutateAdminUserDetail<{
		message: typeof ACCOUNT_API_RESPONSE_CODE_MAP.sessionsDeleted;
	}>(
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
