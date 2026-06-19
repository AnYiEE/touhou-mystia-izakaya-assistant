import AdminSsoTicketsClient, {
	type IAdminSsoTicketsInitialData,
} from './client';

import {
	type IAdminSsoSearchParams,
	getAdminSsoPageFromSearchValue,
	getAdminSsoTicketStatusFromSearchValue,
	getAdminSsoTrimmedSearchValue,
} from '../searchParams';
import {
	readAdminSsoAuthInitialData,
	readAdminSsoTicketListInitialData,
} from '../server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IAdminSsoTicketsPageProps {
	searchParams: Promise<IAdminSsoSearchParams>;
}

function renderClient(initialData: IAdminSsoTicketsInitialData) {
	return <AdminSsoTicketsClient initialData={initialData} />;
}

export default async function AdminSsoTicketsPage({
	searchParams,
}: IAdminSsoTicketsPageProps) {
	const resolvedSearchParams = await searchParams;
	const page = getAdminSsoPageFromSearchValue(resolvedSearchParams.page);
	const clientId = getAdminSsoTrimmedSearchValue(
		resolvedSearchParams.client_id
	);
	const userId = getAdminSsoTrimmedSearchValue(resolvedSearchParams.user_id);
	const query = getAdminSsoTrimmedSearchValue(resolvedSearchParams.query);
	const status = getAdminSsoTicketStatusFromSearchValue(
		resolvedSearchParams.status
	);
	const auth = await readAdminSsoAuthInitialData('/admin/sso/tickets');
	const initialData: IAdminSsoTicketsInitialData = {
		admin: auth.admin,
		clientId: clientId ?? '',
		isAuthLoading: false,
		message: auth.message,
		query: query ?? '',
		renderedAt: Date.now(),
		status: status ?? '',
		tickets: null,
		userId: userId ?? '',
	};

	if (auth.admin === null) {
		return renderClient(initialData);
	}

	try {
		return renderClient({
			...initialData,
			tickets: await readAdminSsoTicketListInitialData({
				page,
				...(clientId === undefined ? {} : { clientId }),
				...(query === undefined ? {} : { query }),
				...(status === undefined ? {} : { status }),
				...(userId === undefined ? {} : { userId }),
			}),
		});
	} catch (error) {
		return renderClient({
			...initialData,
			message:
				error instanceof Error ? error.message : '读取SSO ticket失败',
		});
	}
}
