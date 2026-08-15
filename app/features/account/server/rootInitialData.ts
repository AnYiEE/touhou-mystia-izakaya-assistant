import { unstable_rethrow } from 'next/navigation';

import type {
	IAccountSessionInitialData,
	IAccountSsoGrantInitialData,
	IAccountWebauthnInitialData,
	TAccountFeatureViewer,
	TAccountMeResponse,
} from '@/features/account/contracts';
import { getUserStateSnapshotInTransaction } from '@/features/account/sync/server';

import { createCurrentRequest } from '@/infrastructure/http/server/currentRequest';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import { authenticateAccountFromRequestWithTransaction } from './auth/requestAuthentication';
import {
	checkAccountCookieSecurityGuard,
	checkAccountFeatureGuard,
} from './http/guards';
import { createAccountMeInitialData } from './presentation/accountInitialData';
import { createAccountSessionRecord } from './presentation/session';

interface IAccountFeatureInitialData {
	account: TAccountMeResponse;
	sessions: IAccountSessionInitialData | null;
	ssoGrants: IAccountSsoGrantInitialData | null;
	viewer: TAccountFeatureViewer;
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
				import('./persistence/repositories/sessions'),
				import('@/features/account/sso/server/grants'),
				import('@/features/account/webauthn/server/persistence/credentials'),
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
			import('@/features/account/webauthn/server/presentation'),
			import('@/features/account/webauthn/server/service'),
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
