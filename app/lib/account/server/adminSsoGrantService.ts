import {
	type IAdminSsoClientUsersData,
	type IAdminSsoGrantListData,
	type IAdminSsoGrantMutationData,
	type IAdminSsoUserGrantsData,
	type TUserStatus,
} from '@/lib/account/shared/types';
import {
	checkUserStatus,
	createAccountUserProfile,
} from '@/lib/account/server/user';
import { findUserById } from '@/lib/account/server/repositories/users';
import {
	type IAdminSsoGrantListOptions as IRepositoryAdminSsoGrantListOptions,
	type ISsoGrantListOptions as IRepositorySsoGrantListOptions,
	type TSsoAdminClientStatusFilter,
	deleteSsoUserClientGrant,
	deleteSsoUserClientGrantsByClient,
	deleteSsoUserClientGrantsByUser,
	listAdminSsoGrants,
	listSsoClientGrantsForUserAsAdmin,
	listSsoUserClientGrantsForClient,
} from '@/lib/account/server/repositories/sso';
import {
	checkAdminSsoPagination,
	getReachableAdminSsoTotalCount,
} from '@/lib/account/server/adminSsoPagination';

export type TAdminSsoGrantServiceError =
	| 'invalid-object-structure'
	| 'sso-client-not-found'
	| 'sso-grant-not-found'
	| 'user-not-found';

export type TAdminSsoGrantServiceResult<TData> =
	| { data: TData; status: 'ok' }
	| { error: TAdminSsoGrantServiceError; status: 'error' };

export const ADMIN_SSO_GRANT_SERVICE_ERROR_STATUS_MAP: Record<
	TAdminSsoGrantServiceError,
	number
> = {
	'invalid-object-structure': 400,
	'sso-client-not-found': 404,
	'sso-grant-not-found': 404,
	'user-not-found': 404,
};

export interface IAdminSsoGrantListOptions {
	page: number;
	pageSize: number;
	query?: string;
}

export interface IAdminSsoGrantGlobalListOptions extends IAdminSsoGrantListOptions {
	clientId?: string;
	clientStatus?: TSsoAdminClientStatusFilter;
	userId?: string;
	userStatus?: TUserStatus;
}

export interface IAdminSsoGrantRevokeInput {
	adminId: string | null;
	ipAddress?: string | null;
	reason?: string;
	userAgent?: string | null;
}

interface IWriteGrantRevokeAuditInput {
	adminId: string | null;
	action: string;
	clientId?: string | undefined;
	ipAddress?: string | null | undefined;
	reason: string;
	revokedCount?: number | undefined;
	targetId: string | null;
	targetType: string;
	userAgent?: string | null | undefined;
	userId?: string | undefined;
}

function normalizeReason(value: string | undefined) {
	const trimmedValue = value?.trim() ?? '';

	return trimmedValue === ''
		? 'admin-revoke-grant'
		: trimmedValue.slice(0, 160);
}

function createGrantRevokeAuditLogInput(
	auditModule: typeof import('@/lib/account/server/adminAuditService'),
	{
		action,
		adminId,
		clientId,
		ipAddress,
		reason,
		revokedCount,
		targetId,
		targetType,
		userAgent,
		userId,
	}: IWriteGrantRevokeAuditInput
) {
	return {
		action,
		actorId: adminId,
		actorType: 'admin',
		metadata: {
			...(clientId === undefined ? {} : { client_id: clientId }),
			...(revokedCount === undefined
				? {}
				: { revoked_count: revokedCount }),
			reason,
			...(userId === undefined ? {} : { user_id: userId }),
		},
		scope: 'sso',
		targetId,
		targetType,
		...(ipAddress === undefined ? {} : { ipAddress }),
		...(userAgent === undefined ? {} : { userAgent }),
	} satisfies Parameters<typeof auditModule.writeAdminAuditLog>[0];
}

function checkPagination(options: IAdminSsoGrantListOptions) {
	return checkAdminSsoPagination(options);
}

function createRepositoryListOptions({
	page,
	pageSize,
	query,
}: IAdminSsoGrantListOptions): IRepositorySsoGrantListOptions {
	const options = {
		limit: pageSize,
		offset: (page - 1) * pageSize,
	} satisfies IRepositorySsoGrantListOptions;

	return query === undefined ? options : { ...options, query };
}

function checkClientStatusFilter(
	value: TSsoAdminClientStatusFilter | undefined
) {
	return [undefined, 'active', 'disabled'].includes(value);
}

function checkGlobalGrantListOptions(options: IAdminSsoGrantGlobalListOptions) {
	return (
		checkPagination(options) &&
		checkClientStatusFilter(options.clientStatus) &&
		(options.userStatus === undefined ||
			checkUserStatus(options.userStatus))
	);
}

function createRepositoryGlobalListOptions({
	clientId,
	clientStatus,
	page,
	pageSize,
	query,
	userId,
	userStatus,
}: IAdminSsoGrantGlobalListOptions): IRepositoryAdminSsoGrantListOptions {
	return {
		limit: pageSize,
		offset: (page - 1) * pageSize,
		...(clientId === undefined ? {} : { clientId }),
		...(clientStatus === undefined ? {} : { clientStatus }),
		...(query === undefined ? {} : { query }),
		...(userId === undefined ? {} : { userId }),
		...(userStatus === undefined ? {} : { userStatus }),
	};
}

function createAdminSsoGrantListData(
	grants: Awaited<ReturnType<typeof listAdminSsoGrants>>['grants'],
	totalCount: number,
	page: number,
	pageSize: number
): IAdminSsoGrantListData {
	const reachableTotalCount = getReachableAdminSsoTotalCount(
		totalCount,
		pageSize
	);

	return {
		grants: grants.map((grant) => ({
			client: {
				disabled_at: grant.client_disabled_at,
				id: grant.client_id,
				name: grant.client_name,
				updated_at: grant.client_updated_at,
			},
			created_at: grant.grant_created_at,
			updated_at: grant.grant_updated_at,
			user: createAccountUserProfile({
				created_at: grant.user_created_at,
				deleted_at: grant.user_deleted_at,
				id: grant.user_id,
				last_login_at: grant.user_last_login_at,
				nickname: grant.user_nickname,
				state_epoch: grant.user_state_epoch,
				status: grant.user_status,
				sync_generation: grant.user_sync_generation,
				sync_status: grant.user_sync_status,
				updated_at: grant.grant_updated_at,
				username: grant.username,
				username_normalized: grant.username_normalized,
			}),
		})),
		page,
		page_size: pageSize,
		total_count: reachableTotalCount,
		total_pages: Math.ceil(reachableTotalCount / pageSize),
	};
}

export async function listAdminSsoClientUsers(
	clientId: string,
	options: IAdminSsoGrantListOptions
): Promise<TAdminSsoGrantServiceResult<IAdminSsoClientUsersData>> {
	if (!checkPagination(options)) {
		return { error: 'invalid-object-structure', status: 'error' };
	}

	const ssoModule = await import('@/lib/account/server/sso');
	const client = await ssoModule.getSsoClientById(clientId);
	if (client === null) {
		return { error: 'sso-client-not-found', status: 'error' };
	}

	const { page, pageSize } = options;
	const { grants, totalCount } = await listSsoUserClientGrantsForClient(
		clientId,
		createRepositoryListOptions(options)
	);
	const reachableTotalCount = getReachableAdminSsoTotalCount(
		totalCount,
		pageSize
	);

	return {
		data: {
			grants: grants.map((grant) => ({
				created_at: grant.grant_created_at,
				updated_at: grant.grant_updated_at,
				user: createAccountUserProfile({
					created_at: grant.user_created_at,
					deleted_at: grant.user_deleted_at,
					id: grant.user_id,
					last_login_at: grant.user_last_login_at,
					nickname: grant.user_nickname,
					state_epoch: grant.user_state_epoch,
					status: grant.user_status,
					sync_generation: grant.user_sync_generation,
					sync_status: grant.user_sync_status,
					updated_at: grant.grant_updated_at,
					username: grant.username,
					username_normalized: grant.username_normalized,
				}),
			})),
			page,
			page_size: pageSize,
			total_count: reachableTotalCount,
			total_pages: Math.ceil(reachableTotalCount / pageSize),
		},
		status: 'ok',
	};
}

export async function listAdminSsoUserGrants(
	userId: string,
	options: IAdminSsoGrantListOptions
): Promise<TAdminSsoGrantServiceResult<IAdminSsoUserGrantsData>> {
	if (!checkPagination(options)) {
		return { error: 'invalid-object-structure', status: 'error' };
	}

	const user = await findUserById(userId);
	if (user === null) {
		return { error: 'user-not-found', status: 'error' };
	}

	const { page, pageSize } = options;
	const { grants, totalCount } = await listSsoClientGrantsForUserAsAdmin(
		userId,
		createRepositoryListOptions(options)
	);
	const reachableTotalCount = getReachableAdminSsoTotalCount(
		totalCount,
		pageSize
	);

	return {
		data: {
			grants: grants.map((grant) => ({
				client: {
					disabled_at: grant.client_disabled_at,
					id: grant.client_id,
					name: grant.client_name,
					updated_at: grant.client_updated_at,
				},
				created_at: grant.grant_created_at,
				updated_at: grant.grant_updated_at,
			})),
			page,
			page_size: pageSize,
			total_count: reachableTotalCount,
			total_pages: Math.ceil(reachableTotalCount / pageSize),
		},
		status: 'ok',
	};
}

export async function listAdminSsoGrantRelations(
	options: IAdminSsoGrantGlobalListOptions
): Promise<TAdminSsoGrantServiceResult<IAdminSsoGrantListData>> {
	if (!checkGlobalGrantListOptions(options)) {
		return { error: 'invalid-object-structure', status: 'error' };
	}

	const { page, pageSize } = options;
	const { grants, totalCount } = await listAdminSsoGrants(
		createRepositoryGlobalListOptions(options)
	);

	return {
		data: createAdminSsoGrantListData(grants, totalCount, page, pageSize),
		status: 'ok',
	};
}

export async function revokeAdminSsoGrant(
	clientId: string,
	userId: string,
	input: IAdminSsoGrantRevokeInput
): Promise<TAdminSsoGrantServiceResult<IAdminSsoGrantMutationData>> {
	const ssoModule = await import('@/lib/account/server/sso');
	const [client, user] = await Promise.all([
		ssoModule.getSsoClientById(clientId),
		findUserById(userId),
	]);
	if (client === null) {
		return { error: 'sso-client-not-found', status: 'error' };
	}
	if (user === null) {
		return { error: 'user-not-found', status: 'error' };
	}

	const reason = normalizeReason(input.reason);
	const auditModule = await import('@/lib/account/server/adminAuditService');
	const revoked = await deleteSsoUserClientGrant(
		userId,
		clientId,
		{ actorId: input.adminId, actorType: 'admin', reason },
		(trx, auditNow) =>
			auditModule.writeAdminAuditLogInTransaction(
				trx,
				createGrantRevokeAuditLogInput(auditModule, {
					action: 'admin-revoke-sso-grant',
					adminId: input.adminId,
					clientId,
					reason,
					targetId: `${clientId}:${userId}`,
					targetType: 'sso_grant',
					userId,
					...(input.ipAddress === undefined
						? {}
						: { ipAddress: input.ipAddress }),
					...(input.userAgent === undefined
						? {}
						: { userAgent: input.userAgent }),
				}),
				auditNow
			)
	);
	if (!revoked) {
		return { error: 'sso-grant-not-found', status: 'error' };
	}

	return { data: { message: 'sso-grant-revoked' }, status: 'ok' };
}

export async function revokeAdminSsoGrantsForClient(
	clientId: string,
	input: IAdminSsoGrantRevokeInput
): Promise<TAdminSsoGrantServiceResult<IAdminSsoGrantMutationData>> {
	const ssoModule = await import('@/lib/account/server/sso');
	const client = await ssoModule.getSsoClientById(clientId);
	if (client === null) {
		return { error: 'sso-client-not-found', status: 'error' };
	}

	const reason = normalizeReason(input.reason);
	const auditModule = await import('@/lib/account/server/adminAuditService');
	const revokedCount = await deleteSsoUserClientGrantsByClient(
		clientId,
		{ actorId: input.adminId, actorType: 'admin', reason },
		(trx, auditNow, deletedCount) =>
			auditModule.writeAdminAuditLogInTransaction(
				trx,
				createGrantRevokeAuditLogInput(auditModule, {
					action: 'admin-revoke-sso-client-grants',
					adminId: input.adminId,
					clientId,
					reason,
					revokedCount: deletedCount,
					targetId: clientId,
					targetType: 'sso_client',
					...(input.ipAddress === undefined
						? {}
						: { ipAddress: input.ipAddress }),
					...(input.userAgent === undefined
						? {}
						: { userAgent: input.userAgent }),
				}),
				auditNow
			)
	);
	return {
		data: { message: 'sso-grants-revoked', revoked_count: revokedCount },
		status: 'ok',
	};
}

export async function revokeAdminSsoGrantsForUser(
	userId: string,
	input: IAdminSsoGrantRevokeInput
): Promise<TAdminSsoGrantServiceResult<IAdminSsoGrantMutationData>> {
	const user = await findUserById(userId);
	if (user === null) {
		return { error: 'user-not-found', status: 'error' };
	}

	const reason = normalizeReason(input.reason);
	const auditModule = await import('@/lib/account/server/adminAuditService');
	const revokedCount = await deleteSsoUserClientGrantsByUser(
		userId,
		{ actorId: input.adminId, actorType: 'admin', reason },
		(trx, auditNow, deletedCount) =>
			auditModule.writeAdminAuditLogInTransaction(
				trx,
				createGrantRevokeAuditLogInput(auditModule, {
					action: 'admin-revoke-user-sso-grants',
					adminId: input.adminId,
					reason,
					revokedCount: deletedCount,
					targetId: userId,
					targetType: 'user',
					userId,
					...(input.ipAddress === undefined
						? {}
						: { ipAddress: input.ipAddress }),
					...(input.userAgent === undefined
						? {}
						: { userAgent: input.userAgent }),
				}),
				auditNow
			)
	);
	return {
		data: { message: 'sso-grants-revoked', revoked_count: revokedCount },
		status: 'ok',
	};
}
