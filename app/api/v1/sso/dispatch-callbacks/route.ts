import { type NextRequest } from 'next/server';

import { checkAccountFeatureRouteResponse } from '@/lib/account/server/routeResponses';
import {
	checkDispatchSecretStatus,
	checkSsoRateLimitRouteResponse,
} from '@/lib/account/server/ssoRouteResponses';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';
import { getLogSafeErrorCode } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const rateLimitResponse = checkSsoRateLimitRouteResponse(
		request,
		'sso-dispatch-callbacks',
		[]
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const secretStatus = checkDispatchSecretStatus(
		request.headers.get('x-dispatch-secret')
	);
	if (secretStatus === 'misconfigured') {
		return createNoStoreErrorResponse('server-misconfigured', 500);
	}
	if (secretStatus === 'invalid') {
		const invalidSecretRateLimitResponse = checkSsoRateLimitRouteResponse(
			request,
			'sso-dispatch-callbacks-invalid-secret',
			[]
		);
		if (invalidSecretRateLimitResponse !== null) {
			return invalidSecretRateLimitResponse;
		}

		return createNoStoreErrorResponse('invalid-secret', 401);
	}

	try {
		const ssoModule = await import('@/lib/account/server/sso');
		const result = await ssoModule.dispatchSsoCallbacks(
			ssoModule.SSO_CALLBACK_DISPATCH_LIMIT
		);
		let ticketsDeleted = 0;
		try {
			ticketsDeleted = await ssoModule.deleteExpiredSsoTickets();
		} catch (error) {
			console.warn('SSO expired ticket cleanup failed after dispatch.', {
				errorCode: getLogSafeErrorCode(error),
			});
		}

		return createNoStoreJsonResponse({
			...result,
			deleted_expired_tickets: ticketsDeleted,
		});
	} catch (error) {
		console.warn('SSO callback dispatch failed.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return createNoStoreErrorResponse('server-misconfigured', 500);
	}
}
