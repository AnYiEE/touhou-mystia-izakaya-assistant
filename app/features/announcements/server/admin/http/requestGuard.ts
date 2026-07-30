import { type NextRequest } from 'next/server';

import { authenticateAdminFromRequest } from '@/features/account/admin/server/http/authentication';
import {
	checkAdminCsrfRouteResponse,
	checkAdminFeatureRouteResponse,
	createAdminAuthErrorRouteResponse,
} from '@/features/account/admin/server/http/routeResponses';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';

export async function checkAdminAnnouncementRequest(
	request: NextRequest,
	scope: string,
	options: { csrf?: boolean } = {}
) {
	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return { response: featureResponse, status: 'error' as const };
	}

	const adminFeatureResponse = checkAdminFeatureRouteResponse();
	if (adminFeatureResponse !== null) {
		return { response: adminFeatureResponse, status: 'error' as const };
	}

	const sameOriginResponse = checkSameOriginRouteResponse(request);
	if (sameOriginResponse !== null) {
		return { response: sameOriginResponse, status: 'error' as const };
	}

	const cookieSecurityResponse =
		checkAccountCookieSecurityRouteResponse(request);
	if (cookieSecurityResponse !== null) {
		return { response: cookieSecurityResponse, status: 'error' as const };
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		scope
	);
	if (rateLimitResponse !== null) {
		return { response: rateLimitResponse, status: 'error' as const };
	}

	const auth = await authenticateAdminFromRequest(request);
	if (auth.status === 'error') {
		return {
			response: createAdminAuthErrorRouteResponse(
				request,
				auth.message,
				auth.httpStatus
			),
			status: 'error' as const,
		};
	}

	if (options.csrf === true) {
		const csrfResponse = checkAdminCsrfRouteResponse(request, auth.token);
		if (csrfResponse !== null) {
			return { response: csrfResponse, status: 'error' as const };
		}
	}

	return { actorId: auth.actorId, status: 'ok' as const };
}
