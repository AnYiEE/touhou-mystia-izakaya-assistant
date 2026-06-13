import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityResponse,
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
	createAccountAuthErrorResponse,
} from '@/lib/account/server/routeResponses';
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

	const featureResponse = await checkAccountFeatureResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const sameOriginResponse = checkSameOriginResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse = checkAccountCookieSecurityResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const authModule = await import('@/lib/account/server/auth');
	const auth = await authModule.authenticateAccountRequest(request);
	if (auth.status === 'error') {
		return createAccountAuthErrorResponse(auth, request);
	}

	const rateLimitResponse = checkAccountRateLimitResponse(
		request,
		'account-revoke-sso-grant'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const { checkSsoClientId } = await import('@/lib/account/server/sso');
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
