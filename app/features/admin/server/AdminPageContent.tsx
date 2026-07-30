import AdminUsersClient from '@/features/admin/client/users/AdminUsersClient';

import { readAdminUsersInitialData } from './initialData/users';

interface IAdminPageContentProps {
	searchParams: Promise<{ page?: string; query?: string; status?: string }>;
}

export async function AdminPageContent({
	searchParams,
}: IAdminPageContentProps) {
	return (
		<AdminUsersClient
			initialData={await readAdminUsersInitialData(searchParams)}
		/>
	);
}
