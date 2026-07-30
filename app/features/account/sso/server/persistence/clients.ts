import { type Transaction, sql } from 'kysely';

import { getAccountDatabase } from '@/features/account/server/persistence/database';
import { createSsoClientSecret } from '@/features/account/sso/server/crypto';

import { normalizeDatabaseCount } from '@/infrastructure/database/queryValues';
import type {
	TDatabase,
	TSsoCallbackEvent,
	TSsoClient,
	TSsoClientNew,
	TSsoClientUpdate,
} from '@/infrastructure/database/schema';
import { escapeSqliteLikePattern } from '@/infrastructure/database/sqlite/queryValues';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';

import {
	type ISsoCallbackMetadataInput,
	SSO_CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT,
	enqueueSsoClientCallbackInTransaction,
} from './callbackQueue';
import { syncSsoClientSecretRecords } from './clientSecrets';
import {
	type ISsoGrantActorInput,
	type ISsoGrantListOptions,
	createSsoGrantEventRecord,
} from './grants';
import { revokeUnusedSsoTicketsForClientInTransaction } from './tickets';

const CLIENT_TABLE_NAME = TABLE_NAME_MAP.ssoClient;

const CLIENT_SECRET_TABLE_NAME = TABLE_NAME_MAP.ssoClientSecret;

const CALLBACK_QUEUE_TABLE_NAME = TABLE_NAME_MAP.ssoCallbackQueue;

const GRANT_TABLE_NAME = TABLE_NAME_MAP.ssoUserClientGrant;

const GRANT_EVENT_TABLE_NAME = TABLE_NAME_MAP.ssoGrantEvent;

const TICKET_TABLE_NAME = TABLE_NAME_MAP.ssoTicket;

export interface ISsoClientInput {
	cancel_redirect_uri: string | null;
	custom_scheme_redirect_uris: string[];
	disabled_at: number | null;
	https_redirect_uris: string[];
	id: string;
	loopback_redirect_paths: string[];
	name: string;
	secret_hashes: string[];
	status_callback_url: string | null;
}

export interface ISsoClientCreateInput extends Omit<
	ISsoClientInput,
	'disabled_at' | 'secret_hashes'
> {}

export interface ISsoClientConfigUpdateInput extends Omit<
	ISsoClientInput,
	'secret_hashes'
> {}

export interface ISsoClientConfigUpdateWithCallbackInput extends ISsoClientConfigUpdateInput {
	callback?: {
		event: TSsoCallbackEvent;
		metadata?: ISsoCallbackMetadataInput;
		timestamp: number;
	};
}

export type TSsoAdminClientCallbackFilter = 'configured' | 'missing';

export interface IAdminSsoClientSummaryListOptions extends ISsoGrantListOptions {
	callback?: TSsoAdminClientCallbackFilter;
	hasGrants?: boolean;
	status?: TSsoAdminClientStatusFilter;
}

export interface ISsoClientCreateResult {
	client: TSsoClient;
	client_secret: string;
}

export type TSsoAdminClientStatusFilter = 'active' | 'disabled';

export interface IAdminSsoClientSummaryRecord extends TSsoClient {
	active_secret_count: number;
	failed_callback_count: number;
	grant_count: number;
	last_secret_used_at: number | null;
	pending_callback_count: number;
	pending_ticket_count: number;
}

export interface IAdminSsoClientSummaryMetrics {
	active_client_count: number;
	active_grant_count: number;
	disabled_client_count: number;
	failed_callback_count: number;
	pending_callback_count: number;
	pending_ticket_count: number;
}

export interface IListAdminSsoClientSummariesResult {
	clients: IAdminSsoClientSummaryRecord[];
	metrics: IAdminSsoClientSummaryMetrics;
	totalCount: number;
}

export interface ISsoClientDeleteResult {
	revokedGrantCount: number;
	revokedTicketCount: number;
}

export interface ISsoClientDeleteOptions {
	actor?: ISsoGrantActorInput;
}

function serializeStringArray(value: string[]) {
	return JSON.stringify(value);
}

function normalizeNullableTotalCount(value: number | string | bigint | null) {
	return value === null
		? 0
		: normalizeDatabaseCount(value, 'invalid-sso-grant-count');
}

function createSsoClientRecord(
	input: ISsoClientInput,
	now: number
): TSsoClientNew {
	return {
		cancel_redirect_uri: input.cancel_redirect_uri,
		created_at: now,
		custom_scheme_redirect_uris: serializeStringArray(
			input.custom_scheme_redirect_uris
		),
		disabled_at: input.disabled_at,
		https_redirect_uris: serializeStringArray(input.https_redirect_uris),
		id: input.id,
		loopback_redirect_paths: serializeStringArray(
			input.loopback_redirect_paths
		),
		name: input.name,
		secret_hashes: serializeStringArray(input.secret_hashes),
		status_callback_url: input.status_callback_url,
		updated_at: now,
	};
}

function parseAdminSsoClientSummaryRecord(
	record: Omit<
		IAdminSsoClientSummaryRecord,
		| 'active_secret_count'
		| 'failed_callback_count'
		| 'grant_count'
		| 'pending_callback_count'
		| 'pending_ticket_count'
	> & {
		active_secret_count: number | string | bigint | null;
		failed_callback_count: number | string | bigint | null;
		grant_count: number | string | bigint | null;
		pending_callback_count: number | string | bigint | null;
		pending_ticket_count: number | string | bigint | null;
	}
): IAdminSsoClientSummaryRecord {
	return {
		...record,
		active_secret_count: normalizeNullableTotalCount(
			record.active_secret_count
		),
		failed_callback_count: normalizeNullableTotalCount(
			record.failed_callback_count
		),
		grant_count: normalizeNullableTotalCount(record.grant_count),
		pending_callback_count: normalizeNullableTotalCount(
			record.pending_callback_count
		),
		pending_ticket_count: normalizeNullableTotalCount(
			record.pending_ticket_count
		),
	};
}

function createSsoClientConfigUpdate(
	input: ISsoClientConfigUpdateInput,
	now: number
) {
	return {
		cancel_redirect_uri: input.cancel_redirect_uri,
		custom_scheme_redirect_uris: serializeStringArray(
			input.custom_scheme_redirect_uris
		),
		disabled_at: input.disabled_at,
		https_redirect_uris: serializeStringArray(input.https_redirect_uris),
		loopback_redirect_paths: serializeStringArray(
			input.loopback_redirect_paths
		),
		name: input.name,
		status_callback_url: input.status_callback_url,
		updated_at: now,
	} satisfies TSsoClientUpdate;
}

export async function createSsoClient(
	input: ISsoClientCreateInput,
	writeAuditLog?: (
		trx: Transaction<TDatabase>,
		now: number,
		result: ISsoClientCreateResult
	) => Promise<void>
): Promise<ISsoClientCreateResult> {
	const db = await getAccountDatabase();
	const now = Date.now();
	const secret = createSsoClientSecret();
	const record = createSsoClientRecord(
		{ ...input, disabled_at: null, secret_hashes: [secret.secret_hash] },
		now
	);

	return db.transaction().execute(async (trx) => {
		const createdClient = await trx
			.insertInto(CLIENT_TABLE_NAME)
			.values(record)
			.returningAll()
			.executeTakeFirstOrThrow();

		await syncSsoClientSecretRecords(
			trx,
			createdClient.id,
			[secret.secret_hash],
			now
		);

		const result = {
			client: createdClient,
			client_secret: secret.client_secret,
		};
		await writeAuditLog?.(trx, now, result);

		return result;
	});
}

export async function updateSsoClientConfig(
	input: ISsoClientConfigUpdateInput,
	writeAuditLog?: (
		trx: Transaction<TDatabase>,
		now: number,
		client: TSsoClient
	) => Promise<void>
) {
	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
		const client = await trx
			.updateTable(CLIENT_TABLE_NAME)
			.set(createSsoClientConfigUpdate(input, now))
			.where('id', '=', input.id)
			.where('deleted_at', 'is', null)
			.returningAll()
			.executeTakeFirst();
		if (client === undefined) {
			return null;
		}

		await writeAuditLog?.(trx, now, client);

		return client;
	});
}

export async function updateSsoClientConfigWithCallback(
	input: ISsoClientConfigUpdateWithCallbackInput,
	writeAuditLog?: (
		trx: Transaction<TDatabase>,
		now: number,
		client: TSsoClient
	) => Promise<void>
) {
	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
		const client = await trx
			.updateTable(CLIENT_TABLE_NAME)
			.set(createSsoClientConfigUpdate(input, now))
			.where('id', '=', input.id)
			.where('deleted_at', 'is', null)
			.returningAll()
			.executeTakeFirst();
		if (client === undefined) {
			return null;
		}

		if (input.callback?.event === 'client_disabled') {
			await revokeUnusedSsoTicketsForClientInTransaction(
				trx,
				client.id,
				'client-disabled',
				input.callback.timestamp
			);
		}

		if (input.callback !== undefined) {
			await enqueueSsoClientCallbackInTransaction(
				trx,
				client.id,
				input.callback.event,
				input.callback.timestamp,
				input.callback.metadata
			);
		}
		await writeAuditLog?.(trx, now, client);

		return client;
	});
}

export async function deleteSsoClient(
	id: TSsoClient['id'],
	options: ISsoClientDeleteOptions = {},
	writeAuditLog?: (
		trx: Transaction<TDatabase>,
		now: number,
		result: ISsoClientDeleteResult
	) => Promise<void>
): Promise<ISsoClientDeleteResult | null> {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		const now = Date.now();
		const actor =
			options.actor ??
			({
				actorId: null,
				actorType: 'admin',
				reason: 'admin-delete-client',
			} satisfies ISsoGrantActorInput);
		const result = await trx
			.updateTable(CLIENT_TABLE_NAME)
			.set({
				deleted_at: now,
				deleted_by_admin:
					actor.actorType === 'admin' ? actor.actorId : null,
				updated_at: now,
			})
			.where('id', '=', id)
			.where('deleted_at', 'is', null)
			.executeTakeFirst();

		if (result.numUpdatedRows !== 1n) {
			return null;
		}

		const deletedGrants = await trx
			.deleteFrom(GRANT_TABLE_NAME)
			.returning(['client_id', 'user_id'])
			.where('client_id', '=', id)
			.execute();
		const revokedTicketCount =
			await revokeUnusedSsoTicketsForClientInTransaction(
				trx,
				id,
				'client-deleted',
				now
			);
		for (const grant of deletedGrants) {
			await trx
				.insertInto(GRANT_EVENT_TABLE_NAME)
				.values(
					createSsoGrantEventRecord(
						grant.client_id,
						grant.user_id,
						'client_deleted',
						actor,
						now
					)
				)
				.execute();
		}

		await enqueueSsoClientCallbackInTransaction(
			trx,
			id,
			'client_deleted',
			now,
			{ reason: actor.reason ?? 'admin-delete-client' }
		);

		const deleteResult = {
			revokedGrantCount: deletedGrants.length,
			revokedTicketCount,
		};
		await writeAuditLog?.(trx, now, deleteResult);

		return deleteResult;
	});
}

export async function listAdminSsoClientSummaries({
	callback,
	hasGrants,
	limit,
	offset,
	query: searchQuery,
	status,
}: IAdminSsoClientSummaryListOptions): Promise<IListAdminSsoClientSummariesResult> {
	const db = await getAccountDatabase();
	const normalizedSearchQuery = searchQuery?.trim().toLowerCase();
	let clientsQuery = db
		.selectFrom(CLIENT_TABLE_NAME)
		.selectAll(CLIENT_TABLE_NAME)
		.select((eb) => [
			eb
				.selectFrom(GRANT_TABLE_NAME)
				.select((subEb) => subEb.fn.countAll<number>().as('count'))
				.whereRef(
					`${GRANT_TABLE_NAME}.client_id`,
					'=',
					`${CLIENT_TABLE_NAME}.id`
				)
				.as('grant_count'),
			eb
				.selectFrom(CALLBACK_QUEUE_TABLE_NAME)
				.select((subEb) => subEb.fn.countAll<number>().as('count'))
				.whereRef(
					`${CALLBACK_QUEUE_TABLE_NAME}.client_id`,
					'=',
					`${CLIENT_TABLE_NAME}.id`
				)
				.where('attempts', '=', 0)
				.as('pending_callback_count'),
			eb
				.selectFrom(CALLBACK_QUEUE_TABLE_NAME)
				.select((subEb) => subEb.fn.countAll<number>().as('count'))
				.whereRef(
					`${CALLBACK_QUEUE_TABLE_NAME}.client_id`,
					'=',
					`${CLIENT_TABLE_NAME}.id`
				)
				.where(
					'next_retry_at',
					'=',
					SSO_CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT
				)
				.as('failed_callback_count'),
			eb
				.selectFrom(TICKET_TABLE_NAME)
				.select((subEb) => subEb.fn.countAll<number>().as('count'))
				.whereRef(
					`${TICKET_TABLE_NAME}.client_id`,
					'=',
					`${CLIENT_TABLE_NAME}.id`
				)
				.where('used_at', 'is', null)
				.where('revoked_at', 'is', null)
				.where('expires_at', '>', Date.now())
				.as('pending_ticket_count'),
			eb
				.selectFrom(CLIENT_SECRET_TABLE_NAME)
				.select((subEb) => subEb.fn.countAll<number>().as('count'))
				.whereRef(
					`${CLIENT_SECRET_TABLE_NAME}.client_id`,
					'=',
					`${CLIENT_TABLE_NAME}.id`
				)
				.where('disabled_at', 'is', null)
				.where('revoked_at', 'is', null)
				.as('active_secret_count'),
			eb
				.selectFrom(CLIENT_SECRET_TABLE_NAME)
				.select((subEb) =>
					subEb.fn.max('last_used_at').as('last_used_at')
				)
				.whereRef(
					`${CLIENT_SECRET_TABLE_NAME}.client_id`,
					'=',
					`${CLIENT_TABLE_NAME}.id`
				)
				.as('last_secret_used_at'),
		])
		.where(`${CLIENT_TABLE_NAME}.deleted_at`, 'is', null);
	let totalCountQuery = db
		.selectFrom(CLIENT_TABLE_NAME)
		.select((eb) => eb.fn.countAll<number>().as('total_count'))
		.where(`${CLIENT_TABLE_NAME}.deleted_at`, 'is', null);

	if (status === 'active') {
		clientsQuery = clientsQuery.where(
			`${CLIENT_TABLE_NAME}.disabled_at`,
			'is',
			null
		);
		totalCountQuery = totalCountQuery.where(
			`${CLIENT_TABLE_NAME}.disabled_at`,
			'is',
			null
		);
	} else if (status === 'disabled') {
		clientsQuery = clientsQuery.where(
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
	if (callback === 'configured') {
		clientsQuery = clientsQuery.where(
			`${CLIENT_TABLE_NAME}.status_callback_url`,
			'is not',
			null
		);
		totalCountQuery = totalCountQuery.where(
			`${CLIENT_TABLE_NAME}.status_callback_url`,
			'is not',
			null
		);
	} else if (callback === 'missing') {
		clientsQuery = clientsQuery.where(
			`${CLIENT_TABLE_NAME}.status_callback_url`,
			'is',
			null
		);
		totalCountQuery = totalCountQuery.where(
			`${CLIENT_TABLE_NAME}.status_callback_url`,
			'is',
			null
		);
	}
	if (hasGrants !== undefined) {
		const grantExists = (clientIdRef: string) => sql<boolean>`exists (
			select 1 from ${sql.raw(GRANT_TABLE_NAME)}
			where ${sql.ref(`${GRANT_TABLE_NAME}.client_id`)} = ${sql.ref(clientIdRef)}
		)`;
		clientsQuery = clientsQuery.where((eb) =>
			hasGrants
				? eb(grantExists(`${CLIENT_TABLE_NAME}.id`), '=', true)
				: eb.not(grantExists(`${CLIENT_TABLE_NAME}.id`))
		);
		totalCountQuery = totalCountQuery.where((eb) =>
			hasGrants
				? eb(grantExists(`${CLIENT_TABLE_NAME}.id`), '=', true)
				: eb.not(grantExists(`${CLIENT_TABLE_NAME}.id`))
		);
	}
	if (normalizedSearchQuery !== undefined && normalizedSearchQuery !== '') {
		const likePattern = `%${escapeSqliteLikePattern(normalizedSearchQuery)}%`;
		clientsQuery = clientsQuery.where((eb) =>
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

	const [clients, totalCountRecord, metricsRecord] = await Promise.all([
		clientsQuery
			.orderBy(`${CLIENT_TABLE_NAME}.updated_at`, 'desc')
			.orderBy(`${CLIENT_TABLE_NAME}.id`, 'asc')
			.limit(limit)
			.offset(offset)
			.execute(),
		totalCountQuery.executeTakeFirstOrThrow(),
		db
			.selectFrom(CLIENT_TABLE_NAME)
			.select((eb) => [
				eb.fn
					.count<number>(
						sql`case when ${sql.ref(`${CLIENT_TABLE_NAME}.disabled_at`)} is null then 1 end`
					)
					.as('active_client_count'),
				eb.fn
					.count<number>(
						sql`case when ${sql.ref(`${CLIENT_TABLE_NAME}.disabled_at`)} is not null then 1 end`
					)
					.as('disabled_client_count'),
				eb
					.selectFrom(GRANT_TABLE_NAME)
					.select((subEb) => subEb.fn.countAll<number>().as('count'))
					.where((subEb) =>
						subEb.exists(
							subEb
								.selectFrom(CLIENT_TABLE_NAME)
								.select('id')
								.whereRef(
									`${CLIENT_TABLE_NAME}.id`,
									'=',
									`${GRANT_TABLE_NAME}.client_id`
								)
								.where('deleted_at', 'is', null)
						)
					)
					.as('active_grant_count'),
				eb
					.selectFrom(CALLBACK_QUEUE_TABLE_NAME)
					.select((subEb) => subEb.fn.countAll<number>().as('count'))
					.where('attempts', '=', 0)
					.as('pending_callback_count'),
				eb
					.selectFrom(CALLBACK_QUEUE_TABLE_NAME)
					.select((subEb) => subEb.fn.countAll<number>().as('count'))
					.where(
						'next_retry_at',
						'=',
						SSO_CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT
					)
					.as('failed_callback_count'),
				eb
					.selectFrom(TICKET_TABLE_NAME)
					.select((subEb) => subEb.fn.countAll<number>().as('count'))
					.where('used_at', 'is', null)
					.where('revoked_at', 'is', null)
					.where('expires_at', '>', Date.now())
					.as('pending_ticket_count'),
			])
			.where(`${CLIENT_TABLE_NAME}.deleted_at`, 'is', null)
			.executeTakeFirstOrThrow(),
	]);

	return {
		clients: clients.map(parseAdminSsoClientSummaryRecord),
		metrics: {
			active_client_count: normalizeNullableTotalCount(
				metricsRecord.active_client_count
			),
			active_grant_count: normalizeNullableTotalCount(
				metricsRecord.active_grant_count
			),
			disabled_client_count: normalizeNullableTotalCount(
				metricsRecord.disabled_client_count
			),
			failed_callback_count: normalizeNullableTotalCount(
				metricsRecord.failed_callback_count
			),
			pending_callback_count: normalizeNullableTotalCount(
				metricsRecord.pending_callback_count
			),
			pending_ticket_count: normalizeNullableTotalCount(
				metricsRecord.pending_ticket_count
			),
		},
		totalCount: normalizeDatabaseCount(
			totalCountRecord.total_count,
			'invalid-sso-grant-count'
		),
	};
}
