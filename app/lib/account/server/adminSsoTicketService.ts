import {
	type IAdminSsoTicketListData,
	type IAdminSsoTicketMutationData,
	type TAdminSsoTicketStatus,
} from '@/lib/account/shared/types';
import { createAccountUserProfile } from '@/lib/account/server/user';
import { findUserById } from '@/lib/account/server/repositories/users';
import {
	type IAdminSsoTicketListOptions as IRepositoryAdminSsoTicketListOptions,
	cleanupExpiredSsoTickets,
	listAdminSsoTickets,
	revokeUnusedSsoTicketsForClient,
	revokeUnusedSsoTicketsForUser,
} from '@/lib/account/server/repositories/sso';
import {
	checkAdminSsoPagination,
	getReachableAdminSsoTotalCount,
} from '@/lib/account/server/adminSsoPagination';

const ADMIN_SSO_TICKET_CLEANUP_RETENTION_MS = 60 * 1000;

export type TAdminSsoTicketServiceError =
	| 'invalid-object-structure'
	| 'sso-client-not-found'
	| 'user-not-found';

export type TAdminSsoTicketServiceResult<TData> =
	| { data: TData; status: 'ok' }
	| { error: TAdminSsoTicketServiceError; status: 'error' };

export const ADMIN_SSO_TICKET_SERVICE_ERROR_STATUS_MAP: Record<
	TAdminSsoTicketServiceError,
	number
> = {
	'invalid-object-structure': 400,
	'sso-client-not-found': 404,
	'user-not-found': 404,
};

export interface IAdminSsoTicketListOptions {
	clientId?: string;
	page: number;
	pageSize: number;
	query?: string;
	status?: TAdminSsoTicketStatus;
	userId?: string;
}

export interface IAdminSsoTicketMutationInput {
	adminId?: string | null;
	ipAddress?: string | null;
	reason?: string;
	userAgent?: string | null;
}

function checkPagination(options: IAdminSsoTicketListOptions) {
	return checkAdminSsoPagination(options);
}

function checkTicketStatusFilter(value: TAdminSsoTicketStatus | undefined) {
	return [undefined, 'expired', 'pending', 'revoked', 'used'].includes(value);
}

function checkListOptions(options: IAdminSsoTicketListOptions) {
	return checkPagination(options) && checkTicketStatusFilter(options.status);
}

function normalizeReason(value: string | undefined) {
	const trimmedValue = value?.trim() ?? '';

	return trimmedValue === ''
		? 'admin-revoke-ticket'
		: trimmedValue.slice(0, 160);
}

function createRepositoryListOptions(
	options: IAdminSsoTicketListOptions,
	now: number
): IRepositoryAdminSsoTicketListOptions {
	return {
		limit: options.pageSize,
		now,
		offset: (options.page - 1) * options.pageSize,
		...(options.clientId === undefined
			? {}
			: { clientId: options.clientId }),
		...(options.query === undefined ? {} : { query: options.query }),
		...(options.status === undefined ? {} : { status: options.status }),
		...(options.userId === undefined ? {} : { userId: options.userId }),
	};
}

function createTicketAuditLogInput(
	auditModule: typeof import('@/lib/account/server/adminAuditService'),
	action: string,
	targetType: string,
	targetId: string | null,
	input: IAdminSsoTicketMutationInput,
	metadata: Record<string, unknown> = {}
) {
	return {
		action,
		actorId: input.adminId ?? null,
		actorType: 'admin',
		metadata,
		scope: 'sso',
		targetId,
		targetType,
		...(input.ipAddress === undefined
			? {}
			: { ipAddress: input.ipAddress }),
		...(input.userAgent === undefined
			? {}
			: { userAgent: input.userAgent }),
	} satisfies Parameters<typeof auditModule.writeAdminAuditLog>[0];
}

function getTicketStatus(
	ticket: Awaited<ReturnType<typeof listAdminSsoTickets>>['tickets'][number],
	now: number
) {
	if (ticket.revoked_at !== null) {
		return 'revoked';
	}
	if (ticket.ticket_used_at !== null) {
		return 'used';
	}
	if (ticket.ticket_expires_at <= now) {
		return 'expired';
	}

	return 'pending';
}

export async function listAdminSsoTicketRecords(
	options: IAdminSsoTicketListOptions
): Promise<TAdminSsoTicketServiceResult<IAdminSsoTicketListData>> {
	if (!checkListOptions(options)) {
		return { error: 'invalid-object-structure', status: 'error' };
	}

	const now = Date.now();
	const { page, pageSize } = options;
	const { tickets, totalCount } = await listAdminSsoTickets(
		createRepositoryListOptions(options, now)
	);
	const reachableTotalCount = getReachableAdminSsoTotalCount(
		totalCount,
		pageSize
	);

	return {
		data: {
			page,
			page_size: pageSize,
			tickets: tickets.map((ticket) => ({
				client: {
					disabled_at: ticket.client_disabled_at,
					id: ticket.client_id,
					name: ticket.client_name,
					updated_at: ticket.client_updated_at,
				},
				created_at: ticket.ticket_created_at,
				expires_at: ticket.ticket_expires_at,
				redirect_uri: ticket.redirect_uri,
				revoked_at: ticket.revoked_at,
				revoked_reason: ticket.revoked_reason,
				status: getTicketStatus(ticket, now),
				ticket_hash_prefix: ticket.ticket_hash.slice(0, 12),
				used_at: ticket.ticket_used_at,
				user: createAccountUserProfile({
					created_at: ticket.user_created_at,
					deleted_at: ticket.user_deleted_at,
					id: ticket.user_id,
					last_login_at: ticket.user_last_login_at,
					nickname: ticket.user_nickname,
					state_epoch: ticket.user_state_epoch,
					status: ticket.user_status,
					updated_at: ticket.ticket_created_at,
					username: ticket.username,
					username_normalized: ticket.username_normalized,
				}),
			})),
			total_count: reachableTotalCount,
			total_pages: Math.ceil(reachableTotalCount / pageSize),
		},
		status: 'ok',
	};
}

export async function revokeAdminSsoTicketsForClient(
	clientId: string,
	input: IAdminSsoTicketMutationInput = {}
): Promise<TAdminSsoTicketServiceResult<IAdminSsoTicketMutationData>> {
	const ssoModule = await import('@/lib/account/server/sso');
	const client = await ssoModule.getSsoClientById(clientId);
	if (client === null) {
		return { error: 'sso-client-not-found', status: 'error' };
	}

	const auditModule = await import('@/lib/account/server/adminAuditService');
	const revokedCount = await revokeUnusedSsoTicketsForClient(
		clientId,
		normalizeReason(input.reason),
		undefined,
		(trx, auditNow, deletedCount) =>
			auditModule.writeAdminAuditLogInTransaction(
				trx,
				createTicketAuditLogInput(
					auditModule,
					'admin-revoke-sso-client-tickets',
					'sso_client',
					clientId,
					input,
					{ client_id: clientId, revoked_count: deletedCount }
				),
				auditNow
			)
	);

	return {
		data: { message: 'sso-tickets-revoked', revoked_count: revokedCount },
		status: 'ok',
	};
}

export async function revokeAdminSsoTicketsForUser(
	userId: string,
	input: IAdminSsoTicketMutationInput = {}
): Promise<TAdminSsoTicketServiceResult<IAdminSsoTicketMutationData>> {
	const user = await findUserById(userId);
	if (user === null) {
		return { error: 'user-not-found', status: 'error' };
	}

	const auditModule = await import('@/lib/account/server/adminAuditService');
	const revokedCount = await revokeUnusedSsoTicketsForUser(
		userId,
		normalizeReason(input.reason),
		undefined,
		(trx, auditNow, deletedCount) =>
			auditModule.writeAdminAuditLogInTransaction(
				trx,
				createTicketAuditLogInput(
					auditModule,
					'admin-revoke-user-sso-tickets',
					'user',
					userId,
					input,
					{ revoked_count: deletedCount, user_id: userId }
				),
				auditNow
			)
	);

	return {
		data: { message: 'sso-tickets-revoked', revoked_count: revokedCount },
		status: 'ok',
	};
}

export async function cleanupAdminExpiredSsoTickets(
	expiredAt = Date.now() - ADMIN_SSO_TICKET_CLEANUP_RETENTION_MS,
	input: IAdminSsoTicketMutationInput = {}
): Promise<TAdminSsoTicketServiceResult<IAdminSsoTicketMutationData>> {
	const now = Date.now();
	if (
		!Number.isSafeInteger(expiredAt) ||
		expiredAt < 0 ||
		expiredAt > now - ADMIN_SSO_TICKET_CLEANUP_RETENTION_MS
	) {
		return { error: 'invalid-object-structure', status: 'error' };
	}

	const auditModule = await import('@/lib/account/server/adminAuditService');
	const deletedCount = await cleanupExpiredSsoTickets(
		expiredAt,
		(trx, auditNow, deletedCountInTransaction) =>
			auditModule.writeAdminAuditLogInTransaction(
				trx,
				createTicketAuditLogInput(
					auditModule,
					'admin-cleanup-expired-sso-tickets',
					'sso_ticket',
					null,
					input,
					{
						deleted_count: deletedCountInTransaction,
						expired_at: expiredAt,
					}
				),
				auditNow
			)
	);

	return {
		data: { deleted_count: deletedCount, message: 'sso-tickets-cleaned' },
		status: 'ok',
	};
}
