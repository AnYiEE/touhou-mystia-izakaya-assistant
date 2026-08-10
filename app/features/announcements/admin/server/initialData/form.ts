import {
	type TAdminAuthInitialDataResult,
	getAdminAuthInitialDataMessage,
	readAdminAuthInitialData,
} from '@/features/admin/server/initialData/auth';
import type { IAdminAnnouncementFormInitialData } from '@/features/announcements/admin/contracts';
import { ADMIN_ANNOUNCEMENT_MESSAGE_MAP } from '@/features/announcements/admin/copy';

function createFormInitialData(
	authResult: TAdminAuthInitialDataResult
): IAdminAnnouncementFormInitialData {
	return {
		admin: authResult.admin,
		announcement: null,
		isAnnouncementServerLoaded: false,
		isAuthLoading: false,
		loadError: null,
		message: getAdminAuthInitialDataMessage(authResult),
		versions: null,
	};
}

async function readInitialAnnouncement(
	id: string
): Promise<
	Pick<IAdminAnnouncementFormInitialData, 'announcement' | 'versions'>
> {
	const serviceModule =
		await import('@/features/announcements/server/admin/service');
	const [announcementResult, versionsResult] = await Promise.all([
		serviceModule.getAdminAnnouncement(id),
		serviceModule.listAdminAnnouncementVersions(id),
	]);

	return {
		announcement:
			announcementResult.status === 'ok'
				? announcementResult.data.announcement
				: null,
		versions: versionsResult.status === 'ok' ? versionsResult.data : null,
	};
}

export async function readAdminAnnouncementCreateInitialData(): Promise<IAdminAnnouncementFormInitialData> {
	return createFormInitialData(
		await readAdminAuthInitialData('/admin/announcements/new')
	);
}

export async function readAdminAnnouncementEditInitialData(
	id: string
): Promise<IAdminAnnouncementFormInitialData> {
	const authResult = await readAdminAuthInitialData(
		`/admin/announcements/${encodeURIComponent(id)}`
	);
	const initialData = createFormInitialData(authResult);

	if (authResult.admin === null) {
		return initialData;
	}

	try {
		const data = await readInitialAnnouncement(id);

		return {
			...initialData,
			...data,
			isAnnouncementServerLoaded: true,
			loadError:
				data.announcement === null ? 'announcement-not-found' : null,
		};
	} catch (error) {
		return {
			...initialData,
			loadError: Error.isError(error)
				? error.message
				: ADMIN_ANNOUNCEMENT_MESSAGE_MAP.listReadFailed,
		};
	}
}
