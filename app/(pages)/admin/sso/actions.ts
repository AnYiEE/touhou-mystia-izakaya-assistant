'use server';

import { cookies } from 'next/headers';

import { createCurrentRequest } from '@/lib/account/server/currentRequest';
import {
	type TAccountGuardResult,
	authenticateAdminSession,
	checkAccountCookieSecurity,
	checkAccountFeature,
	checkAccountRateLimit,
	checkAdminCsrf,
	checkAdminFeature,
	checkSameOrigin,
} from '@/lib/account/server/guards';
import {
	parseAdminSsoClientCreateBody,
	parseAdminSsoClientUpdateBody,
} from '@/lib/account/server/adminSsoClientPayload';
import { validateSsoClientConfig } from '@/lib/account/server/sso';
import { ACCOUNT_COOKIE_NAME_MAP } from '@/lib/account/shared/constants';
import { type IAdminSsoClientMutationData } from '@/lib/account/shared/types';

export type TAdminSsoClientActionResult<TData = Record<string, unknown>> =
	| { data: TData; status: 'ok' }
	| {
			data?: Record<string, unknown>;
			httpStatus: number;
			message: string;
			status: 'error';
	  };

type TAdminSsoClientActionScope =
	| 'admin-create-sso-client'
	| 'admin-delete-sso-client'
	| 'admin-update-sso-client';

function createActionError(
	message: string,
	httpStatus: number,
	data?: Record<string, unknown>
): Extract<TAdminSsoClientActionResult, { status: 'error' }> {
	return data === undefined
		? { httpStatus, message, status: 'error' }
		: { data, httpStatus, message, status: 'error' };
}

function createGuardActionError(
	result: Extract<TAccountGuardResult, { status: 'error' }>
) {
	return createActionError(result.message, result.httpStatus, result.data);
}

function checkSsoClientConflictError(error: unknown) {
	if (error === null || typeof error !== 'object') {
		return false;
	}

	const code = Object.getOwnPropertyDescriptor(error, 'code')
		?.value as unknown;
	return (
		code === 'SQLITE_CONSTRAINT_PRIMARYKEY' ||
		code === 'SQLITE_CONSTRAINT_UNIQUE'
	);
}

function checkStringArrayEqual(left: string[], right: string[]) {
	return (
		left.length === right.length &&
		left.every((value, index) => value === right[index])
	);
}

function mergeStringArrays(...arrays: string[][]) {
	return [...new Set(arrays.flat())];
}

async function readAdminSessionToken() {
	const cookieStore = await cookies();

	return cookieStore.get(ACCOUNT_COOKIE_NAME_MAP.adminSession)?.value ?? null;
}

async function checkAdminSsoClientActionRequest(
	scope: TAdminSsoClientActionScope,
	csrfToken: unknown
): Promise<
	{ status: 'ok' } | Extract<TAdminSsoClientActionResult, { status: 'error' }>
> {
	const accountFeatureResult = await checkAccountFeature();
	if (accountFeatureResult.status === 'error') {
		return createGuardActionError(accountFeatureResult);
	}

	const adminFeatureResult = checkAdminFeature();
	if (adminFeatureResult.status === 'error') {
		return createGuardActionError(adminFeatureResult);
	}

	const request = await createCurrentRequest('/admin/sso/action');
	const sameOriginResult = checkSameOrigin(request);
	if (sameOriginResult.status === 'error') {
		return createGuardActionError(sameOriginResult);
	}

	const cookieSecurityResult = checkAccountCookieSecurity(request);
	if (cookieSecurityResult.status === 'error') {
		return createGuardActionError(cookieSecurityResult);
	}

	const rateLimitResult = checkAccountRateLimit(request, scope);
	if (rateLimitResult.status === 'error') {
		return createGuardActionError(rateLimitResult);
	}

	const adminSessionToken = await readAdminSessionToken();
	const adminAuthResult = authenticateAdminSession(adminSessionToken);
	if (adminAuthResult.status === 'error') {
		return createGuardActionError(adminAuthResult);
	}
	if (typeof csrfToken !== 'string') {
		return createActionError('forbidden', 403);
	}

	const csrfResult = checkAdminCsrf(csrfToken, adminAuthResult.data.token);
	if (csrfResult.status === 'error') {
		return createGuardActionError(csrfResult);
	}

	return { status: 'ok' };
}

async function readPublicClientProfile(id: string) {
	const ssoModule = await import('@/lib/account/server/sso');
	const client = await ssoModule.getSsoClientById(id);

	return client === null
		? null
		: ssoModule.createSsoClientPublicProfile(client);
}

async function createMutationSuccessResult(
	id: string,
	clientSecret?: string
): Promise<TAdminSsoClientActionResult<IAdminSsoClientMutationData>> {
	const client = await readPublicClientProfile(id);
	if (client === null) {
		return createActionError('sso-client-not-found', 404);
	}

	return {
		data: {
			client,
			...(clientSecret === undefined
				? {}
				: { client_secret: clientSecret }),
		},
		status: 'ok',
	};
}

export async function createAdminSsoClientAction(
	body: unknown,
	csrfToken: unknown
): Promise<TAdminSsoClientActionResult<IAdminSsoClientMutationData>> {
	const guard = await checkAdminSsoClientActionRequest(
		'admin-create-sso-client',
		csrfToken
	);
	if (guard.status === 'error') {
		return guard;
	}

	const parsedBody = parseAdminSsoClientCreateBody(body);
	if (parsedBody === null) {
		return createActionError('invalid-object-structure', 400);
	}

	const actionsModule = await import('@/lib/account/server/repositories/sso');
	try {
		const result = await actionsModule.createSsoClient(parsedBody);

		return await createMutationSuccessResult(
			result.client.id,
			result.client_secret
		);
	} catch (error) {
		if (checkSsoClientConflictError(error)) {
			return createActionError('sso-client-conflict', 409);
		}

		throw error;
	}
}

async function updateAdminSsoClient(
	id: unknown,
	body: unknown,
	csrfToken: unknown,
	overrides: { disabled?: boolean; generateSecret?: boolean } = {}
): Promise<TAdminSsoClientActionResult<IAdminSsoClientMutationData>> {
	const guard = await checkAdminSsoClientActionRequest(
		'admin-update-sso-client',
		csrfToken
	);
	if (guard.status === 'error') {
		return guard;
	}

	if (typeof id !== 'string') {
		return createActionError('invalid-object-structure', 400);
	}

	const parsedBody = parseAdminSsoClientUpdateBody(body);
	if (parsedBody?.id !== id) {
		return createActionError('invalid-object-structure', 400);
	}

	const [actionsModule, ssoModule] = await Promise.all([
		import('@/lib/account/server/repositories/sso'),
		import('@/lib/account/server/sso'),
	]);
	const currentClient = await ssoModule.getSsoClientById(id);
	if (currentClient === null) {
		return createActionError('sso-client-not-found', 404);
	}

	const shouldGenerateSecret =
		overrides.generateSecret ?? parsedBody.generate_secret;
	const shouldDisableClient = overrides.disabled ?? parsedBody.disabled;
	const isSecretMutation =
		shouldGenerateSecret ||
		!checkStringArrayEqual(
			parsedBody.secret_hashes,
			currentClient.secret_hashes
		);
	if (
		(currentClient.disabled_at !== null || shouldDisableClient) &&
		isSecretMutation
	) {
		return createActionError('client-disabled', 403);
	}

	const nextDisabledAt = shouldDisableClient
		? (currentClient.disabled_at ?? Date.now())
		: null;
	const secret = shouldGenerateSecret
		? actionsModule.createSsoClientSecret()
		: null;
	const secretHashes =
		secret === null
			? parsedBody.secret_hashes
			: mergeStringArrays(
					currentClient.secret_hashes,
					parsedBody.secret_hashes,
					[secret.secret_hash]
				);
	if (
		!validateSsoClientConfig({
			cancel_redirect_uri: parsedBody.cancel_redirect_uri,
			custom_scheme_redirect_uris: parsedBody.custom_scheme_redirect_uris,
			https_redirect_uris: parsedBody.https_redirect_uris,
			id: parsedBody.id,
			loopback_redirect_paths: parsedBody.loopback_redirect_paths,
			name: parsedBody.name,
			secret_hashes: secretHashes,
			status_callback_url: parsedBody.status_callback_url,
		})
	) {
		return createActionError('invalid-object-structure', 400);
	}

	const updated = await actionsModule.updateSsoClient({
		cancel_redirect_uri: parsedBody.cancel_redirect_uri,
		custom_scheme_redirect_uris: parsedBody.custom_scheme_redirect_uris,
		disabled_at: nextDisabledAt,
		https_redirect_uris: parsedBody.https_redirect_uris,
		id: parsedBody.id,
		loopback_redirect_paths: parsedBody.loopback_redirect_paths,
		name: parsedBody.name,
		secret_hashes: secretHashes,
		status_callback_url: parsedBody.status_callback_url,
	});
	if (updated === null) {
		return createActionError('sso-client-not-found', 404);
	}

	return createMutationSuccessResult(id, secret?.client_secret);
}

export async function updateAdminSsoClientAction(
	id: unknown,
	body: unknown,
	csrfToken: unknown
): Promise<TAdminSsoClientActionResult<IAdminSsoClientMutationData>> {
	return updateAdminSsoClient(id, body, csrfToken, { generateSecret: false });
}

export async function generateAdminSsoClientSecretAction(
	id: unknown,
	body: unknown,
	csrfToken: unknown
): Promise<TAdminSsoClientActionResult<IAdminSsoClientMutationData>> {
	return updateAdminSsoClient(id, body, csrfToken, {
		disabled: false,
		generateSecret: true,
	});
}

export async function toggleAdminSsoClientDisabledAction(
	id: unknown,
	body: unknown,
	disabled: boolean,
	csrfToken: unknown
): Promise<TAdminSsoClientActionResult<IAdminSsoClientMutationData>> {
	if (typeof disabled !== 'boolean') {
		return createActionError('invalid-object-structure', 400);
	}

	return updateAdminSsoClient(id, body, csrfToken, {
		disabled,
		generateSecret: false,
	});
}

export async function deleteAdminSsoClientAction(
	id: unknown,
	csrfToken: unknown
): Promise<TAdminSsoClientActionResult<{ message: 'sso-client-deleted' }>> {
	const guard = await checkAdminSsoClientActionRequest(
		'admin-delete-sso-client',
		csrfToken
	);
	if (guard.status === 'error') {
		return guard;
	}
	if (typeof id !== 'string') {
		return createActionError('invalid-object-structure', 400);
	}

	const actionsModule = await import('@/lib/account/server/repositories/sso');
	const isDeleted = await actionsModule.deleteSsoClient(id);
	if (!isDeleted) {
		return createActionError('sso-client-not-found', 404);
	}

	return { data: { message: 'sso-client-deleted' }, status: 'ok' };
}
