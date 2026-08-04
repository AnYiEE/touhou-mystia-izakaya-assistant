import { type NextRequest } from 'next/server';

import { readJsonBodyResult } from '@/features/account/server/http/jsonBody';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';
import { ANNOUNCEMENT_API_RESPONSE_CODE_MAP } from '@/features/announcements/apiResponseCodes';
import {
	ANNOUNCEMENT_DISMISSED_COOKIE_NAME,
	parseAnnouncementDismissedCookieValue,
} from '@/features/announcements/dismissals';
import { ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP } from '@/features/announcements/server/http/serviceErrorStatus';

import { SERVER_MISCONFIGURED_MESSAGE } from '@/infrastructure/environment/serverValidation';
import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IAnnouncementDismissBody {
	id: string;
	updatedAt: number;
}

export async function GET(request: NextRequest) {
	try {
		const featureStatusModule =
			await import('@/features/account/server/featureStatus');
		const status = await featureStatusModule.getAccountFeatureStatus();
		if (!status.enabled) {
			return createNoStoreJsonResponse({
				active: false,
				announcements: [],
			});
		}

		const rateLimitResponse = checkAccountRateLimitRouteResponse(
			request,
			'announcements-public-read',
			'',
			{ noTrustedIpGate: true }
		);
		if (rateLimitResponse !== null) {
			return rateLimitResponse;
		}

		const [serviceModule, authModule] = await Promise.all([
			import('@/features/announcements/server/public/service'),
			import('@/features/account/server'),
		]);

		const dismissedTokens = parseAnnouncementDismissedCookieValue(
			request.cookies.get(ANNOUNCEMENT_DISMISSED_COOKIE_NAME)?.value ??
				null
		);
		const auth = await authModule.authenticateAccountFromRequest(
			request,
			true
		);
		const data =
			auth.status === 'ok'
				? await serviceModule.getVisibleAnnouncementsForRequestContext({
						dismissedTokens,
						isAuthenticated: true,
						nickname: auth.data.user.nickname,
						userId: auth.data.user.id,
						username: auth.data.user.username,
					})
				: await serviceModule.getVisibleAnnouncementsForRequestContext({
						dismissedTokens,
						isAuthenticated: false,
					});

		return createNoStoreJsonResponse(data);
	} catch (error) {
		console.warn('Failed to read announcements API.', {
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
		await readJsonBodyResult<IAnnouncementDismissBody>(request);
	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	if (
		typeof body?.id !== 'string' ||
		typeof body.updatedAt !== 'number' ||
		!Number.isSafeInteger(body.updatedAt)
	) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'announcement-dismiss',
		'',
		{ parts: [{ name: 'announcement', value: body.id }] }
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const [authModule, csrfModule] = await Promise.all([
		import('@/features/account/server'),
		import('@/features/account/server/auth/accountCsrf'),
	]);
	const auth = await authModule.authenticateAccountFromRequest(request);
	if (auth.status === 'error') {
		return createNoStoreJsonResponse({
			message: ANNOUNCEMENT_API_RESPONSE_CODE_MAP.dismissed,
		});
	}
	if (!csrfModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.forbidden,
			403
		);
	}

	const [announcementModule, sessionsModule] = await Promise.all([
		import('@/features/announcements/server/public/service'),
		import('@/features/account/server/persistence/repositories/sessions'),
	]);
	const result = await announcementModule.dismissAnnouncementForUser(
		body.id,
		body.updatedAt,
		auth.data.user.id,
		{ id: auth.data.session.id, token_hash: auth.data.sessionTokenHash },
		sessionsModule.lockActiveUserSessionInTransaction
	);
	if (result.status === 'unauthorized') {
		return createNoStoreJsonResponse({
			message: ANNOUNCEMENT_API_RESPONSE_CODE_MAP.dismissed,
		});
	}
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP[result.error]
		);
	}

	return createNoStoreJsonResponse(result.data);
}
