import { ServiceApiError, fetchServiceApi } from '@/lib/api/serviceClient';
import type {
	IAccountUserProfile,
	IAdminLoginBody,
	IAdminMeData,
	IAdminResetPasswordBody,
	IAdminSsoClientCreateBody,
	IAdminSsoClientDetailData,
	IAdminSsoClientListData,
	IAdminSsoClientMutationData,
	IAdminSsoClientUpdateBody,
	IAdminUserDetailData,
	IAdminUserListData,
} from '@/lib/account/shared/types';
import type {
	IAdminAnnouncementBody,
	IAdminAnnouncementListData,
	IAdminAnnouncementMutationData,
	IAdminAnnouncementPreviewData,
	IAdminAnnouncementVersionListData,
} from '@/lib/announcements/shared/types';

export type TAdminApiResult<TData = Record<string, unknown>> =
	| { data: TData; status: 'ok' }
	| {
			data?: Record<string, unknown>;
			httpStatus: number;
			message: string;
			status: 'error';
	  };

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

export async function fetchAdminApiResult<TData>(
	path: string,
	init: RequestInit = {}
): Promise<TAdminApiResult<TData>> {
	try {
		return { data: await fetchServiceApi<TData>(path, init), status: 'ok' };
	} catch (error) {
		if (error instanceof ServiceApiError) {
			const data = readServiceErrorData(error);
			if (data === undefined) {
				return {
					httpStatus: error.status,
					message: error.message,
					status: 'error',
				};
			}

			return {
				data,
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

export type TAdminUserDetailApiResult<TData = Record<string, unknown>> =
	| { data: TData; detail: IAdminUserDetailData; status: 'ok' }
	| Extract<TAdminApiResult, { status: 'error' }>;

async function fetchAdminUserDetailApiResult<TData>(
	id: string,
	data: TData
): Promise<TAdminUserDetailApiResult<TData>> {
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
): Promise<TAdminUserDetailApiResult> {
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

	return fetchAdminUserDetailApiResult(id, result.data);
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
	return mutateAdminUserDetail<{ state_epoch: number }>(
		id,
		`/api/v1/admin/users/${encodeURIComponent(id)}/data`,
		createAdminCsrfRequestInit('DELETE', csrfToken)
	);
}

export function listAdminAnnouncements(
	options: {
		includeArchived?: boolean;
		page?: number;
		pageSize?: number;
		query?: string;
	} = {}
) {
	const searchParams = new URLSearchParams();
	if (options.includeArchived === true) {
		searchParams.set('include_archived', '1');
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

export function listAnnouncementVersions(id: string) {
	return fetchAdminApiResult<IAdminAnnouncementVersionListData>(
		`/api/v1/admin/announcements/${encodeURIComponent(id)}/versions`
	);
}

export type TAdminSsoClientApiResult<TData = Record<string, unknown>> =
	TAdminApiResult<TData>;

export function listAdminSsoClients() {
	return fetchAdminApiResult<IAdminSsoClientListData>(
		'/api/v1/admin/sso/clients'
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
	csrfToken: string,
	overrides: { disabled?: boolean; generateSecret?: boolean } = {}
) {
	return fetchAdminApiResult<IAdminSsoClientMutationData>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(id)}`,
		createAdminJsonRequestInit(
			'PUT',
			{
				...body,
				...(overrides.disabled === undefined
					? {}
					: { disabled: overrides.disabled }),
				...(overrides.generateSecret === undefined
					? {}
					: { generate_secret: overrides.generateSecret }),
			},
			csrfToken
		)
	);
}

export function generateAdminSsoClientSecret(
	id: string,
	body: IAdminSsoClientUpdateBody,
	csrfToken: string
) {
	return updateAdminSsoClient(id, body, csrfToken, {
		disabled: false,
		generateSecret: true,
	});
}

export function toggleAdminSsoClientDisabled(
	id: string,
	body: IAdminSsoClientUpdateBody,
	disabled: boolean,
	csrfToken: string
) {
	return updateAdminSsoClient(id, body, csrfToken, {
		disabled,
		generateSecret: false,
	});
}

export function deleteAdminSsoClient(id: string, csrfToken: string) {
	return fetchAdminApiResult<{ message: 'sso-client-deleted' }>(
		`/api/v1/admin/sso/clients/${encodeURIComponent(id)}`,
		createAdminCsrfRequestInit('DELETE', csrfToken)
	);
}
