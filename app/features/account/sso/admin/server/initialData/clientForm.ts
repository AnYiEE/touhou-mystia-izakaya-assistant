import { createAdminSsoClientListHrefFromSearchParams } from '@/features/account/sso/admin/client/navigation';
import type { IAdminSsoClientFormInitialData } from '@/features/account/sso/admin/contracts';
import { type IAdminSsoSearchParams } from '@/features/account/sso/admin/searchParams';
import { getAdminSingleSearchValue } from '@/features/admin/searchParams';
import {
	getAdminAuthInitialDataMessage,
	readAdminAuthInitialData,
} from '@/features/admin/server/initialData/auth';

function createInitialData(
	admin: IAdminSsoClientFormInitialData['admin'],
	message: string | null
): IAdminSsoClientFormInitialData {
	return {
		admin,
		client: null,
		clientUsers: null,
		isAuthLoading: false,
		isClientServerLoaded: false,
		loadError: null,
		message,
	};
}

export async function readAdminSsoClientCreateInitialData(): Promise<IAdminSsoClientFormInitialData> {
	const authResult = await readAdminAuthInitialData('/admin/sso/new');

	return createInitialData(
		authResult.admin,
		getAdminAuthInitialDataMessage(authResult)
	);
}

export async function readAdminSsoClientEditInitialData(
	id: string,
	searchParams: Promise<IAdminSsoSearchParams>
) {
	const resolvedSearchParams = await searchParams;
	const clientListSearchParams = new URLSearchParams();
	Object.entries(resolvedSearchParams).forEach(([key, value]) => {
		const searchValue = getAdminSingleSearchValue(value);
		if (searchValue !== undefined) {
			clientListSearchParams.set(key, searchValue);
		}
	});
	const listHref = createAdminSsoClientListHrefFromSearchParams(
		clientListSearchParams
	);
	const authResult = await readAdminAuthInitialData(
		`/admin/sso/${encodeURIComponent(id)}`
	);
	const initialData = createInitialData(
		authResult.admin,
		getAdminAuthInitialDataMessage(authResult)
	);

	if (authResult.admin === null) {
		return { initialData, listHref };
	}

	try {
		const clientService =
			await import('@/features/account/sso/admin/server/services/clientService');
		const clientResult = await clientService.getAdminSsoClient(id);
		const { client = null } =
			clientResult.status === 'error' ? {} : clientResult.data;
		let clientUsers: IAdminSsoClientFormInitialData['clientUsers'] = null;
		let { message } = initialData;
		if (client !== null) {
			try {
				const grantService =
					await import('@/features/account/sso/admin/server/services/grantService');
				const usersResult = await grantService.listAdminSsoClientUsers(
					id,
					{ page: 1, pageSize: 20 }
				);
				if (usersResult.status === 'error') {
					throw new Error(usersResult.error);
				}
				clientUsers = usersResult.data;
			} catch (error) {
				message =
					error instanceof Error
						? error.message
						: '读取SSO授权用户失败';
			}
		}

		return {
			initialData: {
				...initialData,
				client,
				clientUsers,
				isClientServerLoaded: true,
				loadError: client === null ? 'sso-client-not-found' : null,
				message,
			},
			listHref,
		};
	} catch (error) {
		return {
			initialData: {
				...initialData,
				loadError:
					error instanceof Error
						? error.message
						: '读取SSO客户端失败',
			},
			listHref,
		};
	}
}
