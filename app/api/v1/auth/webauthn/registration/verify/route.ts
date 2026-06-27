import { type NextRequest } from 'next/server';
import { randomBytes, randomUUID } from 'node:crypto';
import { type RegistrationResponseJSON } from '@simplewebauthn/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	readJsonBodyResult,
} from '@/lib/account/server/routeResponses';
import {
	USER_STATUS_MAP,
	checkWebauthnCredentialNamePolicy,
	normalizeWebauthnCredentialName,
} from '@/lib/account/shared/constants';
import { createNoStoreErrorResponse } from '@/lib/api/routeResponses';
import { getLogSafeErrorCode } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SCOPE = 'webauthn-account-register-verify';

interface IWebauthnAccountRegistrationVerifyBody {
	name?: unknown;
	response?: unknown;
}

function createTemporaryPassword() {
	return randomBytes(48).toString('base64url');
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
		await readJsonBodyResult<IWebauthnAccountRegistrationVerifyBody>(
			request
		);
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

	const registrationResponse = body.response as RegistrationResponseJSON;
	const name = normalizeWebauthnCredentialName(
		typeof body.name === 'string' ? body.name : ''
	);
	if (!checkWebauthnCredentialNamePolicy(name)) {
		return createNoStoreErrorResponse('invalid-passkey-name', 400);
	}

	const [
		webauthnModule,
		challengesModule,
		passwordModule,
		usersModule,
		authModule,
		userModule,
		accountAuditModule,
		loginResponseModule,
	] = await Promise.all([
		import('@/lib/account/server/webauthn'),
		import('@/lib/account/server/repositories/webauthnChallenges'),
		import('@/lib/account/server/password'),
		import('@/lib/account/server/repositories/users'),
		import('@/lib/account/server/auth'),
		import('@/lib/account/server/user'),
		import('@/lib/account/server/accountAuditService'),
		import('@/lib/account/server/loginResponse'),
	]);

	const challengeCookie = webauthnModule.getWebauthnChallengeCookie(request);
	if (challengeCookie === undefined) {
		return createNoStoreErrorResponse('challenge-not-found', 400);
	}

	const challenge = await challengesModule.consumeChallenge(
		challengeCookie,
		'account_registration'
	);
	if (challenge === null) {
		const response = createNoStoreErrorResponse('challenge-expired', 400);
		webauthnModule.clearWebauthnChallengeCookie(response, request);

		return response;
	}

	let verification;
	try {
		verification = await webauthnModule.verifyRegistration({
			expectedChallenge: challenge.challenge,
			response: registrationResponse,
		});
	} catch {
		const response = createNoStoreErrorResponse(
			'webauthn-verification-failed',
			400
		);
		webauthnModule.clearWebauthnChallengeCookie(response, request);

		return response;
	}

	if (!verification.verified) {
		const response = createNoStoreErrorResponse(
			'webauthn-verification-failed',
			400
		);
		webauthnModule.clearWebauthnChallengeCookie(response, request);

		return response;
	}

	const { registrationInfo } = verification;
	const now = Date.now();
	const userId = challenge.id;
	const session = authModule.createAccountSessionDraft(userId, request, now);

	let user = null;
	try {
		for (let attempt = 0; attempt < 5; attempt++) {
			const username = userModule.createAutoAccountUsername(
				userId,
				attempt
			);
			user = await usersModule.createUserWithCredentialWebauthnAndSession(
				{
					created_at: now,
					deleted_at: null,
					id: userId,
					last_login_at: now,
					nickname: null,
					state_epoch: 0,
					status: USER_STATUS_MAP.active,
					updated_at: now,
					username,
					username_normalized: userModule.normalizeUsername(username),
				},
				{
					failed_attempts: 0,
					locked_until: null,
					password_hash: await passwordModule.hashPassword(
						createTemporaryPassword()
					),
					password_must_change: 0,
					password_set: 0,
					updated_at: now,
					user_id: userId,
				},
				{
					aaguid: registrationInfo.aaguid || null,
					backed_up: registrationInfo.credentialBackedUp ? 1 : 0,
					counter: registrationInfo.credential.counter,
					created_at: now,
					credential_id: registrationInfo.credential.id,
					device_type: registrationInfo.credentialDeviceType,
					id: randomUUID(),
					last_used_at: now,
					name,
					public_key: webauthnModule.encodePublicKey(
						registrationInfo.credential.publicKey
					),
					transports: webauthnModule.serializeTransports(
						registrationResponse.response.transports
					),
					user_id: userId,
				},
				session.record,
				async (trx, auditNow, createdUser) => {
					await accountAuditModule.writeAccountAuditLogInTransaction(
						trx,
						accountAuditModule.createAccountUserAuditLogInput({
							action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
								.passkeyAccountRegistered,
							metadata: {
								auth_record_digest:
									accountAuditModule.createAccountAuditValueDigest(
										session.record.id
									),
								auto_username: true,
								backed_up: registrationInfo.credentialBackedUp,
								credential_name: name,
								device_type:
									registrationInfo.credentialDeviceType,
								method: 'passkey',
								nickname: null,
								username,
							},
							request,
							userId: createdUser.id,
						}),
						auditNow
					);
					await accountAuditModule.writeAccountAuditLogInTransaction(
						trx,
						accountAuditModule.createAccountUserAuditLogInput({
							action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
								.loginSucceeded,
							metadata: {
								method: 'passkey',
								must_change_on_next_login: false,
								nickname: null,
								username,
							},
							request,
							userId: createdUser.id,
						}),
						auditNow
					);
				}
			);
			if (user !== null) {
				break;
			}
		}
	} catch (error) {
		console.warn('Failed to register account with passkey.', {
			errorCode: getLogSafeErrorCode(error),
		});

		const response = createNoStoreErrorResponse(
			'server-misconfigured',
			500
		);
		webauthnModule.clearWebauthnChallengeCookie(response, request);

		return response;
	}

	if (user === null) {
		const response = createNoStoreErrorResponse('username-conflict', 409);
		webauthnModule.clearWebauthnChallengeCookie(response, request);

		return response;
	}

	const response =
		await loginResponseModule.createAccountLoginSuccessResponse({
			hasPassword: false,
			passwordMustChange: false,
			request,
			session,
			user: userModule.createAccountUserProfile(user),
		});
	webauthnModule.clearWebauthnChallengeCookie(response, request);

	return response;
}
