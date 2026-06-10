import { type Transaction } from 'kysely';
import { createHash, randomBytes } from 'node:crypto';

import { getAccountDatabase } from '@/lib/account/server/db';
import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TDatabase,
	TSsoCallbackEvent,
	TSsoCallbackQueueNew,
	TSsoClient,
	TSsoClientNew,
	TSsoClientUpdate,
	TUser,
} from '@/lib/db/types';

const CLIENT_TABLE_NAME = TABLE_NAME_MAP.ssoClient;
const CALLBACK_QUEUE_TABLE_NAME = TABLE_NAME_MAP.ssoCallbackQueue;
const GRANT_TABLE_NAME = TABLE_NAME_MAP.ssoUserClientGrant;

export const SSO_CLIENT_SECRET_BYTE_LENGTH = 32;

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

export interface ISsoClientCreateResult {
	client: TSsoClient;
	client_secret: string;
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

function createSsoClientUpdate(input: ISsoClientInput, now: number) {
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
		secret_hashes: serializeStringArray(input.secret_hashes),
		status_callback_url: input.status_callback_url,
		updated_at: now,
	} satisfies TSsoClientUpdate;
}

export async function createSsoClient(
	input: ISsoClientCreateInput
): Promise<ISsoClientCreateResult> {
	const db = await getAccountDatabase();
	const now = Date.now();
	const secret = createSsoClientSecret();
	const record = createSsoClientRecord(
		{ ...input, disabled_at: null, secret_hashes: [secret.secret_hash] },
		now
	);

	const client = await db
		.transaction()
		.execute(async (trx) =>
			trx
				.insertInto(CLIENT_TABLE_NAME)
				.values(record)
				.returningAll()
				.executeTakeFirstOrThrow()
		);

	return { client, client_secret: secret.client_secret };
}

export async function updateSsoClient(input: ISsoClientInput) {
	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
		const client = await trx
			.updateTable(CLIENT_TABLE_NAME)
			.set(createSsoClientUpdate(input, now))
			.where('id', '=', input.id)
			.returningAll()
			.executeTakeFirst();

		return client ?? null;
	});
}

export async function deleteSsoClient(id: TSsoClient['id']) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		const result = await trx
			.deleteFrom(CLIENT_TABLE_NAME)
			.where('id', '=', id)
			.executeTakeFirst();

		return result.numDeletedRows === 1n;
	});
}

export async function enqueueSsoCallbackInTransaction(
	trx: Transaction<TDatabase>,
	clientId: TSsoClient['id'],
	userId: TUser['id'],
	event: TSsoCallbackEvent,
	timestamp: number
) {
	const record = {
		attempts: 0,
		client_id: clientId,
		created_at: timestamp,
		event,
		last_error: null,
		next_retry_at: timestamp,
		timestamp,
		user_id: userId,
	} satisfies TSsoCallbackQueueNew;

	await trx
		.insertInto(CALLBACK_QUEUE_TABLE_NAME)
		.values(record)
		.onConflict((oc) =>
			oc
				.columns(['client_id', 'user_id', 'event'])
				.doUpdateSet({
					attempts: 0,
					created_at: timestamp,
					last_error: null,
					next_retry_at: timestamp,
					timestamp,
				})
		)
		.execute();
}

export async function enqueueSsoCallback(
	clientId: TSsoClient['id'],
	userId: TUser['id'],
	event: TSsoCallbackEvent,
	timestamp = Date.now()
) {
	const db = await getAccountDatabase();

	await db.transaction().execute(async (trx) => {
		await enqueueSsoCallbackInTransaction(
			trx,
			clientId,
			userId,
			event,
			timestamp
		);
	});
}

export async function enqueueSsoCallbacksForUserEventInTransaction(
	trx: Transaction<TDatabase>,
	userId: TUser['id'],
	event: TSsoCallbackEvent,
	timestamp: number
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
		.where(`${CLIENT_TABLE_NAME}.disabled_at`, 'is', null)
		.where(`${CLIENT_TABLE_NAME}.status_callback_url`, 'is not', null)
		.execute();

	for (const client of clients) {
		await enqueueSsoCallbackInTransaction(
			trx,
			client.id,
			userId,
			event,
			timestamp
		);
	}
}
