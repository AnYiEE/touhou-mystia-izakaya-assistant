import { type Transaction, sql } from 'kysely';
import { createHash, randomBytes } from 'node:crypto';

import { getAccountDatabase } from '@/lib/account/server/db';
import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TDatabase,
	TSsoActorType,
	TSsoCallbackEvent,
	TSsoCallbackQueue,
	TSsoCallbackQueueNew,
	TSsoClient,
	TSsoClientNew,
	TSsoClientSecret,
	TSsoClientSecretNew,
	TSsoClientUpdate,
	TSsoGrantEvent,
	TSsoGrantEventNew,
	TSsoTicket,
	TUser,
} from '@/lib/db/types';
import {
	type TAdminSsoCallbackQueueStatus,
	type TAdminSsoTicketStatus,
	type TUserStatus,
} from '@/lib/account/shared/types';

const CLIENT_TABLE_NAME = TABLE_NAME_MAP.ssoClient;
const CLIENT_SECRET_TABLE_NAME = TABLE_NAME_MAP.ssoClientSecret;
const CALLBACK_QUEUE_TABLE_NAME = TABLE_NAME_MAP.ssoCallbackQueue;
const GRANT_TABLE_NAME = TABLE_NAME_MAP.ssoUserClientGrant;
const GRANT_EVENT_TABLE_NAME = TABLE_NAME_MAP.ssoGrantEvent;
const TICKET_TABLE_NAME = TABLE_NAME_MAP.ssoTicket;
const USER_TABLE_NAME = TABLE_NAME_MAP.user;

type TSsoAuditTransactionCallback = (
	trx: Transaction<TDatabase>,
	now: number
) => Promise<void>;

export const SSO_CLIENT_SECRET_BYTE_LENGTH = 32;
export const SSO_CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT = Number.MAX_SAFE_INTEGER;

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

export interface ISsoGrantListOptions {
	limit: number;
	offset: number;
	query?: string;
}

export type TSsoAdminClientStatusFilter = 'active' | 'disabled';

export interface IAdminSsoGrantListOptions extends ISsoGrantListOptions {
	clientId?: TSsoClient['id'];
	clientStatus?: TSsoAdminClientStatusFilter;
	userId?: TUser['id'];
	userStatus?: TUserStatus;
}

export interface IAdminSsoTicketListOptions extends ISsoGrantListOptions {
	clientId?: TSsoClient['id'];
	now?: number;
	status?: TAdminSsoTicketStatus;
	userId?: TUser['id'];
}

export interface IAdminSsoGrantEventListOptions extends ISsoGrantListOptions {
	actorId?: string;
	actorType?: TSsoActorType;
	clientId?: TSsoClient['id'];
	endTime?: number;
	event?: TSsoGrantEvent;
	startTime?: number;
	userId?: TUser['id'];
}

export interface IAdminSsoCallbackQueueListOptions extends ISsoGrantListOptions {
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
	username: string;
	username_normalized: string;
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
	username: string | null;
	username_normalized: string | null;
}

type TSsoGrantIdentity = Pick<IAdminSsoGrantRecord, 'client_id' | 'user_id'>;

export interface IListAdminSsoCallbackQueueResult {
	callbacks: TSsoCallbackQueue[];
	totalCount: number;
}

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

export interface IListAdminSsoTicketsResult {
	tickets: IAdminSsoTicketRecord[];
	totalCount: number;
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

export type TSsoCallbackQueueMutationError =
	| 'sso-callback-queue-busy'
	| 'sso-callback-queue-not-found';

export type TSsoCallbackQueueMutationResult =
	| { callback: TSsoCallbackQueue; status: 'ok' }
	| { error: TSsoCallbackQueueMutationError; status: 'error' };

export type TSsoClientSecretMutationError =
	| 'client-disabled'
	| 'last-active-secret'
	| 'sso-client-not-found'
	| 'sso-client-secret-not-found';

export type TSsoClientSecretMutationResult =
	| { error: TSsoClientSecretMutationError; status: 'error' }
	| { secret: TSsoClientSecret; status: 'ok' };

export type TSsoClientSecretCreateResult =
	| { error: TSsoClientSecretMutationError; status: 'error' }
	| { client_secret: string; secret: TSsoClientSecret; status: 'ok' };

export interface ISsoClientSecretUpdateInput {
	disabled?: boolean;
	label?: string | null;
}

export interface ISsoGrantActorInput {
	actorId: string | null;
	actorType: TSsoGrantEventNew['actor_type'];
	reason: string | null;
}

function createSsoClientSecretHash(secret: string) {
	return createHash('sha256').update(secret).digest('hex');
}

export function createSsoClientSecret() {
	const clientSecret = randomBytes(SSO_CLIENT_SECRET_BYTE_LENGTH).toString(
		'base64url'
	);

	return {
		client_secret: clientSecret,
		secret_hash: createSsoClientSecretHash(clientSecret),
	};
}

function serializeStringArray(value: string[]) {
	return JSON.stringify(value);
}

function escapeLikePattern(pattern: string) {
	return pattern.replaceAll(/[\\%_]/gu, (character) => `\\${character}`);
}

function normalizeTotalCount(value: number | string | bigint) {
	const totalCount = Number(value);

	if (!Number.isSafeInteger(totalCount) || totalCount < 0) {
		throw new Error('invalid-sso-grant-count');
	}

	return totalCount;
}

function normalizeNullableTotalCount(value: number | string | bigint | null) {
	return value === null ? 0 : normalizeTotalCount(value);
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

function createSsoClientSecretRecord(
	clientId: TSsoClient['id'],
	secretHash: string,
	position: number,
	now: number,
	options: { createdByAdmin?: string | null; label?: string | null } = {}
) {
	return {
		client_id: clientId,
		created_at: now,
		created_by_admin: options.createdByAdmin ?? null,
		disabled_at: null,
		id: createHash('sha256')
			.update(`${clientId}:${secretHash}`)
			.digest('hex')
			.slice(0, 32),
		label:
			options.label ??
			(position === 0 ? 'Primary secret' : `Secret #${position + 1}`),
		last_used_at: null,
		position,
		revoked_at: null,
		secret_hash: secretHash,
	} satisfies TSsoClientSecretNew;
}

async function syncSsoClientSecretRecords(
	trx: Transaction<TDatabase>,
	clientId: TSsoClient['id'],
	secretHashes: string[],
	now: number
) {
	if (secretHashes.length === 0) {
		return;
	}

	await trx
		.updateTable(CLIENT_SECRET_TABLE_NAME)
		.set({ revoked_at: now })
		.where('client_id', '=', clientId)
		.where('revoked_at', 'is', null)
		.where('secret_hash', 'not in', secretHashes)
		.execute();

	await trx
		.insertInto(CLIENT_SECRET_TABLE_NAME)
		.values(
			secretHashes.map((secretHash, index) =>
				createSsoClientSecretRecord(clientId, secretHash, index, now)
			)
		)
		.onConflict((oc) =>
			oc
				.columns(['client_id', 'secret_hash'])
				.doUpdateSet((eb) => ({
					disabled_at: null,
					position: eb.ref('excluded.position'),
					revoked_at: null,
				}))
		)
		.execute();
}

async function listActiveSsoClientSecretHashesInTransaction(
	trx: Transaction<TDatabase>,
	clientId: TSsoClient['id']
) {
	const records = await trx
		.selectFrom(CLIENT_SECRET_TABLE_NAME)
		.select('secret_hash')
		.where('client_id', '=', clientId)
		.where('disabled_at', 'is', null)
		.where('revoked_at', 'is', null)
		.orderBy('position', 'asc')
		.orderBy('created_at', 'asc')
		.orderBy('id', 'asc')
		.execute();

	return records.map((record) => record.secret_hash);
}

async function syncSsoClientLegacySecretHashesInTransaction(
	trx: Transaction<TDatabase>,
	clientId: TSsoClient['id'],
	now: number
) {
	const secretHashes = await listActiveSsoClientSecretHashesInTransaction(
		trx,
		clientId
	);

	await trx
		.updateTable(CLIENT_TABLE_NAME)
		.set({
			secret_hashes: serializeStringArray(secretHashes),
			updated_at: now,
		})
		.where('id', '=', clientId)
		.execute();

	return secretHashes;
}

async function countActiveSsoClientSecretsInTransaction(
	trx: Transaction<TDatabase>,
	clientId: TSsoClient['id']
) {
	const record = await trx
		.selectFrom(CLIENT_SECRET_TABLE_NAME)
		.select((eb) => eb.fn.countAll<number>().as('total_count'))
		.where('client_id', '=', clientId)
		.where('disabled_at', 'is', null)
		.where('revoked_at', 'is', null)
		.executeTakeFirstOrThrow();

	return normalizeTotalCount(record.total_count);
}

async function readSsoClientSecretInTransaction(
	trx: Transaction<TDatabase>,
	clientId: TSsoClient['id'],
	secretId: TSsoClientSecret['id']
) {
	return (
		(await trx
			.selectFrom(CLIENT_SECRET_TABLE_NAME)
			.selectAll()
			.where('client_id', '=', clientId)
			.where('id', '=', secretId)
			.executeTakeFirst()) ?? null
	);
}

async function readMutableSsoClientErrorInTransaction(
	trx: Transaction<TDatabase>,
	clientId: TSsoClient['id']
): Promise<TSsoClientSecretMutationError | null> {
	const client = await trx
		.selectFrom(CLIENT_TABLE_NAME)
		.select('disabled_at')
		.where('id', '=', clientId)
		.where('deleted_at', 'is', null)
		.executeTakeFirst();

	if (client === undefined) {
		return 'sso-client-not-found';
	}
	if (client.disabled_at !== null) {
		return 'client-disabled';
	}

	return null;
}

async function getNextSsoClientSecretPositionInTransaction(
	trx: Transaction<TDatabase>,
	clientId: TSsoClient['id']
) {
	const record = await trx
		.selectFrom(CLIENT_SECRET_TABLE_NAME)
		.select('position')
		.where('client_id', '=', clientId)
		.orderBy('position', 'desc')
		.limit(1)
		.executeTakeFirst();

	return record === undefined ? 0 : record.position + 1;
}

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

function createSsoGrantEventRecord(
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

async function revokeUnusedSsoTicketsForClientInTransaction(
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
		const likePattern = `%${escapeLikePattern(normalizedSearchQuery)}%`;
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
		totalCount: normalizeTotalCount(totalCountRecord.total_count),
	};
}

export async function listSsoClientSecrets(clientId: TSsoClient['id']) {
	const db = await getAccountDatabase();

	return db
		.selectFrom(CLIENT_SECRET_TABLE_NAME)
		.selectAll()
		.where('client_id', '=', clientId)
		.orderBy('position', 'asc')
		.orderBy('created_at', 'asc')
		.orderBy('id', 'asc')
		.execute();
}

export async function createSsoClientSecretForClient(
	clientId: TSsoClient['id'],
	input: { createdByAdmin?: string | null; label?: string | null } = {},
	writeAuditLog?: (
		trx: Transaction<TDatabase>,
		now: number,
		result: Extract<TSsoClientSecretCreateResult, { status: 'ok' }>
	) => Promise<void>
): Promise<TSsoClientSecretCreateResult> {
	const db = await getAccountDatabase();
	const now = Date.now();
	const secret = createSsoClientSecret();

	return db.transaction().execute(async (trx) => {
		const clientError = await readMutableSsoClientErrorInTransaction(
			trx,
			clientId
		);
		if (clientError !== null) {
			return { error: clientError, status: 'error' };
		}

		const position = await getNextSsoClientSecretPositionInTransaction(
			trx,
			clientId
		);
		const record = createSsoClientSecretRecord(
			clientId,
			secret.secret_hash,
			position,
			now,
			input
		);
		const createdSecret = await trx
			.insertInto(CLIENT_SECRET_TABLE_NAME)
			.values(record)
			.returningAll()
			.executeTakeFirstOrThrow();

		await syncSsoClientLegacySecretHashesInTransaction(trx, clientId, now);
		await enqueueSsoClientCallbackInTransaction(
			trx,
			clientId,
			'secret_rotated',
			now,
			{ action: 'created', secret_id: createdSecret.id }
		);

		const result = {
			client_secret: secret.client_secret,
			secret: createdSecret,
			status: 'ok' as const,
		};
		await writeAuditLog?.(trx, now, result);

		return result;
	});
}

export async function renameSsoClientSecret(
	clientId: TSsoClient['id'],
	secretId: TSsoClientSecret['id'],
	label: string | null
): Promise<TSsoClientSecretMutationResult> {
	const db = await getAccountDatabase();
	const secret = await db
		.updateTable(CLIENT_SECRET_TABLE_NAME)
		.set({ label })
		.where('client_id', '=', clientId)
		.where('id', '=', secretId)
		.returningAll()
		.executeTakeFirst();

	return secret === undefined
		? { error: 'sso-client-secret-not-found', status: 'error' }
		: { secret, status: 'ok' };
}

export async function setSsoClientSecretDisabled(
	clientId: TSsoClient['id'],
	secretId: TSsoClientSecret['id'],
	disabled: boolean
): Promise<TSsoClientSecretMutationResult> {
	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
		const clientError = await readMutableSsoClientErrorInTransaction(
			trx,
			clientId
		);
		if (clientError !== null) {
			return { error: clientError, status: 'error' };
		}

		const currentSecret = await readSsoClientSecretInTransaction(
			trx,
			clientId,
			secretId
		);
		if (currentSecret?.revoked_at !== null) {
			return { error: 'sso-client-secret-not-found', status: 'error' };
		}

		if (disabled && currentSecret.disabled_at === null) {
			const activeCount = await countActiveSsoClientSecretsInTransaction(
				trx,
				clientId
			);
			if (activeCount <= 1) {
				return { error: 'last-active-secret', status: 'error' };
			}
		}

		const secret = await trx
			.updateTable(CLIENT_SECRET_TABLE_NAME)
			.set({
				disabled_at: disabled
					? (currentSecret.disabled_at ?? now)
					: null,
			})
			.where('client_id', '=', clientId)
			.where('id', '=', secretId)
			.where('revoked_at', 'is', null)
			.returningAll()
			.executeTakeFirstOrThrow();

		await syncSsoClientLegacySecretHashesInTransaction(trx, clientId, now);
		if (
			(disabled && currentSecret.disabled_at === null) ||
			(!disabled && currentSecret.disabled_at !== null)
		) {
			await enqueueSsoClientCallbackInTransaction(
				trx,
				clientId,
				'secret_rotated',
				now,
				{
					action: disabled ? 'disabled' : 'enabled',
					secret_id: secret.id,
				}
			);
		}

		return { secret, status: 'ok' };
	});
}

export async function updateSsoClientSecret(
	clientId: TSsoClient['id'],
	secretId: TSsoClientSecret['id'],
	input: ISsoClientSecretUpdateInput,
	writeAuditLog?: (
		trx: Transaction<TDatabase>,
		now: number,
		secret: TSsoClientSecret
	) => Promise<void>
): Promise<TSsoClientSecretMutationResult> {
	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
		const clientError = await readMutableSsoClientErrorInTransaction(
			trx,
			clientId
		);
		if (clientError !== null) {
			return { error: clientError, status: 'error' };
		}

		const currentSecret = await readSsoClientSecretInTransaction(
			trx,
			clientId,
			secretId
		);
		if (currentSecret?.revoked_at !== null) {
			return { error: 'sso-client-secret-not-found', status: 'error' };
		}

		if (
			input.disabled === true &&
			currentSecret.disabled_at === null &&
			(await countActiveSsoClientSecretsInTransaction(trx, clientId)) <= 1
		) {
			return { error: 'last-active-secret', status: 'error' };
		}

		const nextDisabledAt =
			input.disabled === undefined
				? currentSecret.disabled_at
				: input.disabled
					? (currentSecret.disabled_at ?? now)
					: null;
		const secret = await trx
			.updateTable(CLIENT_SECRET_TABLE_NAME)
			.set({
				...(input.label === undefined ? {} : { label: input.label }),
				disabled_at: nextDisabledAt,
			})
			.where('client_id', '=', clientId)
			.where('id', '=', secretId)
			.where('revoked_at', 'is', null)
			.returningAll()
			.executeTakeFirstOrThrow();

		await syncSsoClientLegacySecretHashesInTransaction(trx, clientId, now);
		if (
			input.disabled !== undefined &&
			currentSecret.disabled_at !== nextDisabledAt
		) {
			await enqueueSsoClientCallbackInTransaction(
				trx,
				clientId,
				'secret_rotated',
				now,
				{
					action: input.disabled ? 'disabled' : 'enabled',
					secret_id: secret.id,
				}
			);
		}

		await writeAuditLog?.(trx, now, secret);

		return { secret, status: 'ok' };
	});
}

export async function revokeSsoClientSecret(
	clientId: TSsoClient['id'],
	secretId: TSsoClientSecret['id'],
	writeAuditLog?: (
		trx: Transaction<TDatabase>,
		now: number,
		secret: TSsoClientSecret
	) => Promise<void>
): Promise<TSsoClientSecretMutationResult> {
	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
		const clientError = await readMutableSsoClientErrorInTransaction(
			trx,
			clientId
		);
		if (clientError !== null) {
			return { error: clientError, status: 'error' };
		}

		const currentSecret = await readSsoClientSecretInTransaction(
			trx,
			clientId,
			secretId
		);
		if (currentSecret?.revoked_at !== null) {
			return { error: 'sso-client-secret-not-found', status: 'error' };
		}

		if (currentSecret.disabled_at === null) {
			const activeCount = await countActiveSsoClientSecretsInTransaction(
				trx,
				clientId
			);
			if (activeCount <= 1) {
				return { error: 'last-active-secret', status: 'error' };
			}
		}

		const secret = await trx
			.updateTable(CLIENT_SECRET_TABLE_NAME)
			.set({ revoked_at: now })
			.where('client_id', '=', clientId)
			.where('id', '=', secretId)
			.where('revoked_at', 'is', null)
			.returningAll()
			.executeTakeFirstOrThrow();

		await syncSsoClientLegacySecretHashesInTransaction(trx, clientId, now);
		await enqueueSsoClientCallbackInTransaction(
			trx,
			clientId,
			'secret_rotated',
			now,
			{ action: 'revoked', secret_id: secret.id }
		);

		await writeAuditLog?.(trx, now, secret);

		return { secret, status: 'ok' };
	});
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
		const likePattern = `%${escapeLikePattern(normalizedSearchQuery)}%`;
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
		totalCount: normalizeTotalCount(totalCountRecord.total_count),
	};
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
		const likePattern = `%${escapeLikePattern(normalizedSearchQuery)}%`;
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
		totalCount: normalizeTotalCount(totalCountRecord.total_count),
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
		const likePattern = `%${escapeLikePattern(normalizedSearchQuery)}%`;
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
		totalCount: normalizeTotalCount(totalCountRecord.total_count),
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
		const likePattern = `%${escapeLikePattern(normalizedSearchQuery)}%`;
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
		totalCount: normalizeTotalCount(totalCountRecord.total_count),
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
		const likePattern = `%${escapeLikePattern(normalizedSearchQuery)}%`;
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
		totalCount: normalizeTotalCount(totalCountRecord.total_count),
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
		const likePattern = `%${escapeLikePattern(normalizedSearchQuery)}%`;
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
		totalCount: normalizeTotalCount(totalCountRecord.total_count),
	};
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
