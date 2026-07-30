import { type Metadata } from 'next';

import { type IAdminSsoSearchParams } from '@/features/account/sso/admin/searchParams';
import { AdminSsoClientsPageContent } from '@/features/account/sso/admin/server/AdminSsoClientsPageContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'SSO管理' };

interface IAdminSsoClientsPageProps {
	searchParams: Promise<IAdminSsoSearchParams>;
}

export default function AdminSsoClientsPage({
	searchParams,
}: IAdminSsoClientsPageProps) {
	return <AdminSsoClientsPageContent searchParams={searchParams} />;
}
