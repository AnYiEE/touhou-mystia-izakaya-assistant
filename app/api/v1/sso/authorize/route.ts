import { type NextRequest } from 'next/server';

import { readJsonBodyResult } from '@/features/account/server/http/jsonBody';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';
import { createAccountAuthErrorRouteResponse } from '@/features/account/server/http/routeResponses';
import { FEATURE_DISABLED_MESSAGE } from '@/features/account/server/featureStatus';
import {
	ACCOUNT_SSO_API_RESPONSE_CODE_MAP,
	SSO_AUTHORIZE_PAGE_STATUS_MAP,
} from '@/features/account/sso/apiResponseCodes';
import {
	clearSsoContextCookie,
	getSsoContextCookie,
	setSsoContextCookie,
} from '@/features/account/sso/server/context';
import { checkSsoRateLimitRouteResponse } from '@/features/account/sso/server/http/routeResponses';
import {
	checkSsoClientId,
	checkSsoCodeChallenge,
	checkSsoRedirectUriFormat,
	checkSsoState,
} from '@/features/account/sso/server/validation';

import { SERVER_MISCONFIGURED_MESSAGE } from '@/infrastructure/environment/serverValidation';
import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	createNoStoreRedirectResponse,
} from '@/infrastructure/http/server/responses';
import { createMainSiteUrl } from '@/infrastructure/http/siteUrl';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

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

function createSsoAuthorizationFlowLoadErrorResponse(
	request: NextRequest,
	intent: TSsoAuthorizeSubmitIntent,
	transactionId: unknown,
	error: unknown
) {
	const context = getSsoContextCookie(request);
	if (context === null || transactionId !== context.transaction_id) {
		return createAuthorizePageJsonResponse(
			SSO_AUTHORIZE_PAGE_STATUS_MAP.expired
		);
	}

	console.warn(
		intent === 'agree'
			? 'SSO authorize confirmation failed.'
			: 'SSO authorize cancellation failed.',
		{ errorCode: getLogSafeErrorCode(error) }
	);

	const response = createAuthorizePageJsonResponse(
		intent === 'agree'
			? SSO_AUTHORIZE_PAGE_STATUS_MAP.invalid
			: SSO_AUTHORIZE_PAGE_STATUS_MAP.cancelled
	);
	if (intent === 'cancel') {
		clearSsoContextCookie(response, request);
	}

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
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
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
		const authorizationFlowModule =
			await import('@/features/account/sso/authorize/server/authorizationFlow');
		const result = await authorizationFlowModule.prepareSsoAuthorization(
			request,
			{ clientId, codeChallenge, redirectUri, state }
		);
		if (result.status === 'account-auth-error') {
			return createAccountAuthErrorRouteResponse(result.auth, request);
		}
		if (result.status === 'error') {
			switch (result.error) {
				case 'client-disabled':
					return createNoStoreErrorResponse(
						ACCOUNT_SSO_API_RESPONSE_CODE_MAP.clientDisabled,
						403
					);
				case 'feature-disabled':
					return createNoStoreErrorResponse(
						FEATURE_DISABLED_MESSAGE,
						404
					);
				case 'invalid-redirect-uri':
					return createNoStoreErrorResponse(
						ACCOUNT_SSO_API_RESPONSE_CODE_MAP.invalidRedirectUri,
						400
					);
			}
		}

		const redirectUrl = createMainSiteUrl('/sso/authorize');

		const response = createNoStoreRedirectResponse(redirectUrl);
		setSsoContextCookie(response, result.context, request);

		return response;
	} catch (error) {
		console.warn('SSO authorize failed.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return createNoStoreErrorResponse(SERVER_MISCONFIGURED_MESSAGE, 500);
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
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.payloadTooLarge,
			413
		);
	}
	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	const intent = getSsoAuthorizeSubmitIntent(body?.intent);
	if (intent === null) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		`sso-authorize-${intent}`
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	let authorizationFlowModule;
	try {
		authorizationFlowModule =
			await import('@/features/account/sso/authorize/server/authorizationFlow');
	} catch (error) {
		return createSsoAuthorizationFlowLoadErrorResponse(
			request,
			intent,
			body?.transaction_id,
			error
		);
	}
	const result = await authorizationFlowModule.submitSsoAuthorization(
		request,
		{ intent, transactionId: body?.transaction_id }
	);
	const response =
		result.status === 'redirect'
			? createNoStoreJsonResponse({ redirect_url: result.redirectUrl })
			: createAuthorizePageJsonResponse(
					result.status === 'resume' ? undefined : result.status
				);
	if (result.clearContext) {
		clearSsoContextCookie(response, request);
	}

	return response;
}
