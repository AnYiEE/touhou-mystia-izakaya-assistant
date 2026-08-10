import type { IAdminSsoTicketsInitialData } from '@/features/account/sso/admin/contracts';
import { ADMIN_SSO_MESSAGE_MAP } from '@/features/account/sso/admin/copy';
import {
	type IAdminSsoSearchParams,
	getAdminSsoTicketStatusFromSearchValue,
} from '@/features/account/sso/admin/searchParams';
import {
	getAdminPageFromSearchValue,
	getAdminTrimmedSearchValue,
} from '@/features/admin/searchParams';
import {
	getAdminAuthInitialDataMessage,
	readAdminAuthInitialData,
} from '@/features/admin/server/initialData/auth';

export async function readAdminSsoTicketsInitialData(
	searchParams: Promise<IAdminSsoSearchParams>
): Promise<IAdminSsoTicketsInitialData> {
	const resolvedSearchParams = await searchParams;
	const page = getAdminPageFromSearchValue(resolvedSearchParams.page);
	const clientId = getAdminTrimmedSearchValue(resolvedSearchParams.client_id);
	const userId = getAdminTrimmedSearchValue(resolvedSearchParams.user_id);
	const query = getAdminTrimmedSearchValue(resolvedSearchParams.query);
	const status = getAdminSsoTicketStatusFromSearchValue(
		resolvedSearchParams.status
	);
	const authResult = await readAdminAuthInitialData('/admin/sso/tickets');
	const initialData: IAdminSsoTicketsInitialData = {
		admin: authResult.admin,
		clientId: clientId ?? '',
		isAuthLoading: false,
		message: getAdminAuthInitialDataMessage(authResult),
		query: query ?? '',
		renderedAt: Date.now(),
		status: status ?? '',
		tickets: null,
		userId: userId ?? '',
	};

	if (authResult.admin === null) {
		return initialData;
	}

	try {
		const serviceModule =
			await import('@/features/account/sso/admin/server/services/ticketService');
		const result = await serviceModule.listAdminSsoTicketRecords({
			page,
			pageSize: 20,
			...(clientId === undefined ? {} : { clientId }),
			...(query === undefined ? {} : { query }),
			...(status === undefined ? {} : { status }),
			...(userId === undefined ? {} : { userId }),
		});
		if (result.status === 'error') {
			throw new Error(result.error);
		}

		return { ...initialData, tickets: result.data };
	} catch (error) {
		return {
			...initialData,
			message: Error.isError(error)
				? error.message
				: ADMIN_SSO_MESSAGE_MAP.ticketReadFailed,
		};
	}
}
