import { type NextRequest } from 'next/server';

import type { IAccountSessionListData } from '@/features/account/contracts';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';
import { createAccountAuthErrorRouteResponse } from '@/features/account/server/http/routeResponses';
import { createAccountSessionRecord } from '@/features/account/server/presentation/session';

import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';

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

	const authModule =
		await import('@/features/account/server/auth/requestAuthentication');
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
		await import('@/features/account/server/persistence/repositories/sessions');
	const sessions = await sessionsModule.listSessionsForActiveUserSession(
		auth.data.user.id,
		{ id: auth.data.session.id, token_hash: auth.data.session.token_hash }
	);
	if (sessions.status === 'unauthorized') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.unauthorized,
			401
		);
	}

	return createNoStoreJsonResponse({
		sessions: sessions.sessions.map((session) =>
			createAccountSessionRecord(session, auth.data.session.id)
		),
	} satisfies IAccountSessionListData);
}
