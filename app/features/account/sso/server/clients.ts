import { type Transaction } from 'kysely';

import { checkFixedLengthEqual } from '@/features/account/server/auth/crypto';
import { getAccountDatabase } from '@/features/account/server/persistence/database';

import type { TDatabase, TSsoClient } from '@/infrastructure/database/schema';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';

import { createSsoSha256Hex } from './crypto';
import {
	checkSsoClientSecret,
	checkSsoRedirectUriFormat,
	normalizeNullableString,
	validateSsoClientConfig,
} from './validation';

export interface ISsoClient extends Omit<
	TSsoClient,
	| 'custom_scheme_redirect_uris'
	| 'https_redirect_uris'
	| 'loopback_redirect_paths'
	| 'secret_hashes'
> {
	custom_scheme_redirect_uris: string[];
	https_redirect_uris: string[];
	loopback_redirect_paths: string[];
	secret_hashes: string[];
}

const CLIENT_TABLE_NAME = TABLE_NAME_MAP.ssoClient;
const CLIENT_SECRET_TABLE_NAME = TABLE_NAME_MAP.ssoClientSecret;

interface ISsoClientSecretHashList {
	hasSecretRecords: boolean;
	secretHashes: string[];
}

function parseJsonStringArray(value: string, fieldName: string): string[] {
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		throw new Error(`server-misconfigured: invalid ${fieldName}`);
	}

	if (
		!Array.isArray(parsed) ||
		parsed.some((item) => typeof item !== 'string')
	) {
		throw new Error(`server-misconfigured: invalid ${fieldName}`);
	}

	return parsed as string[];
}

export function parseSsoClient(
	record: TSsoClient,
	secretHashList?: ISsoClientSecretHashList
): ISsoClient {
	const legacySecretHashes = parseJsonStringArray(
		record.secret_hashes,
		'secret_hashes'
	);
	const secretHashes =
		secretHashList?.hasSecretRecords === true
			? secretHashList.secretHashes
			: legacySecretHashes;
	const loopbackRedirectPaths = parseJsonStringArray(
		record.loopback_redirect_paths,
		'loopback_redirect_paths'
	);
	const customSchemeRedirectUris = parseJsonStringArray(
		record.custom_scheme_redirect_uris,
		'custom_scheme_redirect_uris'
	);
	const httpsRedirectUris = parseJsonStringArray(
		record.https_redirect_uris,
		'https_redirect_uris'
	);
	const client = {
		...record,
		cancel_redirect_uri: normalizeNullableString(
			record.cancel_redirect_uri
		),
		custom_scheme_redirect_uris: customSchemeRedirectUris,
		https_redirect_uris: httpsRedirectUris,
		loopback_redirect_paths: loopbackRedirectPaths,
		secret_hashes: secretHashes,
		status_callback_url: normalizeNullableString(
			record.status_callback_url
		),
	} satisfies ISsoClient;

	if (!validateSsoClientConfig(client)) {
		throw new Error('server-misconfigured: invalid sso client config');
	}

	return client;
}

async function listActiveSsoClientSecretHashes(clientId: TSsoClient['id']) {
	const db = await getAccountDatabase();
	const records = await db
		.selectFrom(CLIENT_SECRET_TABLE_NAME)
		.select(['disabled_at', 'revoked_at', 'secret_hash'])
		.where('client_id', '=', clientId)
		.orderBy('position', 'asc')
		.orderBy('created_at', 'asc')
		.orderBy('id', 'asc')
		.execute();

	return {
		hasSecretRecords: records.length > 0,
		secretHashes: records
			.filter(
				(record) =>
					record.disabled_at === null && record.revoked_at === null
			)
			.map((record) => record.secret_hash),
	} satisfies ISsoClientSecretHashList;
}

export async function listActiveSsoClientSecretHashesInTransaction(
	trx: Transaction<TDatabase>,
	clientId: TSsoClient['id']
) {
	const records = await trx
		.selectFrom(CLIENT_SECRET_TABLE_NAME)
		.select(['disabled_at', 'revoked_at', 'secret_hash'])
		.where('client_id', '=', clientId)
		.orderBy('position', 'asc')
		.orderBy('created_at', 'asc')
		.orderBy('id', 'asc')
		.execute();

	return {
		hasSecretRecords: records.length > 0,
		secretHashes: records
			.filter(
				(record) =>
					record.disabled_at === null && record.revoked_at === null
			)
			.map((record) => record.secret_hash),
	} satisfies ISsoClientSecretHashList;
}

async function readSsoClientActiveSecretHashMap(
	clientIds: Array<TSsoClient['id']>
) {
	const db = await getAccountDatabase();
	if (clientIds.length === 0) {
		return new Map<TSsoClient['id'], ISsoClientSecretHashList>();
	}

	const records = await db
		.selectFrom(CLIENT_SECRET_TABLE_NAME)
		.select(['client_id', 'disabled_at', 'revoked_at', 'secret_hash'])
		.where('client_id', 'in', clientIds)
		.orderBy('client_id', 'asc')
		.orderBy('position', 'asc')
		.orderBy('created_at', 'asc')
		.orderBy('id', 'asc')
		.execute();

	const secretHashMap = new Map<TSsoClient['id'], ISsoClientSecretHashList>();
	for (const record of records) {
		const secretHashList = secretHashMap.get(record.client_id) ?? {
			hasSecretRecords: false,
			secretHashes: [],
		};
		secretHashList.hasSecretRecords = true;
		if (record.disabled_at === null && record.revoked_at === null) {
			secretHashList.secretHashes.push(record.secret_hash);
		}
		secretHashMap.set(record.client_id, secretHashList);
	}

	return secretHashMap;
}

export async function getSsoClientById(id: string) {
	const db = await getAccountDatabase();
	const record =
		(await db
			.selectFrom(CLIENT_TABLE_NAME)
			.selectAll()
			.where('id', '=', id)
			.where('deleted_at', 'is', null)
			.executeTakeFirst()) ?? null;

	return record === null
		? null
		: parseSsoClient(
				record,
				await listActiveSsoClientSecretHashes(record.id)
			);
}

export async function getSsoClientByIdForCallback(id: string) {
	const db = await getAccountDatabase();
	const record =
		(await db
			.selectFrom(CLIENT_TABLE_NAME)
			.selectAll()
			.where('id', '=', id)
			.executeTakeFirst()) ?? null;

	return record === null
		? null
		: parseSsoClient(
				record,
				await listActiveSsoClientSecretHashes(record.id)
			);
}

export async function listSsoClients() {
	const db = await getAccountDatabase();
	const records = await db
		.selectFrom(CLIENT_TABLE_NAME)
		.selectAll()
		.where('deleted_at', 'is', null)
		.orderBy('updated_at', 'desc')
		.orderBy('id', 'asc')
		.execute();

	const secretHashMap = await readSsoClientActiveSecretHashMap(
		records.map((record) => record.id)
	);

	return records.map((record) =>
		parseSsoClient(record, secretHashMap.get(record.id))
	);
}

export async function hasAnySsoClient() {
	const db = await getAccountDatabase();
	const record = await db
		.selectFrom(CLIENT_TABLE_NAME)
		.select('id')
		.limit(1)
		.executeTakeFirst();

	return record !== undefined;
}

export function verifySsoClientSecret(client: ISsoClient, secret: string) {
	if (!checkSsoClientSecret(secret)) {
		return false;
	}

	const secretHash = createSsoSha256Hex(secret);

	return client.secret_hashes.some((activeSecretHash) =>
		checkFixedLengthEqual(activeSecretHash, secretHash)
	);
}

export async function verifyAndTouchSsoClientSecret(
	client: ISsoClient,
	secret: string,
	now = Date.now()
) {
	if (!checkSsoClientSecret(secret)) {
		return false;
	}

	const secretHash = createSsoSha256Hex(secret);
	const matched = client.secret_hashes.some((activeSecretHash) =>
		checkFixedLengthEqual(activeSecretHash, secretHash)
	);
	if (!matched) {
		return false;
	}

	const db = await getAccountDatabase();
	const result = await db
		.updateTable(CLIENT_SECRET_TABLE_NAME)
		.set({ last_used_at: now })
		.where('client_id', '=', client.id)
		.where('secret_hash', '=', secretHash)
		.where('disabled_at', 'is', null)
		.where('revoked_at', 'is', null)
		.executeTakeFirst();

	return result.numUpdatedRows === 1n;
}

export async function verifyAndTouchSsoClientSecretInTransaction(
	trx: Transaction<TDatabase>,
	client: ISsoClient,
	secret: string,
	now: number
) {
	if (!checkSsoClientSecret(secret)) {
		return false;
	}

	const secretHash = createSsoSha256Hex(secret);
	const matched = client.secret_hashes.some((activeSecretHash) =>
		checkFixedLengthEqual(activeSecretHash, secretHash)
	);
	if (!matched) {
		return false;
	}

	const result = await trx
		.updateTable(CLIENT_SECRET_TABLE_NAME)
		.set({ last_used_at: now })
		.where('client_id', '=', client.id)
		.where('secret_hash', '=', secretHash)
		.where('disabled_at', 'is', null)
		.where('revoked_at', 'is', null)
		.executeTakeFirst();

	return result.numUpdatedRows === 1n;
}

export function validateSsoRedirectUri(
	client: ISsoClient,
	redirectUri: string
) {
	if (!checkSsoRedirectUriFormat(redirectUri)) {
		return false;
	}

	const url = new URL(redirectUri);
	if (url.protocol === 'http:') {
		const isLoopbackHost = ['127.0.0.1', '[::1]', '::1'].includes(
			url.hostname
		);

		return (
			isLoopbackHost &&
			client.loopback_redirect_paths.includes(url.pathname)
		);
	}
	if (url.protocol === 'https:') {
		return client.https_redirect_uris.includes(redirectUri);
	}

	return client.custom_scheme_redirect_uris.includes(redirectUri);
}
