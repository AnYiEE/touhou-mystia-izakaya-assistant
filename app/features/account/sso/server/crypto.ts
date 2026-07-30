import { createHash, createHmac, randomBytes } from 'node:crypto';

import {
	checkFixedLengthEqual,
	createAccountHmac,
} from '@/features/account/server/auth/crypto';

import { checkSsoCodeChallenge, checkSsoCodeVerifier } from './validation';

export const SSO_CLIENT_SECRET_BYTE_LENGTH = 32;

export function createSsoClientSecretHash(secret: string) {
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

export function createSsoSha256Hex(value: string) {
	return createHash('sha256').update(value).digest('hex');
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

export function createSsoTicketToken(byteLength: number) {
	return randomBytes(byteLength).toString('base64url');
}

export function hashSsoTicket(ticket: string) {
	return createAccountHmac('sso-ticket:v1', ticket);
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
