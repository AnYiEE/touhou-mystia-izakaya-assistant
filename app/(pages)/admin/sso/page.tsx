import AdminSsoClientsClient, {
	type IAdminSsoClientsInitialData,
} from './client';

import {
	type IAdminSsoSearchParams,
	getAdminSsoCallbackConfigFromSearchValue,
	getAdminSsoClientStatusFromSearchValue,
	getAdminSsoGrantPresenceFromSearchValue,
	getAdminSsoPageFromSearchValue,
	getAdminSsoTrimmedSearchValue,
} from './searchParams';
import {
	readAdminSsoAuthInitialData,
	readAdminSsoClientsInitialData,
} from './server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function renderClient(initialData: IAdminSsoClientsInitialData) {
	return <AdminSsoClientsClient initialData={initialData} />;
}

interface IAdminSsoClientsPageProps {
	searchParams: Promise<IAdminSsoSearchParams>;
}

export default async function AdminSsoClientsPage({
	searchParams,
}: IAdminSsoClientsPageProps) {
	const resolvedSearchParams = await searchParams;
	const page = getAdminSsoPageFromSearchValue(resolvedSearchParams.page);
	const query = getAdminSsoTrimmedSearchValue(resolvedSearchParams.query);
	const status = getAdminSsoClientStatusFromSearchValue(
		resolvedSearchParams.status
	);
	const callback = getAdminSsoCallbackConfigFromSearchValue(
		resolvedSearchParams.callback
	);
	const grant = getAdminSsoGrantPresenceFromSearchValue(
		resolvedSearchParams.has_grants
	);
	const auth = await readAdminSsoAuthInitialData('/admin/sso');
	const initialData: IAdminSsoClientsInitialData = {
		admin: auth.admin,
		callback: callback ?? '',
		clients: null,
		grant: grant ?? '',
		isAuthLoading: false,
		message: auth.message,
		query: query ?? '',
		renderedAt: Date.now(),
		status: status ?? '',
	};

	if (auth.admin === null) {
		return renderClient(initialData);
	}

	try {
		return renderClient({
			...initialData,
			clients: await readAdminSsoClientsInitialData({
				page,
				...(callback === undefined ? {} : { callback }),
				...(grant === undefined ? {} : { hasGrants: grant === 'has' }),
				...(query === undefined ? {} : { query }),
				...(status === undefined ? {} : { status }),
			}),
		});
	} catch (error) {
		return renderClient({
			...initialData,
			message:
				error instanceof Error ? error.message : '读取SSO客户端失败',
		});
	}
}
