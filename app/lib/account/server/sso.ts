import { createHash, createHmac, randomBytes } from 'node:crypto';

import { checkFixedLengthEqual, createAccountHmac } from './crypto';
import { getAccountDatabase } from './db';
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
	TSsoCallbackEvent,
	TSsoCallbackQueue,
	TSsoClient,
	TSsoTicket,
	TUser,
} from '@/lib/db/types';
import { getLogSafeErrorCode } from '@/lib/logging';

export const SSO_CALLBACK_DISPATCH_LIMIT = 20;
export const SSO_CALLBACK_MAX_ATTEMPTS = 100;
export const SSO_CALLBACK_USER_AGENT = 'Mystia-SSO/1.0';
export const SSO_CALLBACK_TIMEOUT_MS = 5000;

const CLIENT_TABLE_NAME = TABLE_NAME_MAP.ssoClient;
const TICKET_TABLE_NAME = TABLE_NAME_MAP.ssoTicket;
const CALLBACK_QUEUE_TABLE_NAME = TABLE_NAME_MAP.ssoCallbackQueue;
const GRANT_TABLE_NAME = TABLE_NAME_MAP.ssoUserClientGrant;
const USER_TABLE_NAME = TABLE_NAME_MAP.user;

const CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT = Number.MAX_SAFE_INTEGER;
const SSO_CALLBACK_CLAIM_LEASE_MS = SSO_CALLBACK_TIMEOUT_MS + 60_000;

interface ISsoCallbackBody {
	client_id: string;
	event: TSsoCallbackEvent;
	timestamp: number;
	user_id: string;
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

export interface ISsoCallbackDispatchResult {
	failed: number;
	final_failed: number;
	succeeded: number;
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

function parseSsoClient(record: TSsoClient): ISsoClient {
	const secretHashes = parseJsonStringArray(
		record.secret_hashes,
		'secret_hashes'
	);
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

export async function getSsoClientById(id: string) {
	const db = await getAccountDatabase();
	const record =
		(await db
			.selectFrom(CLIENT_TABLE_NAME)
			.selectAll()
			.where('id', '=', id)
			.executeTakeFirst()) ?? null;

	return record === null ? null : parseSsoClient(record);
}

export async function listSsoClients() {
	const db = await getAccountDatabase();
	const records = await db
		.selectFrom(CLIENT_TABLE_NAME)
		.selectAll()
		.orderBy('updated_at', 'desc')
		.orderBy('id', 'asc')
		.execute();

	return records.map(parseSsoClient);
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
	const ticketHash = hashSsoTicket(ticket);

	return db.transaction().execute(async (trx) => {
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
			record.expires_at <= now ||
			!verifyPkce(record.code_challenge, codeVerifier)
		) {
			return null;
		}

		const result = await trx
			.updateTable(TICKET_TABLE_NAME)
			.set({ used_at: now })
			.where('ticket_hash', '=', ticketHash)
			.where('used_at', 'is', null)
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

		return { ticket: record, user, user_error: null };
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

function createSsoCallbackBody(record: TSsoCallbackQueue): ISsoCallbackBody {
	return {
		client_id: record.client_id,
		event: record.event,
		timestamp: record.timestamp,
		user_id: record.user_id,
	};
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

async function dispatchSsoCallback(record: TSsoCallbackQueue) {
	if (!checkSsoCallbackEvent(record.event)) {
		return { status: 'delete' as const };
	}

	const client = await getSsoClientById(record.client_id);
	if (client === null) {
		return { status: 'delete' as const };
	}
	if (!checkSsoClientEnabled(client)) {
		return { status: 'delete' as const };
	}

	const statusCallbackUrl = client.status_callback_url;
	if (statusCallbackUrl === null) {
		return { status: 'delete' as const };
	}

	// The first active secret is the callback signing key; remaining active secrets keep client-secret rotation compatible.
	const [signingSecret] = client.secret_hashes;
	if (signingSecret === undefined) {
		return { message: 'server-misconfigured', status: 'failed' as const };
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
			signal: abortController.signal,
		});
	} finally {
		globalThis.clearTimeout(timeoutId);
	}

	return response.ok
		? { status: 'delete' as const }
		: { message: `http-${response.status}`, status: 'failed' as const };
}

async function claimSsoCallbackQueueRecord(
	record: TSsoCallbackQueue,
	now: number
) {
	const db = await getAccountDatabase();
	const result = await db
		.updateTable(CALLBACK_QUEUE_TABLE_NAME)
		.set({ next_retry_at: now + SSO_CALLBACK_CLAIM_LEASE_MS })
		.where('id', '=', record.id)
		.where('next_retry_at', '=', record.next_retry_at)
		.executeTakeFirst();

	return result.numUpdatedRows === 1n;
}

async function markSsoCallbackFailed(
	record: TSsoCallbackQueue,
	errorMessage: string,
	now: number
) {
	const db = await getAccountDatabase();
	const nextAttempts = record.attempts + 1;
	const isFinalFailed = nextAttempts > SSO_CALLBACK_MAX_ATTEMPTS;
	const nextRetryAt = isFinalFailed
		? CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT
		: now + getSsoCallbackRetryDelayMs(nextAttempts);

	await db
		.updateTable(CALLBACK_QUEUE_TABLE_NAME)
		.set({
			attempts: nextAttempts,
			last_error: errorMessage,
			next_retry_at: nextRetryAt,
		})
		.where('id', '=', record.id)
		.execute();

	return isFinalFailed;
}

async function deleteSsoCallbackQueueRecord(id: TSsoCallbackQueue['id']) {
	const db = await getAccountDatabase();

	await db
		.deleteFrom(CALLBACK_QUEUE_TABLE_NAME)
		.where('id', '=', id)
		.execute();
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
		.orderBy('next_retry_at', 'asc')
		.orderBy('id', 'asc')
		.limit(Math.min(Math.max(1, limit), SSO_CALLBACK_DISPATCH_LIMIT))
		.execute();

	let failed = 0;
	let finalFailed = 0;
	let succeeded = 0;

	for (const record of records) {
		const claimNow = Date.now();
		if (!(await claimSsoCallbackQueueRecord(record, claimNow))) {
			continue;
		}

		try {
			const result = await dispatchSsoCallback(record);
			if (result.status === 'delete') {
				await deleteSsoCallbackQueueRecord(record.id);
				succeeded++;
				continue;
			}

			const isFinalFailed = await markSsoCallbackFailed(
				record,
				result.message,
				Date.now()
			);
			if (isFinalFailed) {
				finalFailed++;
			} else {
				failed++;
			}
		} catch (error) {
			const isFinalFailed = await markSsoCallbackFailed(
				record,
				createSsoCallbackErrorMessage(error),
				Date.now()
			);
			if (isFinalFailed) {
				finalFailed++;
			} else {
				failed++;
			}
		}
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
