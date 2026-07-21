import { cookies } from 'next/headers';
import { unstable_rethrow } from 'next/navigation';

import { type TAccountFeatureViewer } from '@/lib/account/server/initialData';
import {
	ANNOUNCEMENT_DISMISSED_COOKIE_NAME,
	parseAnnouncementDismissedCookieValue,
} from '@/lib/announcements/shared/dismissals';
import type { IAnnouncementPublicItem } from '@/lib/announcements/shared/types';
import { getLogSafeErrorCode } from '@/lib/logging';
import { siteConfig } from '@/configs';

interface IProps {
	viewer?: TAccountFeatureViewer | null;
}

async function readAnnouncementViewerFallback(): Promise<TAccountFeatureViewer> {
	const [authModule, currentRequestModule] = await Promise.all([
		import('@/lib/account/server/auth'),
		import('@/lib/account/server/currentRequest'),
	]);
	const request = await currentRequestModule.createCurrentRequest('/');
	const auth = await authModule.authenticateAccountFromRequest(request, true);

	return auth.status === 'ok'
		? {
				isAuthenticated: true,
				nickname: auth.data.user.nickname,
				userId: auth.data.user.id,
				username: auth.data.user.username,
			}
		: { isAuthenticated: false };
}

export default async function AnnouncementBar({ viewer = null }: IProps) {
	if (siteConfig.isExportMode) {
		return null;
	}

	let announcements: IAnnouncementPublicItem[] = [];

	try {
		const [environmentModule, serviceModule] = await Promise.all([
			import('@/lib/announcements/server/environment'),
			import('@/lib/announcements/server/service'),
		]);
		const status = await environmentModule.getAnnouncementFeatureStatus();
		if (status.enabled) {
			const cookieStore = await cookies();
			const dismissedTokens = parseAnnouncementDismissedCookieValue(
				cookieStore.get(ANNOUNCEMENT_DISMISSED_COOKIE_NAME)?.value ??
					null
			);
			const requestViewer =
				viewer ?? (await readAnnouncementViewerFallback());
			const visible =
				await serviceModule.getVisibleAnnouncementsForRequestContext({
					...requestViewer,
					dismissedTokens,
				});
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
