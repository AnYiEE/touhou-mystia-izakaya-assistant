import { type RegistrationResponseJSON } from '@simplewebauthn/server';
import { type NextRequest } from 'next/server';

import {
	checkWebauthnCredentialNamePolicy,
	normalizeWebauthnCredentialName,
} from '@/features/account/constants';
import { readJsonBodyResult } from '@/features/account/server/http/jsonBody';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';

import { createNoStoreErrorResponse } from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SCOPE = 'webauthn-account-register-verify';

interface IWebauthnAccountRegistrationVerifyBody {
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
		userModule,
		loginResponseModule,
		registerWithPasskeyModule,
	] = await Promise.all([
		import('@/features/account/webauthn/server/service'),
		import('@/features/account/webauthn/server/persistence/challenges'),
		import('@/features/account/server/presentation/user'),
		import('@/features/account/server/http/loginResponse'),
		import('@/features/account/server/useCases/registerWithPasskey'),
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
	const userId = challenge.id;
	const result = await registerWithPasskeyModule.registerWithPasskey({
		credential: {
			aaguid: registrationInfo.aaguid || null,
			backed_up: registrationInfo.credentialBackedUp ? 1 : 0,
			counter: registrationInfo.credential.counter,
			credential_id: registrationInfo.credential.id,
			device_type: registrationInfo.credentialDeviceType,
			name,
			public_key: webauthnModule.encodePublicKey(
				registrationInfo.credential.publicKey
			),
			transports: webauthnModule.serializeTransports(
				registrationResponse.response.transports
			),
		},
		request,
		userId,
	});
	if (result.status === 'error') {
		const response = createNoStoreErrorResponse(
			result.message,
			result.message === 'username-conflict' ? 409 : 500
		);
		webauthnModule.clearWebauthnChallengeCookie(response, request);

		return response;
	}

	const response =
		await loginResponseModule.createAccountLoginSuccessResponse({
			hasPassword: false,
			passwordMustChange: false,
			request,
			session: result.session,
			user: userModule.createAccountUserProfile(result.user),
		});
	webauthnModule.clearWebauthnChallengeCookie(response, request);

	return response;
}
