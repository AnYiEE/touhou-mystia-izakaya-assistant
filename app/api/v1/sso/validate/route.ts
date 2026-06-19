import { type NextRequest } from 'next/server';

import { checkAccountFeatureRouteResponse } from '@/lib/account/server/routeResponses';
import { MAX_ACCOUNT_JSON_BODY_BYTES } from '@/lib/account/shared/requestLimits';
import { checkSsoRateLimitRouteResponse } from '@/lib/account/server/ssoRouteResponses';
import {
	checkSsoClientId,
	checkSsoClientSecret,
	checkSsoCodeVerifier,
	checkSsoTicketFormat,
} from '@/lib/account/server/ssoValidation';
import { createAccountUserProfile } from '@/lib/account/server/user';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	readJsonBodyResult,
} from '@/lib/api/routeResponses';
import { getLogSafeErrorCode } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ISsoValidateBody {
	client_id: string;
	client_secret: string;
	code_verifier: string;
	ticket: string;
}

export async function POST(request: NextRequest) {
	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const bodyResult = await readJsonBodyResult<ISsoValidateBody>(
		request,
		MAX_ACCOUNT_JSON_BODY_BYTES
	);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}
	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	if (
		body === null ||
		typeof body.client_id !== 'string' ||
		typeof body.client_secret !== 'string' ||
		typeof body.ticket !== 'string' ||
		typeof body.code_verifier !== 'string'
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const clientId = body.client_id.trim();
	const clientSecret = body.client_secret;
	const ticket = body.ticket.trim();
	const codeVerifier = body.code_verifier.trim();
	if (
		!checkSsoClientId(clientId) ||
		!checkSsoClientSecret(clientSecret) ||
		!checkSsoTicketFormat(ticket) ||
		!checkSsoCodeVerifier(codeVerifier)
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const rateLimitResponse = checkSsoRateLimitRouteResponse(
		request,
		'sso-validate',
		[
			{ name: 'client', value: clientId },
			{ name: 'ticket', value: ticket },
		]
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	try {
		const ssoModule = await import('@/lib/account/server/sso');
		const validation = await ssoModule.validateSsoTicketWithClientSecret(
			clientId,
			clientSecret,
			ticket,
			codeVerifier
		);
		switch (validation.status) {
			case 'client-disabled':
				return createNoStoreErrorResponse('client-disabled', 403);
			case 'invalid-client': {
				const invalidClientRateLimitResponse =
					checkSsoRateLimitRouteResponse(
						request,
						'sso-validate-invalid-client',
						[{ name: 'client', value: clientId }]
					);
				if (invalidClientRateLimitResponse !== null) {
					return invalidClientRateLimitResponse;
				}

				return createNoStoreErrorResponse('invalid-client', 401);
			}
			case 'invalid-ticket': {
				const invalidTicketRateLimitResponse =
					checkSsoRateLimitRouteResponse(
						request,
						'sso-validate-invalid-ticket',
						[
							{ name: 'client', value: clientId },
							{ name: 'ticket', value: ticket },
						]
					);
				if (invalidTicketRateLimitResponse !== null) {
					return invalidTicketRateLimitResponse;
				}

				return createNoStoreErrorResponse('invalid-ticket', 401);
			}
			case 'validated': {
				const validationResult = validation.validation;
				if (validationResult.user_error !== null) {
					return createNoStoreErrorResponse(
						validationResult.user_error,
						403
					);
				}
				if (validationResult.user === null) {
					const invalidTicketRateLimitResponse =
						checkSsoRateLimitRouteResponse(
							request,
							'sso-validate-invalid-ticket',
							[
								{ name: 'client', value: clientId },
								{ name: 'ticket', value: ticket },
							]
						);
					if (invalidTicketRateLimitResponse !== null) {
						return invalidTicketRateLimitResponse;
					}

					return createNoStoreErrorResponse('invalid-ticket', 401);
				}

				const profile = createAccountUserProfile(validationResult.user);

				return createNoStoreJsonResponse({
					user: {
						id: profile.id,
						nickname: profile.nickname,
						status: profile.status,
						username: profile.username,
					},
				});
			}
		}
	} catch (error) {
		console.warn('SSO validate failed.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return createNoStoreErrorResponse('server-misconfigured', 500);
	}
}
