import AdminSsoTicketsClient from '@/features/account/sso/admin/client/AdminSsoTicketsClient';
import { type IAdminSsoSearchParams } from '@/features/account/sso/admin/searchParams';

import { readAdminSsoTicketsInitialData } from './initialData/tickets';

interface IAdminSsoTicketsPageContentProps {
	searchParams: Promise<IAdminSsoSearchParams>;
}

export async function AdminSsoTicketsPageContent({
	searchParams,
}: IAdminSsoTicketsPageContentProps) {
	return (
		<AdminSsoTicketsClient
			initialData={await readAdminSsoTicketsInitialData(searchParams)}
		/>
	);
}
