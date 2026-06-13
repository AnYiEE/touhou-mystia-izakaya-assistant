import AdminAnnouncementForm, {
	type IAdminAnnouncementFormInitialData,
} from '../form';
import { readAdminAnnouncementAuthInitialData } from '../server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AdminAnnouncementCreatePage() {
	const auth = await readAdminAnnouncementAuthInitialData(
		'/admin/announcements/new'
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

	return <AdminAnnouncementForm initialData={initialData} mode="create" />;
}
