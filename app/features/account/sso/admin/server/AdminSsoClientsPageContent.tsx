import AdminSsoClientsClient from '@/features/account/sso/admin/client/AdminSsoClientsClient';
import { type IAdminSsoSearchParams } from '@/features/account/sso/admin/searchParams';

import { readAdminSsoClientsInitialData } from './initialData/clientList';

interface IAdminSsoClientsPageContentProps {
	searchParams: Promise<IAdminSsoSearchParams>;
}

export async function AdminSsoClientsPageContent({
	searchParams,
}: IAdminSsoClientsPageContentProps) {
	return (
		<AdminSsoClientsClient
			initialData={await readAdminSsoClientsInitialData(searchParams)}
		/>
	);
}
