import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	createAccountAuthErrorRouteResponse,
} from '@/lib/account/server/routeResponses';
import { checkSsoClientId } from '@/lib/account/server/ssoValidation';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ clientId: string }> }
) {
	const { clientId } = await params;

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

	const authModule = await import('@/lib/account/server/auth');
	const auth = await authModule.authenticateAccountFromRequest(request);
	if (auth.status === 'error') {
		return createAccountAuthErrorRouteResponse(auth, request);
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'account-revoke-sso-grant'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	if (!checkSsoClientId(clientId)) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const { deleteSsoUserClientGrant } =
		await import('@/lib/account/server/repositories/sso');
	const deleted = await deleteSsoUserClientGrant(auth.data.user.id, clientId);
	if (!deleted) {
		return createNoStoreErrorResponse('sso-grant-not-found', 404);
	}

	return createNoStoreJsonResponse({ message: 'sso-grant-revoked' });
}
