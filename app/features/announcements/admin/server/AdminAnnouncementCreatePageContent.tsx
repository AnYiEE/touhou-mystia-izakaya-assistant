import AdminAnnouncementForm from '@/features/announcements/admin/client/AdminAnnouncementForm';

import { readAdminAnnouncementCreateInitialData } from './initialData/form';

export async function AdminAnnouncementCreatePageContent() {
	return (
		<AdminAnnouncementForm
			initialData={await readAdminAnnouncementCreateInitialData()}
			mode="create"
		/>
	);
}
