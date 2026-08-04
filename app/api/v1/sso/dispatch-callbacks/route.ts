import { type NextRequest } from 'next/server';

import { checkAccountFeatureRouteResponse } from '@/features/account/server/http/routeGuards';
import { ACCOUNT_SSO_API_RESPONSE_CODE_MAP } from '@/features/account/sso/apiResponseCodes';
import {
	checkDispatchSecretStatus,
	checkSsoRateLimitRouteResponse,
} from '@/features/account/sso/server/http/routeResponses';

import { SERVER_MISCONFIGURED_MESSAGE } from '@/infrastructure/environment/serverValidation';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

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
		return createNoStoreErrorResponse(SERVER_MISCONFIGURED_MESSAGE, 500);
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

		return createNoStoreErrorResponse(
			ACCOUNT_SSO_API_RESPONSE_CODE_MAP.invalidSecret,
			401
		);
	}

	try {
		const ssoModule = await import('@/features/account/sso/server');
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

		return createNoStoreErrorResponse(SERVER_MISCONFIGURED_MESSAGE, 500);
	}
}
