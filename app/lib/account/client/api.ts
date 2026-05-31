import {
	type IAccountUserProfile,
	type IAdminLoginBody,
	type IAdminResetPasswordBody,
	type IAuthChangePasswordBody,
	type IAuthLoginBody,
	type IAuthLoginSuccessResponse,
	type IAuthRegisterBody,
	type TAccountMeResponse,
	type TUserStatus,
} from '@/lib/account/shared/types';
import {
	type ISyncImportBackupCodeResponse,
	type ISyncStateGetResponse,
	type ISyncStatePingBody,
	type ISyncStatePutBody,
	type ISyncStatePutResponse,
} from '@/lib/account/sync';

export class AccountApiError extends Error {
	readonly status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = 'AccountApiError';
		this.status = status;
	}
}

async function readAccountApiResponse<T>(response: Response) {
	let json: unknown;
	try {
		json = await response.json();
	} catch {
		throw new AccountApiError(
			response.statusText || 'invalid-api-response',
			response.status
		);
	}

	if (json === null || Array.isArray(json) || typeof json !== 'object') {
		throw new AccountApiError('invalid-api-response', response.status);
	}

	if ('status' in json && json.status === 'error') {
		if ('message' in json && typeof json.message === 'string') {
			throw new AccountApiError(json.message, response.status);
		}

		throw new AccountApiError('invalid-api-response', response.status);
	}

	if ('status' in json && json.status === 'ok' && 'data' in json) {
		return json.data as T;
	}

	throw new AccountApiError('invalid-api-response', response.status);
}

export interface IAccountExportData {
	state: Array<{
		data: string;
		namespace: string;
		revision: number;
		schema_version: number;
		updated_at: number;
		user_id: string;
	}>;
	state_epoch: number;
	user: IAccountUserProfile;
}

export interface IAdminMeData {
	csrf_token: string;
	username: string;
}

export interface IAdminUserListData {
	page: number;
	page_size: number;
	users: IAccountUserProfile[];
}

export interface IAdminUserDetailData {
	namespaces: Array<{
		namespace: string;
		revision: number;
		schema_version: number;
		updated_at: number;
	}>;
	session_count: number;
	user: IAccountUserProfile;
}

function createAccountRequestInit(init: RequestInit = {}) {
	const headers = new Headers(init.headers);
	if (!headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}

	return {
		cache: 'no-store',
		credentials: 'same-origin',
		...init,
		headers,
	} satisfies RequestInit;
}

export async function fetchAccountMe() {
	return readAccountApiResponse<TAccountMeResponse>(
		await fetch('/api/v1/account/me', createAccountRequestInit())
	);
}

export async function registerAccount(body: IAuthRegisterBody) {
	return readAccountApiResponse<IAuthLoginSuccessResponse>(
		await fetch(
			'/api/v1/auth/register',
			createAccountRequestInit({
				body: JSON.stringify(body),
				method: 'POST',
			})
		)
	);
}

export async function loginAccount(body: IAuthLoginBody) {
	return readAccountApiResponse<IAuthLoginSuccessResponse>(
		await fetch(
			'/api/v1/auth/login',
			createAccountRequestInit({
				body: JSON.stringify(body),
				method: 'POST',
			})
		)
	);
}

export async function changeAccountPassword(
	body: IAuthChangePasswordBody,
	csrfToken: string
) {
	return readAccountApiResponse<IAuthLoginSuccessResponse>(
		await fetch(
			'/api/v1/auth/change-password',
			createAccountRequestInit({
				body: JSON.stringify(body),
				headers: { 'x-csrf-token': csrfToken },
				method: 'POST',
			})
		)
	);
}

export async function logoutAccount(csrfToken: string) {
	return readAccountApiResponse(
		await fetch(
			'/api/v1/auth/logout',
			createAccountRequestInit({
				headers: { 'x-csrf-token': csrfToken },
				method: 'POST',
			})
		)
	);
}

export async function logoutAllAccount(csrfToken: string) {
	return readAccountApiResponse(
		await fetch(
			'/api/v1/auth/logout-all',
			createAccountRequestInit({
				headers: { 'x-csrf-token': csrfToken },
				method: 'POST',
			})
		)
	);
}

export async function exportAccountData() {
	return readAccountApiResponse<IAccountExportData>(
		await fetch('/api/v1/account/export', createAccountRequestInit())
	);
}

export async function deleteAccountData(csrfToken: string) {
	return readAccountApiResponse<{ state_epoch: number }>(
		await fetch(
			'/api/v1/account/delete-data',
			createAccountRequestInit({
				headers: { 'x-csrf-token': csrfToken },
				method: 'DELETE',
			})
		)
	);
}

export async function deleteAccount(csrfToken: string) {
	return readAccountApiResponse(
		await fetch(
			'/api/v1/account/delete',
			createAccountRequestInit({
				headers: { 'x-csrf-token': csrfToken },
				method: 'DELETE',
			})
		)
	);
}

export async function fetchSyncState(namespaces: string[] = []) {
	const searchParams = new URLSearchParams();
	namespaces.forEach((namespace) => {
		searchParams.append('namespace', namespace);
	});

	return readAccountApiResponse<ISyncStateGetResponse>(
		await fetch(
			`/api/v1/sync/state${searchParams.size > 0 ? `?${searchParams}` : ''}`,
			createAccountRequestInit()
		)
	);
}

export async function putSyncState(body: ISyncStatePutBody, csrfToken: string) {
	return readAccountApiResponse<ISyncStatePutResponse>(
		await fetch(
			'/api/v1/sync/state',
			createAccountRequestInit({
				body: JSON.stringify(body),
				headers: { 'x-csrf-token': csrfToken },
				method: 'PUT',
			})
		)
	);
}

export async function importBackupCode(code: string, csrfToken: string) {
	return readAccountApiResponse<ISyncImportBackupCodeResponse>(
		await fetch(
			'/api/v1/sync/import-backup-code',
			createAccountRequestInit({
				body: JSON.stringify({ code }),
				headers: { 'x-csrf-token': csrfToken },
				method: 'POST',
			})
		)
	);
}

export function sendSyncPing(body: ISyncStatePingBody) {
	if (typeof navigator.sendBeacon !== 'function') {
		return false;
	}

	try {
		return navigator.sendBeacon(
			'/api/v1/sync/ping',
			new Blob([JSON.stringify(body)], { type: 'application/json' })
		);
	} catch {
		return false;
	}
}

export async function loginAdmin(body: IAdminLoginBody) {
	return readAccountApiResponse<IAdminMeData>(
		await fetch(
			'/api/v1/admin/auth/login',
			createAccountRequestInit({
				body: JSON.stringify(body),
				method: 'POST',
			})
		)
	);
}

export async function logoutAdmin(csrfToken: string) {
	return readAccountApiResponse(
		await fetch(
			'/api/v1/admin/auth/logout',
			createAccountRequestInit({
				headers: { 'x-csrf-token': csrfToken },
				method: 'POST',
			})
		)
	);
}

export async function fetchAdminMe() {
	return readAccountApiResponse<IAdminMeData>(
		await fetch('/api/v1/admin/me', createAccountRequestInit())
	);
}

export async function listAdminUsers({
	page = 1,
	query = '',
	status,
}: {
	page?: number;
	query?: string;
	status?: TUserStatus | '';
}) {
	const searchParams = new URLSearchParams({ page: String(page) });
	if (query.trim() !== '') {
		searchParams.set('query', query.trim());
	}
	if (status !== undefined && status !== '') {
		searchParams.set('status', status);
	}

	return readAccountApiResponse<IAdminUserListData>(
		await fetch(
			`/api/v1/admin/users?${searchParams}`,
			createAccountRequestInit()
		)
	);
}

function createAdminUserPath(id: string) {
	return `/api/v1/admin/users/${encodeURIComponent(id)}`;
}

export async function fetchAdminUser(id: string) {
	const path = createAdminUserPath(id);

	return readAccountApiResponse<IAdminUserDetailData>(
		await fetch(path, createAccountRequestInit())
	);
}

export async function resetAdminUserPassword(
	id: string,
	body: IAdminResetPasswordBody,
	csrfToken: string
) {
	const path = createAdminUserPath(id);

	return readAccountApiResponse(
		await fetch(
			`${path}/reset-password`,
			createAccountRequestInit({
				body: JSON.stringify(body),
				headers: { 'x-csrf-token': csrfToken },
				method: 'POST',
			})
		)
	);
}

export async function disableAdminUser(id: string, csrfToken: string) {
	const path = createAdminUserPath(id);

	return readAccountApiResponse(
		await fetch(
			`${path}/disable`,
			createAccountRequestInit({
				headers: { 'x-csrf-token': csrfToken },
				method: 'POST',
			})
		)
	);
}

export async function enableAdminUser(id: string, csrfToken: string) {
	const path = createAdminUserPath(id);

	return readAccountApiResponse(
		await fetch(
			`${path}/enable`,
			createAccountRequestInit({
				headers: { 'x-csrf-token': csrfToken },
				method: 'POST',
			})
		)
	);
}

export async function deleteAdminUserSessions(id: string, csrfToken: string) {
	const path = createAdminUserPath(id);

	return readAccountApiResponse(
		await fetch(
			`${path}/sessions`,
			createAccountRequestInit({
				headers: { 'x-csrf-token': csrfToken },
				method: 'DELETE',
			})
		)
	);
}
