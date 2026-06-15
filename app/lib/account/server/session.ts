import { randomBytes } from 'node:crypto';

import { createAccountHmac } from './crypto';
import { ACCOUNT_COOKIE_NAME_MAP } from '../shared/constants';

const COOKIE_DOMAIN_PATTERN = /^\.?[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/u;

export const SESSION_TOKEN_BYTE_LENGTH = 32;
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;
export const SESSION_ABSOLUTE_TIMEOUT_MS = SESSION_COOKIE_MAX_AGE * 1000;
export const SESSION_IDLE_TIMEOUT_MS = 60 * 60 * 24 * 30 * 1000;
export const ACCOUNT_SESSION_COOKIE_NAME = ACCOUNT_COOKIE_NAME_MAP.session;
export const ADMIN_SESSION_COOKIE_NAME = ACCOUNT_COOKIE_NAME_MAP.adminSession;

export function createSessionToken() {
	return randomBytes(SESSION_TOKEN_BYTE_LENGTH).toString('base64url');
}

export function hashSessionToken(token: string) {
	return createAccountHmac('session:v1', token);
}

export function getAccountCookieDomain() {
	const domain = process.env.ACCOUNT_COOKIE_DOMAIN?.trim();
	if (!domain) {
		return;
	}
	if (!COOKIE_DOMAIN_PATTERN.test(domain) || domain.includes('..')) {
		throw new Error('server-misconfigured');
	}

	return domain;
}

export function createAccountCookieDomainOptions() {
	const domain = getAccountCookieDomain();

	return domain === undefined ? {} : { domain };
}

export function createSessionCookieOptions(isSecure: boolean) {
	return {
		...createAccountCookieDomainOptions(),
		httpOnly: true,
		maxAge: SESSION_COOKIE_MAX_AGE,
		path: '/',
		sameSite: 'lax',
		secure: isSecure,
	} as const;
}
