import { type Metadata } from 'next';

import AdminSsoClientForm, {
	type IAdminSsoClientFormInitialData,
} from '../clientForm';
import { readAdminSsoAuthInitialData } from '../server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '新建SSO客户端' };

export default async function AdminSsoClientCreatePage() {
	const auth = await readAdminSsoAuthInitialData('/admin/sso/new');
	const initialData: IAdminSsoClientFormInitialData = {
		admin: auth.admin,
		client: null,
		clientUsers: null,
		isAuthLoading: false,
		isClientServerLoaded: false,
		loadError: null,
		message: auth.message,
	};

	return <AdminSsoClientForm initialData={initialData} mode="create" />;
}
