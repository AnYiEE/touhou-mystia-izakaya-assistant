'use server';

import { cookies } from 'next/headers';
import { type NextRequest } from 'next/server';

import {
	checkAdminCredentials,
	createAdminCsrfToken,
	createAdminSessionToken,
	getAdminSessionCookieOptions,
} from '@/lib/account/server/admin';
import { createCurrentRequest } from '@/lib/account/server/currentRequest';
import {
	type TAccountGuardResult,
	authenticateAdminSession,
	checkAccountCookieSecurity,
	checkAccountFeature,
	checkAccountRateLimit,
	checkAdminCsrf,
	checkAdminFeature,
	checkSameOrigin,
} from '@/lib/account/server/guards';
import {
	ACCOUNT_COOKIE_NAME_MAP,
	USER_STATUS_MAP,
} from '@/lib/account/shared/constants';
import {
	type IAccountUserProfile,
	type IAdminLoginBody,
	type IAdminMeData,
	type IAdminSsoClientDetailData,
	type IAdminSsoClientListData,
	type IAdminUserListData,
	type TUserStatus,
} from '@/lib/account/shared/types';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE = 10_000;

export type TAdminActionResult<TData = Record<string, unknown>> =
	| { data: TData; status: 'ok' }
	| {
			data?: Record<string, unknown>;
			httpStatus: number;
			message: string;
			status: 'error';
	  };

type TAdminActionScope =
	| 'admin-login'
	| 'admin-logout'
	| 'admin-me'
	| 'admin-list-users'
	| 'admin-get-users-by-ids'
	| 'admin-list-sso-clients'
	| 'admin-sso-client-detail';

interface IAdminAuthContext {
	request: NextRequest;
	token: string;
	username: string;
}

function createActionError(
	message: string,
	httpStatus: number,
	data?: Record<string, unknown>
): Extract<TAdminActionResult, { status: 'error' }> {
	return data === undefined
		? { httpStatus, message, status: 'error' }
		: { data, httpStatus, message, status: 'error' };
}

function createGuardActionError(
	result: Extract<TAccountGuardResult, { status: 'error' }>
) {
	return createActionError(result.message, result.httpStatus, result.data);
}

function createAdminMeData(context: IAdminAuthContext): IAdminMeData {
	return {
		csrf_token: createAdminCsrfToken(context.token),
		username: context.username,
	};
}

function checkUserStatusValue(value: string): value is TUserStatus {
	return Object.values(USER_STATUS_MAP).includes(value as TUserStatus);
}

function parseAdminPage(value: unknown) {
	if (value === undefined) {
		return 1;
	}

	if (
		typeof value !== 'number' ||
		!Number.isInteger(value) ||
		value < 1 ||
		value > MAX_PAGE
	) {
		return null;
	}

	return value;
}

async function readAdminSessionToken() {
	const cookieStore = await cookies();

	return cookieStore.get(ACCOUNT_COOKIE_NAME_MAP.adminSession)?.value ?? null;
}

async function checkAdminBaseActionRequest(
	pathname: string
): Promise<
	| { request: NextRequest; status: 'ok' }
	| Extract<TAdminActionResult, { status: 'error' }>
> {
	const accountFeatureResult = await checkAccountFeature();
	if (accountFeatureResult.status === 'error') {
		return createGuardActionError(accountFeatureResult);
	}

	const adminFeatureResult = checkAdminFeature();
	if (adminFeatureResult.status === 'error') {
		return createGuardActionError(adminFeatureResult);
	}

	const request = await createCurrentRequest(pathname);
	const sameOriginResult = checkSameOrigin(request);
	if (sameOriginResult.status === 'error') {
		return createGuardActionError(sameOriginResult);
	}

	const cookieSecurityResult = checkAccountCookieSecurity(request);
	if (cookieSecurityResult.status === 'error') {
		return createGuardActionError(cookieSecurityResult);
	}

	return { request, status: 'ok' };
}

async function checkAdminAuthenticatedActionRequest(
	scope: TAdminActionScope,
	pathname: string,
	csrfToken?: unknown,
	options: {
		continueOnRateLimit?: boolean;
		rateLimitAfterAuth?: boolean;
	} = {}
): Promise<
	| ({ status: 'ok' } & IAdminAuthContext)
	| Extract<TAdminActionResult, { status: 'error' }>
> {
	const base = await checkAdminBaseActionRequest(pathname);
	if (base.status === 'error') {
		return base;
	}

	if (options.rateLimitAfterAuth !== true) {
		const rateLimitResult = checkAccountRateLimit(base.request, scope);
		if (rateLimitResult.status === 'error') {
			if (options.continueOnRateLimit === true) {
				console.warn('Admin action rate limit exceeded; continuing.', {
					scope,
				});
			} else {
				return createGuardActionError(rateLimitResult);
			}
		}
	}

	const adminSessionToken = await readAdminSessionToken();
	const adminAuthResult = authenticateAdminSession(adminSessionToken);
	if (adminAuthResult.status === 'error') {
		return createGuardActionError(adminAuthResult);
	}

	if (options.rateLimitAfterAuth === true) {
		const rateLimitResult = checkAccountRateLimit(base.request, scope);
		if (rateLimitResult.status === 'error') {
			if (options.continueOnRateLimit === true) {
				console.warn('Admin action rate limit exceeded; continuing.', {
					scope,
				});
			} else {
				return createGuardActionError(rateLimitResult);
			}
		}
	}

	if (csrfToken !== undefined) {
		if (typeof csrfToken !== 'string') {
			return createActionError('forbidden', 403);
		}

		const csrfResult = checkAdminCsrf(
			csrfToken,
			adminAuthResult.data.token
		);
		if (csrfResult.status === 'error') {
			return createGuardActionError(csrfResult);
		}
	}

	return {
		request: base.request,
		status: 'ok',
		token: adminAuthResult.data.token,
		username: adminAuthResult.data.payload.username,
	};
}

export async function checkAdminAction(): Promise<
	TAdminActionResult<IAdminMeData>
> {
	const context = await checkAdminAuthenticatedActionRequest(
		'admin-me',
		'/admin/action',
		undefined,
		{ rateLimitAfterAuth: true }
	);
	if (context.status === 'error') {
		return context;
	}

	return { data: createAdminMeData(context), status: 'ok' };
}

export async function loginAdminAction(
	body: unknown
): Promise<TAdminActionResult<IAdminMeData>> {
	if (body === null || typeof body !== 'object') {
		return createActionError('invalid-object-structure', 400);
	}

	const candidate = body as Partial<IAdminLoginBody>;
	if (
		typeof candidate.username !== 'string' ||
		typeof candidate.password !== 'string'
	) {
		return createActionError('invalid-object-structure', 400);
	}

	const username = candidate.username.trim();
	if (username === '' || username.length > 128 || candidate.password === '') {
		return createActionError('invalid-object-structure', 400);
	}

	const base = await checkAdminBaseActionRequest('/admin/action');
	if (base.status === 'error') {
		return base;
	}

	const rateLimitResult = checkAccountRateLimit(
		base.request,
		'admin-login',
		username.toLowerCase(),
		{ noTrustedIpGate: true }
	);
	if (rateLimitResult.status === 'error') {
		return createGuardActionError(rateLimitResult);
	}

	if (!checkAdminCredentials(username, candidate.password)) {
		return createActionError('unauthorized', 401);
	}

	const token = createAdminSessionToken(username);
	const cookieStore = await cookies();
	cookieStore.set(
		ACCOUNT_COOKIE_NAME_MAP.adminSession,
		token,
		getAdminSessionCookieOptions(base.request)
	);

	return {
		data: { csrf_token: createAdminCsrfToken(token), username },
		status: 'ok',
	};
}

export async function logoutAdminAction(
	csrfToken: unknown
): Promise<TAdminActionResult<{ message: 'admin-logged-out' }>> {
	const context = await checkAdminAuthenticatedActionRequest(
		'admin-logout',
		'/admin/action',
		csrfToken,
		{ continueOnRateLimit: true }
	);
	if (context.status === 'error') {
		return context;
	}

	const cookieStore = await cookies();
	cookieStore.set(ACCOUNT_COOKIE_NAME_MAP.adminSession, '', {
		...getAdminSessionCookieOptions(context.request),
		maxAge: 0,
	});

	return { data: { message: 'admin-logged-out' }, status: 'ok' };
}

export async function listAdminUsersAction({
	page,
	query = '',
	status = '',
}: { page?: unknown; query?: unknown; status?: unknown } = {}): Promise<
	TAdminActionResult<IAdminUserListData>
> {
	const parsedPage = parseAdminPage(page);
	if (parsedPage === null) {
		return createActionError('invalid-pagination', 400);
	}
	if (typeof query !== 'string') {
		return createActionError('invalid-object-structure', 400);
	}
	if (typeof status !== 'string') {
		return createActionError('invalid-user-status', 400);
	}
	if (status !== '' && !checkUserStatusValue(status)) {
		return createActionError('invalid-user-status', 400);
	}

	const context = await checkAdminAuthenticatedActionRequest(
		'admin-list-users',
		'/admin/action'
	);
	if (context.status === 'error') {
		return context;
	}

	const [usersModule, userModule] = await Promise.all([
		import('@/lib/account/server/repositories/users'),
		import('@/lib/account/server/user'),
	]);
	const listUsersOptions: Parameters<typeof usersModule.listUsers>[0] = {
		limit: DEFAULT_PAGE_SIZE,
		offset: (parsedPage - 1) * DEFAULT_PAGE_SIZE,
		query: userModule.normalizeUsername(query),
	};

	if (status !== '') {
		listUsersOptions.status = status;
	}

	const { totalCount, users } = await usersModule.listUsers(listUsersOptions);

	return {
		data: {
			page: parsedPage,
			page_size: DEFAULT_PAGE_SIZE,
			total_count: totalCount,
			total_pages: Math.ceil(totalCount / DEFAULT_PAGE_SIZE),
			users: users.map(userModule.createAccountUserProfile),
		},
		status: 'ok',
	};
}

export async function getAdminUsersByIdsAction(
	ids: unknown
): Promise<TAdminActionResult<{ users: IAccountUserProfile[] }>> {
	if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) {
		return createActionError('invalid-object-structure', 400);
	}
	const userIds = ids as string[];

	const context = await checkAdminAuthenticatedActionRequest(
		'admin-get-users-by-ids',
		'/admin/action'
	);
	if (context.status === 'error') {
		return context;
	}

	const [usersModule, userModule] = await Promise.all([
		import('@/lib/account/server/repositories/users'),
		import('@/lib/account/server/user'),
	]);
	const users = await usersModule.listUsersByIds(userIds);

	return {
		data: { users: users.map(userModule.createAccountUserProfile) },
		status: 'ok',
	};
}

export async function listAdminSsoClientsAction(): Promise<
	TAdminActionResult<IAdminSsoClientListData>
> {
	const context = await checkAdminAuthenticatedActionRequest(
		'admin-list-sso-clients',
		'/admin/sso/action'
	);
	if (context.status === 'error') {
		return context;
	}

	const ssoModule = await import('@/lib/account/server/sso');
	const clients = await ssoModule.listSsoClients();

	return {
		data: { clients: clients.map(ssoModule.createSsoClientPublicProfile) },
		status: 'ok',
	};
}

export async function fetchAdminSsoClientAction(
	id: unknown
): Promise<TAdminActionResult<IAdminSsoClientDetailData>> {
	if (typeof id !== 'string') {
		return createActionError('invalid-object-structure', 400);
	}

	const context = await checkAdminAuthenticatedActionRequest(
		'admin-sso-client-detail',
		'/admin/sso/action'
	);
	if (context.status === 'error') {
		return context;
	}

	const ssoModule = await import('@/lib/account/server/sso');
	const client = await ssoModule.getSsoClientById(id);
	if (client === null) {
		return createActionError('sso-client-not-found', 404);
	}

	return {
		data: { client: ssoModule.createSsoClientPublicProfile(client) },
		status: 'ok',
	};
}
