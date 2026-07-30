import { sql } from 'kysely';

import {
	type TSsoActorType,
	type TSsoGrantEvent,
} from '@/domain/account/contracts';

import { getAccountDatabase } from '@/features/account/server/persistence/database';

import { normalizeDatabaseCount } from '@/infrastructure/database/queryValues';
import type { TSsoClient, TUser } from '@/infrastructure/database/schema';
import { escapeSqliteLikePattern } from '@/infrastructure/database/sqlite/queryValues';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';

import { type ISsoGrantListOptions } from './grants';

const CLIENT_TABLE_NAME = TABLE_NAME_MAP.ssoClient;

const GRANT_EVENT_TABLE_NAME = TABLE_NAME_MAP.ssoGrantEvent;

const USER_TABLE_NAME = TABLE_NAME_MAP.user;

export interface IAdminSsoGrantEventListOptions extends ISsoGrantListOptions {
	actorId?: string;
	actorType?: TSsoActorType;
	clientId?: TSsoClient['id'];
	endTime?: number;
	event?: TSsoGrantEvent;
	startTime?: number;
	userId?: TUser['id'];
}

export interface IAdminSsoGrantEventRecord {
	actor_id: string | null;
	actor_type: TSsoActorType;
	client_disabled_at: number | null;
	client_id: string | null;
	client_name: string | null;
	client_updated_at: number | null;
	event: TSsoGrantEvent;
	event_created_at: number;
	event_id: number;
	reason: string | null;
	user_created_at: number | null;
	user_deleted_at: number | null;
	user_id: string | null;
	user_last_login_at: number | null;
	user_nickname: string | null;
	user_state_epoch: number | null;
	user_status: TUser['status'] | null;
	user_sync_generation: number | null;
	user_sync_status: TUser['sync_status'] | null;
	username: string | null;
	username_normalized: string | null;
}

export interface IListAdminSsoGrantEventsResult {
	events: IAdminSsoGrantEventRecord[];
	totalCount: number;
}

export interface ISsoGrantEventCleanupOptions {
	before?: number;
	maxRows?: number;
}

export interface ISsoGrantEventCleanupResult {
	deletedByAge: number;
	deletedByCap: number;
}

export async function listAdminSsoGrantEvents({
	actorId,
	actorType,
	clientId,
	endTime,
	event,
	limit,
	offset,
	query: searchQuery,
	startTime,
	userId,
}: IAdminSsoGrantEventListOptions): Promise<IListAdminSsoGrantEventsResult> {
	const db = await getAccountDatabase();
	const normalizedSearchQuery = searchQuery?.trim().toLowerCase();
	let eventsQuery = db
		.selectFrom(GRANT_EVENT_TABLE_NAME)
		.leftJoin(
			CLIENT_TABLE_NAME,
			`${GRANT_EVENT_TABLE_NAME}.client_id`,
			`${CLIENT_TABLE_NAME}.id`
		)
		.leftJoin(
			USER_TABLE_NAME,
			`${GRANT_EVENT_TABLE_NAME}.user_id`,
			`${USER_TABLE_NAME}.id`
		)
		.select([
			`${GRANT_EVENT_TABLE_NAME}.actor_id as actor_id`,
			`${GRANT_EVENT_TABLE_NAME}.actor_type as actor_type`,
			`${GRANT_EVENT_TABLE_NAME}.created_at as event_created_at`,
			`${GRANT_EVENT_TABLE_NAME}.event as event`,
			`${GRANT_EVENT_TABLE_NAME}.id as event_id`,
			`${GRANT_EVENT_TABLE_NAME}.reason as reason`,
			`${CLIENT_TABLE_NAME}.disabled_at as client_disabled_at`,
			`${CLIENT_TABLE_NAME}.id as client_id`,
			`${CLIENT_TABLE_NAME}.name as client_name`,
			`${CLIENT_TABLE_NAME}.updated_at as client_updated_at`,
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
		]);
	let totalCountQuery = db
		.selectFrom(GRANT_EVENT_TABLE_NAME)
		.leftJoin(
			CLIENT_TABLE_NAME,
			`${GRANT_EVENT_TABLE_NAME}.client_id`,
			`${CLIENT_TABLE_NAME}.id`
		)
		.leftJoin(
			USER_TABLE_NAME,
			`${GRANT_EVENT_TABLE_NAME}.user_id`,
			`${USER_TABLE_NAME}.id`
		)
		.select((eb) => eb.fn.countAll<number>().as('total_count'));

	if (clientId !== undefined) {
		eventsQuery = eventsQuery.where(
			`${GRANT_EVENT_TABLE_NAME}.client_id`,
			'=',
			clientId
		);
		totalCountQuery = totalCountQuery.where(
			`${GRANT_EVENT_TABLE_NAME}.client_id`,
			'=',
			clientId
		);
	}
	if (userId !== undefined) {
		eventsQuery = eventsQuery.where(
			`${GRANT_EVENT_TABLE_NAME}.user_id`,
			'=',
			userId
		);
		totalCountQuery = totalCountQuery.where(
			`${GRANT_EVENT_TABLE_NAME}.user_id`,
			'=',
			userId
		);
	}
	if (event !== undefined) {
		eventsQuery = eventsQuery.where(
			`${GRANT_EVENT_TABLE_NAME}.event`,
			'=',
			event
		);
		totalCountQuery = totalCountQuery.where(
			`${GRANT_EVENT_TABLE_NAME}.event`,
			'=',
			event
		);
	}
	if (actorType !== undefined) {
		eventsQuery = eventsQuery.where(
			`${GRANT_EVENT_TABLE_NAME}.actor_type`,
			'=',
			actorType
		);
		totalCountQuery = totalCountQuery.where(
			`${GRANT_EVENT_TABLE_NAME}.actor_type`,
			'=',
			actorType
		);
	}
	if (actorId !== undefined) {
		eventsQuery = eventsQuery.where(
			`${GRANT_EVENT_TABLE_NAME}.actor_id`,
			'=',
			actorId
		);
		totalCountQuery = totalCountQuery.where(
			`${GRANT_EVENT_TABLE_NAME}.actor_id`,
			'=',
			actorId
		);
	}
	if (startTime !== undefined) {
		eventsQuery = eventsQuery.where(
			`${GRANT_EVENT_TABLE_NAME}.created_at`,
			'>=',
			startTime
		);
		totalCountQuery = totalCountQuery.where(
			`${GRANT_EVENT_TABLE_NAME}.created_at`,
			'>=',
			startTime
		);
	}
	if (endTime !== undefined) {
		eventsQuery = eventsQuery.where(
			`${GRANT_EVENT_TABLE_NAME}.created_at`,
			'<=',
			endTime
		);
		totalCountQuery = totalCountQuery.where(
			`${GRANT_EVENT_TABLE_NAME}.created_at`,
			'<=',
			endTime
		);
	}
	if (normalizedSearchQuery !== undefined && normalizedSearchQuery !== '') {
		const likePattern = `%${escapeSqliteLikePattern(normalizedSearchQuery)}%`;
		eventsQuery = eventsQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref(`${GRANT_EVENT_TABLE_NAME}.client_id`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${GRANT_EVENT_TABLE_NAME}.user_id`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${GRANT_EVENT_TABLE_NAME}.event`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${GRANT_EVENT_TABLE_NAME}.actor_id`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${CLIENT_TABLE_NAME}.name`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${USER_TABLE_NAME}.username_normalized`)} like ${likePattern} escape '\\'`,
			])
		);
		totalCountQuery = totalCountQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref(`${GRANT_EVENT_TABLE_NAME}.client_id`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${GRANT_EVENT_TABLE_NAME}.user_id`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${GRANT_EVENT_TABLE_NAME}.event`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${GRANT_EVENT_TABLE_NAME}.actor_id`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${CLIENT_TABLE_NAME}.name`)} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref(`${USER_TABLE_NAME}.username_normalized`)} like ${likePattern} escape '\\'`,
			])
		);
	}

	const [events, totalCountRecord] = await Promise.all([
		eventsQuery
			.orderBy(`${GRANT_EVENT_TABLE_NAME}.created_at`, 'desc')
			.orderBy(`${GRANT_EVENT_TABLE_NAME}.id`, 'desc')
			.limit(limit)
			.offset(offset)
			.execute(),
		totalCountQuery.executeTakeFirstOrThrow(),
	]);

	return {
		events,
		totalCount: normalizeDatabaseCount(
			totalCountRecord.total_count,
			'invalid-sso-grant-count'
		),
	};
}

export async function cleanupSsoGrantEvents({
	before,
	maxRows,
}: ISsoGrantEventCleanupOptions): Promise<ISsoGrantEventCleanupResult> {
	const db = await getAccountDatabase();
	let deletedByAge = 0;
	let deletedByCap = 0;

	if (before !== undefined) {
		const result = await db
			.deleteFrom(GRANT_EVENT_TABLE_NAME)
			.where('created_at', '<', before)
			.executeTakeFirst();
		deletedByAge = Number(result.numDeletedRows);
	}

	if (maxRows !== undefined && maxRows >= 0) {
		const cutoff = await db
			.selectFrom(GRANT_EVENT_TABLE_NAME)
			.select(['created_at', 'id'])
			.orderBy('created_at', 'desc')
			.orderBy('id', 'desc')
			.offset(maxRows)
			.limit(1)
			.executeTakeFirst();

		if (cutoff !== undefined) {
			const result = await db
				.deleteFrom(GRANT_EVENT_TABLE_NAME)
				.where((eb) =>
					eb.or([
						eb('created_at', '<', cutoff.created_at),
						eb.and([
							eb('created_at', '=', cutoff.created_at),
							eb('id', '<=', cutoff.id),
						]),
					])
				)
				.executeTakeFirst();
			deletedByCap = Number(result.numDeletedRows);
		}
	}

	return { deletedByAge, deletedByCap };
}
