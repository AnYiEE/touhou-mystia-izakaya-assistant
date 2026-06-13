import { type NextRequest } from 'next/server';

import { checkAccountFeatureResponse } from '@/lib/account/server/routeResponses';
import { MAX_ACCOUNT_JSON_BODY_BYTES } from '@/lib/account/shared/requestLimits';
import { checkSsoRateLimitResponse } from '@/lib/account/server/ssoRouteResponses';
import {
	checkSsoClientEnabled,
	checkSsoClientId,
	checkSsoClientSecret,
	checkSsoCodeVerifier,
	checkSsoTicketFormat,
	getSsoClientById,
	validateSsoTicket,
	verifySsoClientSecret,
} from '@/lib/account/server/sso';
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
	const featureResponse = await checkAccountFeatureResponse();
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

	const rateLimitResponse = checkSsoRateLimitResponse(
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
		const client = await getSsoClientById(clientId);
		if (client === null || !verifySsoClientSecret(client, clientSecret)) {
			return createNoStoreErrorResponse('invalid-client', 401);
		}
		if (!checkSsoClientEnabled(client)) {
			return createNoStoreErrorResponse('client-disabled', 403);
		}

		const validation = await validateSsoTicket(
			clientId,
			ticket,
			codeVerifier
		);
		if (validation === null) {
			return createNoStoreErrorResponse('invalid-ticket', 401);
		}
		if (validation.user_error !== null) {
			return createNoStoreErrorResponse(validation.user_error, 403);
		}
		if (validation.user === null) {
			return createNoStoreErrorResponse('invalid-ticket', 401);
		}

		const profile = createAccountUserProfile(validation.user);

		return createNoStoreJsonResponse({
			user: {
				id: profile.id,
				status: profile.status,
				username: profile.username,
			},
		});
	} catch (error) {
		console.warn('SSO validate failed.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return createNoStoreErrorResponse('server-misconfigured', 500);
	}
}
