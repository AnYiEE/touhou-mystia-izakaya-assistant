import AdminSsoGrantsClient from '@/features/account/sso/admin/client/AdminSsoGrantsClient';
import { type IAdminSsoSearchParams } from '@/features/account/sso/admin/searchParams';

import { readAdminSsoGrantsInitialData } from './initialData/grants';

interface IAdminSsoGrantsPageContentProps {
	searchParams: Promise<IAdminSsoSearchParams>;
}

export async function AdminSsoGrantsPageContent({
	searchParams,
}: IAdminSsoGrantsPageContentProps) {
	return (
		<AdminSsoGrantsClient
			initialData={await readAdminSsoGrantsInitialData(searchParams)}
		/>
	);
}
