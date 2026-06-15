import { cookies } from 'next/headers';

import AdminUserDetailClient, {
	type IAdminUserDetailInitialData,
} from './client';
import {
	getAdminListHref,
	getAdminListPageFromSearchValue,
	getAdminListStatusFromSearchValue,
} from '../../listState';

import { createAdminCsrfToken } from '@/lib/account/server/admin';
import { createCurrentRequest } from '@/lib/account/server/currentRequest';
import {
	authenticateAdminSessionToken,
	checkAccountCookieSecurityGuard,
	checkAccountFeatureGuard,
	checkAdminFeatureGuard,
} from '@/lib/account/server/guards';
import { ACCOUNT_COOKIE_NAME_MAP } from '@/lib/account/shared/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IAdminUserDetailPageProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ page?: string; query?: string; status?: string }>;
}

async function readInitialDetail(
	id: string
): Promise<IAdminUserDetailInitialData['detail']> {
	const [usersModule, sessionsModule, userStateModule, userModule] =
		await Promise.all([
			import('@/lib/account/server/repositories/users'),
			import('@/lib/account/server/repositories/sessions'),
			import('@/lib/account/server/repositories/userState'),
			import('@/lib/account/server/user'),
		]);
	const user = await usersModule.findUserById(id);
	if (user === null) {
		return null;
	}

	const [sessions, namespaces] = await Promise.all([
		sessionsModule.listSessionsByUserId(user.id),
		userStateModule.listUserNamespaces(user.id),
	]);

	return {
		namespaces,
		session_count: sessions.length,
		user: userModule.createAccountUserProfile(user),
	};
}

function renderClient(initialData: IAdminUserDetailInitialData) {
	return <AdminUserDetailClient initialData={initialData} />;
}

export default async function AdminUserDetailPage({
	params,
	searchParams,
}: IAdminUserDetailPageProps) {
	const [{ id }, resolvedSearchParams] = await Promise.all([
		params,
		searchParams,
	]);
	const listHref = getAdminListHref({
		page: getAdminListPageFromSearchValue(
			resolvedSearchParams.page ?? null
		),
		query: resolvedSearchParams.query ?? '',
		status: getAdminListStatusFromSearchValue(
			resolvedSearchParams.status ?? null
		),
	});
	const initialData: IAdminUserDetailInitialData = {
		admin: null,
		detail: null,
		isAuthLoading: false,
		isDetailServerLoaded: false,
		listHref,
		message: null,
		renderedAt: Date.now(),
		userId: id,
	};

	const accountFeatureResult = await checkAccountFeatureGuard();
	if (accountFeatureResult.status === 'error') {
		return renderClient({
			...initialData,
			message: accountFeatureResult.message,
		});
	}

	const adminFeatureResult = checkAdminFeatureGuard();
	if (adminFeatureResult.status === 'error') {
		return renderClient({
			...initialData,
			message: adminFeatureResult.message,
		});
	}

	const request = await createCurrentRequest(
		`/admin/users/${encodeURIComponent(id)}`
	);
	const cookieSecurityResult = checkAccountCookieSecurityGuard(request);
	if (cookieSecurityResult.status === 'error') {
		return renderClient({
			...initialData,
			message: cookieSecurityResult.message,
		});
	}

	const cookieStore = await cookies();
	const adminSessionToken =
		cookieStore.get(ACCOUNT_COOKIE_NAME_MAP.adminSession)?.value ?? null;
	const adminAuthResult = authenticateAdminSessionToken(adminSessionToken);
	if (adminAuthResult.status === 'error') {
		return renderClient({
			...initialData,
			message:
				adminAuthResult.message === 'unauthorized'
					? null
					: adminAuthResult.message,
		});
	}

	const admin = {
		csrf_token: createAdminCsrfToken(adminAuthResult.data.token),
		username: adminAuthResult.data.payload.username,
	};
	try {
		const detail = await readInitialDetail(id);

		return renderClient({
			...initialData,
			admin,
			detail,
			isDetailServerLoaded: true,
			message: detail === null ? 'target-user-not-found' : null,
		});
	} catch (error) {
		return renderClient({
			...initialData,
			admin,
			message:
				error instanceof Error ? error.message : '读取用户详情失败',
		});
	}
}
