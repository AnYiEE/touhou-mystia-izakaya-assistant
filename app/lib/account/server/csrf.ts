import { randomBytes } from 'node:crypto';

import { checkFixedLengthEqual, createAccountHmac } from './crypto';

export const CSRF_NONCE_BYTE_LENGTH = 16;
const CSRF_NONCE_BASE64URL_LENGTH = 22;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/u;

export function createCsrfToken(sessionTokenHash: string) {
	const nonce = randomBytes(CSRF_NONCE_BYTE_LENGTH).toString('base64url');
	const signature = createAccountHmac(
		'csrf:v1',
		`${sessionTokenHash}.${nonce}`
	);

	return `${nonce}.${signature}`;
}

export function verifyCsrfToken(token: string, sessionTokenHash: string) {
	const [nonce, signature, extra] = token.split('.');
	if (!nonce || !signature || extra !== undefined) {
		return false;
	}
	if (
		nonce.length !== CSRF_NONCE_BASE64URL_LENGTH ||
		!BASE64URL_PATTERN.test(nonce)
	) {
		return false;
	}

	const expectedSignature = createAccountHmac(
		'csrf:v1',
		`${sessionTokenHash}.${nonce}`
	);

	return checkFixedLengthEqual(signature, expectedSignature);
}
