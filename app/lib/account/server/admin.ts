import { randomBytes } from 'node:crypto';
import { type NextRequest, type NextResponse } from 'next/server';

import { checkFixedLengthEqual, createAccountHmac } from './crypto';
import { createCsrfToken, verifyCsrfToken } from './csrf';
import { getAccountCookieSecureFlag } from './request';
import { ACCOUNT_COOKIE_NAME_MAP } from '../shared/constants';

export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

interface IAdminSessionPayload {
	expires_at: number;
	issued_at: number;
	nonce: string;
	username: string;
}

function encodeAdminPayload(payload: IAdminSessionPayload) {
	return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodeAdminPayload(value: string): IAdminSessionPayload | null {
	try {
		const payload = JSON.parse(
			Buffer.from(value, 'base64url').toString('utf8')
		) as IAdminSessionPayload;

		if (
			typeof payload.expires_at !== 'number' ||
			typeof payload.issued_at !== 'number' ||
			typeof payload.nonce !== 'string' ||
			typeof payload.username !== 'string'
		) {
			return null;
		}

		return payload;
	} catch {
		return null;
	}
}

export function checkAdminFeatureEnabled() {
	return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);
}

export function checkAdminCredentials(username: string, password: string) {
	const adminUsername = process.env.ADMIN_USERNAME;
	const adminPassword = process.env.ADMIN_PASSWORD;

	if (!adminUsername || !adminPassword) {
		return false;
	}

	const usernameMatches = checkFixedLengthEqual(
		createAccountHmac('admin:v1', username),
		createAccountHmac('admin:v1', adminUsername)
	);
	const passwordMatches = checkFixedLengthEqual(
		createAccountHmac('admin:v1', password),
		createAccountHmac('admin:v1', adminPassword)
	);

	return usernameMatches && passwordMatches;
}

function getAdminCredentialBinding() {
	const adminUsername = process.env.ADMIN_USERNAME;
	const adminPassword = process.env.ADMIN_PASSWORD;

	if (!adminUsername || !adminPassword) {
		return null;
	}

	return createAccountHmac(
		'admin:v1',
		`${adminUsername}\0${createAccountHmac('admin:v1', adminPassword)}`
	);
}

function createAdminSessionSignature(payload: string) {
	const credentialBinding = getAdminCredentialBinding();
	if (credentialBinding === null) {
		return null;
	}

	return createAccountHmac('admin:v1', `${credentialBinding}\0${payload}`);
}

export function createAdminSessionToken(username: string, now = Date.now()) {
	const adminUsername = process.env.ADMIN_USERNAME;
	if (!adminUsername || username !== adminUsername) {
		throw new Error('feature-disabled');
	}

	const payload = encodeAdminPayload({
		expires_at: now + ADMIN_SESSION_MAX_AGE * 1000,
		issued_at: now,
		nonce: randomBytes(16).toString('base64url'),
		username,
	});
	const signature = createAdminSessionSignature(payload);
	if (signature === null) {
		throw new Error('feature-disabled');
	}

	return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token: string, now = Date.now()) {
	const [payloadValue, signature, extra] = token.split('.');
	if (!payloadValue || !signature || extra !== undefined) {
		return null;
	}

	const expectedSignature = createAdminSessionSignature(payloadValue);
	if (expectedSignature === null) {
		return null;
	}
	if (!checkFixedLengthEqual(signature, expectedSignature)) {
		return null;
	}

	const payload = decodeAdminPayload(payloadValue);
	if (
		!payload ||
		payload.expires_at <= now ||
		payload.username !== process.env.ADMIN_USERNAME
	) {
		return null;
	}

	return payload;
}

export function getAdminSessionCookieOptions(request: NextRequest) {
	return {
		httpOnly: true,
		maxAge: ADMIN_SESSION_MAX_AGE,
		path: '/',
		sameSite: 'lax',
		secure: getAccountCookieSecureFlag(request),
	} as const;
}

export function setAdminSessionCookie(
	response: NextResponse,
	token: string,
	request: NextRequest
) {
	response.cookies.set(
		ACCOUNT_COOKIE_NAME_MAP.adminSession,
		token,
		getAdminSessionCookieOptions(request)
	);
}

export function clearAdminSessionCookie(
	response: NextResponse,
	request: NextRequest
) {
	response.cookies.set(ACCOUNT_COOKIE_NAME_MAP.adminSession, '', {
		...getAdminSessionCookieOptions(request),
		maxAge: 0,
	});
}

export function getAdminSessionToken(request: NextRequest) {
	return (
		request.cookies.get(ACCOUNT_COOKIE_NAME_MAP.adminSession)?.value ?? null
	);
}

export function getAdminCsrfBinding(token: string) {
	return createAccountHmac('admin:v1', token);
}

export function createAdminCsrfToken(token: string) {
	return createCsrfToken(getAdminCsrfBinding(token));
}

export function verifyAdminCsrfToken(csrfToken: string | null, token: string) {
	return (
		csrfToken !== null &&
		verifyCsrfToken(csrfToken, getAdminCsrfBinding(token))
	);
}

export function verifyAdminCsrfRequest(request: NextRequest, token: string) {
	return verifyAdminCsrfToken(request.headers.get('x-csrf-token'), token);
}
