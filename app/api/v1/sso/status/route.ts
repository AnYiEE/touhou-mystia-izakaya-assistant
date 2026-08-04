import { type NextRequest } from 'next/server';

import { MAX_ACCOUNT_JSON_BODY_BYTES } from '@/features/account/requestLimits';
import { checkAccountFeatureRouteResponse } from '@/features/account/server/http/routeGuards';
import { ACCOUNT_SSO_API_RESPONSE_CODE_MAP } from '@/features/account/sso/apiResponseCodes';
import { checkSsoRateLimitRouteResponse } from '@/features/account/sso/server/http/routeResponses';
import {
	checkSsoClientEnabled,
	checkSsoClientId,
	checkSsoClientSecret,
} from '@/features/account/sso/server/validation';

import { SERVER_MISCONFIGURED_MESSAGE } from '@/infrastructure/environment/serverValidation';
import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	readJsonBodyResult,
} from '@/infrastructure/http/server/responses';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ISsoStatusBody {
	client_id: string;
	client_secret: string;
	user_id: string;
}

export async function POST(request: NextRequest) {
	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const bodyResult = await readJsonBodyResult<ISsoStatusBody>(
		request,
		MAX_ACCOUNT_JSON_BODY_BYTES
	);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.payloadTooLarge,
			413
		);
	}
	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	if (
		body === null ||
		typeof body.client_id !== 'string' ||
		typeof body.client_secret !== 'string' ||
		typeof body.user_id !== 'string'
	) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}

	const clientId = body.client_id.trim();
	const clientSecret = body.client_secret;
	const userId = body.user_id.trim();
	if (
		!checkSsoClientId(clientId) ||
		!checkSsoClientSecret(clientSecret) ||
		userId.length === 0 ||
		userId.length > 128
	) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}

	const rateLimitResponse = checkSsoRateLimitRouteResponse(
		request,
		'sso-status',
		[
			{ name: 'client', value: clientId },
			{ name: 'user', value: userId },
		]
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	try {
		const ssoModule = await import('@/features/account/sso/server');
		const client = await ssoModule.getSsoClientById(clientId);
		if (
			client === null ||
			!(await ssoModule.verifyAndTouchSsoClientSecret(
				client,
				clientSecret
			))
		) {
			const invalidClientRateLimitResponse =
				checkSsoRateLimitRouteResponse(
					request,
					'sso-status-invalid-client',
					[{ name: 'client', value: clientId }]
				);
			if (invalidClientRateLimitResponse !== null) {
				return invalidClientRateLimitResponse;
			}

			return createNoStoreErrorResponse(
				ACCOUNT_SSO_API_RESPONSE_CODE_MAP.invalidClient,
				401
			);
		}
		if (!checkSsoClientEnabled(client)) {
			return createNoStoreErrorResponse(
				ACCOUNT_SSO_API_RESPONSE_CODE_MAP.clientDisabled,
				403
			);
		}

		const user = await ssoModule.getSsoUserById(userId);
		if (user === null) {
			return createNoStoreErrorResponse(
				ACCOUNT_SSO_API_RESPONSE_CODE_MAP.userNotFound,
				404
			);
		}

		const hasGrant = await ssoModule.hasSsoUserClientGrant(
			clientId,
			userId
		);
		if (!hasGrant) {
			return createNoStoreErrorResponse(
				ACCOUNT_SSO_API_RESPONSE_CODE_MAP.userNotFound,
				404
			);
		}

		const statusError = ssoModule.getSsoUserStatusError(user);
		if (statusError !== null) {
			return createNoStoreErrorResponse(statusError, 403);
		}

		return createNoStoreJsonResponse({
			user: { id: user.id, status: user.status },
		});
	} catch (error) {
		console.warn('SSO status failed.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return createNoStoreErrorResponse(SERVER_MISCONFIGURED_MESSAGE, 500);
	}
}
