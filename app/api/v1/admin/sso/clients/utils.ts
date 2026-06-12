import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityResponse,
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
} from '@/api/v1/accountRouteUtils';
import {
	authenticateAdminRequest,
	checkAdminCsrfResponse,
	checkAdminFeatureResponse,
	createAdminAuthErrorResponse,
} from '@/api/v1/admin/utils';

export {
	parseAdminSsoClientCreateBody,
	parseAdminSsoClientUpdateBody,
} from '@/lib/account/server/adminSsoClientPayload';

export async function checkAdminSsoClientRequest(
	request: NextRequest,
	scope: string,
	options: { csrf?: boolean } = {}
) {
	const featureResponse = await checkAccountFeatureResponse();
	if (featureResponse !== null) {
		return { response: featureResponse, status: 'error' as const };
	}

	const adminFeatureResponse = checkAdminFeatureResponse();
	if (adminFeatureResponse !== null) {
		return { response: adminFeatureResponse, status: 'error' as const };
	}

	const sameOriginResponse = checkSameOriginResponse(request);
	if (sameOriginResponse !== null) {
		return { response: sameOriginResponse, status: 'error' as const };
	}

	const cookieSecurityResponse = checkAccountCookieSecurityResponse(request);
	if (cookieSecurityResponse !== null) {
		return { response: cookieSecurityResponse, status: 'error' as const };
	}

	const rateLimitResponse = checkAccountRateLimitResponse(request, scope);
	if (rateLimitResponse !== null) {
		return { response: rateLimitResponse, status: 'error' as const };
	}

	const auth = authenticateAdminRequest(request);
	if (auth.status === 'error') {
		return {
			response: createAdminAuthErrorResponse(
				request,
				auth.message,
				auth.httpStatus
			),
			status: 'error' as const,
		};
	}

	if (options.csrf === true) {
		const csrfResponse = checkAdminCsrfResponse(request, auth.token);
		if (csrfResponse !== null) {
			return { response: csrfResponse, status: 'error' as const };
		}
	}

	return { status: 'ok' as const };
}
