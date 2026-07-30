import { cookies } from 'next/headers';
import { unstable_rethrow } from 'next/navigation';

import { USER_STATUS_MAP } from '@/domain/account/contracts';

import type {
	IAccountMeSuccessResponse,
	IAccountSsoGrantInitialData,
} from '@/features/account/contracts';
import { authenticateAccountFromRequest } from '@/features/account/server/auth/requestAuthentication';
import { createAccountMeInitialData } from '@/features/account/server/presentation/accountInitialData';
import {
	SSO_CONTEXT_COOKIE_NAME,
	getSsoContextCookieValue,
} from '@/features/account/sso/server/context';
import { checkSsoClientEnabled } from '@/features/account/sso/server/validation';
import { getActiveUserStateSnapshotForSession } from '@/features/account/sync/server';

import { createCurrentRequest } from '@/infrastructure/http/server/currentRequest';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

interface IMessageInitialData {
	kind: 'message';
	status: string | null;
}

interface ILoginRequiredInitialData {
	kind: 'login-required';
}

interface IPasswordChangeRequiredInitialData {
	account: IAccountMeSuccessResponse;
	kind: 'password-change-required';
}

interface IReadyInitialData {
	account: IAccountMeSuccessResponse;
	accountLabel: string;
	clientName: string;
	kind: 'ready';
	ssoGrants: IAccountSsoGrantInitialData;
	transactionId: string;
}

export type TSsoAuthorizeInitialData =
	| ILoginRequiredInitialData
	| IMessageInitialData
	| IPasswordChangeRequiredInitialData
	| IReadyInitialData;

async function createAccountSsoGrantInitialDataForUser(
	userId: string,
	session: { id: string; token_hash: string }
): Promise<IAccountSsoGrantInitialData | null> {
	const ssoModule = await import('@/features/account/sso/server/grants');
	const grants = await ssoModule.listSsoUserClientGrantsForActiveUserSession(
		userId,
		session
	);
	if (grants.status === 'unauthorized') {
		return null;
	}

	return { grants: grants.grants, rendered_at: Date.now(), user_id: userId };
}

async function createAccountMeInitialDataForAuthenticatedRequest({
	sessionId,
	sessionTokenHash,
	userId,
}: {
	sessionId: string;
	sessionTokenHash: string;
	userId: string;
}): Promise<IAccountMeSuccessResponse | null> {
	const stateSnapshot = await getActiveUserStateSnapshotForSession({
		namespaces: null,
		session: { id: sessionId, token_hash: sessionTokenHash },
		userId,
	});
	if (stateSnapshot.status === 'unauthorized') {
		return null;
	}

	return createAccountMeInitialData({
		credential: stateSnapshot.credential,
		records: stateSnapshot.records,
		sessionTokenHash,
		user: stateSnapshot.user,
	});
}

export async function readSsoAuthorizeInitialData(
	status: string | null
): Promise<TSsoAuthorizeInitialData> {
	const cookieStore = await cookies();
	const context = getSsoContextCookieValue(
		cookieStore.get(SSO_CONTEXT_COOKIE_NAME)?.value
	);
	if (context === null) {
		return { kind: 'message', status };
	}

	try {
		const request = await createCurrentRequest('/sso/authorize');
		const auth = await authenticateAccountFromRequest(request, true);
		if (auth.status === 'error') {
			return auth.message === 'unauthorized'
				? { kind: 'login-required' }
				: { kind: 'message', status: 'invalid' };
		}

		const account = await createAccountMeInitialDataForAuthenticatedRequest(
			{
				sessionId: auth.data.session.id,
				sessionTokenHash: auth.data.sessionTokenHash,
				userId: auth.data.user.id,
			}
		);
		if (account === null) {
			return { kind: 'message', status: 'invalid' };
		}
		if (account.password_must_change) {
			return { account, kind: 'password-change-required' };
		}
		if (auth.data.user.status !== USER_STATUS_MAP.active) {
			return { kind: 'message', status: 'invalid' };
		}

		const ssoModule = await import('@/features/account/sso/server');
		const client = await ssoModule.getSsoClientById(context.client_id);
		if (
			client === null ||
			!checkSsoClientEnabled(client) ||
			!ssoModule.validateSsoRedirectUri(client, context.redirect_uri)
		) {
			return { kind: 'message', status: 'invalid' };
		}

		const ssoGrants = await createAccountSsoGrantInitialDataForUser(
			auth.data.user.id,
			{ id: auth.data.session.id, token_hash: auth.data.sessionTokenHash }
		);
		if (ssoGrants === null) {
			return { kind: 'message', status: 'invalid' };
		}

		return {
			account,
			accountLabel:
				auth.data.user.nickname === null
					? `用户名：${auth.data.user.username}`
					: `用户名：${auth.data.user.username}，昵称：${auth.data.user.nickname}`,
			clientName: client.name,
			kind: 'ready',
			ssoGrants,
			transactionId: context.transaction_id,
		};
	} catch (error) {
		unstable_rethrow(error);
		console.warn('SSO authorize page failed.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return { kind: 'message', status: 'invalid' };
	}
}
