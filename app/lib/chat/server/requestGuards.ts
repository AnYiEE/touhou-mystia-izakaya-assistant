import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	createAccountAuthErrorRouteResponse,
} from '@/lib/account/server/routeResponses';
import { checkRateLimit } from '@/lib/account/server/rateLimit';
import { createNoStoreErrorResponse } from '@/lib/api/routeResponses';
import { createRetryAfterHeaders } from '@/lib/api/http';

const CHAT_MESSAGE_SEND_RATE_LIMIT = {
	limit: 10,
	windowMs: 10 * 1000,
} as const;

export async function requireChatAccountAuth(
	request: NextRequest,
	scope: string
) {
	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return { response: featureResponse, status: 'error' as const };
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
		scope,
		'',
		{ noTrustedIpGate: true }
	);
	if (rateLimitResponse !== null) {
		return { response: rateLimitResponse, status: 'error' as const };
	}

	const authModule = await import('@/lib/account/server/auth');
	const auth = await authModule.authenticateAccountFromRequest(request);
	if (auth.status === 'error') {
		return {
			response: createAccountAuthErrorRouteResponse(auth, request),
			status: 'error' as const,
		};
	}

	return { auth, authModule, status: 'ok' as const };
}

export function checkChatMessageSendRateLimitResponse(userId: string) {
	const capacityGroup = 'chat-message-send';
	const result = checkRateLimit(JSON.stringify([capacityGroup, userId]), {
		...CHAT_MESSAGE_SEND_RATE_LIMIT,
		capacityGroup,
	});
	if (result.allowed) {
		return null;
	}

	return createNoStoreErrorResponse(
		'too-many-requests',
		429,
		{ retry_after: result.retryAfter },
		{ headers: createRetryAfterHeaders(result.retryAfter) }
	);
}

export function createChatErrorResponse(error: unknown) {
	if (!(error instanceof Error)) {
		return createNoStoreErrorResponse('chat-internal-error', 500);
	}

	switch (error.message) {
		case 'chat-forbidden':
			return createNoStoreErrorResponse('chat-forbidden', 403);
		case 'chat-not-found':
			return createNoStoreErrorResponse('chat-not-found', 404);
		case 'empty-message':
		case 'message-too-long':
		case 'invalid-last-read-message-id':
			return createNoStoreErrorResponse(error.message, 400);
		default:
			return createNoStoreErrorResponse('chat-internal-error', 500);
	}
}
