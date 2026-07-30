import AdminAnnouncementForm from '@/features/announcements/admin/client/AdminAnnouncementForm';

import { readAdminAnnouncementEditInitialData } from './initialData/form';

interface IAdminAnnouncementEditPageContentProps {
	params: Promise<{ id: string }>;
}

export async function AdminAnnouncementEditPageContent({
	params,
}: IAdminAnnouncementEditPageContentProps) {
	const { id } = await params;

	return (
		<AdminAnnouncementForm
			announcementId={id}
			initialData={await readAdminAnnouncementEditInitialData(id)}
			mode="edit"
		/>
	);
}
