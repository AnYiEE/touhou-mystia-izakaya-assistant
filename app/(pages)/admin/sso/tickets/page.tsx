import { type Metadata } from 'next';

import { type IAdminSsoSearchParams } from '@/features/account/sso/admin/searchParams';
import { AdminSsoTicketsPageContent } from '@/features/account/sso/admin/server/AdminSsoTicketsPageContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'SSO Tickets' };

interface IAdminSsoTicketsPageProps {
	searchParams: Promise<IAdminSsoSearchParams>;
}

export default function AdminSsoTicketsPage({
	searchParams,
}: IAdminSsoTicketsPageProps) {
	return <AdminSsoTicketsPageContent searchParams={searchParams} />;
}
