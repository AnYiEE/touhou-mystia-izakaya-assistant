import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/lib/account/server/routeResponses';
import {
	authenticateAdminFromRequest,
	checkAdminCsrfRouteResponse,
	checkAdminFeatureRouteResponse,
	createAdminAuthErrorRouteResponse,
} from '@/lib/account/server/adminRouteResponses';

export async function checkAdminSsoClientRequest(
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

	const auth = authenticateAdminFromRequest(request);
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

	return { status: 'ok' as const };
}
