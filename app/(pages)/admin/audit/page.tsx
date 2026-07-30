import { type Metadata } from 'next';

import { type IAdminSearchParams } from '@/features/admin/searchParams';
import { AdminAuditPageContent } from '@/features/admin/server/AdminAuditPageContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '审计日志' };

interface IAdminAuditPageProps {
	searchParams: Promise<IAdminSearchParams>;
}

export default function AdminAuditPage({ searchParams }: IAdminAuditPageProps) {
	return <AdminAuditPageContent searchParams={searchParams} />;
}
