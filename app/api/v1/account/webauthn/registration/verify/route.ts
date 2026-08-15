import { type RegistrationResponseJSON } from '@simplewebauthn/server';
import isObject from 'lodash/isObject.js';
import { type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';

import { ACCOUNT_API_RESPONSE_CODE_MAP } from '@/features/account/apiResponseCodes';
import {
	WEBAUTHN_MAX_CREDENTIALS_PER_USER,
	checkWebauthnCredentialNamePolicy,
	normalizeWebauthnCredentialName,
} from '@/features/account/constants';
import type { IWebauthnCredentialListData } from '@/features/account/contracts';
import { readJsonBodyResult } from '@/features/account/server/http/jsonBody';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';
import { createAccountAuthErrorRouteResponse } from '@/features/account/server/http/routeResponses';

import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SCOPE = 'webauthn-register-verify';

interface IWebauthnRegistrationVerifyBody {
	name?: unknown;
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

	const preAuthRateLimitResponse = checkAccountPreAuthRateLimitRouteResponse(
		request,
		SCOPE
	);
	if (preAuthRateLimitResponse !== null) {
		return preAuthRateLimitResponse;
	}

	const [authModule, csrfModule] = await Promise.all([
		import('@/features/account/server/auth/requestAuthentication'),
		import('@/features/account/server/auth/accountCsrf'),
	]);
	const auth = await authModule.authenticateAccountFromRequest(request);
	if (auth.status === 'error') {
		return createAccountAuthErrorRouteResponse(auth, request);
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		SCOPE
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	if (!csrfModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.forbidden,
			403
		);
	}

	const bodyResult =
		await readJsonBodyResult<IWebauthnRegistrationVerifyBody>(request);
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

	const registrationResponse = body.response as RegistrationResponseJSON;
	const name = normalizeWebauthnCredentialName(
		typeof body.name === 'string' ? body.name : ''
	);
	if (!checkWebauthnCredentialNamePolicy(name)) {
		return createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.invalidPasskeyName,
			400
		);
	}

	const [
		webauthnModule,
		presentationModule,
		credentialsModule,
		challengesModule,
	] = await Promise.all([
		import('@/features/account/webauthn/server/service'),
		import('@/features/account/webauthn/server/presentation'),
		import('@/features/account/webauthn/server/persistence/credentials'),
		import('@/features/account/webauthn/server/persistence/challenges'),
	]);

	const challengeCookie = webauthnModule.getWebauthnChallengeCookie(request);
	if (challengeCookie === undefined) {
		return createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.challengeNotFound,
			400
		);
	}

	const challengeResult =
		await challengesModule.consumeRegistrationChallengeForActiveSession(
			challengeCookie,
			auth.data.user.id,
			{ id: auth.data.session.id, token_hash: auth.data.sessionTokenHash }
		);
	if (challengeResult.status === 'unauthorized') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.unauthorized,
			401
		);
	}
	if (challengeResult.status === 'not-found') {
		const response = createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.challengeExpired,
			400
		);
		webauthnModule.clearWebauthnChallengeCookie(response, request);

		return response;
	}
	const { challenge } = challengeResult;

	let verification;
	try {
		verification = await webauthnModule.verifyRegistration({
			expectedChallenge: challenge.challenge,
			response: registrationResponse,
		});
	} catch {
		const response = createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.webauthnVerificationFailed,
			400
		);
		webauthnModule.clearWebauthnChallengeCookie(response, request);

		return response;
	}

	if (!verification.verified) {
		const response = createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.webauthnVerificationFailed,
			400
		);
		webauthnModule.clearWebauthnChallengeCookie(response, request);

		return response;
	}

	const { registrationInfo } = verification;
	const now = Date.now();
	const accountAuditModule =
		await import('@/features/account/server/audit/service');
	const createResult =
		await credentialsModule.createCredentialForActiveSession(
			{
				aaguid: registrationInfo.aaguid || null,
				backed_up: registrationInfo.credentialBackedUp ? 1 : 0,
				counter: registrationInfo.credential.counter,
				created_at: now,
				credential_id: registrationInfo.credential.id,
				device_type: registrationInfo.credentialDeviceType,
				id: randomUUID(),
				last_used_at: null,
				name,
				public_key: webauthnModule.encodePublicKey(
					registrationInfo.credential.publicKey
				),
				transports: webauthnModule.serializeTransports(
					registrationResponse.response.transports
				),
				user_id: auth.data.user.id,
			},
			WEBAUTHN_MAX_CREDENTIALS_PER_USER,
			{
				id: auth.data.session.id,
				token_hash: auth.data.sessionTokenHash,
			},
			(trx, auditNow) =>
				accountAuditModule.writeAccountAuditLogInTransaction(
					trx,
					accountAuditModule.createAccountUserAuditLogInput({
						action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
							.passkeyRegistered,
						metadata: {
							backed_up: registrationInfo.credentialBackedUp,
							device_type: registrationInfo.credentialDeviceType,
							nickname: auth.data.user.nickname,
							username: auth.data.user.username,
						},
						request,
						userId: auth.data.user.id,
					}),
					auditNow
				)
		);
	if (createResult.status === 'unauthorized') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.unauthorized,
			401
		);
	}
	if (createResult.status === 'too-many') {
		const response = createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.tooManyPasskeys,
			409
		);
		webauthnModule.clearWebauthnChallengeCookie(response, request);

		return response;
	}

	const { rpID } = webauthnModule.getWebAuthnRelyingParty();
	const response = createNoStoreJsonResponse({
		credentials: createResult.credentials.map((credential) =>
			presentationModule.createWebauthnCredentialSummary(credential)
		),
		rp_id: rpID,
	} satisfies IWebauthnCredentialListData);
	webauthnModule.clearWebauthnChallengeCookie(response, request);

	return response;
}
