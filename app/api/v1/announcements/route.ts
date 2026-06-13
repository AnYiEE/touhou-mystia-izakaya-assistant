import { type NextRequest } from 'next/server';

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

export async function GET(request: NextRequest) {
	try {
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
		const auth = await authModule.authenticateAccountRequest(request, true);
		const data =
			auth.status === 'ok'
				? await serviceModule.getVisibleAnnouncementsForRequestContext({
						dismissedTokens,
						isAuthenticated: true,
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
