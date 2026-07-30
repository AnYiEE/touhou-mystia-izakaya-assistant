import { cookies } from 'next/headers';
import { unstable_rethrow } from 'next/navigation';

import type { TAccountFeatureViewer } from '@/features/account/contracts';
import { type IAnnouncementPublicItem } from '@/features/announcements/contracts';
import {
	ANNOUNCEMENT_DISMISSED_COOKIE_NAME,
	parseAnnouncementDismissedCookieValue,
} from '@/features/announcements/dismissals';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

interface IProps {
	viewer?: TAccountFeatureViewer | null;
}

async function readAnnouncementViewerFallback(): Promise<TAccountFeatureViewer> {
	const [authModule, currentRequestModule] = await Promise.all([
		import('@/features/account/server/auth/requestAuthentication'),
		import('@/infrastructure/http/server/currentRequest'),
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
	if (PUBLIC_RUNTIME_CONFIG.isExportMode) {
		return null;
	}

	let announcements: IAnnouncementPublicItem[] = [];

	try {
		const featureStatusModule =
			await import('@/features/account/server/featureStatus');
		const status = await featureStatusModule.getAccountFeatureStatus();
		if (status.enabled) {
			const serviceModule = await import('./public/service');
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
		await import('@/features/announcements/client/components/AnnouncementCarousel');

	return <AnnouncementCarousel serverAnnouncements={announcements} />;
}
