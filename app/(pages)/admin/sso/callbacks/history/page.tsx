import AdminSsoCallbackHistoryClient, {
	type IAdminSsoCallbackHistoryInitialData,
} from './client';

import {
	type IAdminSsoSearchParams,
	getAdminSsoCallbackDeliveryStatusFromSearchValue,
	getAdminSsoCallbackEventFromSearchValue,
	getAdminSsoPageFromSearchValue,
	getAdminSsoTimeFromSearchValue,
	getAdminSsoTrimmedSearchValue,
} from '../../searchParams';
import {
	readAdminSsoAuthInitialData,
	readAdminSsoCallbackDeliveryInitialData,
} from '../../server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IAdminSsoCallbackHistoryPageProps {
	searchParams: Promise<IAdminSsoSearchParams>;
}

function renderClient(initialData: IAdminSsoCallbackHistoryInitialData) {
	return <AdminSsoCallbackHistoryClient initialData={initialData} />;
}

export default async function AdminSsoCallbackHistoryPage({
	searchParams,
}: IAdminSsoCallbackHistoryPageProps) {
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
	const status = getAdminSsoCallbackDeliveryStatusFromSearchValue(
		resolvedSearchParams.status
	);
	const startTime = getAdminSsoTimeFromSearchValue(
		resolvedSearchParams.start_time
	);
	const endTime = getAdminSsoTimeFromSearchValue(
		resolvedSearchParams.end_time
	);
	const auth = await readAdminSsoAuthInitialData(
		'/admin/sso/callbacks/history'
	);
	const initialData: IAdminSsoCallbackHistoryInitialData = {
		admin: auth.admin,
		clientId: clientId ?? '',
		deliveries: null,
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
			deliveries: await readAdminSsoCallbackDeliveryInitialData({
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
				error instanceof Error ? error.message : '读取SSO投递历史失败',
		});
	}
}
