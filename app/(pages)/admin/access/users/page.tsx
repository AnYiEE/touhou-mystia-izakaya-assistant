import { type Metadata } from 'next';

import {
	getAdminAuthInitialDataMessage,
	readAdminAuthInitialData,
} from '@/features/admin/server/initialData/auth';
import { checkAdminPagination } from '@/features/admin/server/pagination';
import { AccessUsersClient } from '@/features/featureAccess/admin/client/AccessUsersClient';
import { AccessAuthRequired } from '@/features/featureAccess/admin/server/AccessAuthRequired';
import { listAdminFeatureAccessUsers } from '@/features/featureAccess/admin/server/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '用户访问' };

const PAGE_SIZE = 20;

interface IAdminAccessUsersPageProps {
	searchParams: Promise<{ page?: string; query?: string }>;
}

export default async function AdminAccessUsersPage({
	searchParams,
}: IAdminAccessUsersPageProps) {
	const [{ page: pageValue, query = '' }, auth] = await Promise.all([
		searchParams,
		readAdminAuthInitialData('/admin/access/users'),
	]);
	if (auth.admin === null) {
		return (
			<AccessAuthRequired
				message={getAdminAuthInitialDataMessage(auth)}
				title="用户访问"
			/>
		);
	}
	const parsedPage = Number.parseInt(pageValue ?? '1', 10);
	const page =
		Number.isSafeInteger(parsedPage) &&
		checkAdminPagination({ page: parsedPage, pageSize: PAGE_SIZE })
			? parsedPage
			: 1;

	return (
		<AccessUsersClient
			initialData={await listAdminFeatureAccessUsers({
				limit: PAGE_SIZE,
				offset: (page - 1) * PAGE_SIZE,
				query: query.trim(),
			})}
			initialQuery={query.trim()}
		/>
	);
}
