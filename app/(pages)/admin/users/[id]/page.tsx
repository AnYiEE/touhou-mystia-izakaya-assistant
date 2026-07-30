import { type Metadata } from 'next';

import { AdminUserDetailPageContent } from '@/features/admin/server/AdminUserDetailPageContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IAdminUserDetailPageProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ page?: string; query?: string; status?: string }>;
}

export async function generateMetadata({
	params,
}: Pick<IAdminUserDetailPageProps, 'params'>): Promise<Metadata> {
	const { id } = await params;

	return { title: `用户${id}` };
}

export default function AdminUserDetailPage({
	params,
	searchParams,
}: IAdminUserDetailPageProps) {
	return (
		<AdminUserDetailPageContent
			params={params}
			searchParams={searchParams}
		/>
	);
}
