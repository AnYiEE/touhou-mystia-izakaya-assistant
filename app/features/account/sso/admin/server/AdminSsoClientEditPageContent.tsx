import AdminSsoClientForm from '@/features/account/sso/admin/client/AdminSsoClientForm';
import { type IAdminSsoSearchParams } from '@/features/account/sso/admin/searchParams';

import { readAdminSsoClientEditInitialData } from './initialData/clientForm';

interface IAdminSsoClientEditPageContentProps {
	clientId: string;
	searchParams: Promise<IAdminSsoSearchParams>;
}

export async function AdminSsoClientEditPageContent({
	clientId,
	searchParams,
}: IAdminSsoClientEditPageContentProps) {
	const { initialData, listHref } = await readAdminSsoClientEditInitialData(
		clientId,
		searchParams
	);

	return (
		<AdminSsoClientForm
			clientId={clientId}
			initialData={initialData}
			listHref={listHref}
			mode="edit"
		/>
	);
}
