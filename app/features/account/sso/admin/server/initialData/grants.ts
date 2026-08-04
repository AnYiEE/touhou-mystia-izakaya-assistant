import type { IAdminSsoGrantsInitialData } from '@/features/account/sso/admin/contracts';
import { ADMIN_SSO_MESSAGE_MAP } from '@/features/account/sso/admin/copy';
import {
	type IAdminSsoSearchParams,
	getAdminSsoClientStatusFromSearchValue,
	getAdminSsoUserStatusFromSearchValue,
} from '@/features/account/sso/admin/searchParams';
import {
	getAdminPageFromSearchValue,
	getAdminTrimmedSearchValue,
} from '@/features/admin/searchParams';
import {
	getAdminAuthInitialDataMessage,
	readAdminAuthInitialData,
} from '@/features/admin/server/initialData/auth';

export async function readAdminSsoGrantsInitialData(
	searchParams: Promise<IAdminSsoSearchParams>
): Promise<IAdminSsoGrantsInitialData> {
	const resolvedSearchParams = await searchParams;
	const page = getAdminPageFromSearchValue(resolvedSearchParams.page);
	const clientId = getAdminTrimmedSearchValue(resolvedSearchParams.client_id);
	const userId = getAdminTrimmedSearchValue(resolvedSearchParams.user_id);
	const query = getAdminTrimmedSearchValue(resolvedSearchParams.query);
	const clientStatus = getAdminSsoClientStatusFromSearchValue(
		resolvedSearchParams.client_status
	);
	const userStatus = getAdminSsoUserStatusFromSearchValue(
		resolvedSearchParams.user_status
	);
	const authResult = await readAdminAuthInitialData('/admin/sso/grants');
	const initialData: IAdminSsoGrantsInitialData = {
		admin: authResult.admin,
		clientId: clientId ?? '',
		clientStatus: clientStatus ?? '',
		grants: null,
		isAuthLoading: false,
		message: getAdminAuthInitialDataMessage(authResult),
		query: query ?? '',
		renderedAt: Date.now(),
		userId: userId ?? '',
		userStatus: userStatus ?? '',
	};

	if (authResult.admin === null) {
		return initialData;
	}

	try {
		const serviceModule =
			await import('@/features/account/sso/admin/server/services/grantService');
		const result = await serviceModule.listAdminSsoGrantRelations({
			page,
			pageSize: 20,
			...(clientId === undefined ? {} : { clientId }),
			...(clientStatus === undefined ? {} : { clientStatus }),
			...(query === undefined ? {} : { query }),
			...(userId === undefined ? {} : { userId }),
			...(userStatus === undefined ? {} : { userStatus }),
		});
		if (result.status === 'error') {
			throw new Error(result.error);
		}

		return { ...initialData, grants: result.data };
	} catch (error) {
		return {
			...initialData,
			message:
				error instanceof Error
					? error.message
					: ADMIN_SSO_MESSAGE_MAP.grantReadFailed,
		};
	}
}
