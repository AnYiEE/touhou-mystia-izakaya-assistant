import AdminAnnouncementsClient from '@/features/announcements/admin/client/AdminAnnouncementsClient';

import { readAdminAnnouncementsInitialData } from './initialData/list';

export async function AdminAnnouncementsPageContent() {
	return (
		<AdminAnnouncementsClient
			initialData={await readAdminAnnouncementsInitialData()}
		/>
	);
}
