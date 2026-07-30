import { type Metadata } from 'next';

import { type IAdminSsoSearchParams } from '@/features/account/sso/admin/searchParams';
import { AdminSsoGrantsPageContent } from '@/features/account/sso/admin/server/AdminSsoGrantsPageContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'SSO授权关系' };

interface IAdminSsoGrantsPageProps {
	searchParams: Promise<IAdminSsoSearchParams>;
}

export default function AdminSsoGrantsPage({
	searchParams,
}: IAdminSsoGrantsPageProps) {
	return <AdminSsoGrantsPageContent searchParams={searchParams} />;
}
