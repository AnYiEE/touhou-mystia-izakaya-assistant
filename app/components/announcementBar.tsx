import { cookies } from 'next/headers';
import { unstable_rethrow } from 'next/navigation';

import {
	ANNOUNCEMENT_DISMISSED_COOKIE_NAME,
	parseAnnouncementDismissedCookieValue,
} from '@/lib/announcements/shared/dismissals';
import type { IAnnouncementPublicItem } from '@/lib/announcements/shared/types';
import { getLogSafeErrorCode } from '@/lib/logging';
import { siteConfig } from '@/configs';

export default async function AnnouncementBar() {
	if (siteConfig.isExportMode) {
		return null;
	}

	let announcements: IAnnouncementPublicItem[] = [];

	try {
		const [environmentModule, serviceModule, authModule] =
			await Promise.all([
				import('@/lib/announcements/server/environment'),
				import('@/lib/announcements/server/service'),
				import('@/lib/account/server/auth'),
			]);
		const status = await environmentModule.getAnnouncementFeatureStatus();
		if (status.enabled) {
			const cookieStore = await cookies();
			const dismissedTokens = parseAnnouncementDismissedCookieValue(
				cookieStore.get(ANNOUNCEMENT_DISMISSED_COOKIE_NAME)?.value ??
					null
			);
			const { createCurrentRequest } =
				await import('@/lib/account/server/currentRequest');
			const request = await createCurrentRequest('/');
			const auth = await authModule.authenticateAccountFromRequest(
				request,
				true
			);
			const visible =
				auth.status === 'ok'
					? await serviceModule.getVisibleAnnouncementsForRequestContext(
							{
								dismissedTokens,
								isAuthenticated: true,
								nickname: auth.data.user.nickname,
								userId: auth.data.user.id,
								username: auth.data.user.username,
							}
						)
					: await serviceModule.getVisibleAnnouncementsForRequestContext(
							{ dismissedTokens, isAuthenticated: false }
						);
			if (visible.active) {
				announcements = visible.announcements;
			}
		}
	} catch (error) {
		unstable_rethrow(error);
		console.warn('Failed to render ordinary announcements.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}

	const { default: AnnouncementCarousel } =
		await import('./announcementCarousel');

	return <AnnouncementCarousel serverAnnouncements={announcements} />;
}
