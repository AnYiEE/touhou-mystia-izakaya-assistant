import { type Metadata } from 'next';

import AdminSsoCallbacksClient, {
	type IAdminSsoCallbacksInitialData,
} from './client';

import {
	type IAdminSsoSearchParams,
	getAdminSsoCallbackEventFromSearchValue,
	getAdminSsoCallbackQueueStatusFromSearchValue,
	getAdminSsoPageFromSearchValue,
	getAdminSsoTimeFromSearchValue,
	getAdminSsoTrimmedSearchValue,
} from '../searchParams';
import {
	readAdminSsoAuthInitialData,
	readAdminSsoCallbackQueueInitialData,
} from '../server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'SSO Callback' };

interface IAdminSsoCallbacksPageProps {
	searchParams: Promise<IAdminSsoSearchParams>;
}

function renderClient(initialData: IAdminSsoCallbacksInitialData) {
	return <AdminSsoCallbacksClient initialData={initialData} />;
}

export default async function AdminSsoCallbacksPage({
	searchParams,
}: IAdminSsoCallbacksPageProps) {
	const resolvedSearchParams = await searchParams;
	const page = getAdminSsoPageFromSearchValue(resolvedSearchParams.page);
	const clientId = getAdminSsoTrimmedSearchValue(
		resolvedSearchParams.client_id
	);
	const userId = getAdminSsoTrimmedSearchValue(resolvedSearchParams.user_id);
	const query = getAdminSsoTrimmedSearchValue(resolvedSearchParams.query);
	const event = getAdminSsoCallbackEventFromSearchValue(
		resolvedSearchParams.event
	);
	const status = getAdminSsoCallbackQueueStatusFromSearchValue(
		resolvedSearchParams.status
	);
	const startTime = getAdminSsoTimeFromSearchValue(
		resolvedSearchParams.start_time
	);
	const endTime = getAdminSsoTimeFromSearchValue(
		resolvedSearchParams.end_time
	);
	const auth = await readAdminSsoAuthInitialData('/admin/sso/callbacks');
	const initialData: IAdminSsoCallbacksInitialData = {
		admin: auth.admin,
		callbacks: null,
		clientId: clientId ?? '',
		event: event ?? '',
		isAuthLoading: false,
		message: auth.message,
		query: query ?? '',
		renderedAt: Date.now(),
		status: status ?? '',
		userId: userId ?? '',
		...(endTime === undefined ? {} : { endTime }),
		...(startTime === undefined ? {} : { startTime }),
	};

	if (auth.admin === null) {
		return renderClient(initialData);
	}

	try {
		return renderClient({
			...initialData,
			callbacks: await readAdminSsoCallbackQueueInitialData({
				page,
				...(clientId === undefined ? {} : { clientId }),
				...(endTime === undefined ? {} : { endTime }),
				...(event === undefined ? {} : { event }),
				...(query === undefined ? {} : { query }),
				...(startTime === undefined ? {} : { startTime }),
				...(status === undefined ? {} : { status }),
				...(userId === undefined ? {} : { userId }),
			}),
		});
	} catch (error) {
		return renderClient({
			...initialData,
			message:
				error instanceof Error
					? error.message
					: '读取SSO Callback队列失败',
		});
	}
}
