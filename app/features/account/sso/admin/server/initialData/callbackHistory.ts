import type { IAdminSsoCallbackHistoryInitialData } from '@/features/account/sso/admin/contracts';
import { ADMIN_SSO_MESSAGE_MAP } from '@/features/account/sso/admin/copy';
import {
	type IAdminSsoSearchParams,
	getAdminSsoCallbackDeliveryStatusFromSearchValue,
	getAdminSsoCallbackEventFromSearchValue,
} from '@/features/account/sso/admin/searchParams';
import {
	getAdminPageFromSearchValue,
	getAdminTimeFromSearchValue,
	getAdminTrimmedSearchValue,
} from '@/features/admin/searchParams';
import {
	getAdminAuthInitialDataMessage,
	readAdminAuthInitialData,
} from '@/features/admin/server/initialData/auth';

export async function readAdminSsoCallbackHistoryInitialData(
	searchParams: Promise<IAdminSsoSearchParams>
): Promise<IAdminSsoCallbackHistoryInitialData> {
	const resolvedSearchParams = await searchParams;
	const page = getAdminPageFromSearchValue(resolvedSearchParams.page);
	const clientId = getAdminTrimmedSearchValue(resolvedSearchParams.client_id);
	const userId = getAdminTrimmedSearchValue(resolvedSearchParams.user_id);
	const query = getAdminTrimmedSearchValue(resolvedSearchParams.query);
	const event = getAdminSsoCallbackEventFromSearchValue(
		resolvedSearchParams.event
	);
	const status = getAdminSsoCallbackDeliveryStatusFromSearchValue(
		resolvedSearchParams.status
	);
	const startTime = getAdminTimeFromSearchValue(
		resolvedSearchParams.start_time
	);
	const endTime = getAdminTimeFromSearchValue(resolvedSearchParams.end_time);
	const authResult = await readAdminAuthInitialData(
		'/admin/sso/callbacks/history'
	);
	const initialData: IAdminSsoCallbackHistoryInitialData = {
		admin: authResult.admin,
		clientId: clientId ?? '',
		deliveries: null,
		event: event ?? '',
		isAuthLoading: false,
		message: getAdminAuthInitialDataMessage(authResult),
		query: query ?? '',
		renderedAt: Date.now(),
		status: status ?? '',
		userId: userId ?? '',
		...(endTime === undefined ? {} : { endTime }),
		...(startTime === undefined ? {} : { startTime }),
	};

	if (authResult.admin === null) {
		return initialData;
	}

	try {
		const serviceModule =
			await import('@/features/account/sso/admin/server/services/callbackService');
		const result = await serviceModule.listAdminSsoCallbackDeliveries({
			page,
			pageSize: 20,
			...(clientId === undefined ? {} : { clientId }),
			...(endTime === undefined ? {} : { endTime }),
			...(event === undefined ? {} : { event }),
			...(query === undefined ? {} : { query }),
			...(startTime === undefined ? {} : { startTime }),
			...(status === undefined ? {} : { status }),
			...(userId === undefined ? {} : { userId }),
		});
		if (result.status === 'error') {
			throw new Error(result.error);
		}

		return { ...initialData, deliveries: result.data };
	} catch (error) {
		return {
			...initialData,
			message: Error.isError(error)
				? error.message
				: ADMIN_SSO_MESSAGE_MAP.callbackHistoryReadFailed,
		};
	}
}
