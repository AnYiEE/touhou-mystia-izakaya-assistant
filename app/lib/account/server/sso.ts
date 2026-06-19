import { type Transaction } from 'kysely';
import { createHash, createHmac, randomBytes } from 'node:crypto';

import { checkFixedLengthEqual, createAccountHmac } from './crypto';
import { getAccountDatabase } from './db';
import {
	ADMIN_SSO_CALLBACK_DELIVERY_MAX_ROWS,
	ADMIN_SSO_CALLBACK_DELIVERY_RETENTION_MS,
} from './adminSsoCallbackService';
import {
	cleanupSsoCallbackDeliveries,
	writeSsoCallbackDelivery,
} from './repositories/ssoCallbackDeliveries';
import { SSO_CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT } from './repositories/sso';
import { SSO_TICKET_BYTE_LENGTH, SSO_TICKET_TTL_MS } from './ssoContext';
export {
	SSO_CONTEXT_COOKIE_MAX_AGE,
	SSO_CONTEXT_COOKIE_NAME,
	SSO_CONTEXT_TRANSACTION_ID_BYTE_LENGTH,
	SSO_TICKET_BYTE_LENGTH,
	SSO_TICKET_TTL_MS,
	clearSsoContextCookie,
	createSsoContextTransactionId,
	createSsoRedirectUrl,
	getSsoContextCookie,
	getSsoContextCookieOptions,
	getSsoContextCookieValue,
	setSsoContextCookie,
} from './ssoContext';
export {
	SSO_CODE_CHALLENGE_LENGTH,
	SSO_CLIENT_ID_MAX_LENGTH,
	SSO_CODE_VERIFIER_MAX_LENGTH,
	SSO_FIELD_MAX_LENGTH,
	SSO_STATE_MAX_LENGTH,
	SSO_TICKET_LENGTH,
	checkSsoCallbackEvent,
	checkSsoClientEnabled,
	checkSsoClientId,
	checkSsoClientName,
	checkSsoClientSecret,
	checkSsoCodeChallenge,
	checkSsoCodeVerifier,
	checkSsoContextTransactionId,
	checkSsoCustomSchemeRedirectUri,
	checkSsoHttpsRedirectUri,
	checkSsoLoopbackRedirectPath,
	checkSsoRedirectUriFormat,
	checkSsoSecretHash,
	checkSsoState,
	checkSsoStatusCallbackUrl,
	checkSsoTicketFormat,
	createSsoClientPublicProfile,
	normalizeSsoOptionalUri,
	validateSsoClientConfig,
} from './ssoValidation';
import {
	checkSsoCallbackEvent,
	checkSsoClientEnabled,
	checkSsoClientId,
	checkSsoClientSecret,
	checkSsoCodeChallenge,
	checkSsoCodeVerifier,
	checkSsoRedirectUriFormat,
	checkSsoTicketFormat,
	normalizeNullableString,
	validateSsoClientConfig,
} from './ssoValidation';
import { USER_STATUS_MAP } from '../shared/constants';
import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TDatabase,
	TSsoCallbackDeliveryStatus,
	TSsoCallbackEvent,
	TSsoCallbackQueue,
	TSsoClient,
	TSsoGrantEventNew,
	TSsoTicket,
	TUser,
} from '@/lib/db/types';
import { getLogSafeErrorCode } from '@/lib/logging';

export const SSO_CALLBACK_DISPATCH_LIMIT = 20;
export const SSO_CALLBACK_MAX_ATTEMPTS = 100;
export const SSO_CALLBACK_USER_AGENT = 'Mystia-SSO/1.0';
export const SSO_CALLBACK_TIMEOUT_MS = 5000;
export const SSO_CALLBACK_DELIVERY_MAX_ROWS =
	ADMIN_SSO_CALLBACK_DELIVERY_MAX_ROWS;
export const SSO_CALLBACK_DELIVERY_RETENTION_MS =
	ADMIN_SSO_CALLBACK_DELIVERY_RETENTION_MS;

const CLIENT_TABLE_NAME = TABLE_NAME_MAP.ssoClient;
const CLIENT_SECRET_TABLE_NAME = TABLE_NAME_MAP.ssoClientSecret;
const TICKET_TABLE_NAME = TABLE_NAME_MAP.ssoTicket;
const CALLBACK_QUEUE_TABLE_NAME = TABLE_NAME_MAP.ssoCallbackQueue;
const GRANT_TABLE_NAME = TABLE_NAME_MAP.ssoUserClientGrant;
const GRANT_EVENT_TABLE_NAME = TABLE_NAME_MAP.ssoGrantEvent;
const USER_TABLE_NAME = TABLE_NAME_MAP.user;

const SSO_CALLBACK_CLAIM_LEASE_MS = SSO_CALLBACK_TIMEOUT_MS + 60_000;
const SSO_CALLBACK_DELIVERY_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

let lastSsoCallbackDeliveryCleanupAt = 0;

interface ISsoCallbackBody {
	client_id: string;
	event: TSsoCallbackEvent;
	metadata: Record<string, boolean | null | number | string>;
	timestamp: number;
	user_id: string | null;
}

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

export type TSsoTicketValidationUserError = 'user-deleted' | 'user-disabled';

export interface ISsoTicketValidationResult {
	ticket: TSsoTicket;
	user: TUser | null;
	user_error: TSsoTicketValidationUserError | null;
}

export type TSsoTicketWithClientSecretValidationResult =
	| { status: 'client-disabled' }
	| { status: 'invalid-client' }
	| { status: 'invalid-ticket' }
	| { status: 'validated'; validation: ISsoTicketValidationResult };

export interface ISsoCallbackDispatchResult {
	failed: number;
	final_failed: number;
	succeeded: number;
}

interface ISsoCallbackDeliveryAttempt {
	durationMs: number | null;
	error: string | null;
	httpStatus: number | null;
}

type TSsoCallbackAttemptResult =
	| { delivery: ISsoCallbackDeliveryAttempt | null; status: 'delete' }
	| {
			delivery: ISsoCallbackDeliveryAttempt;
			message: string;
			status: 'failed';
	  };

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

function createSha256Hex(value: string) {
	return createHash('sha256').update(value).digest('hex');
}

function parseSsoClient(
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

async function listActiveSsoClientSecretHashesInTransaction(
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

async function getSsoClientByIdForCallback(id: string) {
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

	const secretHash = createSha256Hex(secret);

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

	const secretHash = createSha256Hex(secret);
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

async function verifyAndTouchSsoClientSecretInTransaction(
	trx: Transaction<TDatabase>,
	client: ISsoClient,
	secret: string,
	now: number
) {
	if (!checkSsoClientSecret(secret)) {
		return false;
	}

	const secretHash = createSha256Hex(secret);
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

export function verifyPkce(codeChallenge: string, codeVerifier: string) {
	if (
		!checkSsoCodeChallenge(codeChallenge) ||
		!checkSsoCodeVerifier(codeVerifier)
	) {
		return false;
	}

	const verifierChallenge = createHash('sha256')
		.update(codeVerifier)
		.digest('base64url');

	return checkFixedLengthEqual(codeChallenge, verifierChallenge);
}

function createSsoTicketToken() {
	return randomBytes(SSO_TICKET_BYTE_LENGTH).toString('base64url');
}

function hashSsoTicket(ticket: string) {
	return createAccountHmac('sso-ticket:v1', ticket);
}

export async function createSsoTicket(
	clientId: string,
	userId: string,
	redirectUri: string,
	codeChallenge: string
) {
	if (
		!checkSsoClientId(clientId) ||
		!checkSsoRedirectUriFormat(redirectUri) ||
		!checkSsoCodeChallenge(codeChallenge)
	) {
		throw new Error('invalid-object-structure');
	}

	const db = await getAccountDatabase();
	const now = Date.now();
	const ticket = createSsoTicketToken();
	const ticketHash = hashSsoTicket(ticket);

	await db
		.insertInto(TICKET_TABLE_NAME)
		.values({
			client_id: clientId,
			code_challenge: codeChallenge,
			created_at: now,
			expires_at: now + SSO_TICKET_TTL_MS,
			redirect_uri: redirectUri,
			ticket_hash: ticketHash,
			used_at: null,
			user_id: userId,
		})
		.execute();

	return ticket;
}

export function getSsoUserStatusError(user: TUser) {
	if (user.status === USER_STATUS_MAP.disabled) {
		return 'user-disabled';
	}
	if (user.status === USER_STATUS_MAP.deleted) {
		return 'user-deleted';
	}

	return null;
}

export async function hasSsoUserClientGrant(
	clientId: TSsoClient['id'],
	userId: TUser['id']
) {
	const db = await getAccountDatabase();
	const record = await db
		.selectFrom(GRANT_TABLE_NAME)
		.select('client_id')
		.where('client_id', '=', clientId)
		.where('user_id', '=', userId)
		.executeTakeFirst();

	return record !== undefined;
}

export async function listSsoUserClientGrantsForUser(userId: TUser['id']) {
	const db = await getAccountDatabase();
	const records = await db
		.selectFrom(GRANT_TABLE_NAME)
		.innerJoin(
			CLIENT_TABLE_NAME,
			`${GRANT_TABLE_NAME}.client_id`,
			`${CLIENT_TABLE_NAME}.id`
		)
		.select([
			`${CLIENT_TABLE_NAME}.id as client_id`,
			`${CLIENT_TABLE_NAME}.name as client_name`,
			`${GRANT_TABLE_NAME}.created_at`,
			`${GRANT_TABLE_NAME}.updated_at`,
		])
		.where(`${GRANT_TABLE_NAME}.user_id`, '=', userId)
		.orderBy(`${GRANT_TABLE_NAME}.updated_at`, 'desc')
		.orderBy(`${CLIENT_TABLE_NAME}.id`, 'asc')
		.execute();

	return records.map((record) => ({
		client: { id: record.client_id, name: record.client_name },
		created_at: record.created_at,
		updated_at: record.updated_at,
	}));
}

async function validateSsoTicketInTransaction(
	trx: Transaction<TDatabase>,
	clientId: string,
	ticket: string,
	codeVerifier: string,
	now: number
): Promise<ISsoTicketValidationResult | null> {
	const ticketHash = hashSsoTicket(ticket);
	const record =
		(await trx
			.selectFrom(TICKET_TABLE_NAME)
			.selectAll()
			.where('ticket_hash', '=', ticketHash)
			.executeTakeFirst()) ?? null;
	if (record === null) {
		return null;
	}
	if (
		record.client_id !== clientId ||
		record.used_at !== null ||
		record.revoked_at !== null ||
		record.expires_at <= now ||
		!verifyPkce(record.code_challenge, codeVerifier)
	) {
		return null;
	}

	const result = await trx
		.updateTable(TICKET_TABLE_NAME)
		.set({ used_at: now })
		.where('ticket_hash', '=', ticketHash)
		.where('client_id', '=', clientId)
		.where('used_at', 'is', null)
		.where('revoked_at', 'is', null)
		.where('expires_at', '>', now)
		.executeTakeFirst();
	if (result.numUpdatedRows !== 1n) {
		return null;
	}

	const user =
		(await trx
			.selectFrom(USER_TABLE_NAME)
			.selectAll()
			.where('id', '=', record.user_id)
			.executeTakeFirst()) ?? null;
	if (user === null) {
		return { ticket: record, user, user_error: 'user-deleted' };
	}

	const userError = getSsoUserStatusError(user);
	if (userError !== null) {
		return { ticket: record, user, user_error: userError };
	}

	const existingGrant = await trx
		.selectFrom(GRANT_TABLE_NAME)
		.select('client_id')
		.where('client_id', '=', clientId)
		.where('user_id', '=', user.id)
		.executeTakeFirst();

	await trx
		.insertInto(GRANT_TABLE_NAME)
		.values({
			client_id: clientId,
			created_at: now,
			updated_at: now,
			user_id: user.id,
		})
		.onConflict((oc) =>
			oc
				.columns(['client_id', 'user_id'])
				.doUpdateSet({ updated_at: now })
		)
		.execute();

	await trx
		.insertInto(GRANT_EVENT_TABLE_NAME)
		.values({
			actor_id: clientId,
			actor_type: 'client',
			client_id: clientId,
			created_at: now,
			event:
				existingGrant === undefined
					? 'grant_created'
					: 'grant_refreshed',
			reason: null,
			user_id: user.id,
		} satisfies TSsoGrantEventNew)
		.execute();

	return { ticket: record, user, user_error: null };
}

export async function validateSsoTicket(
	clientId: string,
	ticket: string,
	codeVerifier: string
): Promise<ISsoTicketValidationResult | null> {
	if (
		!checkSsoClientId(clientId) ||
		!checkSsoTicketFormat(ticket) ||
		!checkSsoCodeVerifier(codeVerifier)
	) {
		return null;
	}

	const db = await getAccountDatabase();
	const now = Date.now();

	return db
		.transaction()
		.execute((trx) =>
			validateSsoTicketInTransaction(
				trx,
				clientId,
				ticket,
				codeVerifier,
				now
			)
		);
}

export async function validateSsoTicketWithClientSecret(
	clientId: string,
	clientSecret: string,
	ticket: string,
	codeVerifier: string
): Promise<TSsoTicketWithClientSecretValidationResult> {
	if (!checkSsoClientId(clientId) || !checkSsoClientSecret(clientSecret)) {
		return { status: 'invalid-client' };
	}
	if (!checkSsoTicketFormat(ticket) || !checkSsoCodeVerifier(codeVerifier)) {
		return { status: 'invalid-ticket' };
	}

	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
		const record =
			(await trx
				.selectFrom(CLIENT_TABLE_NAME)
				.selectAll()
				.where('id', '=', clientId)
				.where('deleted_at', 'is', null)
				.executeTakeFirst()) ?? null;
		if (record === null) {
			return { status: 'invalid-client' };
		}

		const client = parseSsoClient(
			record,
			await listActiveSsoClientSecretHashesInTransaction(trx, record.id)
		);
		const isSecretValid = await verifyAndTouchSsoClientSecretInTransaction(
			trx,
			client,
			clientSecret,
			now
		);
		if (!isSecretValid) {
			return { status: 'invalid-client' };
		}
		if (!checkSsoClientEnabled(client)) {
			return { status: 'client-disabled' };
		}

		const validation = await validateSsoTicketInTransaction(
			trx,
			clientId,
			ticket,
			codeVerifier,
			now
		);

		return validation === null
			? { status: 'invalid-ticket' }
			: { status: 'validated', validation };
	});
}

export function createSsoCallbackSignature(
	signingSecret: string,
	timestamp: number,
	body: string
) {
	return createHmac('sha256', signingSecret)
		.update(`${timestamp}.${body}`)
		.digest('base64url');
}

function getSsoCallbackRetryDelayMs(nextAttempts: number) {
	switch (nextAttempts) {
		case 1:
			return 1000;
		case 2:
			return 5000;
		case 3:
			return 25_000;
		default:
			return 60_000;
	}
}

function parseSsoCallbackMetadata(
	value: string
): Record<string, boolean | null | number | string> {
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		return {};
	}

	if (
		parsed === null ||
		typeof parsed !== 'object' ||
		Array.isArray(parsed)
	) {
		return {};
	}

	const parsedRecord = parsed as Record<string, unknown>;
	const metadata: Record<string, boolean | null | number | string> = {};
	for (const [key, metadataValue] of Object.entries(parsedRecord)) {
		if (
			metadataValue === null ||
			typeof metadataValue === 'boolean' ||
			typeof metadataValue === 'number' ||
			typeof metadataValue === 'string'
		) {
			metadata[key] = metadataValue;
		}
	}

	return metadata;
}

function createSsoCallbackBody(record: TSsoCallbackQueue): ISsoCallbackBody {
	return {
		client_id: record.client_id,
		event: record.event,
		metadata: parseSsoCallbackMetadata(record.metadata_json),
		timestamp: record.timestamp,
		user_id: record.user_id,
	};
}

function isSsoClientEvent(event: TSsoCallbackEvent) {
	return ['client_deleted', 'client_disabled', 'secret_rotated'].includes(
		event
	);
}

function createSsoCallbackErrorMessage(error: unknown) {
	if (error instanceof Error && error.name === 'AbortError') {
		return 'request-timeout';
	}
	if (error instanceof Error && error.message.length > 0) {
		return error.message.slice(0, 160);
	}

	return getLogSafeErrorCode(error);
}

function checkSsoCallbackDispatchUrl(value: string) {
	try {
		const url = new URL(value);
		return (
			url.protocol === 'https:' &&
			url.username === '' &&
			url.password === '' &&
			url.hash === ''
		);
	} catch {
		return false;
	}
}

async function dispatchSsoCallback(
	record: TSsoCallbackQueue
): Promise<TSsoCallbackAttemptResult> {
	if (!checkSsoCallbackEvent(record.event)) {
		return { delivery: null, status: 'delete' };
	}

	const client = await getSsoClientByIdForCallback(record.client_id);
	if (client === null) {
		return { delivery: null, status: 'delete' };
	}
	if (
		!isSsoClientEvent(record.event) &&
		(!checkSsoClientEnabled(client) || client.deleted_at !== null)
	) {
		return { delivery: null, status: 'delete' };
	}

	const statusCallbackUrl = client.status_callback_url;
	if (statusCallbackUrl === null) {
		return { delivery: null, status: 'delete' };
	}
	if (!checkSsoCallbackDispatchUrl(statusCallbackUrl)) {
		return {
			delivery: {
				durationMs: null,
				error: 'blocked-callback-url',
				httpStatus: null,
			},
			message: 'blocked-callback-url',
			status: 'failed',
		};
	}

	// The first active secret is the callback signing key; remaining active secrets keep client-secret rotation compatible.
	const [signingSecret] = client.secret_hashes;
	if (signingSecret === undefined) {
		return {
			delivery: {
				durationMs: null,
				error: 'server-misconfigured',
				httpStatus: null,
			},
			message: 'server-misconfigured',
			status: 'failed',
		};
	}

	const body = JSON.stringify(createSsoCallbackBody(record));
	const signingTimestamp = Date.now();
	const signature = createSsoCallbackSignature(
		signingSecret,
		signingTimestamp,
		body
	);
	// eslint-disable-next-line compat/compat -- SSO callbacks run only in the Node.js route runtime.
	const abortController = new AbortController();
	const timeoutId = globalThis.setTimeout(() => {
		abortController.abort();
	}, SSO_CALLBACK_TIMEOUT_MS);
	const startedAt = Date.now();
	let response: Response;
	try {
		response = await fetch(statusCallbackUrl, {
			body,
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': SSO_CALLBACK_USER_AGENT,
				'X-Sso-Signature': `t=${signingTimestamp},v1=${signature}`,
			},
			method: 'POST',
			redirect: 'manual',
			signal: abortController.signal,
		});
	} catch (error) {
		const message = createSsoCallbackErrorMessage(error);

		return {
			delivery: {
				durationMs: Date.now() - startedAt,
				error: message,
				httpStatus: null,
			},
			message,
			status: 'failed',
		};
	} finally {
		globalThis.clearTimeout(timeoutId);
	}
	const durationMs = Date.now() - startedAt;

	return response.ok
		? {
				delivery: {
					durationMs,
					error: null,
					httpStatus: response.status,
				},
				status: 'delete',
			}
		: {
				delivery: {
					durationMs,
					error: `http-${response.status}`,
					httpStatus: response.status,
				},
				message: `http-${response.status}`,
				status: 'failed',
			};
}

async function writeSsoCallbackDeliveryBestEffort(
	record: TSsoCallbackQueue,
	status: TSsoCallbackDeliveryStatus,
	attempt: ISsoCallbackDeliveryAttempt,
	now = Date.now()
) {
	try {
		await writeSsoCallbackDelivery(
			record,
			{
				attempt: record.attempts + 1,
				durationMs: attempt.durationMs,
				error: attempt.error,
				httpStatus: attempt.httpStatus,
				status,
			},
			now
		);
	} catch (error) {
		console.warn('Failed to write SSO callback delivery history.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}
}

async function cleanupSsoCallbackDeliveriesBestEffort(now = Date.now()) {
	if (
		now - lastSsoCallbackDeliveryCleanupAt <
		SSO_CALLBACK_DELIVERY_CLEANUP_INTERVAL_MS
	) {
		return;
	}

	lastSsoCallbackDeliveryCleanupAt = now;
	try {
		await cleanupSsoCallbackDeliveries({
			before: now - SSO_CALLBACK_DELIVERY_RETENTION_MS,
			maxRows: SSO_CALLBACK_DELIVERY_MAX_ROWS,
		});
	} catch (error) {
		console.warn('Failed to clean up SSO callback delivery history.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}
}

async function claimSsoCallbackQueueRecord(
	record: TSsoCallbackQueue,
	now: number
) {
	const db = await getAccountDatabase();
	const leaseExpiresAt = now + SSO_CALLBACK_CLAIM_LEASE_MS;
	const leaseToken = randomBytes(16).toString('base64url');
	const result = await db
		.updateTable(CALLBACK_QUEUE_TABLE_NAME)
		.set({ lease_expires_at: leaseExpiresAt, lease_token: leaseToken })
		.where('id', '=', record.id)
		.where('generation', '=', record.generation)
		.where('next_retry_at', '=', record.next_retry_at)
		.where((eb) =>
			eb.or([
				eb('lease_expires_at', 'is', null),
				eb('lease_expires_at', '<=', now),
			])
		)
		.executeTakeFirst();

	return result.numUpdatedRows === 1n ? { leaseExpiresAt, leaseToken } : null;
}

async function markSsoCallbackFailed(
	record: TSsoCallbackQueue,
	errorMessage: string,
	now: number,
	leaseToken: string,
	leaseExpiresAt: number
) {
	const db = await getAccountDatabase();
	const nextAttempts = record.attempts + 1;
	const isFinalFailed = nextAttempts >= SSO_CALLBACK_MAX_ATTEMPTS;
	const nextRetryAt = isFinalFailed
		? SSO_CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT
		: now + getSsoCallbackRetryDelayMs(nextAttempts);

	const result = await db
		.updateTable(CALLBACK_QUEUE_TABLE_NAME)
		.set({
			attempts: nextAttempts,
			last_error: errorMessage,
			lease_expires_at: null,
			lease_token: null,
			next_retry_at: nextRetryAt,
		})
		.where('id', '=', record.id)
		.where('generation', '=', record.generation)
		.where('lease_token', '=', leaseToken)
		.where('lease_expires_at', '=', leaseExpiresAt)
		.executeTakeFirst();
	if (result.numUpdatedRows !== 1n) {
		return null;
	}

	return isFinalFailed;
}

async function deleteSsoCallbackQueueRecord(
	id: TSsoCallbackQueue['id'],
	generation: TSsoCallbackQueue['generation'],
	leaseToken: string,
	leaseExpiresAt: number
) {
	const db = await getAccountDatabase();

	const result = await db
		.deleteFrom(CALLBACK_QUEUE_TABLE_NAME)
		.where('id', '=', id)
		.where('generation', '=', generation)
		.where('lease_token', '=', leaseToken)
		.where('lease_expires_at', '=', leaseExpiresAt)
		.executeTakeFirst();

	return result.numDeletedRows === 1n;
}

export async function dispatchSsoCallbacks(
	limit = SSO_CALLBACK_DISPATCH_LIMIT
): Promise<ISsoCallbackDispatchResult> {
	const db = await getAccountDatabase();
	const now = Date.now();
	const records = await db
		.selectFrom(CALLBACK_QUEUE_TABLE_NAME)
		.selectAll()
		.where('next_retry_at', '<=', now)
		.where((eb) =>
			eb.or([
				eb('lease_expires_at', 'is', null),
				eb('lease_expires_at', '<=', now),
			])
		)
		.orderBy('next_retry_at', 'asc')
		.orderBy('id', 'asc')
		.limit(Math.min(Math.max(1, limit), SSO_CALLBACK_DISPATCH_LIMIT))
		.execute();

	let failed = 0;
	let finalFailed = 0;
	let succeeded = 0;

	for (const record of records) {
		const claimNow = Date.now();
		const lease = await claimSsoCallbackQueueRecord(record, claimNow);
		if (lease === null) {
			continue;
		}

		try {
			const result = await dispatchSsoCallback(record);
			if (result.status === 'delete') {
				if (result.delivery !== null) {
					await writeSsoCallbackDeliveryBestEffort(
						record,
						'succeeded',
						result.delivery
					);
				}
				if (
					!(await deleteSsoCallbackQueueRecord(
						record.id,
						record.generation,
						lease.leaseToken,
						lease.leaseExpiresAt
					))
				) {
					continue;
				}
				succeeded++;
				continue;
			}

			const failedAt = Date.now();
			await writeSsoCallbackDeliveryBestEffort(
				record,
				record.attempts + 1 >= SSO_CALLBACK_MAX_ATTEMPTS
					? 'final_failed'
					: 'failed',
				result.delivery,
				failedAt
			);
			const isFinalFailed = await markSsoCallbackFailed(
				record,
				result.message,
				failedAt,
				lease.leaseToken,
				lease.leaseExpiresAt
			);
			if (isFinalFailed === null) {
				continue;
			}
			if (isFinalFailed) {
				finalFailed++;
			} else {
				failed++;
			}
		} catch (error) {
			const errorMessage = createSsoCallbackErrorMessage(error);
			const failedAt = Date.now();
			await writeSsoCallbackDeliveryBestEffort(
				record,
				record.attempts + 1 >= SSO_CALLBACK_MAX_ATTEMPTS
					? 'final_failed'
					: 'failed',
				{ durationMs: null, error: errorMessage, httpStatus: null },
				failedAt
			);
			const isFinalFailed = await markSsoCallbackFailed(
				record,
				errorMessage,
				failedAt,
				lease.leaseToken,
				lease.leaseExpiresAt
			);
			if (isFinalFailed === null) {
				continue;
			}
			if (isFinalFailed) {
				finalFailed++;
			} else {
				failed++;
			}
		}
	}

	if (records.length > 0) {
		await cleanupSsoCallbackDeliveriesBestEffort(Date.now());
	}

	return { failed, final_failed: finalFailed, succeeded };
}

export async function getSsoUserById(userId: TUser['id']) {
	const db = await getAccountDatabase();

	return (
		(await db
			.selectFrom(USER_TABLE_NAME)
			.selectAll()
			.where('id', '=', userId)
			.executeTakeFirst()) ?? null
	);
}

export async function deleteExpiredSsoTickets(expiredAt = Date.now()) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		const result = await trx
			.deleteFrom(TICKET_TABLE_NAME)
			.where('expires_at', '<=', expiredAt)
			.executeTakeFirst();

		return Number(result.numDeletedRows);
	});
}
