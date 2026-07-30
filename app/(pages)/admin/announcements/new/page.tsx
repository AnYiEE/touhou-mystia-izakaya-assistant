import { type Metadata } from 'next';

import { AdminAnnouncementCreatePageContent } from '@/features/announcements/admin/server/AdminAnnouncementCreatePageContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '新建站点通知' };

export default function AdminAnnouncementCreatePage() {
	return <AdminAnnouncementCreatePageContent />;
}
