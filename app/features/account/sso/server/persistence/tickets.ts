import { type Transaction, sql } from 'kysely';

import type { TAdminSsoTicketStatus } from '@/features/account/contracts';
import { getAccountDatabase } from '@/features/account/server/persistence/database';

import { normalizeDatabaseCount } from '@/infrastructure/database/queryValues';
import type {
	TDatabase,
	TSsoClient,
	TSsoTicket,
	TUser,
} from '@/infrastructure/database/schema';
import { escapeSqliteLikePattern } from '@/infrastructure/database/sqlite/queryValues';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';

import { type ISsoGrantListOptions } from './grants';

const CLIENT_TABLE_NAME = TABLE_NAME_MAP.ssoClient;

const TICKET_TABLE_NAME = TABLE_NAME_MAP.ssoTicket;

const USER_TABLE_NAME = TABLE_NAME_MAP.user;

export interface IAdminSsoTicketListOptions extends ISsoGrantListOptions {
	clientId?: TSsoClient['id'];
	now?: number;
	status?: TAdminSsoTicketStatus;
	userId?: TUser['id'];
}

export interface IAdminSsoTicketRecord {
	client_disabled_at: number | null;
	client_id: string;
	client_name: string;
	client_updated_at: number;
	redirect_uri: string;
	revoked_at: number | null;
	revoked_reason: string | null;
	ticket_created_at: number;
	ticket_expires_at: number;
	ticket_hash: TSsoTicket['ticket_hash'];
	ticket_used_at: number | null;
	user_created_at: number;
	user_deleted_at: number | null;
	user_id: string;
	user_last_login_at: number | null;
	user_nickname: string | null;
	user_state_epoch: number;
	user_status: TUser['status'];
	user_sync_generation: number;
	user_sync_status: TUser['sync_status'];
	username: string;
	username_normalized: string;
}

export interface IListAdminSsoTicketsResult {
	tickets: IAdminSsoTicketRecord[];
	totalCount: number;
}

export async function revokeUnusedSsoTicketsForClientInTransaction(
	trx: Transaction<TDatabase>,
	clientId: TSsoClient['id'],
	reason: string,
	now: number
) {
	const result = await trx
		.updateTable(TICKET_TABLE_NAME)
		.set({ revoked_at: now, revoked_reason: reason })
		.where('client_id', '=', clientId)
		.where('used_at', 'is', null)
		.where('revoked_at', 'is', null)
		.executeTakeFirst();

	return Number(result.numUpdatedRows);
}

export async function listAdminSsoTickets({
	clientId,
	limit,
	now = Date.now(),
	offset,
	query: searchQuery,
	status,
	userId,
}: IAdminSsoTicketListOptions): Promise<IListAdminSsoTicketsResult> {
	const db = await getAccountDatabase();
	const normalizedSearchQuery = searchQuery?.trim().toLowerCase();
	let ticketsQuery = db
		.selectFrom(TICKET_TABLE_NAME)
		.innerJoin(
			CLIENT_TABLE_NAME,
			`${TICKET_TABLE_NAME}.client_id`,
			`${CLIENT_TABLE_NAME}.id`
		)
		.innerJoin(
			USER_TABLE_NAME,
			`${TICKET_TABLE_NAME}.user_id`,
			`${USER_TABLE_NAME}.id`
		)
		.select([
			`${CLIENT_TABLE_NAME}.disabled_at as client_disabled_at`,
			`${CLIENT_TABLE_NAME}.id as client_id`,
			`${CLIENT_TABLE_NAME}.name as client_name`,
			`${CLIENT_TABLE_NAME}.updated_at as client_updated_at`,
			`${TICKET_TABLE_NAME}.created_at as ticket_created_at`,
			`${TICKET_TABLE_NAME}.expires_at as ticket_expires_at`,
			`${TICKET_TABLE_NAME}.redirect_uri as redirect_uri`,
			`${TICKET_TABLE_NAME}.revoked_at as revoked_at`,
			`${TICKET_TABLE_NAME}.revoked_reason as revoked_reason`,
			`${TICKET_TABLE_NAME}.ticket_hash as ticket_hash`,
			`${TICKET_TABLE_NAME}.used_at as ticket_used_at`,
			`${USER_TABLE_NAME}.created_at as user_created_at`,
			`${USER_TABLE_NAME}.deleted_at as user_deleted_at`,
			`${USER_TABLE_NAME}.id as user_id`,
			`${USER_TABLE_NAME}.last_login_at as user_last_login_at`,
			`${USER_TABLE_NAME}.nickname as user_nickname`,
			`${USER_TABLE_NAME}.state_epoch as user_state_epoch`,
			`${USER_TABLE_NAME}.status as user_status`,
			`${USER_TABLE_NAME}.sync_generation as user_sync_generation`,
			`${USER_TABLE_NAME}.sync_status as user_sync_status`,
			`${USER_TABLE_NAME}.username as username`,
			`${USER_TABLE_NAME}.username_normalized as username_normalized`,
		])
		.where(`${CLIENT_TABLE_NAME}.deleted_at`, 'is', null);
	let totalCountQuery = db
		.selectFrom(TICKET_TABLE_NAME)
		.innerJoin(
			CLIENT_TABLE_NAME,
			`${TICKET_TABLE_NAME}.client_id`,
			`${CLIENT_TABLE_NAME}.id`
		)
		.innerJoin(
			USER_TABLE_NAME,
			`${TICKET_TABLE_NAME}.user_id`,
			`${USER_TABLE_NAME}.id`
		)
		.select((eb) => eb.fn.countAll<number>().as('total_count'))
		.where(`${CLIENT_TABLE_NAME}.deleted_at`, 'is', null);

	if (clientId !== undefined) {
		ticketsQuery = ticketsQuery.where(
			`${TICKET_TABLE_NAME}.client_id`,
			'=',
			clientId
		);
		totalCountQuery = totalCountQuery.where(
			`${TICKET_TABLE_NAME}.client_id`,
			'=',
			clientId
		);
	}
	if (userId !== undefined) {
		ticketsQuery = ticketsQuery.where(
			`${TICKET_TABLE_NAME}.user_id`,
			'=',
			userId
		);
		totalCountQuery = totalCountQuery.where(
			`${TICKET_TABLE_NAME}.user_id`,
			'=',
			userId
		);
	}
	switch (status) {
		case 'expired':
			ticketsQuery = ticketsQuery
				.where(`${TICKET_TABLE_NAME}.used_at`, 'is', null)
				.where(`${TICKET_TABLE_NAME}.revoked_at`, 'is', null)
				.where(`${TICKET_TABLE_NAME}.expires_at`, '<=', now);
			totalCountQuery = totalCountQuery
				.where(`${TICKET_TABLE_NAME}.used_at`, 'is', null)
				.where(`${TICKET_TABLE_NAME}.revoked_at`, 'is', null)
				.where(`${TICKET_TABLE_NAME}.expires_at`, '<=', now);
			break;
		case 'pending':
			ticketsQuery = ticketsQuery
				.where(`${TICKET_TABLE_NAME}.used_at`, 'is', null)
				.where(`${TICKET_TABLE_NAME}.revoked_at`, 'is', null)
				.where(`${TICKET_TABLE_NAME}.expires_at`, '>', now);
			totalCountQuery = totalCountQuery
				.where(`${TICKET_TABLE_NAME}.used_at`, 'is', null)
				.where(`${TICKET_TABLE_NAME}.revoked_at`, 'is', null)
				.where(`${TICKET_TABLE_NAME}.expires_at`, '>', now);
			break;
		case 'revoked':
			ticketsQuery = ticketsQuery.where(
				`${TICKET_TABLE_NAME}.revoked_at`,
				'is not',
				null
			);
			totalCountQuery = totalCountQuery.where(
				`${TICKET_TABLE_NAME}.revoked_at`,
				'is not',
				null
			);
			break;
		case 'used':
			ticketsQuery = ticketsQuery.where(
				`${TICKET_TABLE_NAME}.used_at`,
				'is not',
				null
			);
			totalCountQuery = totalCountQuery.where(
				`${TICKET_TABLE_NAME}.used_at`,
				'is not',
				null
			);
			break;
		case undefined:
			break;
	}
	if (normalizedSearchQuery !== undefined && normalizedSearchQuery !== '') {
		const likePattern = `%${escapeSqliteLikePattern(normalizedSearchQuery)}%`;
		ticketsQuery = ticketsQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref(`${CLIENT_TABLE_NAME}.id`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${CLIENT_TABLE_NAME}.name`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${TICKET_TABLE_NAME}.redirect_uri`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${TICKET_TABLE_NAME}.ticket_hash`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${USER_TABLE_NAME}.id`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${USER_TABLE_NAME}.username_normalized`)} like ${likePattern} escape '\\'`,
			])
		);
		totalCountQuery = totalCountQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref(`${CLIENT_TABLE_NAME}.id`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${CLIENT_TABLE_NAME}.name`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${TICKET_TABLE_NAME}.redirect_uri`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${TICKET_TABLE_NAME}.ticket_hash`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${USER_TABLE_NAME}.id`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${USER_TABLE_NAME}.username_normalized`)} like ${likePattern} escape '\\'`,
			])
		);
	}

	const [tickets, totalCountRecord] = await Promise.all([
		ticketsQuery
			.orderBy(`${TICKET_TABLE_NAME}.created_at`, 'desc')
			.orderBy(`${TICKET_TABLE_NAME}.ticket_hash`, 'asc')
			.limit(limit)
			.offset(offset)
			.execute(),
		totalCountQuery.executeTakeFirstOrThrow(),
	]);

	return {
		tickets,
		totalCount: normalizeDatabaseCount(
			totalCountRecord.total_count,
			'invalid-sso-grant-count'
		),
	};
}

export async function revokeUnusedSsoTicketsForClient(
	clientId: TSsoClient['id'],
	reason: string,
	now = Date.now(),
	writeAuditLog?: (
		trx: Transaction<TDatabase>,
		now: number,
		revokedCount: number
	) => Promise<void>
) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		const result = await trx
			.updateTable(TICKET_TABLE_NAME)
			.set({ revoked_at: now, revoked_reason: reason })
			.where('client_id', '=', clientId)
			.where('used_at', 'is', null)
			.where('revoked_at', 'is', null)
			.executeTakeFirst();
		const revokedCount = Number(result.numUpdatedRows);
		await writeAuditLog?.(trx, now, revokedCount);

		return revokedCount;
	});
}

export async function revokeUnusedSsoTicketsForUser(
	userId: TUser['id'],
	reason: string,
	now = Date.now(),
	writeAuditLog?: (
		trx: Transaction<TDatabase>,
		now: number,
		revokedCount: number
	) => Promise<void>
) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		const result = await trx
			.updateTable(TICKET_TABLE_NAME)
			.set({ revoked_at: now, revoked_reason: reason })
			.where('user_id', '=', userId)
			.where('used_at', 'is', null)
			.where('revoked_at', 'is', null)
			.executeTakeFirst();
		const revokedCount = Number(result.numUpdatedRows);
		await writeAuditLog?.(trx, now, revokedCount);

		return revokedCount;
	});
}

export async function countExpiredSsoTickets(expiredAt = Date.now()) {
	const db = await getAccountDatabase();
	const countRecord = await db
		.selectFrom(TICKET_TABLE_NAME)
		.select((eb) => eb.fn.countAll<number>().as('total_count'))
		.where('expires_at', '<=', expiredAt)
		.executeTakeFirstOrThrow();

	return normalizeDatabaseCount(
		countRecord.total_count,
		'invalid-sso-grant-count'
	);
}

export async function cleanupExpiredSsoTickets(
	expiredAt = Date.now(),
	writeAuditLog?: (
		trx: Transaction<TDatabase>,
		now: number,
		deletedCount: number
	) => Promise<void>
) {
	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
		const result = await trx
			.deleteFrom(TICKET_TABLE_NAME)
			.where('expires_at', '<=', expiredAt)
			.executeTakeFirst();
		const deletedCount = Number(result.numDeletedRows);
		await writeAuditLog?.(trx, now, deletedCount);

		return deletedCount;
	});
}
