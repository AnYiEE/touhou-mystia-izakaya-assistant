import { type Metadata } from 'next';

import { type IAdminSsoSearchParams } from '@/features/account/sso/admin/searchParams';
import { AdminSsoClientEditPageContent } from '@/features/account/sso/admin/server/AdminSsoClientEditPageContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IAdminSsoClientEditPageProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<IAdminSsoSearchParams>;
}

export async function generateMetadata({
	params,
}: Pick<IAdminSsoClientEditPageProps, 'params'>): Promise<Metadata> {
	const { id } = await params;

	return { title: `SSO客户端${id}` };
}

export default async function AdminSsoClientEditPage({
	params,
	searchParams,
}: IAdminSsoClientEditPageProps) {
	const { id } = await params;

	return (
		<AdminSsoClientEditPageContent
			clientId={id}
			searchParams={searchParams}
		/>
	);
}
