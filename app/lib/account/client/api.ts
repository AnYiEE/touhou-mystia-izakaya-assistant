import {
	type PublicKeyCredentialCreationOptionsJSON,
	type PublicKeyCredentialRequestOptionsJSON,
	startAuthentication,
	startRegistration,
} from '@simplewebauthn/browser';

import {
	type IAccountExportData,
	type IAccountProfileUpdateBody,
	type IAccountSessionListData,
	type IAccountSsoGrantListData,
	type IAuthChangePasswordBody,
	type IAuthInitialPasswordBody,
	type IAuthLoginBody,
	type IAuthLoginSuccessResponse,
	type IAuthRegisterBody,
	type IWebauthnCredentialListData,
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
	IAccountSessionListData,
	IAccountSsoGrantListData,
	IAccountProfileUpdateBody,
	IAuthChangePasswordBody,
	IAuthInitialPasswordBody,
	IAuthLoginBody,
	IAuthLoginSuccessResponse,
	IAuthRegisterBody,
	IWebauthnCredentialListData,
	IWebauthnCredentialSummary,
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

export function setInitialAccountPassword(
	body: IAuthInitialPasswordBody,
	csrfToken: string
) {
	return fetchAccountApiResult<IAuthLoginSuccessResponse>(
		'/api/v1/account/password/initial',
		createJsonRequestInit('POST', body, csrfToken)
	);
}

export function changeAccountProfile(
	body: IAccountProfileUpdateBody,
	csrfToken: string
) {
	return fetchAccountApiResult<IAuthLoginSuccessResponse>(
		'/api/v1/account/profile',
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
	return fetchAccountApiResult<{
		deleted_current_session: boolean;
		message: 'logged-out-all';
	}>('/api/v1/auth/logout-all', createCsrfRequestInit('POST', csrfToken));
}

export function refreshAccountSessions() {
	return fetchAccountApiResult<IAccountSessionListData>(
		'/api/v1/account/sessions'
	);
}

export async function revokeAccountSession(
	sessionId: string,
	csrfToken: string
) {
	const result = await fetchAccountApiResult<{ message: 'session-revoked' }>(
		`/api/v1/account/sessions/${encodeURIComponent(sessionId)}`,
		createCsrfRequestInit('DELETE', csrfToken)
	);
	if (result.status === 'error') {
		return result;
	}

	return {
		data: { message: result.data.message, session_id: sessionId },
		status: 'ok' as const,
	};
}

function createWebAuthnCanceledResult(
	error: unknown
): Extract<TAccountApiResult, { status: 'error' }> {
	const errorName = error instanceof Error ? error.name : null;
	const message =
		errorName === 'AbortError' || errorName === 'NotAllowedError'
			? 'webauthn-canceled'
			: 'webauthn-failed';

	return { httpStatus: 0, message, status: 'error' };
}

export async function startWebAuthnRegistration(
	name: string,
	csrfToken: string
): Promise<TAccountApiResult<IWebauthnCredentialListData>> {
	const optionsResult = await fetchAccountApiResult<{
		options: PublicKeyCredentialCreationOptionsJSON;
	}>(
		'/api/v1/account/webauthn/registration/options',
		createJsonRequestInit('POST', undefined, csrfToken)
	);
	if (optionsResult.status === 'error') {
		return optionsResult;
	}

	let attestationResponse;
	try {
		attestationResponse = await startRegistration({
			optionsJSON: optionsResult.data.options,
		});
	} catch (error) {
		return createWebAuthnCanceledResult(error);
	}

	return fetchAccountApiResult<IWebauthnCredentialListData>(
		'/api/v1/account/webauthn/registration/verify',
		createJsonRequestInit(
			'POST',
			{ name, response: attestationResponse },
			csrfToken
		)
	);
}

export async function startWebAuthnAccountRegistration(
	name = ''
): Promise<TAccountApiResult<TAuthLoginSuccessData>> {
	const optionsResult = await fetchAccountApiResult<{
		options: PublicKeyCredentialCreationOptionsJSON;
	}>(
		'/api/v1/auth/webauthn/registration/options',
		createJsonRequestInit('POST')
	);
	if (optionsResult.status === 'error') {
		return optionsResult;
	}

	let attestationResponse;
	try {
		attestationResponse = await startRegistration({
			optionsJSON: optionsResult.data.options,
		});
	} catch (error) {
		return createWebAuthnCanceledResult(error);
	}

	return fetchAccountApiResult<TAuthLoginSuccessData>(
		'/api/v1/auth/webauthn/registration/verify',
		createJsonRequestInit('POST', { name, response: attestationResponse })
	);
}

export function listWebAuthnCredentials() {
	return fetchAccountApiResult<IWebauthnCredentialListData>(
		'/api/v1/account/webauthn/credentials'
	);
}

export async function deleteWebAuthnCredential(id: string, csrfToken: string) {
	const result = await fetchAccountApiResult<{ message: 'passkey-deleted' }>(
		`/api/v1/account/webauthn/credentials/${encodeURIComponent(id)}`,
		createCsrfRequestInit('DELETE', csrfToken)
	);
	if (result.status === 'error') {
		return result;
	}

	return {
		data: { id, message: result.data.message },
		status: 'ok' as const,
	};
}

export function renameWebAuthnCredential(
	id: string,
	name: string,
	csrfToken: string
) {
	return fetchAccountApiResult<IWebauthnCredentialListData>(
		`/api/v1/account/webauthn/credentials/${encodeURIComponent(id)}`,
		createJsonRequestInit('PATCH', { name }, csrfToken)
	);
}

interface IStartWebAuthnLoginOptions {
	useBrowserAutofill?: boolean;
}

export async function startWebAuthnLogin({
	useBrowserAutofill = false,
}: IStartWebAuthnLoginOptions = {}): Promise<
	TAccountApiResult<TAuthLoginSuccessData>
> {
	const optionsResult = await fetchAccountApiResult<{
		options: PublicKeyCredentialRequestOptionsJSON;
	}>(
		'/api/v1/auth/webauthn/authentication/options',
		createJsonRequestInit('POST')
	);
	if (optionsResult.status === 'error') {
		return optionsResult;
	}

	let assertionResponse;
	try {
		assertionResponse = await startAuthentication({
			optionsJSON: optionsResult.data.options,
			useBrowserAutofill,
		});
	} catch (error) {
		return createWebAuthnCanceledResult(error);
	}

	return fetchAccountApiResult<TAuthLoginSuccessData>(
		'/api/v1/auth/webauthn/authentication/verify',
		createJsonRequestInit('POST', { response: assertionResponse })
	);
}

export function exportAccountData() {
	return fetchAccountApiResult<IAccountExportData>('/api/v1/account/export');
}

export function deleteAccountData(csrfToken: string, stateEpoch: number) {
	return fetchAccountApiResult<{ state_epoch: number }>(
		'/api/v1/account/delete-data',
		createJsonRequestInit('DELETE', { state_epoch: stateEpoch }, csrfToken)
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
