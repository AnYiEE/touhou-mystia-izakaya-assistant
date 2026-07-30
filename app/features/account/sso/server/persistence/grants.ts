import { type Transaction, sql } from 'kysely';

import { type TUserStatus } from '@/domain/account/contracts';

import type { TAuthenticatedSessionIdentity } from '@/features/account/server/persistence/contracts';
import { getAccountDatabase } from '@/features/account/server/persistence/database';
import { lockActiveUserSessionInTransaction } from '@/features/account/server/persistence/repositories/sessions';

import { normalizeDatabaseCount } from '@/infrastructure/database/queryValues';
import type {
	TDatabase,
	TSsoClient,
	TSsoGrantEventNew,
	TUser,
} from '@/infrastructure/database/schema';
import { escapeSqliteLikePattern } from '@/infrastructure/database/sqlite/queryValues';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';

import { enqueueSsoCallbackInTransaction } from './callbackQueue';

const CLIENT_TABLE_NAME = TABLE_NAME_MAP.ssoClient;

const GRANT_TABLE_NAME = TABLE_NAME_MAP.ssoUserClientGrant;

const GRANT_EVENT_TABLE_NAME = TABLE_NAME_MAP.ssoGrantEvent;

const TICKET_TABLE_NAME = TABLE_NAME_MAP.ssoTicket;

const USER_TABLE_NAME = TABLE_NAME_MAP.user;

type TSsoAuditTransactionCallback = (
	trx: Transaction<TDatabase>,
	now: number
) => Promise<void>;

export interface ISsoGrantListOptions {
	limit: number;
	offset: number;
	query?: string;
}

export interface IAdminSsoGrantListOptions extends ISsoGrantListOptions {
	clientId?: TSsoClient['id'];
	clientStatus?: 'active' | 'disabled';
	userId?: TUser['id'];
	userStatus?: TUserStatus;
}

export interface ISsoClientUserGrantRecord {
	grant_created_at: number;
	grant_updated_at: number;
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

export interface ISsoUserClientGrantRecord {
	client_disabled_at: number | null;
	client_id: string;
	client_name: string;
	client_updated_at: number;
	grant_created_at: number;
	grant_updated_at: number;
}

export interface IAdminSsoGrantRecord
	extends ISsoClientUserGrantRecord, ISsoUserClientGrantRecord {}

type TSsoGrantIdentity = Pick<IAdminSsoGrantRecord, 'client_id' | 'user_id'>;

export interface IListSsoClientUserGrantsResult {
	grants: ISsoClientUserGrantRecord[];
	totalCount: number;
}

export interface IListSsoUserClientGrantsResult {
	grants: ISsoUserClientGrantRecord[];
	totalCount: number;
}

export interface IListAdminSsoGrantsResult {
	grants: IAdminSsoGrantRecord[];
	totalCount: number;
}

export interface ISsoGrantActorInput {
	actorId: string | null;
	actorType: TSsoGrantEventNew['actor_type'];
	reason: string | null;
}

export function createSsoGrantEventRecord(
	clientId: TSsoClient['id'],
	userId: TUser['id'],
	event: TSsoGrantEventNew['event'],
	actor: ISsoGrantActorInput,
	timestamp: number
) {
	return {
		actor_id: actor.actorId,
		actor_type: actor.actorType,
		client_id: clientId,
		created_at: timestamp,
		event,
		reason: actor.reason,
		user_id: userId,
	} satisfies TSsoGrantEventNew;
}

function createAdminRevokeEventActor(actor?: ISsoGrantActorInput) {
	return (
		actor ?? {
			actorId: null,
			actorType: 'admin' as const,
			reason: 'admin-revoke-grant',
		}
	);
}

async function revokeSsoGrantSideEffectsInTransaction(
	trx: Transaction<TDatabase>,
	grants: Array<Pick<IAdminSsoGrantRecord, 'client_id' | 'user_id'>>,
	actor: ISsoGrantActorInput,
	timestamp: number
) {
	if (grants.length === 0) {
		return;
	}

	for (const grant of grants) {
		await trx
			.updateTable(TICKET_TABLE_NAME)
			.set({ revoked_at: timestamp, revoked_reason: actor.reason })
			.where('client_id', '=', grant.client_id)
			.where('user_id', '=', grant.user_id)
			.where('used_at', 'is', null)
			.where('revoked_at', 'is', null)
			.execute();

		await trx
			.insertInto(GRANT_EVENT_TABLE_NAME)
			.values(
				createSsoGrantEventRecord(
					grant.client_id,
					grant.user_id,
					actor.actorType === 'user'
						? 'user_revoked'
						: 'admin_revoked',
					actor,
					timestamp
				)
			)
			.execute();

		await enqueueSsoCallbackInTransaction(
			trx,
			grant.client_id,
			grant.user_id,
			'grant_revoked',
			timestamp,
			{ reason: actor.reason }
		);
	}
}

async function deleteSsoUserClientGrantsInTransaction(
	trx: Transaction<TDatabase>,
	grants: TSsoGrantIdentity[],
	actor: ISsoGrantActorInput,
	timestamp: number
) {
	if (grants.length === 0) {
		return 0;
	}

	const deletedGrants: TSsoGrantIdentity[] = [];
	for (const grant of grants) {
		const deletedGrant = await trx
			.deleteFrom(GRANT_TABLE_NAME)
			.returning(['client_id', 'user_id'])
			.where('client_id', '=', grant.client_id)
			.where('user_id', '=', grant.user_id)
			.executeTakeFirst();
		if (deletedGrant !== undefined) {
			deletedGrants.push(deletedGrant);
		}
	}
	if (deletedGrants.length === 0) {
		return 0;
	}

	await revokeSsoGrantSideEffectsInTransaction(
		trx,
		deletedGrants,
		actor,
		timestamp
	);

	return deletedGrants.length;
}

async function deleteSsoUserClientGrantScopeInTransaction(
	trx: Transaction<TDatabase>,
	filter: { clientId: TSsoClient['id'] } | { userId: TUser['id'] },
	actor: ISsoGrantActorInput,
	timestamp: number
) {
	let deletedGrants: TSsoGrantIdentity[];
	if ('clientId' in filter) {
		const result = await sql<TSsoGrantIdentity>`
			delete from ${sql.raw(GRANT_TABLE_NAME)}
			where client_id = ${filter.clientId}
			returning client_id, user_id
		`.execute(trx);
		deletedGrants = result.rows;
	} else {
		const result = await sql<TSsoGrantIdentity>`
			delete from ${sql.raw(GRANT_TABLE_NAME)}
			where user_id = ${filter.userId}
			returning client_id, user_id
		`.execute(trx);
		deletedGrants = result.rows;
	}
	if (deletedGrants.length === 0) {
		return 0;
	}

	await revokeSsoGrantSideEffectsInTransaction(
		trx,
		deletedGrants,
		actor,
		timestamp
	);

	return deletedGrants.length;
}

export async function deleteSsoUserClientGrant(
	userId: TUser['id'],
	clientId: TSsoClient['id'],
	actor?: ISsoGrantActorInput,
	writeAuditLog?: TSsoAuditTransactionCallback
) {
	const db = await getAccountDatabase();
	const now = Date.now();
	const eventActor = actor ?? {
		actorId: userId,
		actorType: 'user' as const,
		reason: 'user-revoke-grant',
	};

	return db.transaction().execute(async (trx) => {
		const deletedCount = await deleteSsoUserClientGrantsInTransaction(
			trx,
			[{ client_id: clientId, user_id: userId }],
			eventActor,
			now
		);
		if (deletedCount !== 1) {
			return false;
		}
		await writeAuditLog?.(trx, now);

		return true;
	});
}

export async function deleteSsoUserClientGrantForActiveSession(
	userId: TUser['id'],
	clientId: TSsoClient['id'],
	session: TAuthenticatedSessionIdentity,
	writeAuditLog: TSsoAuditTransactionCallback
) {
	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
		if (!(await lockActiveUserSessionInTransaction(trx, userId, session))) {
			return { status: 'unauthorized' as const };
		}
		const deletedCount = await deleteSsoUserClientGrantsInTransaction(
			trx,
			[{ client_id: clientId, user_id: userId }],
			{ actorId: userId, actorType: 'user', reason: 'user-revoke-grant' },
			now
		);
		if (deletedCount !== 1) {
			return { status: 'not-found' as const };
		}
		await writeAuditLog(trx, now);

		return { status: 'ok' as const };
	});
}

export async function listAdminSsoGrants({
	clientId,
	clientStatus,
	limit,
	offset,
	query: searchQuery,
	userId,
	userStatus,
}: IAdminSsoGrantListOptions): Promise<IListAdminSsoGrantsResult> {
	const db = await getAccountDatabase();
	const normalizedSearchQuery = searchQuery?.trim().toLowerCase();
	let grantsQuery = db
		.selectFrom(GRANT_TABLE_NAME)
		.innerJoin(
			CLIENT_TABLE_NAME,
			`${GRANT_TABLE_NAME}.client_id`,
			`${CLIENT_TABLE_NAME}.id`
		)
		.innerJoin(
			USER_TABLE_NAME,
			`${GRANT_TABLE_NAME}.user_id`,
			`${USER_TABLE_NAME}.id`
		)
		.select([
			`${CLIENT_TABLE_NAME}.disabled_at as client_disabled_at`,
			`${CLIENT_TABLE_NAME}.id as client_id`,
			`${CLIENT_TABLE_NAME}.name as client_name`,
			`${CLIENT_TABLE_NAME}.updated_at as client_updated_at`,
			`${GRANT_TABLE_NAME}.created_at as grant_created_at`,
			`${GRANT_TABLE_NAME}.updated_at as grant_updated_at`,
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
		.selectFrom(GRANT_TABLE_NAME)
		.innerJoin(
			CLIENT_TABLE_NAME,
			`${GRANT_TABLE_NAME}.client_id`,
			`${CLIENT_TABLE_NAME}.id`
		)
		.innerJoin(
			USER_TABLE_NAME,
			`${GRANT_TABLE_NAME}.user_id`,
			`${USER_TABLE_NAME}.id`
		)
		.select((eb) => eb.fn.countAll<number>().as('total_count'))
		.where(`${CLIENT_TABLE_NAME}.deleted_at`, 'is', null);

	if (clientId !== undefined) {
		grantsQuery = grantsQuery.where(
			`${GRANT_TABLE_NAME}.client_id`,
			'=',
			clientId
		);
		totalCountQuery = totalCountQuery.where(
			`${GRANT_TABLE_NAME}.client_id`,
			'=',
			clientId
		);
	}
	if (userId !== undefined) {
		grantsQuery = grantsQuery.where(
			`${GRANT_TABLE_NAME}.user_id`,
			'=',
			userId
		);
		totalCountQuery = totalCountQuery.where(
			`${GRANT_TABLE_NAME}.user_id`,
			'=',
			userId
		);
	}
	if (userStatus !== undefined) {
		grantsQuery = grantsQuery.where(
			`${USER_TABLE_NAME}.status`,
			'=',
			userStatus
		);
		totalCountQuery = totalCountQuery.where(
			`${USER_TABLE_NAME}.status`,
			'=',
			userStatus
		);
	}
	if (clientStatus === 'active') {
		grantsQuery = grantsQuery.where(
			`${CLIENT_TABLE_NAME}.disabled_at`,
			'is',
			null
		);
		totalCountQuery = totalCountQuery.where(
			`${CLIENT_TABLE_NAME}.disabled_at`,
			'is',
			null
		);
	} else if (clientStatus === 'disabled') {
		grantsQuery = grantsQuery.where(
			`${CLIENT_TABLE_NAME}.disabled_at`,
			'is not',
			null
		);
		totalCountQuery = totalCountQuery.where(
			`${CLIENT_TABLE_NAME}.disabled_at`,
			'is not',
			null
		);
	}
	if (normalizedSearchQuery !== undefined && normalizedSearchQuery !== '') {
		const likePattern = `%${escapeSqliteLikePattern(normalizedSearchQuery)}%`;
		grantsQuery = grantsQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref(`${CLIENT_TABLE_NAME}.id`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${CLIENT_TABLE_NAME}.name`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${USER_TABLE_NAME}.id`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${USER_TABLE_NAME}.username_normalized`)} like ${likePattern} escape '\\'`,
			])
		);
		totalCountQuery = totalCountQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref(`${CLIENT_TABLE_NAME}.id`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${CLIENT_TABLE_NAME}.name`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${USER_TABLE_NAME}.id`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${USER_TABLE_NAME}.username_normalized`)} like ${likePattern} escape '\\'`,
			])
		);
	}

	const [grants, totalCountRecord] = await Promise.all([
		grantsQuery
			.orderBy(`${GRANT_TABLE_NAME}.updated_at`, 'desc')
			.orderBy(`${CLIENT_TABLE_NAME}.id`, 'asc')
			.orderBy(`${USER_TABLE_NAME}.id`, 'asc')
			.limit(limit)
			.offset(offset)
			.execute(),
		totalCountQuery.executeTakeFirstOrThrow(),
	]);

	return {
		grants,
		totalCount: normalizeDatabaseCount(
			totalCountRecord.total_count,
			'invalid-sso-grant-count'
		),
	};
}

export async function deleteSsoUserClientGrantsByClient(
	clientId: TSsoClient['id'],
	actor?: ISsoGrantActorInput,
	writeAuditLog?: (
		trx: Transaction<TDatabase>,
		now: number,
		deletedCount: number
	) => Promise<void>
) {
	const db = await getAccountDatabase();
	const now = Date.now();
	const eventActor = createAdminRevokeEventActor(actor);

	return db.transaction().execute(async (trx) => {
		const deletedCount = await deleteSsoUserClientGrantScopeInTransaction(
			trx,
			{ clientId },
			eventActor,
			now
		);
		await writeAuditLog?.(trx, now, deletedCount);

		return deletedCount;
	});
}

export async function deleteSsoUserClientGrantsByUser(
	userId: TUser['id'],
	actor?: ISsoGrantActorInput,
	writeAuditLog?: (
		trx: Transaction<TDatabase>,
		now: number,
		deletedCount: number
	) => Promise<void>
) {
	const db = await getAccountDatabase();
	const now = Date.now();
	const eventActor = createAdminRevokeEventActor(actor);

	return db.transaction().execute(async (trx) => {
		const deletedCount = await deleteSsoUserClientGrantScopeInTransaction(
			trx,
			{ userId },
			eventActor,
			now
		);
		await writeAuditLog?.(trx, now, deletedCount);

		return deletedCount;
	});
}

export async function listSsoUserClientGrantsForClient(
	clientId: TSsoClient['id'],
	{ limit, offset, query: searchQuery }: ISsoGrantListOptions
): Promise<IListSsoClientUserGrantsResult> {
	const db = await getAccountDatabase();
	const normalizedSearchQuery = searchQuery?.trim().toLowerCase();
	let grantsQuery = db
		.selectFrom(GRANT_TABLE_NAME)
		.innerJoin(
			USER_TABLE_NAME,
			`${GRANT_TABLE_NAME}.user_id`,
			`${USER_TABLE_NAME}.id`
		)
		.select([
			`${GRANT_TABLE_NAME}.created_at as grant_created_at`,
			`${GRANT_TABLE_NAME}.updated_at as grant_updated_at`,
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
		.where(`${GRANT_TABLE_NAME}.client_id`, '=', clientId);
	let totalCountQuery = db
		.selectFrom(GRANT_TABLE_NAME)
		.innerJoin(
			USER_TABLE_NAME,
			`${GRANT_TABLE_NAME}.user_id`,
			`${USER_TABLE_NAME}.id`
		)
		.select((eb) => eb.fn.countAll<number>().as('total_count'))
		.where(`${GRANT_TABLE_NAME}.client_id`, '=', clientId);

	if (normalizedSearchQuery !== undefined && normalizedSearchQuery !== '') {
		const likePattern = `%${escapeSqliteLikePattern(normalizedSearchQuery)}%`;
		grantsQuery = grantsQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref(`${USER_TABLE_NAME}.username_normalized`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${USER_TABLE_NAME}.id`)} like ${likePattern} escape '\\'`,
			])
		);
		totalCountQuery = totalCountQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref(`${USER_TABLE_NAME}.username_normalized`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${USER_TABLE_NAME}.id`)} like ${likePattern} escape '\\'`,
			])
		);
	}

	const [grants, totalCountRecord] = await Promise.all([
		grantsQuery
			.orderBy(`${GRANT_TABLE_NAME}.updated_at`, 'desc')
			.orderBy(`${USER_TABLE_NAME}.id`, 'asc')
			.limit(limit)
			.offset(offset)
			.execute(),
		totalCountQuery.executeTakeFirstOrThrow(),
	]);

	return {
		grants,
		totalCount: normalizeDatabaseCount(
			totalCountRecord.total_count,
			'invalid-sso-grant-count'
		),
	};
}

export async function listSsoClientGrantsForUserAsAdmin(
	userId: TUser['id'],
	{ limit, offset, query: searchQuery }: ISsoGrantListOptions
): Promise<IListSsoUserClientGrantsResult> {
	const db = await getAccountDatabase();
	const normalizedSearchQuery = searchQuery?.trim().toLowerCase();
	let grantsQuery = db
		.selectFrom(GRANT_TABLE_NAME)
		.innerJoin(
			CLIENT_TABLE_NAME,
			`${GRANT_TABLE_NAME}.client_id`,
			`${CLIENT_TABLE_NAME}.id`
		)
		.select([
			`${CLIENT_TABLE_NAME}.disabled_at as client_disabled_at`,
			`${CLIENT_TABLE_NAME}.id as client_id`,
			`${CLIENT_TABLE_NAME}.name as client_name`,
			`${CLIENT_TABLE_NAME}.updated_at as client_updated_at`,
			`${GRANT_TABLE_NAME}.created_at as grant_created_at`,
			`${GRANT_TABLE_NAME}.updated_at as grant_updated_at`,
		])
		.where(`${GRANT_TABLE_NAME}.user_id`, '=', userId)
		.where(`${CLIENT_TABLE_NAME}.deleted_at`, 'is', null);
	let totalCountQuery = db
		.selectFrom(GRANT_TABLE_NAME)
		.innerJoin(
			CLIENT_TABLE_NAME,
			`${GRANT_TABLE_NAME}.client_id`,
			`${CLIENT_TABLE_NAME}.id`
		)
		.select((eb) => eb.fn.countAll<number>().as('total_count'))
		.where(`${GRANT_TABLE_NAME}.user_id`, '=', userId)
		.where(`${CLIENT_TABLE_NAME}.deleted_at`, 'is', null);

	if (normalizedSearchQuery !== undefined && normalizedSearchQuery !== '') {
		const likePattern = `%${escapeSqliteLikePattern(normalizedSearchQuery)}%`;
		grantsQuery = grantsQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref(`${CLIENT_TABLE_NAME}.id`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${CLIENT_TABLE_NAME}.name`)} like ${likePattern} escape '\\'`,
			])
		);
		totalCountQuery = totalCountQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref(`${CLIENT_TABLE_NAME}.id`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${CLIENT_TABLE_NAME}.name`)} like ${likePattern} escape '\\'`,
			])
		);
	}

	const [grants, totalCountRecord] = await Promise.all([
		grantsQuery
			.orderBy(`${GRANT_TABLE_NAME}.updated_at`, 'desc')
			.orderBy(`${CLIENT_TABLE_NAME}.id`, 'asc')
			.limit(limit)
			.offset(offset)
			.execute(),
		totalCountQuery.executeTakeFirstOrThrow(),
	]);

	return {
		grants,
		totalCount: normalizeDatabaseCount(
			totalCountRecord.total_count,
			'invalid-sso-grant-count'
		),
	};
}
