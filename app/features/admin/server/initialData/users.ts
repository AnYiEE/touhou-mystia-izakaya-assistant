import { type TUserStatus } from '@/domain/account/contracts';

import { checkAdminCredentialLoginEnabled } from '@/features/account/admin/server/auth';
import type { IAdminPageInitialData } from '@/features/admin/contracts';
import {
	getAdminListPageFromSearchValue,
	getAdminListStatusFromSearchValue,
} from '@/features/admin/navigation';

import { readAdminAuthInitialData } from './auth';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE = 10_000;

interface IAdminUsersSearchParams {
	page?: string;
	query?: string;
	status?: string;
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
		import('@/features/account/server/persistence/repositories/users'),
		import('@/features/account/server/presentation/user'),
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

export async function readAdminUsersInitialData(
	searchParams: Promise<IAdminUsersSearchParams>
): Promise<IAdminPageInitialData> {
	const resolvedSearchParams = await searchParams;
	const page = Math.min(
		getAdminListPageFromSearchValue(resolvedSearchParams.page ?? null),
		MAX_PAGE
	);
	const query = resolvedSearchParams.query ?? '';
	const status = getAdminListStatusFromSearchValue(
		resolvedSearchParams.status ?? null
	);
	const initialData: IAdminPageInitialData = {
		admin: null,
		authStatus: 'unauthenticated',
		credentialLoginEnabled: checkAdminCredentialLoginEnabled(),
		message: null,
		page,
		query,
		renderedAt: Date.now(),
		status,
		users: null,
	};
	const authResult = await readAdminAuthInitialData('/admin');

	if (authResult.error !== null) {
		const isUnauthenticated =
			authResult.error.source === 'authentication' &&
			authResult.error.httpStatus === 401;

		return {
			...initialData,
			authStatus: isUnauthenticated ? 'unauthenticated' : 'error',
			message: isUnauthenticated ? null : authResult.error.message,
		};
	}

	let users: IAdminPageInitialData['users'] = null;
	let message: string | null = null;
	try {
		users = await readInitialUsers({ page, query, status });
	} catch (error) {
		message = error instanceof Error ? error.message : '读取用户列表失败';
	}

	return {
		...initialData,
		admin: authResult.admin,
		authStatus: 'authenticated',
		message,
		users,
	};
}
