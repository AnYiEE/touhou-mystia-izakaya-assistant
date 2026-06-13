import { type NextRequest } from 'next/server';

import { checkAccountFeatureResponse } from '@/lib/account/server/routeResponses';
import {
	checkDispatchSecret,
	checkSsoRateLimitResponse,
} from '@/lib/account/server/ssoRouteResponses';
import {
	SSO_CALLBACK_DISPATCH_LIMIT,
	deleteExpiredSsoTickets,
	dispatchSsoCallbacks,
} from '@/lib/account/server/sso';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';
import { getLogSafeErrorCode } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
	const featureResponse = await checkAccountFeatureResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const rateLimitResponse = checkSsoRateLimitResponse(
		request,
		'sso-dispatch-callbacks',
		[]
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const secretStatus = checkDispatchSecret(
		request.headers.get('x-dispatch-secret')
	);
	if (secretStatus === 'misconfigured') {
		return createNoStoreErrorResponse('server-misconfigured', 500);
	}
	if (secretStatus === 'invalid') {
		return createNoStoreErrorResponse('invalid-secret', 401);
	}

	try {
		const result = await dispatchSsoCallbacks(SSO_CALLBACK_DISPATCH_LIMIT);
		let ticketsDeleted = 0;
		try {
			ticketsDeleted = await deleteExpiredSsoTickets();
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
