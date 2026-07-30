import { type Metadata } from 'next';

import { type IAdminSsoSearchParams } from '@/features/account/sso/admin/searchParams';
import { AdminSsoCallbackHistoryPageContent } from '@/features/account/sso/admin/server/AdminSsoCallbackHistoryPageContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'SSO投递历史' };

interface IAdminSsoCallbackHistoryPageProps {
	searchParams: Promise<IAdminSsoSearchParams>;
}

export default function AdminSsoCallbackHistoryPage({
	searchParams,
}: IAdminSsoCallbackHistoryPageProps) {
	return <AdminSsoCallbackHistoryPageContent searchParams={searchParams} />;
}
