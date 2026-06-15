import { type NextRequest, type NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';

import { checkFixedLengthEqual, createAccountHmac } from './crypto';
import { getAccountCookieSecureFlag } from './request';
import { createAccountCookieDomainOptions } from './session';
import {
	checkSsoClientId,
	checkSsoCodeChallenge,
	checkSsoContextTransactionId,
	checkSsoRedirectUriFormat,
	checkSsoState,
} from './ssoValidation';
import { ACCOUNT_COOKIE_NAME_MAP } from '../shared/constants';

export const SSO_CONTEXT_COOKIE_MAX_AGE = 10 * 60;
export const SSO_CONTEXT_COOKIE_NAME = ACCOUNT_COOKIE_NAME_MAP.ssoContext;
export const SSO_TICKET_BYTE_LENGTH = 32;
export const SSO_TICKET_TTL_MS = 60 * 1000;
export const SSO_CONTEXT_TRANSACTION_ID_BYTE_LENGTH = 16;

const SSO_CONTEXT_VERSION = 1;
const SSO_CONTEXT_MAX_JSON_BYTES = 4096;

interface ISsoContextPayload {
	client_id: string;
	code_challenge: string;
	expires_at: number;
	redirect_uri: string;
	state: string;
	transaction_id: string;
	version: typeof SSO_CONTEXT_VERSION;
}

export interface ISsoContext {
	client_id: string;
	code_challenge: string;
	redirect_uri: string;
	state: string;
	transaction_id: string;
}

function checkBase64Url(value: string) {
	return /^[A-Za-z0-9_-]+$/u.test(value);
}

export function createSsoContextTransactionId() {
	return randomBytes(SSO_CONTEXT_TRANSACTION_ID_BYTE_LENGTH).toString(
		'base64url'
	);
}

export function getSsoContextCookieOptions(request?: NextRequest) {
	return {
		...createAccountCookieDomainOptions(),
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
