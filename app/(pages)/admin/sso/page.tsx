import AdminSsoClientsClient, {
	type IAdminSsoClientsInitialData,
} from './client';
import { readAdminSsoAuthInitialData } from './server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function readInitialClients(): Promise<
	IAdminSsoClientsInitialData['clients']
> {
	const ssoModule = await import('@/lib/account/server/sso');
	const clients = await ssoModule.listSsoClients();

	return { clients: clients.map(ssoModule.createSsoClientPublicProfile) };
}

function renderClient(initialData: IAdminSsoClientsInitialData) {
	return <AdminSsoClientsClient initialData={initialData} />;
}

export default async function AdminSsoClientsPage() {
	const auth = await readAdminSsoAuthInitialData('/admin/sso');
	const initialData: IAdminSsoClientsInitialData = {
		admin: auth.admin,
		clients: null,
		isAuthLoading: false,
		message: auth.message,
		renderedAt: Date.now(),
	};

	if (auth.admin === null) {
		return renderClient(initialData);
	}

	try {
		return renderClient({
			...initialData,
			clients: await readInitialClients(),
		});
	} catch (error) {
		return renderClient({
			...initialData,
			message:
				error instanceof Error ? error.message : '读取SSO客户端失败',
		});
	}
}
