import { type NextRequest } from 'next/server';

import {
	checkAccountFeatureResponse,
	readJsonBodyResult,
} from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';
import { checkSsoRateLimitResponse } from '../utils';
import {
	checkSsoClientEnabled,
	checkSsoClientId,
	checkSsoClientSecret,
	getSsoClientById,
	getSsoUserById,
	getSsoUserStatusError,
	hasSsoUserClientGrant,
	verifySsoClientSecret,
} from '@/lib/account/server/sso';
import { getLogSafeErrorCode } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ISsoStatusBody {
	client_id: string;
	client_secret: string;
	user_id: string;
}

export async function POST(request: NextRequest) {
	const featureResponse = await checkAccountFeatureResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const bodyResult = await readJsonBodyResult<ISsoStatusBody>(request);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}
	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	if (
		body === null ||
		typeof body.client_id !== 'string' ||
		typeof body.client_secret !== 'string' ||
		typeof body.user_id !== 'string'
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
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
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const rateLimitResponse = checkSsoRateLimitResponse(request, 'sso-status', [
		{ name: 'client', value: clientId },
		{ name: 'user', value: userId },
	]);
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

		const user = await getSsoUserById(userId);
		if (user === null) {
			return createNoStoreErrorResponse('user-not-found', 404);
		}

		const statusError = getSsoUserStatusError(user);
		if (statusError !== null) {
			return createNoStoreErrorResponse(statusError, 403);
		}

		const hasGrant = await hasSsoUserClientGrant(clientId, userId);
		if (!hasGrant) {
			return createNoStoreErrorResponse('grant-revoked', 403);
		}

		return createNoStoreJsonResponse({
			user: { id: user.id, status: user.status },
		});
	} catch (error) {
		console.warn('SSO status failed.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return createNoStoreErrorResponse('server-misconfigured', 500);
	}
}
