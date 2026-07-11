import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	createAccountAuthErrorRouteResponse,
} from '@/lib/account/server/routeResponses';
import { createAccountSessionRecord } from '@/lib/account/server/sessionPresentation';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';
import { type IAccountSessionListData } from '@/lib/account/shared/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
		'account-sessions-list'
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
		'account-sessions-list'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const sessionsModule =
		await import('@/lib/account/server/repositories/sessions');
	const sessions = await sessionsModule.listSessionsForActiveUserSession(
		auth.data.user.id,
		{ id: auth.data.session.id, token_hash: auth.data.session.token_hash }
	);
	if (sessions.status === 'unauthorized') {
		return createNoStoreErrorResponse('unauthorized', 401);
	}

	return createNoStoreJsonResponse({
		sessions: sessions.sessions.map((session) =>
			createAccountSessionRecord(session, auth.data.session.id)
		),
	} satisfies IAccountSessionListData);
}
