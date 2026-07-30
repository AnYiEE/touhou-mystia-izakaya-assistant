import AdminUserDetailClient from '@/features/admin/client/userDetail/AdminUserDetailClient';

import { readAdminUserDetailInitialData } from './initialData/userDetail';

interface IAdminUserDetailPageContentProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ page?: string; query?: string; status?: string }>;
}

export async function AdminUserDetailPageContent({
	params,
	searchParams,
}: IAdminUserDetailPageContentProps) {
	return (
		<AdminUserDetailClient
			initialData={await readAdminUserDetailInitialData(
				params,
				searchParams
			)}
		/>
	);
}
