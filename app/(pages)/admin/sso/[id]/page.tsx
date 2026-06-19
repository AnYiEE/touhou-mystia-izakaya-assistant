import AdminSsoClientForm, {
	type IAdminSsoClientFormInitialData,
} from '../clientForm';

import { createAdminSsoClientListHrefFromSearchParams } from '../locationState';
import {
	type IAdminSsoSearchParams,
	getAdminSsoSingleSearchValue,
} from '../searchParams';
import {
	readAdminSsoAuthInitialData,
	readAdminSsoClientInitialData,
	readAdminSsoClientUsersInitialData,
} from '../server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AdminSsoClientEditPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<IAdminSsoSearchParams>;
}) {
	const { id } = await params;
	const resolvedSearchParams = await searchParams;
	const clientListSearchParams = new URLSearchParams();
	Object.entries(resolvedSearchParams).forEach(([key, value]) => {
		const searchValue = getAdminSsoSingleSearchValue(value);
		if (searchValue !== undefined) {
			clientListSearchParams.set(key, searchValue);
		}
	});
	const listHref = createAdminSsoClientListHrefFromSearchParams(
		clientListSearchParams
	);
	const auth = await readAdminSsoAuthInitialData(
		`/admin/sso/${encodeURIComponent(id)}`
	);
	const initialData: IAdminSsoClientFormInitialData = {
		admin: auth.admin,
		client: null,
		clientUsers: null,
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
				listHref={listHref}
				mode="edit"
			/>
		);
	}

	try {
		const clientData = await readAdminSsoClientInitialData(id);
		const { client = null } = clientData ?? {};
		let clientUsers: IAdminSsoClientFormInitialData['clientUsers'] = null;
		let { message } = initialData;
		if (client !== null) {
			try {
				clientUsers = await readAdminSsoClientUsersInitialData(id);
			} catch (error) {
				if (error instanceof Error) {
					({ message } = error);
				} else {
					message = '读取SSO授权用户失败';
				}
			}
		}

		return (
			<AdminSsoClientForm
				clientId={id}
				initialData={{
					...initialData,
					client,
					clientUsers,
					isClientServerLoaded: true,
					loadError: client === null ? 'sso-client-not-found' : null,
					message,
				}}
				listHref={listHref}
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
				listHref={listHref}
				mode="edit"
			/>
		);
	}
}
