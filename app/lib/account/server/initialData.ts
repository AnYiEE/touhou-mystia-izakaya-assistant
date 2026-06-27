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
import { getUserStateSnapshot } from '@/lib/account/server/repositories/userState';
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
	userId: string
): Promise<IAccountSsoGrantInitialData> {
	const ssoModule = await import('./sso');
	const grants = await ssoModule.listSsoUserClientGrantsForUser(userId);

	return { grants, rendered_at: Date.now(), user_id: userId };
}

export async function createAccountSessionInitialDataForAuthenticatedRequest({
	sessionId,
	userId,
}: {
	sessionId: string;
	userId: string;
}): Promise<IAccountSessionInitialData> {
	const sessionsModule =
		await import('@/lib/account/server/repositories/sessions');
	const sessions = await sessionsModule.listSessionsByUserId(userId);

	return {
		rendered_at: Date.now(),
		sessions: sessions.map((session) =>
			createAccountSessionRecord(session, sessionId)
		),
		user_id: userId,
	};
}

export async function createAccountWebauthnInitialDataForUser(
	userId: string
): Promise<IAccountWebauthnInitialData> {
	const [credentialsModule, presentationModule] = await Promise.all([
		import('@/lib/account/server/repositories/webauthnCredentials'),
		import('@/lib/account/server/webauthnPresentation'),
	]);
	const webauthnModule = await import('@/lib/account/server/webauthn');
	const credentials = await credentialsModule.listCredentialsByUserId(userId);
	const { rpID } = webauthnModule.getWebAuthnRelyingParty();

	return {
		credentials: credentials.map((credential) =>
			presentationModule.createWebauthnCredentialSummary(credential)
		),
		rendered_at: Date.now(),
		rp_id: rpID,
		user_id: userId,
	};
}

export async function createAccountMeInitialDataForAuthenticatedRequest({
	hasPassword = true,
	sessionTokenHash,
	userId,
}: {
	hasPassword?: boolean;
	sessionTokenHash: string;
	userId: string;
}): Promise<IAccountMeSuccessResponse | null> {
	const stateSnapshot = await getUserStateSnapshot(userId);
	if (stateSnapshot === null) {
		return null;
	}

	const revisions = stateSnapshot.state.reduce<Record<string, number>>(
		(result, namespace) => {
			result[namespace.namespace] = namespace.revision;
			return result;
		},
		{}
	);

	return {
		csrf_token: createAccountCsrfToken(sessionTokenHash),
		featureEnabled: true,
		has_password: hasPassword,
		isLoggedIn: true,
		password_must_change: false,
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
		const accountFeatureResult = await checkAccountFeatureGuard();
		if (accountFeatureResult.status === 'error') {
			return null;
		}

		const request = await createCurrentRequest(pathname);
		const cookieSecurityResult = checkAccountCookieSecurityGuard(request);
		if (cookieSecurityResult.status === 'error') {
			return null;
		}

		const auth = await authenticateAccountFromRequest(request);
		if (auth.status === 'error') {
			return null;
		}

		return await createAccountSsoGrantInitialDataForUser(auth.data.user.id);
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
		const accountFeatureResult = await checkAccountFeatureGuard();
		if (accountFeatureResult.status === 'error') {
			return null;
		}

		const request = await createCurrentRequest(pathname);
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
				hasPassword: auth.data.credential.password_set === 1,
				sessionTokenHash: auth.data.sessionTokenHash,
				userId: auth.data.user.id,
			}
		);
		if (account === null) {
			return null;
		}

		const passwordMustChange =
			auth.data.credential.password_must_change === 1;
		const sessions = passwordMustChange
			? null
			: await createAccountSessionInitialDataForAuthenticatedRequest({
					sessionId: auth.data.session.id,
					userId: auth.data.user.id,
				});
		const ssoGrants = passwordMustChange
			? null
			: await createAccountSsoGrantInitialDataForUser(auth.data.user.id);
		const webauthn = passwordMustChange
			? null
			: await createAccountWebauthnInitialDataForUser(auth.data.user.id);

		return {
			account: { ...account, password_must_change: passwordMustChange },
			sessions,
			ssoGrants,
			webauthn,
		};
	} catch (error) {
		unstable_rethrow(error);

		console.warn('Account feature initial data read failed.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return null;
	}
}
