import { unstable_rethrow } from 'next/navigation';

import { authenticateAccountFromRequest, createAccountCsrfToken } from './auth';
import { createCurrentRequest } from './currentRequest';
import {
	checkAccountCookieSecurityGuard,
	checkAccountFeatureGuard,
} from './guards';
import { createAccountUserProfile } from './user';
import {
	type IAccountMeSuccessResponse,
	type IAccountSessionInitialData,
	type IAccountSsoGrantInitialData,
	type IAccountWebauthnInitialData,
	type TAccountMeResponse,
} from '../shared/types';
import { getLogSafeErrorCode } from '@/lib/logging';
import { getActiveUserStateSnapshotForSession } from '@/lib/account/server/repositories/userState';
import { createAccountSessionRecord } from '@/lib/account/server/sessionPresentation';

export interface IAccountFeatureInitialData {
	account: TAccountMeResponse;
	ssoGrants: IAccountSsoGrantInitialData | null;
	sessions: IAccountSessionInitialData | null;
	webauthn: IAccountWebauthnInitialData | null;
}

function createAccountAnonymousInitialData(): TAccountMeResponse {
	return {
		csrf_token: null,
		featureEnabled: true,
		has_password: false,
		isLoggedIn: false,
		password_must_change: false,
		state_epoch: null,
		syncMeta: null,
		user: null,
	};
}

export async function createAccountSsoGrantInitialDataForUser(
	userId: string,
	session: { id: string; token_hash: string }
): Promise<IAccountSsoGrantInitialData | null> {
	const ssoModule = await import('./sso');
	const grants = await ssoModule.listSsoUserClientGrantsForActiveUserSession(
		userId,
		session
	);
	if (grants.status === 'unauthorized') {
		return null;
	}

	return { grants: grants.grants, rendered_at: Date.now(), user_id: userId };
}

export async function createAccountSessionInitialDataForAuthenticatedRequest({
	sessionId,
	sessionTokenHash,
	userId,
}: {
	sessionId: string;
	sessionTokenHash: string;
	userId: string;
}): Promise<IAccountSessionInitialData | null> {
	const sessionsModule =
		await import('@/lib/account/server/repositories/sessions');
	const sessions = await sessionsModule.listSessionsForActiveUserSession(
		userId,
		{ id: sessionId, token_hash: sessionTokenHash }
	);
	if (sessions.status === 'unauthorized') {
		return null;
	}

	return {
		rendered_at: Date.now(),
		sessions: sessions.sessions.map((session) =>
			createAccountSessionRecord(session, sessionId)
		),
		user_id: userId,
	};
}

export async function createAccountWebauthnInitialDataForUser(
	userId: string,
	session: { id: string; token_hash: string }
): Promise<IAccountWebauthnInitialData | null> {
	const [credentialsModule, presentationModule] = await Promise.all([
		import('@/lib/account/server/repositories/webauthnCredentials'),
		import('@/lib/account/server/webauthnPresentation'),
	]);
	const webauthnModule = await import('@/lib/account/server/webauthn');
	const credentials =
		await credentialsModule.listCredentialsForActiveUserSession(
			userId,
			session
		);
	if (credentials.status === 'unauthorized') {
		return null;
	}
	const { rpID } = webauthnModule.getWebAuthnRelyingParty();

	return {
		credentials: credentials.credentials.map((credential) =>
			presentationModule.createWebauthnCredentialSummary(credential)
		),
		rendered_at: Date.now(),
		rp_id: rpID,
		user_id: userId,
	};
}

export async function createAccountMeInitialDataForAuthenticatedRequest({
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

	const revisions = stateSnapshot.records.reduce<Record<string, number>>(
		(result, namespace) => {
			result[namespace.namespace] = namespace.revision;
			return result;
		},
		{}
	);

	return {
		csrf_token: createAccountCsrfToken(sessionTokenHash),
		featureEnabled: true,
		has_password: stateSnapshot.credential.password_set === 1,
		isLoggedIn: true,
		password_must_change:
			stateSnapshot.credential.password_must_change === 1,
		state_epoch: stateSnapshot.user.state_epoch,
		syncMeta: {
			lastAppliedRemoteHash: {},
			revisions,
			state_epoch: stateSnapshot.user.state_epoch,
		},
		user: createAccountUserProfile(stateSnapshot.user),
	};
}

export async function readAccountSsoGrantInitialData(
	pathname = '/account/sso/grants/initial'
): Promise<IAccountSsoGrantInitialData | null> {
	try {
		const request = await createCurrentRequest(pathname);

		const accountFeatureResult = await checkAccountFeatureGuard();
		if (accountFeatureResult.status === 'error') {
			return null;
		}

		const cookieSecurityResult = checkAccountCookieSecurityGuard(request);
		if (cookieSecurityResult.status === 'error') {
			return null;
		}

		const auth = await authenticateAccountFromRequest(request);
		if (auth.status === 'error') {
			return null;
		}

		return await createAccountSsoGrantInitialDataForUser(
			auth.data.user.id,
			{ id: auth.data.session.id, token_hash: auth.data.sessionTokenHash }
		);
	} catch (error) {
		unstable_rethrow(error);

		console.warn('Account SSO grant initial data read failed.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return null;
	}
}

export async function readAccountFeatureInitialData(
	pathname = '/account/initial'
): Promise<IAccountFeatureInitialData | null> {
	try {
		const request = await createCurrentRequest(pathname);

		const accountFeatureResult = await checkAccountFeatureGuard();
		if (accountFeatureResult.status === 'error') {
			return null;
		}

		const cookieSecurityResult = checkAccountCookieSecurityGuard(request);
		if (cookieSecurityResult.status === 'error') {
			return null;
		}

		const auth = await authenticateAccountFromRequest(request, true);
		if (auth.status === 'error') {
			return auth.message === 'unauthorized'
				? {
						account: createAccountAnonymousInitialData(),
						sessions: null,
						ssoGrants: null,
						webauthn: null,
					}
				: null;
		}

		const account = await createAccountMeInitialDataForAuthenticatedRequest(
			{
				sessionId: auth.data.session.id,
				sessionTokenHash: auth.data.sessionTokenHash,
				userId: auth.data.user.id,
			}
		);
		if (account === null) {
			return null;
		}

		const passwordMustChange = account.password_must_change;
		const sessions = passwordMustChange
			? null
			: await createAccountSessionInitialDataForAuthenticatedRequest({
					sessionId: auth.data.session.id,
					sessionTokenHash: auth.data.sessionTokenHash,
					userId: auth.data.user.id,
				});
		const ssoGrants = passwordMustChange
			? null
			: await createAccountSsoGrantInitialDataForUser(auth.data.user.id, {
					id: auth.data.session.id,
					token_hash: auth.data.sessionTokenHash,
				});
		const webauthn = passwordMustChange
			? null
			: await createAccountWebauthnInitialDataForUser(auth.data.user.id, {
					id: auth.data.session.id,
					token_hash: auth.data.sessionTokenHash,
				});
		if (
			!passwordMustChange &&
			(sessions === null || ssoGrants === null || webauthn === null)
		) {
			return null;
		}

		return { account, sessions, ssoGrants, webauthn };
	} catch (error) {
		unstable_rethrow(error);

		console.warn('Account feature initial data read failed.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return null;
	}
}
