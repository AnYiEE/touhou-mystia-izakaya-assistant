'use server';

import {
	type TAccountActionResult,
	createAccountActionError as createActionError,
} from '@/lib/account/actions/utils';
import {
	authenticateAccountFromRequest,
	verifyAccountCsrfToken,
} from '@/lib/account/server/auth';
import { createCurrentRequest } from '@/lib/account/server/currentRequest';
import { deleteSsoUserClientGrant } from '@/lib/account/server/repositories/sso';
import {
	type TAccountGuardResult,
	checkAccountCookieSecurityGuard,
	checkAccountFeatureGuard,
	checkAccountRateLimitGuard,
	checkSameOriginGuard,
} from '@/lib/account/server/guards';
import {
	checkSsoClientId,
	listSsoUserClientGrantsForUser,
} from '@/lib/account/server/sso';
import { type IAccountSsoGrantListData } from '@/lib/account/shared/types';

export type TAccountSsoGrantActionResult<TData = Record<string, unknown>> =
	TAccountActionResult<TData>;

type TAccountSsoGrantActionScope =
	| 'account-list-sso-grants'
	| 'account-revoke-sso-grant';

function createGuardActionError(
	result: Extract<TAccountGuardResult, { status: 'error' }>
) {
	return createActionError(result.message, result.httpStatus, result.data);
}

async function authenticateAccountSsoGrantActionRequest(
	scope: TAccountSsoGrantActionScope
): Promise<
	| { sessionTokenHash: string; status: 'ok'; userId: string }
	| Extract<TAccountSsoGrantActionResult, { status: 'error' }>
> {
	const accountFeatureResult = await checkAccountFeatureGuard();
	if (accountFeatureResult.status === 'error') {
		return createGuardActionError(accountFeatureResult);
	}

	const request = await createCurrentRequest('/account/sso/grants/action');
	const sameOriginResult = checkSameOriginGuard(request);
	if (sameOriginResult.status === 'error') {
		return createGuardActionError(sameOriginResult);
	}

	const cookieSecurityResult = checkAccountCookieSecurityGuard(request);
	if (cookieSecurityResult.status === 'error') {
		return createGuardActionError(cookieSecurityResult);
	}

	const auth = await authenticateAccountFromRequest(request);
	if (auth.status === 'error') {
		return createActionError(auth.message, auth.httpStatus);
	}

	const rateLimitResult = checkAccountRateLimitGuard(request, scope);
	if (rateLimitResult.status === 'error') {
		return createGuardActionError(rateLimitResult);
	}

	return {
		sessionTokenHash: auth.data.sessionTokenHash,
		status: 'ok',
		userId: auth.data.user.id,
	};
}

export async function refreshAccountSsoGrantsAction(): Promise<
	TAccountSsoGrantActionResult<IAccountSsoGrantListData>
> {
	const auth = await authenticateAccountSsoGrantActionRequest(
		'account-list-sso-grants'
	);
	if (auth.status === 'error') {
		return auth;
	}

	const grants = await listSsoUserClientGrantsForUser(auth.userId);

	return { data: { grants }, status: 'ok' };
}

export async function revokeAccountSsoGrantAction(
	clientId: unknown,
	csrfToken: unknown
): Promise<
	TAccountSsoGrantActionResult<{
		client_id: string;
		message: 'sso-grant-revoked';
	}>
> {
	const auth = await authenticateAccountSsoGrantActionRequest(
		'account-revoke-sso-grant'
	);
	if (auth.status === 'error') {
		return auth;
	}

	if (typeof clientId !== 'string' || !checkSsoClientId(clientId)) {
		return createActionError('invalid-object-structure', 400);
	}
	if (
		typeof csrfToken !== 'string' ||
		!verifyAccountCsrfToken(csrfToken, auth.sessionTokenHash)
	) {
		return createActionError('forbidden', 403);
	}

	const deleted = await deleteSsoUserClientGrant(auth.userId, clientId);
	if (!deleted) {
		return createActionError('sso-grant-not-found', 404);
	}

	return {
		data: { client_id: clientId, message: 'sso-grant-revoked' },
		status: 'ok',
	};
}
