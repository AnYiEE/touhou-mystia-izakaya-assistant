import { randomBytes } from 'node:crypto';

import { ACCOUNT_COOKIE_NAME_MAP } from '../shared/constants';
import { createAccountHmac } from './crypto';

export const SESSION_TOKEN_BYTE_LENGTH = 32;
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 5;
export const ACCOUNT_SESSION_COOKIE_NAME = ACCOUNT_COOKIE_NAME_MAP.session;
export const ADMIN_SESSION_COOKIE_NAME = ACCOUNT_COOKIE_NAME_MAP.adminSession;

export function createSessionToken() {
	return randomBytes(SESSION_TOKEN_BYTE_LENGTH).toString('base64url');
}

export function hashSessionToken(token: string) {
	return createAccountHmac('session:v1', token);
}

export function createSessionCookieOptions(isSecure: boolean) {
	return {
		httpOnly: true,
		maxAge: SESSION_COOKIE_MAX_AGE,
		path: '/',
		sameSite: 'lax',
		secure: isSecure,
	} as const;
}
