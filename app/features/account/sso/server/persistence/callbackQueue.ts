import { type Transaction, sql } from 'kysely';

import type { TAdminSsoCallbackQueueStatus } from '@/features/account/contracts';
import { getAccountDatabase } from '@/features/account/server/persistence/database';

import { normalizeDatabaseCount } from '@/infrastructure/database/queryValues';
import type {
	TDatabase,
	TSsoCallbackEvent,
	TSsoCallbackQueue,
	TSsoCallbackQueueNew,
	TSsoClient,
	TUser,
} from '@/infrastructure/database/schema';
import { escapeSqliteLikePattern } from '@/infrastructure/database/sqlite/queryValues';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';

const CLIENT_TABLE_NAME = TABLE_NAME_MAP.ssoClient;

const CALLBACK_QUEUE_TABLE_NAME = TABLE_NAME_MAP.ssoCallbackQueue;

const GRANT_TABLE_NAME = TABLE_NAME_MAP.ssoUserClientGrant;

export const SSO_CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT = Number.MAX_SAFE_INTEGER;

export interface IAdminSsoCallbackQueueListOptions {
	limit: number;
	offset: number;
	query?: string;
	clientId?: TSsoClient['id'];
	endTime?: number;
	event?: TSsoCallbackEvent;
	startTime?: number;
	status?: TAdminSsoCallbackQueueStatus;
	userId?: TUser['id'];
}

export type ISsoCallbackMetadataInput = Record<
	string,
	boolean | null | number | string
>;

export interface IListAdminSsoCallbackQueueResult {
	callbacks: TSsoCallbackQueue[];
	totalCount: number;
}

export interface ISsoFinalFailedCallbackQueueCleanupOptions {
	before?: number;
	maxRows?: number;
}

export interface ISsoFinalFailedCallbackQueueCleanupResult {
	deletedByAge: number;
	deletedByCap: number;
}

export type TSsoCallbackQueueMutationError =
	| 'sso-callback-queue-busy'
	| 'sso-callback-queue-not-found';

export type TSsoCallbackQueueMutationResult =
	| { callback: TSsoCallbackQueue; status: 'ok' }
	| { error: TSsoCallbackQueueMutationError; status: 'error' };

function createSsoCallbackQueueRecord(
	clientId: TSsoClient['id'],
	userId: TUser['id'] | null,
	event: TSsoCallbackEvent,
	timestamp: number,
	metadata: ISsoCallbackMetadataInput = {}
) {
	return {
		attempts: 0,
		client_id: clientId,
		created_at: timestamp,
		event,
		generation: 0,
		last_error: null,
		lease_expires_at: null,
		lease_token: null,
		metadata_json: JSON.stringify(metadata),
		next_retry_at: timestamp,
		timestamp,
		user_id: userId,
	} satisfies TSsoCallbackQueueNew;
}

function createCallbackQueueUpdate(
	timestamp: number,
	metadata: ISsoCallbackMetadataInput = {}
) {
	return {
		attempts: 0,
		created_at: timestamp,
		generation: sql<number>`generation + 1`,
		last_error: null,
		lease_expires_at: null,
		lease_token: null,
		metadata_json: JSON.stringify(metadata),
		next_retry_at: timestamp,
		timestamp,
	};
}

export async function enqueueSsoCallbackInTransaction(
	trx: Transaction<TDatabase>,
	clientId: TSsoClient['id'],
	userId: TUser['id'],
	event: TSsoCallbackEvent,
	timestamp: number,
	metadata: ISsoCallbackMetadataInput = {}
) {
	const record = createSsoCallbackQueueRecord(
		clientId,
		userId,
		event,
		timestamp,
		metadata
	);

	await trx
		.insertInto(CALLBACK_QUEUE_TABLE_NAME)
		.values(record)
		.onConflict((oc) =>
			oc
				.columns(['client_id', 'user_id', 'event'])
				.where('user_id', 'is not', null)
				.doUpdateSet(createCallbackQueueUpdate(timestamp, metadata))
		)
		.execute();
}

export async function enqueueSsoClientCallbackInTransaction(
	trx: Transaction<TDatabase>,
	clientId: TSsoClient['id'],
	event: TSsoCallbackEvent,
	timestamp: number,
	metadata: ISsoCallbackMetadataInput = {}
) {
	const record = createSsoCallbackQueueRecord(
		clientId,
		null,
		event,
		timestamp,
		metadata
	);

	await trx
		.insertInto(CALLBACK_QUEUE_TABLE_NAME)
		.values(record)
		.onConflict((oc) =>
			oc
				.columns(['client_id', 'event'])
				.where('user_id', 'is', null)
				.doUpdateSet(createCallbackQueueUpdate(timestamp, metadata))
		)
		.execute();
}

export async function enqueueSsoCallback(
	clientId: TSsoClient['id'],
	userId: TUser['id'],
	event: TSsoCallbackEvent,
	timestamp = Date.now(),
	metadata: ISsoCallbackMetadataInput = {}
) {
	const db = await getAccountDatabase();

	await db.transaction().execute(async (trx) => {
		await enqueueSsoCallbackInTransaction(
			trx,
			clientId,
			userId,
			event,
			timestamp,
			metadata
		);
	});
}

export async function enqueueSsoClientCallback(
	clientId: TSsoClient['id'],
	event: TSsoCallbackEvent,
	timestamp = Date.now(),
	metadata: ISsoCallbackMetadataInput = {}
) {
	const db = await getAccountDatabase();

	await db.transaction().execute(async (trx) => {
		await enqueueSsoClientCallbackInTransaction(
			trx,
			clientId,
			event,
			timestamp,
			metadata
		);
	});
}

export async function cleanupFinalFailedSsoCallbackQueue({
	before,
	maxRows,
}: ISsoFinalFailedCallbackQueueCleanupOptions): Promise<ISsoFinalFailedCallbackQueueCleanupResult> {
	const db = await getAccountDatabase();
	let deletedByAge = 0;
	let deletedByCap = 0;

	if (before !== undefined) {
		const result = await db
			.deleteFrom(CALLBACK_QUEUE_TABLE_NAME)
			.where(
				'next_retry_at',
				'=',
				SSO_CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT
			)
			.where('created_at', '<', before)
			.executeTakeFirst();
		deletedByAge = Number(result.numDeletedRows);
	}

	if (maxRows !== undefined && maxRows >= 0) {
		const cutoff = await db
			.selectFrom(CALLBACK_QUEUE_TABLE_NAME)
			.select(['created_at', 'id'])
			.where(
				'next_retry_at',
				'=',
				SSO_CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT
			)
			.orderBy('created_at', 'desc')
			.orderBy('id', 'desc')
			.offset(maxRows)
			.limit(1)
			.executeTakeFirst();

		if (cutoff !== undefined) {
			const result = await db
				.deleteFrom(CALLBACK_QUEUE_TABLE_NAME)
				.where(
					'next_retry_at',
					'=',
					SSO_CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT
				)
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

export async function listAdminSsoCallbackQueue({
	clientId,
	endTime,
	event,
	limit,
	offset,
	query: searchQuery,
	startTime,
	status,
	userId,
}: IAdminSsoCallbackQueueListOptions): Promise<IListAdminSsoCallbackQueueResult> {
	const db = await getAccountDatabase();
	const normalizedSearchQuery = searchQuery?.trim().toLowerCase();
	let callbacksQuery = db.selectFrom(CALLBACK_QUEUE_TABLE_NAME).selectAll();
	let totalCountQuery = db
		.selectFrom(CALLBACK_QUEUE_TABLE_NAME)
		.select((eb) => eb.fn.countAll<number>().as('total_count'));

	if (clientId !== undefined) {
		callbacksQuery = callbacksQuery.where('client_id', '=', clientId);
		totalCountQuery = totalCountQuery.where('client_id', '=', clientId);
	}
	if (userId !== undefined) {
		callbacksQuery = callbacksQuery.where('user_id', '=', userId);
		totalCountQuery = totalCountQuery.where('user_id', '=', userId);
	}
	if (event !== undefined) {
		callbacksQuery = callbacksQuery.where('event', '=', event);
		totalCountQuery = totalCountQuery.where('event', '=', event);
	}
	if (startTime !== undefined) {
		callbacksQuery = callbacksQuery.where('created_at', '>=', startTime);
		totalCountQuery = totalCountQuery.where('created_at', '>=', startTime);
	}
	if (endTime !== undefined) {
		callbacksQuery = callbacksQuery.where('created_at', '<=', endTime);
		totalCountQuery = totalCountQuery.where('created_at', '<=', endTime);
	}
	switch (status) {
		case 'final_failed':
			callbacksQuery = callbacksQuery.where(
				'next_retry_at',
				'=',
				SSO_CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT
			);
			totalCountQuery = totalCountQuery.where(
				'next_retry_at',
				'=',
				SSO_CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT
			);
			break;
		case 'pending':
			callbacksQuery = callbacksQuery.where('attempts', '=', 0);
			totalCountQuery = totalCountQuery.where('attempts', '=', 0);
			break;
		case 'retrying':
			callbacksQuery = callbacksQuery
				.where('attempts', '>', 0)
				.where(
					'next_retry_at',
					'!=',
					SSO_CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT
				);
			totalCountQuery = totalCountQuery
				.where('attempts', '>', 0)
				.where(
					'next_retry_at',
					'!=',
					SSO_CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT
				);
			break;
		case undefined:
			break;
	}
	if (normalizedSearchQuery !== undefined && normalizedSearchQuery !== '') {
		const likePattern = `%${escapeSqliteLikePattern(normalizedSearchQuery)}%`;
		callbacksQuery = callbacksQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref('id')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('client_id')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('user_id')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('last_error')} like ${likePattern} escape '\\'`,
			])
		);
		totalCountQuery = totalCountQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref('id')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('client_id')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('user_id')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('last_error')} like ${likePattern} escape '\\'`,
			])
		);
	}

	const [callbacks, totalCountRecord] = await Promise.all([
		callbacksQuery
			.orderBy('next_retry_at', 'asc')
			.orderBy('id', 'asc')
			.limit(limit)
			.offset(offset)
			.execute(),
		totalCountQuery.executeTakeFirstOrThrow(),
	]);

	return {
		callbacks,
		totalCount: normalizeDatabaseCount(
			totalCountRecord.total_count,
			'invalid-sso-grant-count'
		),
	};
}

function isCallbackQueueBusy(
	record: Pick<TSsoCallbackQueue, 'lease_expires_at'>,
	now: number
) {
	return record.lease_expires_at !== null && record.lease_expires_at > now;
}

export async function retrySsoCallbackQueueRecord(
	id: TSsoCallbackQueue['id'],
	now = Date.now(),
	writeAuditLog?: (
		trx: Transaction<TDatabase>,
		now: number,
		callback: TSsoCallbackQueue
	) => Promise<void>
): Promise<TSsoCallbackQueueMutationResult> {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		const record =
			(await trx
				.selectFrom(CALLBACK_QUEUE_TABLE_NAME)
				.selectAll()
				.where('id', '=', id)
				.executeTakeFirst()) ?? null;
		if (record === null) {
			return { error: 'sso-callback-queue-not-found', status: 'error' };
		}
		if (isCallbackQueueBusy(record, now)) {
			return { error: 'sso-callback-queue-busy', status: 'error' };
		}

		const result = await trx
			.updateTable(CALLBACK_QUEUE_TABLE_NAME)
			.set({
				attempts: 0,
				generation: sql<number>`generation + 1`,
				last_error: null,
				lease_expires_at: null,
				lease_token: null,
				next_retry_at: now,
			})
			.where('id', '=', id)
			.where('generation', '=', record.generation)
			.where((eb) =>
				eb.or([
					eb('lease_expires_at', 'is', null),
					eb('lease_expires_at', '<=', now),
				])
			)
			.returningAll()
			.executeTakeFirst();
		if (result === undefined) {
			return { error: 'sso-callback-queue-busy', status: 'error' };
		}
		await writeAuditLog?.(trx, now, result);

		return { callback: result, status: 'ok' };
	});
}

export async function discardSsoCallbackQueueRecord(
	id: TSsoCallbackQueue['id'],
	now = Date.now(),
	writeAuditLog?: (
		trx: Transaction<TDatabase>,
		now: number,
		callback: TSsoCallbackQueue
	) => Promise<void>
): Promise<TSsoCallbackQueueMutationResult> {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		const record =
			(await trx
				.selectFrom(CALLBACK_QUEUE_TABLE_NAME)
				.selectAll()
				.where('id', '=', id)
				.executeTakeFirst()) ?? null;
		if (record === null) {
			return { error: 'sso-callback-queue-not-found', status: 'error' };
		}
		if (isCallbackQueueBusy(record, now)) {
			return { error: 'sso-callback-queue-busy', status: 'error' };
		}

		const result = await trx
			.deleteFrom(CALLBACK_QUEUE_TABLE_NAME)
			.where('id', '=', id)
			.where('generation', '=', record.generation)
			.where((eb) =>
				eb.or([
					eb('lease_expires_at', 'is', null),
					eb('lease_expires_at', '<=', now),
				])
			)
			.executeTakeFirst();
		if (result.numDeletedRows !== 1n) {
			return { error: 'sso-callback-queue-busy', status: 'error' };
		}
		await writeAuditLog?.(trx, now, record);

		return { callback: record, status: 'ok' };
	});
}

export async function enqueueSsoCallbacksForUserEventInTransaction(
	trx: Transaction<TDatabase>,
	userId: TUser['id'],
	event: TSsoCallbackEvent,
	timestamp: number,
	metadata: ISsoCallbackMetadataInput = {}
) {
	const clients = await trx
		.selectFrom(GRANT_TABLE_NAME)
		.innerJoin(
			CLIENT_TABLE_NAME,
			`${GRANT_TABLE_NAME}.client_id`,
			`${CLIENT_TABLE_NAME}.id`
		)
		.select([`${CLIENT_TABLE_NAME}.id as id`])
		.where(`${GRANT_TABLE_NAME}.user_id`, '=', userId)
		.where(`${CLIENT_TABLE_NAME}.deleted_at`, 'is', null)
		.where(`${CLIENT_TABLE_NAME}.disabled_at`, 'is', null)
		.where(`${CLIENT_TABLE_NAME}.status_callback_url`, 'is not', null)
		.execute();

	if (clients.length === 0) {
		return;
	}

	await trx
		.insertInto(CALLBACK_QUEUE_TABLE_NAME)
		.values(
			clients.map((client) =>
				createSsoCallbackQueueRecord(
					client.id,
					userId,
					event,
					timestamp,
					metadata
				)
			)
		)
		.onConflict((oc) =>
			oc
				.columns(['client_id', 'user_id', 'event'])
				.where('user_id', 'is not', null)
				.doUpdateSet(createCallbackQueueUpdate(timestamp, metadata))
		)
		.execute();
}
