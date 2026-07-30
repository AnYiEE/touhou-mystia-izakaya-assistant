import { type NextRequest } from 'next/server';

import type { IWebauthnCredentialListData } from '@/features/account/contracts';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';
import { createAccountAuthErrorRouteResponse } from '@/features/account/server/http/routeResponses';

import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SCOPE = 'webauthn-credentials-list';

export async function GET(request: NextRequest) {
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

	const authModule =
		await import('@/features/account/server/auth/requestAuthentication');
	const auth = await authModule.authenticateAccountFromRequest(request, true);
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

	const [credentialsModule, presentationModule, webauthnModule] =
		await Promise.all([
			import('@/features/account/webauthn/server/persistence/credentials'),
			import('@/features/account/webauthn/server/presentation'),
			import('@/features/account/webauthn/server/service'),
		]);
	const credentials =
		await credentialsModule.listCredentialsForActiveUserSession(
			auth.data.user.id,
			{
				id: auth.data.session.id,
				token_hash: auth.data.session.token_hash,
			}
		);
	if (credentials.status === 'unauthorized') {
		return createNoStoreErrorResponse('unauthorized', 401);
	}
	const { rpID } = webauthnModule.getWebAuthnRelyingParty();

	return createNoStoreJsonResponse({
		credentials: credentials.credentials.map((credential) =>
			presentationModule.createWebauthnCredentialSummary(credential)
		),
		rp_id: rpID,
	} satisfies IWebauthnCredentialListData);
}
