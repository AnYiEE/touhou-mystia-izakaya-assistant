import type { IAdminSsoClientsInitialData } from '@/features/account/sso/admin/contracts';
import {
	type IAdminSsoSearchParams,
	getAdminSsoCallbackConfigFromSearchValue,
	getAdminSsoClientStatusFromSearchValue,
	getAdminSsoGrantPresenceFromSearchValue,
} from '@/features/account/sso/admin/searchParams';
import {
	getAdminPageFromSearchValue,
	getAdminTrimmedSearchValue,
} from '@/features/admin/searchParams';
import {
	getAdminAuthInitialDataMessage,
	readAdminAuthInitialData,
} from '@/features/admin/server/initialData/auth';

export async function readAdminSsoClientsInitialData(
	searchParams: Promise<IAdminSsoSearchParams>
): Promise<IAdminSsoClientsInitialData> {
	const resolvedSearchParams = await searchParams;
	const page = getAdminPageFromSearchValue(resolvedSearchParams.page);
	const query = getAdminTrimmedSearchValue(resolvedSearchParams.query);
	const status = getAdminSsoClientStatusFromSearchValue(
		resolvedSearchParams.status
	);
	const callback = getAdminSsoCallbackConfigFromSearchValue(
		resolvedSearchParams.callback
	);
	const grant = getAdminSsoGrantPresenceFromSearchValue(
		resolvedSearchParams.has_grants
	);
	const authResult = await readAdminAuthInitialData('/admin/sso');
	const initialData: IAdminSsoClientsInitialData = {
		admin: authResult.admin,
		callback: callback ?? '',
		clients: null,
		grant: grant ?? '',
		isAuthLoading: false,
		message: getAdminAuthInitialDataMessage(authResult),
		query: query ?? '',
		renderedAt: Date.now(),
		status: status ?? '',
	};

	if (authResult.admin === null) {
		return initialData;
	}

	try {
		const serviceModule =
			await import('@/features/account/sso/admin/server/services/clientService');
		const result = await serviceModule.listAdminSsoClients({
			page,
			pageSize: 20,
			...(callback === undefined ? {} : { callback }),
			...(grant === undefined ? {} : { hasGrants: grant === 'has' }),
			...(query === undefined ? {} : { query }),
			...(status === undefined ? {} : { status }),
		});
		if (result.status === 'error') {
			throw new Error(result.error);
		}

		return { ...initialData, clients: result.data };
	} catch (error) {
		return {
			...initialData,
			message:
				error instanceof Error ? error.message : '读取SSO客户端失败',
		};
	}
}
