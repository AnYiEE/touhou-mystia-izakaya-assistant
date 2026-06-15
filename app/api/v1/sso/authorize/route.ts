import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	createAccountAuthErrorRouteResponse,
} from '@/lib/account/server/routeResponses';
import { checkSsoRateLimitRouteResponse } from '@/lib/account/server/ssoRouteResponses';
import {
	checkSsoClientEnabled,
	checkSsoClientId,
	checkSsoCodeChallenge,
	checkSsoRedirectUriFormat,
	checkSsoState,
	createSsoContextTransactionId,
	getSsoClientById,
	hasAnySsoClient,
	setSsoContextCookie,
	validateSsoRedirectUri,
} from '@/lib/account/server/sso';
import {
	createNoStoreErrorResponse,
	createNoStoreRedirectResponse,
} from '@/lib/api/routeResponses';
import { getLogSafeErrorCode } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getRequiredQueryParam(request: NextRequest, name: string) {
	const value = request.nextUrl.searchParams.get(name)?.trim() ?? '';

	return value === '' ? null : value;
}

function createAuthorizeRedirectUrl(request: NextRequest, pathname: string) {
	return new URL(pathname, request.nextUrl.origin);
}

export async function GET(request: NextRequest) {
	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const cookieSecurityResponse =
		checkAccountCookieSecurityRouteResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const clientId = getRequiredQueryParam(request, 'client_id');
	const redirectUri = getRequiredQueryParam(request, 'redirect_uri');
	const state = getRequiredQueryParam(request, 'state');
	const codeChallenge = getRequiredQueryParam(request, 'code_challenge');
	if (
		clientId === null ||
		redirectUri === null ||
		state === null ||
		codeChallenge === null ||
		!checkSsoClientId(clientId) ||
		!checkSsoRedirectUriFormat(redirectUri) ||
		!checkSsoState(state) ||
		!checkSsoCodeChallenge(codeChallenge)
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const rateLimitResponse = checkSsoRateLimitRouteResponse(
		request,
		'sso-authorize',
		[{ name: 'client', value: clientId }]
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	try {
		if (!(await hasAnySsoClient())) {
			return createNoStoreErrorResponse('feature-disabled', 404);
		}

		const client = await getSsoClientById(clientId);
		if (client === null) {
			return createNoStoreErrorResponse('feature-disabled', 404);
		}
		if (!checkSsoClientEnabled(client)) {
			return createNoStoreErrorResponse('client-disabled', 403);
		}
		if (!validateSsoRedirectUri(client, redirectUri)) {
			return createNoStoreErrorResponse('invalid-redirect-uri', 400);
		}

		const authModule = await import('@/lib/account/server/auth');
		const auth = await authModule.authenticateAccountFromRequest(
			request,
			true
		);
		if (auth.status === 'error' && auth.message !== 'unauthorized') {
			return createAccountAuthErrorRouteResponse(auth, request);
		}

		const redirectUrl = createAuthorizeRedirectUrl(
			request,
			'/sso/authorize'
		);

		const response = createNoStoreRedirectResponse(redirectUrl);
		setSsoContextCookie(
			response,
			{
				client_id: clientId,
				code_challenge: codeChallenge,
				redirect_uri: redirectUri,
				state,
				transaction_id: createSsoContextTransactionId(),
			},
			request
		);

		return response;
	} catch (error) {
		console.warn('SSO authorize failed.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return createNoStoreErrorResponse('server-misconfigured', 500);
	}
}
