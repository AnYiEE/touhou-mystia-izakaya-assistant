import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	readJsonBodyResult,
} from '@/lib/account/server/routeResponses';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';
import {
	ANNOUNCEMENT_DISMISSED_COOKIE_NAME,
	parseAnnouncementDismissedCookieValue,
} from '@/lib/announcements/shared/dismissals';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IAnnouncementDismissBody {
	id: string;
	updatedAt: number;
}

export async function GET(request: NextRequest) {
	try {
		const rateLimitResponse = checkAccountRateLimitRouteResponse(
			request,
			'announcements-public-read',
			'',
			{ noTrustedIpGate: true }
		);
		if (rateLimitResponse !== null) {
			return rateLimitResponse;
		}

		const [environmentModule, serviceModule, authModule] =
			await Promise.all([
				import('@/lib/announcements/server/environment'),
				import('@/lib/announcements/server/service'),
				import('@/lib/account/server/auth'),
			]);
		const status = await environmentModule.getAnnouncementFeatureStatus();
		if (!status.enabled) {
			return createNoStoreJsonResponse({
				active: false,
				announcements: [],
			});
		}

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
		console.warn('Failed to read announcements API.', error);
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
		await readJsonBodyResult<IAnnouncementDismissBody>(request);
	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	if (
		typeof body?.id !== 'string' ||
		typeof body.updatedAt !== 'number' ||
		!Number.isSafeInteger(body.updatedAt)
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
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

	const authModule = await import('@/lib/account/server/auth');
	const auth = await authModule.authenticateAccountFromRequest(request);
	if (auth.status === 'error') {
		return createNoStoreJsonResponse({ message: 'announcement-dismissed' });
	}
	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const announcementModule =
		await import('@/lib/announcements/server/service');
	const result = await announcementModule.dismissAnnouncementForUser(
		body.id,
		body.updatedAt,
		auth.data.user.id,
		{ id: auth.data.session.id, token_hash: auth.data.sessionTokenHash }
	);
	if (result.status === 'unauthorized') {
		return createNoStoreJsonResponse({ message: 'announcement-dismissed' });
	}
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			announcementModule.ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP[
				result.error
			]
		);
	}

	return createNoStoreJsonResponse(result.data);
}
