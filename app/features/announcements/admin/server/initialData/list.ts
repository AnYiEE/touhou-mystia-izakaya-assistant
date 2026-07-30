import {
	getAdminAuthInitialDataMessage,
	readAdminAuthInitialData,
} from '@/features/admin/server/initialData/auth';
import type { IAdminAnnouncementsInitialData } from '@/features/announcements/admin/contracts';

async function readInitialAnnouncements(): Promise<
	IAdminAnnouncementsInitialData['announcements']
> {
	const serviceModule =
		await import('@/features/announcements/server/admin/service');

	return serviceModule.listAdminAnnouncements();
}

export async function readAdminAnnouncementsInitialData(): Promise<IAdminAnnouncementsInitialData> {
	const authResult = await readAdminAuthInitialData('/admin/announcements');
	const initialData: IAdminAnnouncementsInitialData = {
		admin: authResult.admin,
		announcements: null,
		isAuthLoading: false,
		message: getAdminAuthInitialDataMessage(authResult),
		renderedAt: Date.now(),
	};

	if (authResult.admin === null) {
		return initialData;
	}

	try {
		return {
			...initialData,
			announcements: await readInitialAnnouncements(),
		};
	} catch (error) {
		return {
			...initialData,
			message:
				error instanceof Error ? error.message : '读取站点通知失败',
		};
	}
}
