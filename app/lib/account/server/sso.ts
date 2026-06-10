import { type NextRequest, type NextResponse } from 'next/server';
import { createHash, createHmac, randomBytes } from 'node:crypto';

import { checkFixedLengthEqual, createAccountHmac } from './crypto';
import { getAccountDatabase } from './db';
import { getAccountCookieSecureFlag } from './request';
import { ACCOUNT_COOKIE_NAME_MAP, USER_STATUS_MAP } from '../shared/constants';
import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TSsoCallbackEvent,
	TSsoCallbackQueue,
	TSsoClient,
	TSsoTicket,
	TUser,
} from '@/lib/db/types';
import { getLogSafeErrorCode } from '@/lib/logging';

export const SSO_CONTEXT_COOKIE_MAX_AGE = 10 * 60;
export const SSO_CONTEXT_COOKIE_NAME = ACCOUNT_COOKIE_NAME_MAP.ssoContext;
export const SSO_TICKET_BYTE_LENGTH = 32;
export const SSO_TICKET_TTL_MS = 60 * 1000;
export const SSO_CALLBACK_DISPATCH_LIMIT = 20;
export const SSO_CALLBACK_MAX_ATTEMPTS = 100;
export const SSO_CALLBACK_USER_AGENT = 'Mystia-SSO/1.0';
export const SSO_CALLBACK_TIMEOUT_MS = 5000;
export const SSO_CONTEXT_TRANSACTION_ID_BYTE_LENGTH = 16;

const CLIENT_TABLE_NAME = TABLE_NAME_MAP.ssoClient;
const TICKET_TABLE_NAME = TABLE_NAME_MAP.ssoTicket;
const CALLBACK_QUEUE_TABLE_NAME = TABLE_NAME_MAP.ssoCallbackQueue;
const GRANT_TABLE_NAME = TABLE_NAME_MAP.ssoUserClientGrant;
const USER_TABLE_NAME = TABLE_NAME_MAP.user;

const SSO_CONTEXT_VERSION = 1;
const SSO_CONTEXT_MAX_JSON_BYTES = 4096;
const SSO_FIELD_MAX_LENGTH = 2048;
const SSO_CLIENT_ID_MAX_LENGTH = 128;
const SSO_STATE_MAX_LENGTH = 1024;
const SSO_CODE_VERIFIER_MAX_LENGTH = 256;
const SSO_CODE_CHALLENGE_LENGTH = 43;
const SSO_TICKET_LENGTH = Math.ceil((SSO_TICKET_BYTE_LENGTH * 8) / 6);
const CALLBACK_FINAL_FAILURE_NEXT_RETRY_AT = Number.MAX_SAFE_INTEGER;
const SSO_CALLBACK_CLAIM_LEASE_MS = SSO_CALLBACK_TIMEOUT_MS + 60_000;
const DANGEROUS_CUSTOM_REDIRECT_SCHEME_SET = new Set([
	'about',
	'blob',
	'data',
	'file',
	'javascript',
	'vbscript',
]);

interface ISsoContextPayload extends ISsoContext {
	expires_at: number;
	version: typeof SSO_CONTEXT_VERSION;
}

interface ISsoCallbackBody {
	client_id: string;
	event: TSsoCallbackEvent;
	timestamp: number;
	user_id: string;
}

export interface ISsoClient extends Omit<
	TSsoClient,
	'custom_scheme_redirect_uris' | 'loopback_redirect_paths' | 'secret_hashes'
> {
	custom_scheme_redirect_uris: string[];
	loopback_redirect_paths: string[];
	secret_hashes: string[];
}

export interface ISsoContext {
	client_id: string;
	code_challenge: string;
	redirect_uri: string;
	state: string;
	transaction_id: string;
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

function normalizeNullableString(value: string | null) {
	const trimmed = value?.trim() ?? '';

	return trimmed === '' ? null : trimmed;
}

function createSha256Hex(value: string) {
	return createHash('sha256').update(value).digest('hex');
}

function checkBase64Url(value: string) {
	return /^[A-Za-z0-9_-]+$/u.test(value);
}

export function checkSsoCallbackEvent(
	value: string
): value is TSsoCallbackEvent {
	return value === 'user_deleted' || value === 'user_disabled';
}

function hasControlCharacter(value: string) {
	for (let index = 0; index < value.length; index++) {
		const codePoint = value.codePointAt(index);
		if (
			codePoint !== undefined &&
			((codePoint >= 0 && codePoint <= 0x1f) || codePoint === 0x7f)
		) {
			return true;
		}
	}

	return false;
}

export function checkSsoClientId(value: string) {
	return (
		value.length > 0 &&
		value.length <= SSO_CLIENT_ID_MAX_LENGTH &&
		/^[A-Za-z0-9._:-]+$/u.test(value)
	);
}

export function checkSsoClientName(value: string) {
	return value.trim().length > 0 && value.length <= 80;
}

export function checkSsoSecretHash(value: string) {
	return /^[a-f0-9]{64}$/u.test(value);
}

export function checkSsoClientSecret(value: string) {
	return value.length > 0 && value.length <= SSO_FIELD_MAX_LENGTH;
}

export function checkSsoState(value: string) {
	return (
		value.length > 0 &&
		value.length <= SSO_STATE_MAX_LENGTH &&
		!hasControlCharacter(value)
	);
}

export function checkSsoCodeChallenge(value: string) {
	return value.length === SSO_CODE_CHALLENGE_LENGTH && checkBase64Url(value);
}

export function checkSsoCodeVerifier(value: string) {
	return (
		value.length > 0 &&
		value.length <= SSO_CODE_VERIFIER_MAX_LENGTH &&
		checkBase64Url(value)
	);
}

export function checkSsoContextTransactionId(value: string) {
	return (
		value.length ===
			Math.ceil((SSO_CONTEXT_TRANSACTION_ID_BYTE_LENGTH * 8) / 6) &&
		checkBase64Url(value)
	);
}

export function checkSsoTicketFormat(value: string) {
	return value.length === SSO_TICKET_LENGTH && checkBase64Url(value);
}

export function checkSsoLoopbackRedirectPath(value: string) {
	return (
		value.length > 0 &&
		value.length <= 256 &&
		value.startsWith('/') &&
		!value.startsWith('//') &&
		!hasControlCharacter(value) &&
		!/[?#]/u.test(value)
	);
}

export function checkSsoCustomSchemeRedirectUri(value: string) {
	if (value.length === 0 || value.length > SSO_FIELD_MAX_LENGTH) {
		return false;
	}

	try {
		const url = new URL(value);
		const scheme = url.protocol.slice(0, -1).toLowerCase();
		const protocolPrefix = `${url.protocol}//`;

		return (
			/^[a-z][a-z0-9+.-]{1,63}$/u.test(scheme) &&
			!DANGEROUS_CUSTOM_REDIRECT_SCHEME_SET.has(scheme) &&
			url.protocol !== 'http:' &&
			url.protocol !== 'https:' &&
			value.toLowerCase().startsWith(protocolPrefix) &&
			url.hostname !== '' &&
			url.username === '' &&
			url.password === '' &&
			url.hash === ''
		);
	} catch {
		return false;
	}
}

export function checkSsoStatusCallbackUrl(value: string | null) {
	if (value === null) {
		return true;
	}

	try {
		const url = new URL(value);
		return (
			value.length <= SSO_FIELD_MAX_LENGTH &&
			url.protocol === 'https:' &&
			url.username === '' &&
			url.password === '' &&
			url.hash === ''
		);
	} catch {
		return false;
	}
}

export function checkSsoRedirectUriFormat(value: string) {
	if (value.length === 0 || value.length > SSO_FIELD_MAX_LENGTH) {
		return false;
	}

	try {
		const url = new URL(value);
		if (url.protocol === 'http:') {
			return (
				(url.hostname === '127.0.0.1' ||
					url.hostname === '[::1]' ||
					url.hostname === '::1') &&
				url.username === '' &&
				url.password === '' &&
				url.hash === '' &&
				checkSsoLoopbackRedirectPath(url.pathname)
			);
		}

		return checkSsoCustomSchemeRedirectUri(value);
	} catch {
		return false;
	}
}

export function normalizeSsoOptionalUri(value: string | null | undefined) {
	return normalizeNullableString(value ?? null);
}

export function validateSsoClientConfig(input: {
	cancel_redirect_uri: string | null;
	custom_scheme_redirect_uris: string[];
	id: string;
	loopback_redirect_paths: string[];
	name: string;
	secret_hashes: string[];
	status_callback_url: string | null;
}) {
	if (!checkSsoClientId(input.id) || !checkSsoClientName(input.name)) {
		return false;
	}
	if (
		input.secret_hashes.length === 0 ||
		input.secret_hashes.some(
			(secretHash) => !checkSsoSecretHash(secretHash)
		)
	) {
		return false;
	}
	if (
		input.loopback_redirect_paths.some(
			(path) => !checkSsoLoopbackRedirectPath(path)
		) ||
		input.custom_scheme_redirect_uris.some(
			(uri) => !checkSsoCustomSchemeRedirectUri(uri)
		)
	) {
		return false;
	}
	if (
		input.loopback_redirect_paths.length === 0 &&
		input.custom_scheme_redirect_uris.length === 0
	) {
		return false;
	}
	if (!checkSsoStatusCallbackUrl(input.status_callback_url)) {
		return false;
	}
	if (
		input.cancel_redirect_uri !== null &&
		!checkSsoRedirectUriFormat(input.cancel_redirect_uri)
	) {
		return false;
	}

	return true;
}

export function createSsoClientPublicProfile(client: ISsoClient) {
	return {
		cancel_redirect_uri: client.cancel_redirect_uri,
		created_at: client.created_at,
		custom_scheme_redirect_uris: client.custom_scheme_redirect_uris,
		id: client.id,
		loopback_redirect_paths: client.loopback_redirect_paths,
		name: client.name,
		secret_hashes: client.secret_hashes,
		status_callback_url: client.status_callback_url,
		updated_at: client.updated_at,
	};
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
	const client = {
		...record,
		cancel_redirect_uri: normalizeNullableString(
			record.cancel_redirect_uri
		),
		custom_scheme_redirect_uris: customSchemeRedirectUris,
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
		const isLoopbackHost =
			url.hostname === '127.0.0.1' ||
			url.hostname === '[::1]' ||
			url.hostname === '::1';

		return (
			isLoopbackHost &&
			client.loopback_redirect_paths.includes(url.pathname)
		);
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

export function createSsoContextTransactionId() {
	return randomBytes(SSO_CONTEXT_TRANSACTION_ID_BYTE_LENGTH).toString(
		'base64url'
	);
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
			return { ticket: record, user, user_error: null };
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

export function getSsoContextCookieOptions(request?: NextRequest) {
	return {
		httpOnly: true,
		maxAge: SSO_CONTEXT_COOKIE_MAX_AGE,
		path: '/',
		sameSite: 'lax',
		secure:
			request === undefined
				? process.env.NODE_ENV === 'production'
				: getAccountCookieSecureFlag(request),
	} as const;
}

function createSsoContextCookieValue(context: ISsoContext, now = Date.now()) {
	const payload = {
		...context,
		expires_at: now + SSO_CONTEXT_COOKIE_MAX_AGE * 1000,
		version: SSO_CONTEXT_VERSION,
	} satisfies ISsoContextPayload;
	const encodedPayload = Buffer.from(
		JSON.stringify(payload),
		'utf8'
	).toString('base64url');
	const signature = createAccountHmac('sso-context:v1', encodedPayload);

	return `${encodedPayload}.${signature}`;
}

function parseSsoContextCookieValue(value: string, now = Date.now()) {
	const [encodedPayload, signature, extra] = value.split('.');
	if (
		extra !== undefined ||
		encodedPayload === undefined ||
		signature === undefined ||
		!checkBase64Url(encodedPayload) ||
		!checkBase64Url(signature)
	) {
		return null;
	}

	const expectedSignature = createAccountHmac(
		'sso-context:v1',
		encodedPayload
	);
	if (!checkFixedLengthEqual(signature, expectedSignature)) {
		return null;
	}

	const json = Buffer.from(encodedPayload, 'base64url').toString('utf8');
	if (Buffer.byteLength(json, 'utf8') > SSO_CONTEXT_MAX_JSON_BYTES) {
		return null;
	}

	let payload: unknown;
	try {
		payload = JSON.parse(json);
	} catch {
		return null;
	}

	if (
		payload === null ||
		Array.isArray(payload) ||
		typeof payload !== 'object'
	) {
		return null;
	}
	if (
		!('client_id' in payload) ||
		!('redirect_uri' in payload) ||
		!('state' in payload) ||
		!('code_challenge' in payload) ||
		!('transaction_id' in payload) ||
		!('expires_at' in payload) ||
		!('version' in payload) ||
		payload.version !== SSO_CONTEXT_VERSION ||
		typeof payload.client_id !== 'string' ||
		typeof payload.redirect_uri !== 'string' ||
		typeof payload.state !== 'string' ||
		typeof payload.code_challenge !== 'string' ||
		typeof payload.transaction_id !== 'string' ||
		typeof payload.expires_at !== 'number' ||
		!Number.isSafeInteger(payload.expires_at) ||
		payload.expires_at <= now
	) {
		return null;
	}

	const context = {
		client_id: payload.client_id,
		code_challenge: payload.code_challenge,
		redirect_uri: payload.redirect_uri,
		state: payload.state,
		transaction_id: payload.transaction_id,
	} satisfies ISsoContext;

	return checkSsoClientId(context.client_id) &&
		checkSsoRedirectUriFormat(context.redirect_uri) &&
		checkSsoState(context.state) &&
		checkSsoCodeChallenge(context.code_challenge) &&
		checkSsoContextTransactionId(context.transaction_id)
		? context
		: null;
}

export function setSsoContextCookie(
	response: NextResponse,
	context: ISsoContext,
	request?: NextRequest
) {
	response.cookies.set(
		SSO_CONTEXT_COOKIE_NAME,
		createSsoContextCookieValue(context),
		getSsoContextCookieOptions(request)
	);
}

export function getSsoContextCookie(request: NextRequest) {
	const value = request.cookies.get(SSO_CONTEXT_COOKIE_NAME)?.value;

	return value === undefined ? null : parseSsoContextCookieValue(value);
}

export function getSsoContextCookieValue(value: string | undefined) {
	return value === undefined ? null : parseSsoContextCookieValue(value);
}

export function clearSsoContextCookie(
	response: NextResponse,
	request?: NextRequest
) {
	response.cookies.set(SSO_CONTEXT_COOKIE_NAME, '', {
		...getSsoContextCookieOptions(request),
		maxAge: 0,
	});
}

export function createSsoRedirectUrl(
	redirectUri: string,
	ticket: string,
	state: string
) {
	const url = new URL(redirectUri);
	url.searchParams.set('ticket', ticket);
	url.searchParams.set('state', state);

	return url.toString();
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

	await db.transaction().execute(async (trx) => {
		await trx
			.updateTable(CALLBACK_QUEUE_TABLE_NAME)
			.set({
				attempts: nextAttempts,
				last_error: errorMessage,
				next_retry_at: nextRetryAt,
			})
			.where('id', '=', record.id)
			.execute();
	});

	return isFinalFailed;
}

async function deleteSsoCallbackQueueRecord(id: TSsoCallbackQueue['id']) {
	const db = await getAccountDatabase();

	await db.transaction().execute(async (trx) => {
		await trx
			.deleteFrom(CALLBACK_QUEUE_TABLE_NAME)
			.where('id', '=', id)
			.execute();
	});
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
