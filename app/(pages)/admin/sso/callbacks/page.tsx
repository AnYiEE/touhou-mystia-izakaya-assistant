import { type Metadata } from 'next';

import { type IAdminSsoSearchParams } from '@/features/account/sso/admin/searchParams';
import { AdminSsoCallbacksPageContent } from '@/features/account/sso/admin/server/AdminSsoCallbacksPageContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'SSO Callback' };

interface IAdminSsoCallbacksPageProps {
	searchParams: Promise<IAdminSsoSearchParams>;
}

export default function AdminSsoCallbacksPage({
	searchParams,
}: IAdminSsoCallbacksPageProps) {
	return <AdminSsoCallbacksPageContent searchParams={searchParams} />;
}
