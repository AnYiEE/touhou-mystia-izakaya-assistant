import { type Transaction, sql } from 'kysely';
import { createHash } from 'node:crypto';

import { getAccountDatabase } from '@/lib/account/server/db';
import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TDatabase,
	TSsoCallbackDelivery,
	TSsoCallbackDeliveryNew,
	TSsoCallbackDeliveryStatus,
	TSsoCallbackEvent,
	TSsoCallbackQueue,
} from '@/lib/db/types';

const CALLBACK_DELIVERY_TABLE_NAME = TABLE_NAME_MAP.ssoCallbackDelivery;

export interface ISsoCallbackDeliveryAttemptInput {
	attempt: number;
	durationMs: number | null;
	error: string | null;
	httpStatus: number | null;
	status: TSsoCallbackDeliveryStatus;
}

export interface ISsoCallbackDeliveryListOptions {
	clientId?: string;
	endTime?: number;
	event?: TSsoCallbackEvent;
	limit: number;
	offset: number;
	query?: string;
	startTime?: number;
	status?: TSsoCallbackDeliveryStatus;
	userId?: string;
}

export interface IListSsoCallbackDeliveriesResult {
	deliveries: TSsoCallbackDelivery[];
	totalCount: number;
}

export interface ISsoCallbackDeliveryCleanupOptions {
	before?: number;
	maxRows?: number;
}

export interface ISsoCallbackDeliveryCleanupResult {
	deletedByAge: number;
	deletedByCap: number;
}

function createQueueKey(
	record: Pick<
		TSsoCallbackQueue,
		'client_id' | 'event' | 'timestamp' | 'user_id'
	>
) {
	const userKey = record.user_id ?? '<client>';

	return createHash('sha256')
		.update(
			[
				record.client_id,
				userKey,
				record.event,
				String(record.timestamp),
			].join('\0')
		)
		.digest('hex')
		.slice(0, 32);
}

function normalizeError(value: string | null) {
	return value === null ? null : value.slice(0, 160);
}

function normalizeTotalCount(value: number | string | bigint) {
	const totalCount = Number(value);

	if (!Number.isSafeInteger(totalCount) || totalCount < 0) {
		throw new Error('invalid-sso-callback-delivery-count');
	}

	return totalCount;
}

function escapeLikePattern(pattern: string) {
	return pattern.replaceAll(/[\\%_]/gu, (character) => `\\${character}`);
}

function createDeliveryRecord(
	queueRecord: Pick<
		TSsoCallbackQueue,
		'client_id' | 'event' | 'metadata_json' | 'timestamp' | 'user_id'
	>,
	input: ISsoCallbackDeliveryAttemptInput,
	now: number
): TSsoCallbackDeliveryNew {
	return {
		attempt: input.attempt,
		client_id: queueRecord.client_id,
		created_at: now,
		duration_ms: input.durationMs,
		error: normalizeError(input.error),
		event: queueRecord.event,
		http_status: input.httpStatus,
		metadata_json: queueRecord.metadata_json,
		queue_key: createQueueKey(queueRecord),
		status: input.status,
		user_id: queueRecord.user_id,
	};
}

export async function writeSsoCallbackDelivery(
	queueRecord: Pick<
		TSsoCallbackQueue,
		'client_id' | 'event' | 'metadata_json' | 'timestamp' | 'user_id'
	>,
	input: ISsoCallbackDeliveryAttemptInput,
	now = Date.now()
) {
	const db = await getAccountDatabase();

	await db
		.insertInto(CALLBACK_DELIVERY_TABLE_NAME)
		.values(createDeliveryRecord(queueRecord, input, now))
		.execute();
}

export async function listSsoCallbackDeliveries({
	clientId,
	endTime,
	event,
	limit,
	offset,
	query: searchQuery,
	startTime,
	status,
	userId,
}: ISsoCallbackDeliveryListOptions): Promise<IListSsoCallbackDeliveriesResult> {
	const db = await getAccountDatabase();
	const normalizedSearchQuery = searchQuery?.trim().toLowerCase();
	let deliveriesQuery = db
		.selectFrom(CALLBACK_DELIVERY_TABLE_NAME)
		.selectAll();
	let totalCountQuery = db
		.selectFrom(CALLBACK_DELIVERY_TABLE_NAME)
		.select((eb) => eb.fn.countAll<number>().as('total_count'));

	if (clientId !== undefined) {
		deliveriesQuery = deliveriesQuery.where('client_id', '=', clientId);
		totalCountQuery = totalCountQuery.where('client_id', '=', clientId);
	}
	if (userId !== undefined) {
		deliveriesQuery = deliveriesQuery.where('user_id', '=', userId);
		totalCountQuery = totalCountQuery.where('user_id', '=', userId);
	}
	if (event !== undefined) {
		deliveriesQuery = deliveriesQuery.where('event', '=', event);
		totalCountQuery = totalCountQuery.where('event', '=', event);
	}
	if (status !== undefined) {
		deliveriesQuery = deliveriesQuery.where('status', '=', status);
		totalCountQuery = totalCountQuery.where('status', '=', status);
	}
	if (startTime !== undefined) {
		deliveriesQuery = deliveriesQuery.where('created_at', '>=', startTime);
		totalCountQuery = totalCountQuery.where('created_at', '>=', startTime);
	}
	if (endTime !== undefined) {
		deliveriesQuery = deliveriesQuery.where('created_at', '<=', endTime);
		totalCountQuery = totalCountQuery.where('created_at', '<=', endTime);
	}
	if (normalizedSearchQuery !== undefined && normalizedSearchQuery !== '') {
		const likePattern = `%${escapeLikePattern(normalizedSearchQuery)}%`;
		deliveriesQuery = deliveriesQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref('id')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('client_id')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('user_id')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('event')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('error')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('queue_key')} like ${likePattern} escape '\\'`,
			])
		);
		totalCountQuery = totalCountQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref('id')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('client_id')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('user_id')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('event')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('error')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('queue_key')} like ${likePattern} escape '\\'`,
			])
		);
	}

	const [deliveries, totalCountRecord] = await Promise.all([
		deliveriesQuery
			.orderBy('created_at', 'desc')
			.orderBy('id', 'desc')
			.limit(limit)
			.offset(offset)
			.execute(),
		totalCountQuery.executeTakeFirstOrThrow(),
	]);

	return {
		deliveries,
		totalCount: normalizeTotalCount(totalCountRecord.total_count),
	};
}

export async function countCleanableSsoCallbackDeliveries({
	before,
	maxRows,
}: ISsoCallbackDeliveryCleanupOptions) {
	const db = await getAccountDatabase();
	const totalCountRecord = await db
		.selectFrom(CALLBACK_DELIVERY_TABLE_NAME)
		.select((eb) => eb.fn.countAll<number>().as('total_count'))
		.executeTakeFirstOrThrow();
	const totalCount = normalizeTotalCount(totalCountRecord.total_count);
	const deletedByAge =
		before === undefined
			? 0
			: await db
					.selectFrom(CALLBACK_DELIVERY_TABLE_NAME)
					.select((eb) => eb.fn.countAll<number>().as('total_count'))
					.where('created_at', '<', before)
					.executeTakeFirstOrThrow()
					.then((record) => normalizeTotalCount(record.total_count));
	const remainingCount = Math.max(0, totalCount - deletedByAge);
	const deletedByCap =
		maxRows === undefined ? 0 : Math.max(0, remainingCount - maxRows);

	return deletedByAge + deletedByCap;
}

export async function cleanupSsoCallbackDeliveries(
	{ before, maxRows }: ISsoCallbackDeliveryCleanupOptions,
	writeAuditLog?: (
		trx: Transaction<TDatabase>,
		now: number,
		result: ISsoCallbackDeliveryCleanupResult
	) => Promise<void>
): Promise<ISsoCallbackDeliveryCleanupResult> {
	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
		let deletedByAge = 0;
		let deletedByCap = 0;

		if (before !== undefined) {
			const result = await trx
				.deleteFrom(CALLBACK_DELIVERY_TABLE_NAME)
				.where('created_at', '<', before)
				.executeTakeFirst();
			deletedByAge = Number(result.numDeletedRows);
		}

		if (maxRows !== undefined && maxRows >= 0) {
			const cutoff = await trx
				.selectFrom(CALLBACK_DELIVERY_TABLE_NAME)
				.select(['created_at', 'id'])
				.orderBy('created_at', 'desc')
				.orderBy('id', 'desc')
				.offset(maxRows)
				.limit(1)
				.executeTakeFirst();

			if (cutoff !== undefined) {
				const result = await trx
					.deleteFrom(CALLBACK_DELIVERY_TABLE_NAME)
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

		const result = { deletedByAge, deletedByCap };
		await writeAuditLog?.(trx, now, result);

		return result;
	});
}
