import { unstable_rethrow } from 'next/navigation';

import {
	authenticateAccountFromRequest,
	authenticateAccountFromRequestWithTransaction,
	createAccountCsrfToken,
} from './auth';
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
import {
	getActiveUserStateSnapshotForSession,
	getUserStateSnapshotInTransaction,
} from '@/lib/account/server/repositories/userState';
import { createAccountSessionRecord } from '@/lib/account/server/sessionPresentation';
import type { TUser, TUserCredential, TUserState } from '@/lib/db/types';

export interface IAccountFeatureInitialData {
	account: TAccountMeResponse;
	ssoGrants: IAccountSsoGrantInitialData | null;
	sessions: IAccountSessionInitialData | null;
	viewer: TAccountFeatureViewer;
	webauthn: IAccountWebauthnInitialData | null;
}

export type TAccountFeatureViewer =
	| { isAuthenticated: false }
	| {
			isAuthenticated: true;
			nickname: TUser['nickname'];
			userId: TUser['id'];
			username: TUser['username'];
	  };

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

function createAccountMeInitialData({
	credential,
	records,
	sessionTokenHash,
	user,
}: {
	credential: TUserCredential;
	records: TUserState[];
	sessionTokenHash: string;
	user: TUser;
}): IAccountMeSuccessResponse {
	const revisions = records.reduce<Record<string, number>>(
		(result, namespace) => {
			result[namespace.namespace] = namespace.revision;
			return result;
		},
		{}
	);

	return {
		csrf_token: createAccountCsrfToken(sessionTokenHash),
		featureEnabled: true,
		has_password: credential.password_set === 1,
		isLoggedIn: true,
		password_must_change: credential.password_must_change === 1,
		state_epoch: user.state_epoch,
		syncMeta: {
			lastAppliedRemoteHash: {},
			revisions,
			state_epoch: user.state_epoch,
			sync_generation: user.sync_generation,
			sync_status: user.sync_status,
		},
		user: createAccountUserProfile(user),
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

	return createAccountMeInitialData({
		credential: stateSnapshot.credential,
		records: stateSnapshot.records,
		sessionTokenHash,
		user: stateSnapshot.user,
	});
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

		const [sessionsModule, ssoModule, credentialsModule] =
			await Promise.all([
				import('@/lib/account/server/repositories/sessions'),
				import('@/lib/account/server/sso'),
				import('@/lib/account/server/repositories/webauthnCredentials'),
			]);
		const auth = await authenticateAccountFromRequestWithTransaction(
			request,
			async (trx, authenticatedAccount) => {
				const stateSnapshot = await getUserStateSnapshotInTransaction(
					trx,
					{
						credential: authenticatedAccount.credential,
						namespaces: null,
						user: authenticatedAccount.user,
					}
				);
				if (
					authenticatedAccount.credential.password_must_change === 1
				) {
					return {
						credentials: null,
						grantRecords: null,
						sessionRecords: null,
						stateSnapshot,
					};
				}

				const sessionRecords =
					await sessionsModule.listSessionsByUserIdInTransaction(
						trx,
						authenticatedAccount.user.id
					);
				const grantRecords =
					await ssoModule.listSsoUserClientGrantsForUserInTransaction(
						trx,
						authenticatedAccount.user.id
					);
				const credentials =
					await credentialsModule.listCredentialsByUserIdInTransaction(
						trx,
						authenticatedAccount.user.id
					);

				return {
					credentials,
					grantRecords,
					sessionRecords,
					stateSnapshot,
				};
			},
			true
		);
		if (auth.status === 'error') {
			return auth.message === 'unauthorized'
				? {
						account: createAccountAnonymousInitialData(),
						sessions: null,
						ssoGrants: null,
						viewer: { isAuthenticated: false },
						webauthn: null,
					}
				: null;
		}

		const { credentials, grantRecords, sessionRecords, stateSnapshot } =
			auth.result;
		const account = createAccountMeInitialData({
			credential: stateSnapshot.credential,
			records: stateSnapshot.records,
			sessionTokenHash: auth.data.sessionTokenHash,
			user: stateSnapshot.user,
		});
		const viewer = {
			isAuthenticated: true,
			nickname: stateSnapshot.user.nickname,
			userId: stateSnapshot.user.id,
			username: stateSnapshot.user.username,
		} satisfies TAccountFeatureViewer;
		if (credentials === null) {
			return {
				account,
				sessions: null,
				ssoGrants: null,
				viewer,
				webauthn: null,
			};
		}

		const sessions = {
			rendered_at: Date.now(),
			sessions: sessionRecords.map((session) =>
				createAccountSessionRecord(session, auth.data.session.id)
			),
			user_id: auth.data.user.id,
		} satisfies IAccountSessionInitialData;
		const ssoGrants = {
			grants: grantRecords.map(ssoModule.createSsoUserClientGrant),
			rendered_at: Date.now(),
			user_id: auth.data.user.id,
		} satisfies IAccountSsoGrantInitialData;
		const [presentationModule, webauthnModule] = await Promise.all([
			import('@/lib/account/server/webauthnPresentation'),
			import('@/lib/account/server/webauthn'),
		]);
		const { rpID } = webauthnModule.getWebAuthnRelyingParty();
		const webauthn = {
			credentials: credentials.map((credential) =>
				presentationModule.createWebauthnCredentialSummary(credential)
			),
			rendered_at: Date.now(),
			rp_id: rpID,
			user_id: auth.data.user.id,
		} satisfies IAccountWebauthnInitialData;

		return { account, sessions, ssoGrants, viewer, webauthn };
	} catch (error) {
		unstable_rethrow(error);

		console.warn('Account feature initial data read failed.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return null;
	}
}
