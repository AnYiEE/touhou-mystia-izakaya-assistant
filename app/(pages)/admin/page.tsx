import { cookies } from 'next/headers';

import AdminPageClient, {
	type IAdminPageInitialData,
	type TAdminAuthStatus,
} from './client';
import {
	getAdminListPageFromSearchValue,
	getAdminListStatusFromSearchValue,
} from './listState';

import { createAdminCsrfToken } from '@/lib/account/server/admin';
import { createCurrentRequest } from '@/lib/account/server/currentRequest';
import {
	authenticateAdminSession,
	checkAccountCookieSecurity,
	checkAccountFeature,
	checkAdminFeature,
} from '@/lib/account/server/guards';
import { ACCOUNT_COOKIE_NAME_MAP } from '@/lib/account/shared/constants';
import { type TUserStatus } from '@/lib/account/shared/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE = 10_000;

interface IAdminPageProps {
	searchParams: Promise<{ page?: string; query?: string; status?: string }>;
}

function clampPage(page: number) {
	return Math.min(page, MAX_PAGE);
}

async function readInitialUsers({
	page,
	query,
	status,
}: {
	page: number;
	query: string;
	status: TUserStatus | '';
}): Promise<IAdminPageInitialData['users']> {
	const [usersModule, userModule] = await Promise.all([
		import('@/lib/account/server/repositories/users'),
		import('@/lib/account/server/user'),
	]);
	const listUsersOptions: Parameters<typeof usersModule.listUsers>[0] = {
		limit: DEFAULT_PAGE_SIZE,
		offset: (page - 1) * DEFAULT_PAGE_SIZE,
		query: userModule.normalizeUsername(query),
	};

	if (status !== '') {
		listUsersOptions.status = status;
	}

	const { totalCount, users } = await usersModule.listUsers(listUsersOptions);

	return {
		page,
		page_size: DEFAULT_PAGE_SIZE,
		total_count: totalCount,
		total_pages: Math.ceil(totalCount / DEFAULT_PAGE_SIZE),
		users: users.map(userModule.createAccountUserProfile),
	};
}

function renderClient(initialData: IAdminPageInitialData) {
	return <AdminPageClient initialData={initialData} />;
}

export default async function AdminPage({ searchParams }: IAdminPageProps) {
	const resolvedSearchParams = await searchParams;
	const initialPage = clampPage(
		getAdminListPageFromSearchValue(resolvedSearchParams.page ?? null)
	);
	const initialQuery = resolvedSearchParams.query ?? '';
	const initialStatus = getAdminListStatusFromSearchValue(
		resolvedSearchParams.status ?? null
	);
	const initialData: IAdminPageInitialData = {
		admin: null,
		authStatus: 'unauthenticated',
		message: null,
		page: initialPage,
		query: initialQuery,
		renderedAt: Date.now(),
		status: initialStatus,
		users: null,
	};

	const accountFeatureResult = await checkAccountFeature();
	if (accountFeatureResult.status === 'error') {
		return renderClient({
			...initialData,
			authStatus: 'error',
			message: accountFeatureResult.message,
		});
	}

	const adminFeatureResult = checkAdminFeature();
	if (adminFeatureResult.status === 'error') {
		return renderClient({
			...initialData,
			authStatus: 'error',
			message: adminFeatureResult.message,
		});
	}

	const request = await createCurrentRequest('/admin');
	const cookieSecurityResult = checkAccountCookieSecurity(request);
	if (cookieSecurityResult.status === 'error') {
		return renderClient({
			...initialData,
			authStatus: 'error',
			message: cookieSecurityResult.message,
		});
	}

	const cookieStore = await cookies();
	const adminSessionToken =
		cookieStore.get(ACCOUNT_COOKIE_NAME_MAP.adminSession)?.value ?? null;
	const adminAuthResult = authenticateAdminSession(adminSessionToken);
	if (adminAuthResult.status === 'error') {
		const authStatus: TAdminAuthStatus =
			adminAuthResult.httpStatus === 401 ? 'unauthenticated' : 'error';

		return renderClient({
			...initialData,
			authStatus,
			message:
				authStatus === 'error'
					? adminAuthResult.message
					: initialData.message,
		});
	}

	const admin = {
		csrf_token: createAdminCsrfToken(adminAuthResult.data.token),
		username: adminAuthResult.data.payload.username,
	};
	let users: IAdminPageInitialData['users'] = null;
	let message: string | null = null;
	try {
		users = await readInitialUsers({
			page: initialPage,
			query: initialQuery,
			status: initialStatus,
		});
	} catch (error) {
		message = error instanceof Error ? error.message : '读取用户列表失败';
	}

	return renderClient({
		...initialData,
		admin,
		authStatus: 'authenticated',
		message,
		users,
	});
}
