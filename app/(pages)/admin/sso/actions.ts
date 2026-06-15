'use server';

import { cookies } from 'next/headers';

import { createCurrentRequest } from '@/lib/account/server/currentRequest';
import {
	type TAccountGuardResult,
	authenticateAdminSessionToken,
	checkAccountCookieSecurityGuard,
	checkAccountFeatureGuard,
	checkAccountRateLimitGuard,
	checkAdminCsrfGuard,
	checkAdminFeatureGuard,
	checkSameOriginGuard,
} from '@/lib/account/server/guards';
import {
	parseAdminSsoClientCreateBody,
	parseAdminSsoClientUpdateBody,
} from '@/lib/account/server/adminSsoClientPayload';
import {
	ADMIN_SSO_CLIENT_SERVICE_ERROR_STATUS_MAP,
	type TAdminSsoClientServiceError,
	createAdminSsoClient as createAdminSsoClientRecord,
	deleteAdminSsoClient as deleteAdminSsoClientRecord,
	updateAdminSsoClient as updateAdminSsoClientRecord,
} from '@/lib/account/server/adminSsoClientService';
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

function createServiceActionError(error: TAdminSsoClientServiceError) {
	return createActionError(
		error,
		ADMIN_SSO_CLIENT_SERVICE_ERROR_STATUS_MAP[error]
	);
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
	const accountFeatureResult = await checkAccountFeatureGuard();
	if (accountFeatureResult.status === 'error') {
		return createGuardActionError(accountFeatureResult);
	}

	const adminFeatureResult = checkAdminFeatureGuard();
	if (adminFeatureResult.status === 'error') {
		return createGuardActionError(adminFeatureResult);
	}

	const request = await createCurrentRequest('/admin/sso/action');
	const sameOriginResult = checkSameOriginGuard(request);
	if (sameOriginResult.status === 'error') {
		return createGuardActionError(sameOriginResult);
	}

	const cookieSecurityResult = checkAccountCookieSecurityGuard(request);
	if (cookieSecurityResult.status === 'error') {
		return createGuardActionError(cookieSecurityResult);
	}

	const rateLimitResult = checkAccountRateLimitGuard(request, scope);
	if (rateLimitResult.status === 'error') {
		return createGuardActionError(rateLimitResult);
	}

	const adminSessionToken = await readAdminSessionToken();
	const adminAuthResult = authenticateAdminSessionToken(adminSessionToken);
	if (adminAuthResult.status === 'error') {
		return createGuardActionError(adminAuthResult);
	}
	if (typeof csrfToken !== 'string') {
		return createActionError('forbidden', 403);
	}

	const csrfResult = checkAdminCsrfGuard(
		csrfToken,
		adminAuthResult.data.token
	);
	if (csrfResult.status === 'error') {
		return createGuardActionError(csrfResult);
	}

	return { status: 'ok' };
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

	const result = await createAdminSsoClientRecord(parsedBody);
	if (result.status === 'error') {
		return createServiceActionError(result.error);
	}

	return { data: result.data, status: 'ok' };
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

	const result = await updateAdminSsoClientRecord(id, parsedBody, overrides);
	if (result.status === 'error') {
		return createServiceActionError(result.error);
	}

	return { data: result.data, status: 'ok' };
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

	const result = await deleteAdminSsoClientRecord(id);
	if (result.status === 'error') {
		return createServiceActionError(result.error);
	}

	return { data: result.data, status: 'ok' };
}
