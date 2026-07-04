import { type Metadata } from 'next';

import AdminSsoGrantsClient, {
	type IAdminSsoGrantsInitialData,
} from './client';

import {
	type IAdminSsoSearchParams,
	getAdminSsoClientStatusFromSearchValue,
	getAdminSsoPageFromSearchValue,
	getAdminSsoTrimmedSearchValue,
	getAdminSsoUserStatusFromSearchValue,
} from '../searchParams';
import {
	readAdminSsoAuthInitialData,
	readAdminSsoGrantListInitialData,
} from '../server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'SSO授权关系' };

function renderClient(initialData: IAdminSsoGrantsInitialData) {
	return <AdminSsoGrantsClient initialData={initialData} />;
}

interface IAdminSsoGrantsPageProps {
	searchParams: Promise<IAdminSsoSearchParams>;
}

export default async function AdminSsoGrantsPage({
	searchParams,
}: IAdminSsoGrantsPageProps) {
	const resolvedSearchParams = await searchParams;
	const page = getAdminSsoPageFromSearchValue(resolvedSearchParams.page);
	const clientId = getAdminSsoTrimmedSearchValue(
		resolvedSearchParams.client_id
	);
	const userId = getAdminSsoTrimmedSearchValue(resolvedSearchParams.user_id);
	const query = getAdminSsoTrimmedSearchValue(resolvedSearchParams.query);
	const clientStatus = getAdminSsoClientStatusFromSearchValue(
		resolvedSearchParams.client_status
	);
	const userStatus = getAdminSsoUserStatusFromSearchValue(
		resolvedSearchParams.user_status
	);
	const auth = await readAdminSsoAuthInitialData('/admin/sso/grants');
	const initialData: IAdminSsoGrantsInitialData = {
		admin: auth.admin,
		clientId: clientId ?? '',
		clientStatus: clientStatus ?? '',
		grants: null,
		isAuthLoading: false,
		message: auth.message,
		query: query ?? '',
		renderedAt: Date.now(),
		userId: userId ?? '',
		userStatus: userStatus ?? '',
	};

	if (auth.admin === null) {
		return renderClient(initialData);
	}

	try {
		return renderClient({
			...initialData,
			grants: await readAdminSsoGrantListInitialData({
				page,
				...(clientId === undefined ? {} : { clientId }),
				...(clientStatus === undefined ? {} : { clientStatus }),
				...(query === undefined ? {} : { query }),
				...(userId === undefined ? {} : { userId }),
				...(userStatus === undefined ? {} : { userStatus }),
			}),
		});
	} catch (error) {
		return renderClient({
			...initialData,
			message:
				error instanceof Error ? error.message : '读取SSO授权关系失败',
		});
	}
}
