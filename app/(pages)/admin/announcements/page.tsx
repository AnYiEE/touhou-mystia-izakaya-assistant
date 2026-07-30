import { type Metadata } from 'next';

import { AdminAnnouncementsPageContent } from '@/features/announcements/admin/server/AdminAnnouncementsPageContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '站点通知' };

export default function AdminAnnouncementsPage() {
	return <AdminAnnouncementsPageContent />;
}
