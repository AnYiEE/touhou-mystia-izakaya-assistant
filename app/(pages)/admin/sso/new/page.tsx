import AdminSsoClientForm, {
	type IAdminSsoClientFormInitialData,
} from '../clientForm';
import { readAdminSsoAuthInitialData } from '../server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
