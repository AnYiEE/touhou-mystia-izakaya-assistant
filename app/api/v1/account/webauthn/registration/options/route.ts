import { type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	createAccountAuthErrorRouteResponse,
} from '@/lib/account/server/routeResponses';
import {
	WEBAUTHN_CHALLENGE_TTL_MS,
	WEBAUTHN_MAX_CREDENTIALS_PER_USER,
} from '@/lib/account/shared/constants';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SCOPE = 'webauthn-register-options';

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

	const [webauthnModule, credentialsModule, challengesModule] =
		await Promise.all([
			import('@/lib/account/server/webauthn'),
			import('@/lib/account/server/repositories/webauthnCredentials'),
			import('@/lib/account/server/repositories/webauthnChallenges'),
		]);

	const existingCredentials = await credentialsModule.listCredentialsByUserId(
		auth.data.user.id
	);
	if (existingCredentials.length >= WEBAUTHN_MAX_CREDENTIALS_PER_USER) {
		return createNoStoreErrorResponse('too-many-passkeys', 409);
	}

	const options = await webauthnModule.buildRegistrationOptions({
		existingCredentials,
		user: auth.data.user,
	});

	const now = Date.now();
	const challengeId = randomUUID();
	const createResult =
		await challengesModule.createRegistrationChallengeForActiveSession(
			{
				challenge: options.challenge,
				created_at: now,
				expires_at: now + WEBAUTHN_CHALLENGE_TTL_MS,
				id: challengeId,
				purpose: 'registration',
				user_id: auth.data.user.id,
			},
			auth.data.user.id,
			{
				id: auth.data.session.id,
				token_hash: auth.data.sessionTokenHash,
			},
			WEBAUTHN_MAX_CREDENTIALS_PER_USER
		);
	if (createResult.status === 'unauthorized') {
		return createNoStoreErrorResponse('unauthorized', 401);
	}
	if (createResult.status === 'too-many') {
		return createNoStoreErrorResponse('too-many-passkeys', 409);
	}

	const response = createNoStoreJsonResponse({ options });
	webauthnModule.setWebauthnChallengeCookie(response, challengeId, request);

	return response;
}
