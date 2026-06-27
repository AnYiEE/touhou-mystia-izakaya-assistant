import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	createAccountAuthErrorRouteResponse,
} from '@/lib/account/server/routeResponses';
import { type IWebauthnCredentialListData } from '@/lib/account/shared/types';
import { createNoStoreJsonResponse } from '@/lib/api/routeResponses';

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

	const authModule = await import('@/lib/account/server/auth');
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
			import('@/lib/account/server/repositories/webauthnCredentials'),
			import('@/lib/account/server/webauthnPresentation'),
			import('@/lib/account/server/webauthn'),
		]);
	const credentials = await credentialsModule.listCredentialsByUserId(
		auth.data.user.id
	);
	const { rpID } = webauthnModule.getWebAuthnRelyingParty();

	return createNoStoreJsonResponse({
		credentials: credentials.map((credential) =>
			presentationModule.createWebauthnCredentialSummary(credential)
		),
		rp_id: rpID,
	} satisfies IWebauthnCredentialListData);
}
