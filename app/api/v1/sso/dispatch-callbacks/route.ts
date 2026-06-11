import { type NextRequest } from 'next/server';

import { checkAccountFeatureResponse } from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';
import { checkDispatchSecret, checkSsoRateLimitResponse } from '../utils';
import {
	SSO_CALLBACK_DISPATCH_LIMIT,
	deleteExpiredSsoTickets,
	dispatchSsoCallbacks,
} from '@/lib/account/server/sso';
import { getLogSafeErrorCode } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
	const featureResponse = await checkAccountFeatureResponse();
	if (featureResponse !== null) {
		return featureResponse;
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

	const rateLimitResponse = checkSsoRateLimitResponse(
		request,
		'sso-dispatch-callbacks',
		[]
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	try {
		const [ticketsDeleted, result] = await Promise.all([
			deleteExpiredSsoTickets(),
			dispatchSsoCallbacks(SSO_CALLBACK_DISPATCH_LIMIT),
		]);

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
