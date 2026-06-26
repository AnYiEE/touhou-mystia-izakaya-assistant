import { type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { type RegistrationResponseJSON } from '@simplewebauthn/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	createAccountAuthErrorRouteResponse,
	readJsonBodyResult,
} from '@/lib/account/server/routeResponses';
import {
	WEBAUTHN_MAX_CREDENTIALS_PER_USER,
	checkWebauthnCredentialNamePolicy,
	normalizeWebauthnCredentialName,
} from '@/lib/account/shared/constants';
import { type IWebauthnCredentialListData } from '@/lib/account/shared/types';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

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

	const authModule = await import('@/lib/account/server/auth');
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

	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const bodyResult =
		await readJsonBodyResult<IWebauthnRegistrationVerifyBody>(request);
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
		presentationModule,
		credentialsModule,
		challengesModule,
	] = await Promise.all([
		import('@/lib/account/server/webauthn'),
		import('@/lib/account/server/webauthnPresentation'),
		import('@/lib/account/server/repositories/webauthnCredentials'),
		import('@/lib/account/server/repositories/webauthnChallenges'),
	]);

	const challengeCookie = webauthnModule.getWebauthnChallengeCookie(request);
	if (challengeCookie === undefined) {
		return createNoStoreErrorResponse('challenge-not-found', 400);
	}

	const challenge = await challengesModule.consumeChallenge(
		challengeCookie,
		'registration'
	);
	if (challenge?.user_id !== auth.data.user.id) {
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

	const existingCount = await credentialsModule.countCredentialsByUserId(
		auth.data.user.id
	);
	if (existingCount >= WEBAUTHN_MAX_CREDENTIALS_PER_USER) {
		const response = createNoStoreErrorResponse('too-many-passkeys', 409);
		webauthnModule.clearWebauthnChallengeCookie(response, request);

		return response;
	}

	const { registrationInfo } = verification;
	const now = Date.now();
	await credentialsModule.createCredential({
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
	});

	const accountAuditModule =
		await import('@/lib/account/server/accountAuditService');
	await accountAuditModule.writeAccountAuditLogBestEffort(
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
		})
	);

	const credentials = await credentialsModule.listCredentialsByUserId(
		auth.data.user.id
	);
	const response = createNoStoreJsonResponse({
		credentials: credentials.map((credential) =>
			presentationModule.createWebauthnCredentialSummary(credential)
		),
	} satisfies IWebauthnCredentialListData);
	webauthnModule.clearWebauthnChallengeCookie(response, request);

	return response;
}
