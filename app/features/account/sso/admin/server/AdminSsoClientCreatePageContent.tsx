import AdminSsoClientForm from '@/features/account/sso/admin/client/AdminSsoClientForm';

import { readAdminSsoClientCreateInitialData } from './initialData/clientForm';

export async function AdminSsoClientCreatePageContent() {
	return (
		<AdminSsoClientForm
			initialData={await readAdminSsoClientCreateInitialData()}
			mode="create"
		/>
	);
}
