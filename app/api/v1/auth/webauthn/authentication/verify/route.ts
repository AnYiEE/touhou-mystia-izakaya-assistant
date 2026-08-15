import { type AuthenticationResponseJSON } from '@simplewebauthn/server';
import isObject from 'lodash/isObject.js';
import { type NextRequest } from 'next/server';

import { USER_STATUS_MAP } from '@/domain/account/contracts';

import { ACCOUNT_API_RESPONSE_CODE_MAP } from '@/features/account/apiResponseCodes';
import { readJsonBodyResult } from '@/features/account/server/http/jsonBody';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';

import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import { createNoStoreErrorResponse } from '@/infrastructure/http/server/responses';

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
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.payloadTooLarge,
			413
		);
	}

	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	if (body === null || !isObject(body.response)) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}

	const authenticationResponse = body.response as AuthenticationResponseJSON;
	const credentialId: unknown = authenticationResponse.id;
	if (typeof credentialId !== 'string') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}

	const [
		webauthnModule,
		challengesModule,
		webauthnCredentialsModule,
		usersModule,
		userModule,
		accountAuditModule,
		loginResponseModule,
		loginWithPasskeyModule,
	] = await Promise.all([
		import('@/features/account/webauthn/server/service'),
		import('@/features/account/webauthn/server/persistence/challenges'),
		import('@/features/account/webauthn/server/persistence/credentials'),
		import('@/features/account/server/persistence/repositories/users'),
		import('@/features/account/server/presentation/user'),
		import('@/features/account/server/audit/service'),
		import('@/features/account/server/http/loginResponse'),
		import('@/features/account/server/useCases/loginWithPasskey'),
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
		return createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.challengeNotFound,
			400
		);
	}

	const challenge = await challengesModule.consumeChallenge(
		challengeCookie,
		'authentication'
	);
	if (challenge === null) {
		const response = createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.challengeExpired,
			400
		);
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

	const result = await loginWithPasskeyModule.loginWithPasskey({
		credential,
		nextCounter: verification.authenticationInfo.newCounter,
		request,
		user,
	});
	if (result.status === 'error') {
		return respondInvalid(result.reason, result.targetId);
	}

	const response =
		await loginResponseModule.createAccountLoginSuccessResponse({
			hasPassword: result.hasPassword,
			passwordMustChange: result.passwordMustChange,
			request,
			session: result.session,
			user: userModule.createAccountUserProfile(result.user),
		});
	webauthnModule.clearWebauthnChallengeCookie(response, request);

	return response;
}
