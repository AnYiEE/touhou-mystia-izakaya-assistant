import { type NextRequest } from 'next/server';
import { type AuthenticationResponseJSON } from '@simplewebauthn/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	readJsonBodyResult,
} from '@/lib/account/server/routeResponses';
import { USER_STATUS_MAP } from '@/lib/account/shared/constants';
import { createNoStoreErrorResponse } from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SCOPE = 'webauthn-auth-verify';
const INVALID_MESSAGE = 'invalid-credentials';

interface IWebauthnAuthenticationVerifyBody {
	response?: unknown;
}

export async function POST(request: NextRequest) {
	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const sameOriginResponse = checkSameOriginRouteResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse =
		checkAccountCookieSecurityRouteResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		SCOPE,
		'',
		{ noTrustedIpGate: true }
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const bodyResult =
		await readJsonBodyResult<IWebauthnAuthenticationVerifyBody>(request);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}

	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	if (
		body === null ||
		typeof body.response !== 'object' ||
		body.response === null
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const authenticationResponse = body.response as AuthenticationResponseJSON;
	const credentialId: unknown = authenticationResponse.id;
	if (typeof credentialId !== 'string') {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const [
		webauthnModule,
		challengesModule,
		webauthnCredentialsModule,
		usersModule,
		credentialsModule,
		authModule,
		userModule,
		accountAuditModule,
		loginResponseModule,
	] = await Promise.all([
		import('@/lib/account/server/webauthn'),
		import('@/lib/account/server/repositories/webauthnChallenges'),
		import('@/lib/account/server/repositories/webauthnCredentials'),
		import('@/lib/account/server/repositories/users'),
		import('@/lib/account/server/repositories/credentials'),
		import('@/lib/account/server/auth'),
		import('@/lib/account/server/user'),
		import('@/lib/account/server/accountAuditService'),
		import('@/lib/account/server/loginResponse'),
	]);

	const respondInvalid = async (reason: string, targetId: string | null) => {
		await accountAuditModule.writeAccountAuditLogBestEffort(
			accountAuditModule.createAccountSystemAuditLogInput({
				action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP.loginFailed,
				metadata: { method: 'passkey', reason },
				request,
				targetId,
			})
		);
		const response = createNoStoreErrorResponse(INVALID_MESSAGE, 401);
		webauthnModule.clearWebauthnChallengeCookie(response, request);

		return response;
	};

	const challengeCookie = webauthnModule.getWebauthnChallengeCookie(request);
	if (challengeCookie === undefined) {
		return createNoStoreErrorResponse('challenge-not-found', 400);
	}

	const challenge = await challengesModule.consumeChallenge(
		challengeCookie,
		'authentication'
	);
	if (challenge === null) {
		const response = createNoStoreErrorResponse('challenge-expired', 400);
		webauthnModule.clearWebauthnChallengeCookie(response, request);

		return response;
	}

	const credential =
		await webauthnCredentialsModule.getCredentialByCredentialId(
			credentialId
		);
	if (credential === null) {
		return respondInvalid('credential-not-found', null);
	}

	const user = await usersModule.findUserById(credential.user_id);
	if (user?.status !== USER_STATUS_MAP.active) {
		return respondInvalid('user-not-active', credential.user_id);
	}

	let verification;
	try {
		verification = await webauthnModule.verifyAuthentication({
			credential: webauthnModule.toWebAuthnCredential(credential),
			expectedChallenge: challenge.challenge,
			response: authenticationResponse,
		});
	} catch {
		return respondInvalid('verification-error', user.id);
	}

	if (!verification.verified) {
		return respondInvalid('verification-failed', user.id);
	}

	const now = Date.now();
	await webauthnCredentialsModule.updateCredentialOnUse(
		credential.id,
		verification.authenticationInfo.newCounter,
		now
	);

	const passwordCredential = await credentialsModule.getCredentialByUserId(
		user.id
	);
	const hasPassword = passwordCredential?.password_set === 1;
	const passwordMustChange = passwordCredential?.password_must_change === 1;

	const session = await authModule.createAccountSessionForActiveUser(
		user.id,
		request,
		{ last_login_at: now, updated_at: now },
		undefined,
		(trx, auditNow) =>
			accountAuditModule.writeAccountAuditLogInTransaction(
				trx,
				accountAuditModule.createAccountUserAuditLogInput({
					action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
						.loginSucceeded,
					metadata: {
						method: 'passkey',
						must_change_on_next_login: passwordMustChange,
						nickname: user.nickname,
						username: user.username,
					},
					request,
					userId: user.id,
				}),
				auditNow
			)
	);
	if (session === null) {
		return respondInvalid('session-create-failed', user.id);
	}

	const response =
		await loginResponseModule.createAccountLoginSuccessResponse({
			hasPassword,
			passwordMustChange,
			request,
			session,
			user: userModule.createAccountUserProfile({
				...user,
				last_login_at: now,
				updated_at: now,
			}),
		});
	webauthnModule.clearWebauthnChallengeCookie(response, request);

	return response;
}
