import { type Metadata } from 'next';

import { AdminPageContent } from '@/features/admin/server/AdminPageContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '用户管理' };

interface IAdminPageProps {
	searchParams: Promise<{ page?: string; query?: string; status?: string }>;
}

export default function AdminPage({ searchParams }: IAdminPageProps) {
	return <AdminPageContent searchParams={searchParams} />;
}
