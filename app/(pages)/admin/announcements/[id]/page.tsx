import { type Metadata } from 'next';

import { AdminAnnouncementEditPageContent } from '@/features/announcements/admin/server/AdminAnnouncementEditPageContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IAdminAnnouncementEditPageProps {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({
	params,
}: IAdminAnnouncementEditPageProps): Promise<Metadata> {
	const { id } = await params;

	return { title: `通知${id}` };
}

export default function AdminAnnouncementEditPage({
	params,
}: IAdminAnnouncementEditPageProps) {
	return <AdminAnnouncementEditPageContent params={params} />;
}
