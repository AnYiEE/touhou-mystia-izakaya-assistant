import AdminAnnouncementsClient, {
	type IAdminAnnouncementsInitialData,
} from './client';
import { readAdminAnnouncementAuthInitialData } from './server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function readInitialAnnouncements(): Promise<
	IAdminAnnouncementsInitialData['announcements']
> {
	const serviceModule = await import('@/lib/announcements/server/service');

	return serviceModule.listAdminAnnouncements();
}

function renderClient(initialData: IAdminAnnouncementsInitialData) {
	return <AdminAnnouncementsClient initialData={initialData} />;
}

export default async function AdminAnnouncementsPage() {
	const auth = await readAdminAnnouncementAuthInitialData(
		'/admin/announcements'
	);
	const initialData: IAdminAnnouncementsInitialData = {
		admin: auth.admin,
		announcements: null,
		isAuthLoading: false,
		message: auth.message,
		renderedAt: Date.now(),
	};

	if (auth.admin === null) {
		return renderClient(initialData);
	}

	try {
		return renderClient({
			...initialData,
			announcements: await readInitialAnnouncements(),
		});
	} catch (error) {
		return renderClient({
			...initialData,
			message:
				error instanceof Error ? error.message : '读取站点通知失败',
		});
	}
}
