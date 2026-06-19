import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	createAccountAuthErrorRouteResponse,
	readJsonBodyResult,
} from '@/lib/account/server/routeResponses';
import {
	clearSsoContextCookie,
	createSsoRedirectUrl,
	getSsoContextCookie,
} from '@/lib/account/server/ssoContext';
import { checkSsoRateLimitRouteResponse } from '@/lib/account/server/ssoRouteResponses';
import {
	checkSsoClientEnabled,
	checkSsoClientId,
	checkSsoCodeChallenge,
	checkSsoRedirectUriFormat,
	checkSsoState,
} from '@/lib/account/server/ssoValidation';
import { USER_STATUS_MAP } from '@/lib/account/shared/constants';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	createNoStoreRedirectResponse,
} from '@/lib/api/routeResponses';
import { getLogSafeErrorCode } from '@/lib/logging';
import { createMainSiteUrl } from '@/lib/siteUrl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TSsoAuthorizeSubmitIntent = 'agree' | 'cancel';

interface ISsoAuthorizeSubmitBody {
	intent: TSsoAuthorizeSubmitIntent;
	transaction_id?: string;
}

function getRequiredQueryParam(request: NextRequest, name: string) {
	const value = request.nextUrl.searchParams.get(name)?.trim() ?? '';

	return value === '' ? null : value;
}

function getSsoAuthorizeSubmitIntent(value: unknown) {
	return value === 'agree' || value === 'cancel' ? value : null;
}

function createAuthorizePageUrl(status?: string) {
	const url = createMainSiteUrl('/sso/authorize');
	if (status !== undefined) {
		url.searchParams.set('status', status);
	}

	return url.toString();
}

function createAuthorizePageJsonResponse(status?: string) {
	return createNoStoreJsonResponse({
		redirect_url: createAuthorizePageUrl(status),
	});
}

function readSsoAuthorizeContext(request: NextRequest, transactionId: unknown) {
	const context = getSsoContextCookie(request);
	if (context === null || transactionId !== context.transaction_id) {
		return null;
	}

	return context;
}

async function submitSsoAuthorizeAgree(
	request: NextRequest,
	transactionId: unknown
) {
	const context = readSsoAuthorizeContext(request, transactionId);
	if (context === null) {
		return createAuthorizePageJsonResponse('expired');
	}

	try {
		const [authModule, ssoModule] = await Promise.all([
			import('@/lib/account/server/auth'),
			import('@/lib/account/server/sso'),
		]);
		const [auth, client] = await Promise.all([
			authModule.authenticateAccountFromRequest(request, true),
			ssoModule.getSsoClientById(context.client_id),
		]);
		if (auth.status === 'error') {
			return createAuthorizePageJsonResponse();
		}
		if (auth.data.credential.password_must_change === 1) {
			return createAuthorizePageJsonResponse();
		}
		if (
			client === null ||
			!checkSsoClientEnabled(client) ||
			!ssoModule.validateSsoRedirectUri(client, context.redirect_uri) ||
			auth.data.user.status !== USER_STATUS_MAP.active
		) {
			return createAuthorizePageJsonResponse('invalid');
		}

		const ticket = await ssoModule.createSsoTicket(
			context.client_id,
			auth.data.user.id,
			context.redirect_uri,
			context.code_challenge
		);
		const response = createNoStoreJsonResponse({
			redirect_url: createSsoRedirectUrl(
				context.redirect_uri,
				ticket,
				context.state
			),
		});
		clearSsoContextCookie(response, request);

		return response;
	} catch (error) {
		console.warn('SSO authorize confirmation failed.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return createAuthorizePageJsonResponse('invalid');
	}
}

async function submitSsoAuthorizeCancel(
	request: NextRequest,
	transactionId: unknown
) {
	const context = readSsoAuthorizeContext(request, transactionId);
	if (context === null) {
		return createAuthorizePageJsonResponse('expired');
	}

	let redirectUrl = createAuthorizePageUrl('cancelled');
	try {
		const ssoModule = await import('@/lib/account/server/sso');
		const client = await ssoModule.getSsoClientById(context.client_id);
		if (
			client?.cancel_redirect_uri !== undefined &&
			client.cancel_redirect_uri !== null &&
			checkSsoRedirectUriFormat(client.cancel_redirect_uri)
		) {
			redirectUrl = client.cancel_redirect_uri;
		}
	} catch (error) {
		console.warn('SSO authorize cancellation failed.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}

	const response = createNoStoreJsonResponse({ redirect_url: redirectUrl });
	clearSsoContextCookie(response, request);

	return response;
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
		const ssoModule = await import('@/lib/account/server/sso');
		if (!(await ssoModule.hasAnySsoClient())) {
			return createNoStoreErrorResponse('feature-disabled', 404);
		}

		const client = await ssoModule.getSsoClientById(clientId);
		if (client === null) {
			return createNoStoreErrorResponse('feature-disabled', 404);
		}
		if (!checkSsoClientEnabled(client)) {
			return createNoStoreErrorResponse('client-disabled', 403);
		}
		if (!ssoModule.validateSsoRedirectUri(client, redirectUri)) {
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

		const redirectUrl = createMainSiteUrl('/sso/authorize');

		const response = createNoStoreRedirectResponse(redirectUrl);
		ssoModule.setSsoContextCookie(
			response,
			{
				client_id: clientId,
				code_challenge: codeChallenge,
				redirect_uri: redirectUri,
				state,
				transaction_id: ssoModule.createSsoContextTransactionId(),
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

export async function POST(request: NextRequest) {
	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const sameOriginResponse = checkSameOriginRouteResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse =
		checkAccountCookieSecurityRouteResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const bodyResult =
		await readJsonBodyResult<ISsoAuthorizeSubmitBody>(request);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}
	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	const intent = getSsoAuthorizeSubmitIntent(body?.intent);
	if (intent === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		`sso-authorize-${intent}`
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	return intent === 'agree'
		? submitSsoAuthorizeAgree(request, body?.transaction_id)
		: submitSsoAuthorizeCancel(request, body?.transaction_id);
}
