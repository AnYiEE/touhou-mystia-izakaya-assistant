import {
	type IAccountExportData,
	type IAccountSsoGrantListData,
	type IAuthChangePasswordBody,
	type IAuthLoginBody,
	type IAuthLoginSuccessResponse,
	type IAuthRegisterBody,
	type TAccountMeResponse,
} from '@/lib/account/shared/types';
import {
	type ISyncImportBackupCodeResponse,
	type ISyncStateGetResponse,
	type ISyncStatePingBody,
	type ISyncStatePutBody,
	type ISyncStatePutResponse,
} from '@/lib/account/sync';
import {
	ServiceApiError,
	createServiceApiUrl,
	fetchServiceApi,
} from '@/lib/api/serviceClient';

export type {
	IAccountExportData,
	IAccountSsoGrantListData,
	IAuthChangePasswordBody,
	IAuthLoginBody,
	IAuthLoginSuccessResponse,
	IAuthRegisterBody,
	TAccountMeResponse,
} from '@/lib/account/shared/types';

export type TAccountApiResult<TData = Record<string, unknown>> =
	| { data: TData; status: 'ok' }
	| {
			data?: Record<string, unknown>;
			httpStatus: number;
			message: string;
			status: 'error';
	  };

export type TAuthLoginSuccessData = IAuthLoginSuccessResponse & {
	redirect_to?: string;
};

export class AccountApiError extends Error {
	readonly retryAfter: number | null;
	readonly status: number;

	constructor(
		message: string,
		status: number,
		retryAfter: number | null = null
	) {
		super(message);
		this.name = 'AccountApiError';
		this.retryAfter = retryAfter;
		this.status = status;
	}
}

function mapServiceApiError(error: unknown): never {
	if (error instanceof ServiceApiError) {
		throw new AccountApiError(
			error.message,
			error.status,
			error.retryAfter
		);
	}

	throw error;
}

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

async function fetchAccountApiResult<TData>(
	path: string,
	init: RequestInit = {}
): Promise<TAccountApiResult<TData>> {
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

function createJsonRequestInit(
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

function createCsrfRequestInit(method: string, csrfToken: string): RequestInit {
	return { headers: { 'X-CSRF-Token': csrfToken }, method };
}

export function loginAccount(body: IAuthLoginBody) {
	return fetchAccountApiResult<TAuthLoginSuccessData>(
		'/api/v1/auth/login',
		createJsonRequestInit('POST', body)
	);
}

export function registerAccount(body: IAuthRegisterBody) {
	return fetchAccountApiResult<TAuthLoginSuccessData>(
		'/api/v1/auth/register',
		createJsonRequestInit('POST', body)
	);
}

export function fetchAccountMe() {
	return fetchAccountApiResult<TAccountMeResponse>('/api/v1/account/me');
}

export function changeAccountPassword(
	body: IAuthChangePasswordBody,
	csrfToken: string
) {
	return fetchAccountApiResult<IAuthLoginSuccessResponse>(
		'/api/v1/auth/change-password',
		createJsonRequestInit('POST', body, csrfToken)
	);
}

export function logoutAccount(csrfToken: string) {
	return fetchAccountApiResult<{ message: 'logged-out' }>(
		'/api/v1/auth/logout',
		createCsrfRequestInit('POST', csrfToken)
	);
}

export function logoutAllAccount(csrfToken: string) {
	return fetchAccountApiResult<{ message: 'logged-out-all' }>(
		'/api/v1/auth/logout-all',
		createCsrfRequestInit('POST', csrfToken)
	);
}

export function exportAccountData() {
	return fetchAccountApiResult<IAccountExportData>('/api/v1/account/export');
}

export function deleteAccountData(csrfToken: string) {
	return fetchAccountApiResult<{ state_epoch: number }>(
		'/api/v1/account/delete-data',
		createCsrfRequestInit('DELETE', csrfToken)
	);
}

export function deleteAccount(csrfToken: string) {
	return fetchAccountApiResult<{ message: 'user-deleted' }>(
		'/api/v1/account/delete',
		createCsrfRequestInit('DELETE', csrfToken)
	);
}

export function refreshAccountSsoGrants() {
	return fetchAccountApiResult<IAccountSsoGrantListData>(
		'/api/v1/account/sso/grants'
	);
}

export async function revokeAccountSsoGrant(
	clientId: string,
	csrfToken: string
) {
	const result = await fetchAccountApiResult<{
		message: 'sso-grant-revoked';
	}>(
		`/api/v1/account/sso/grants/${encodeURIComponent(clientId)}`,
		createCsrfRequestInit('DELETE', csrfToken)
	);
	if (result.status === 'error') {
		return result;
	}

	return {
		data: { client_id: clientId, message: result.data.message },
		status: 'ok' as const,
	};
}

export async function fetchSyncState(namespaces: string[] = []) {
	const searchParams = new URLSearchParams();
	namespaces.forEach((namespace) => {
		searchParams.append('namespace', namespace);
	});
	const query = searchParams.toString();

	try {
		return await fetchServiceApi<ISyncStateGetResponse>(
			`/api/v1/sync/state${query === '' ? '' : `?${query}`}`
		);
	} catch (error) {
		mapServiceApiError(error);
	}
}

export async function putSyncState(body: ISyncStatePutBody, csrfToken: string) {
	try {
		return await fetchServiceApi<ISyncStatePutResponse>(
			'/api/v1/sync/state',
			{
				body: JSON.stringify(body),
				headers: {
					'Content-Type': 'application/json',
					'X-CSRF-Token': csrfToken,
				},
				method: 'PUT',
			}
		);
	} catch (error) {
		mapServiceApiError(error);
	}
}

export async function importBackupCode(code: string, csrfToken: string) {
	try {
		return await fetchServiceApi<ISyncImportBackupCodeResponse>(
			'/api/v1/sync/import-backup-code',
			{
				body: JSON.stringify({ code }),
				headers: {
					'Content-Type': 'application/json',
					'X-CSRF-Token': csrfToken,
				},
				method: 'POST',
			}
		);
	} catch (error) {
		mapServiceApiError(error);
	}
}

export function sendSyncPing(body: ISyncStatePingBody) {
	if (typeof fetch !== 'function') {
		return false;
	}

	try {
		void fetch(createServiceApiUrl('/api/v1/sync/ping'), {
			body: JSON.stringify(body),
			cache: 'no-store',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			keepalive: true,
			method: 'POST',
		});

		return true;
	} catch {
		return false;
	}
}
