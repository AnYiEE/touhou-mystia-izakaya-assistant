import AdminAnnouncementForm, {
	type IAdminAnnouncementFormInitialData,
} from '../form';
import { readAdminAnnouncementAuthInitialData } from '../server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function readInitialAnnouncement(
	id: string
): Promise<
	Pick<IAdminAnnouncementFormInitialData, 'announcement' | 'versions'>
> {
	const serviceModule = await import('@/lib/announcements/server/service');
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

export default async function AdminAnnouncementEditPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const auth = await readAdminAnnouncementAuthInitialData(
		`/admin/announcements/${encodeURIComponent(id)}`
	);
	const initialData: IAdminAnnouncementFormInitialData = {
		admin: auth.admin,
		announcement: null,
		isAnnouncementServerLoaded: false,
		isAuthLoading: false,
		loadError: null,
		message: auth.message,
		versions: null,
	};

	if (auth.admin === null) {
		return (
			<AdminAnnouncementForm
				announcementId={id}
				initialData={initialData}
				mode="edit"
			/>
		);
	}

	try {
		const data = await readInitialAnnouncement(id);

		return (
			<AdminAnnouncementForm
				announcementId={id}
				initialData={{
					...initialData,
					...data,
					isAnnouncementServerLoaded: true,
					loadError:
						data.announcement === null
							? 'announcement-not-found'
							: null,
				}}
				mode="edit"
			/>
		);
	} catch (error) {
		return (
			<AdminAnnouncementForm
				announcementId={id}
				initialData={{
					...initialData,
					loadError:
						error instanceof Error
							? error.message
							: '读取站点通知失败',
				}}
				mode="edit"
			/>
		);
	}
}
