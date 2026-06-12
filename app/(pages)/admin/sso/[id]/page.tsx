import AdminSsoClientForm, {
	type IAdminSsoClientFormInitialData,
} from '../clientForm';
import { readAdminSsoAuthInitialData } from '../server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function readInitialClient(
	id: string
): Promise<IAdminSsoClientFormInitialData['client']> {
	const ssoModule = await import('@/lib/account/server/sso');
	const client = await ssoModule.getSsoClientById(id);

	return client === null
		? null
		: ssoModule.createSsoClientPublicProfile(client);
}

export default async function AdminSsoClientEditPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const auth = await readAdminSsoAuthInitialData(
		`/admin/sso/${encodeURIComponent(id)}`
	);
	const initialData: IAdminSsoClientFormInitialData = {
		admin: auth.admin,
		client: null,
		isAuthLoading: false,
		isClientServerLoaded: false,
		loadError: null,
		message: auth.message,
	};

	if (auth.admin === null) {
		return (
			<AdminSsoClientForm
				clientId={id}
				initialData={initialData}
				mode="edit"
			/>
		);
	}

	try {
		const client = await readInitialClient(id);

		return (
			<AdminSsoClientForm
				clientId={id}
				initialData={{
					...initialData,
					client,
					isClientServerLoaded: true,
					loadError: client === null ? 'sso-client-not-found' : null,
				}}
				mode="edit"
			/>
		);
	} catch (error) {
		return (
			<AdminSsoClientForm
				clientId={id}
				initialData={{
					...initialData,
					loadError:
						error instanceof Error
							? error.message
							: '读取SSO客户端失败',
				}}
				mode="edit"
			/>
		);
	}
}
