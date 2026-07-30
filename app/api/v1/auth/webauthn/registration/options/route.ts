import { type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';

import { WEBAUTHN_CHALLENGE_TTL_MS } from '@/features/account/constants';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';

import { createNoStoreJsonResponse } from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SCOPE = 'webauthn-account-register-options';

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

	const [webauthnModule, challengesModule, userModule] = await Promise.all([
		import('@/features/account/webauthn/server/service'),
		import('@/features/account/webauthn/server/persistence/challenges'),
		import('@/features/account/server/presentation/user'),
	]);

	const now = Date.now();
	const challengeId = randomUUID();
	const username = userModule.createAutoAccountUsername(challengeId);
	const options = await webauthnModule.buildRegistrationOptions({
		existingCredentials: [],
		user: { id: challengeId, nickname: null, username },
	});

	await challengesModule.createChallenge({
		challenge: options.challenge,
		created_at: now,
		expires_at: now + WEBAUTHN_CHALLENGE_TTL_MS,
		id: challengeId,
		purpose: 'account_registration',
		user_id: null,
	});

	const response = createNoStoreJsonResponse({ options });
	webauthnModule.setWebauthnChallengeCookie(response, challengeId, request);

	return response;
}
