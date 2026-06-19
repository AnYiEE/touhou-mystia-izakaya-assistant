import { createHmac, timingSafeEqual } from 'node:crypto';

import { SERVER_MISCONFIGURED_MESSAGE, checkAppSecret } from './environment';

export type TAccountSecretDomain =
	| 'admin:v1'
	| 'audit-value:v1'
	| 'csrf:v1'
	| 'session:v1'
	| 'sso-context:v1'
	| 'sso-ticket:v1';

function getAppSecret() {
	const secret = process.env.APP_SECRET;

	if (!checkAppSecret(secret)) {
		throw new Error(SERVER_MISCONFIGURED_MESSAGE);
	}
	return secret;
}

export function createAccountHmac(domain: TAccountSecretDomain, value: string) {
	return createHmac('sha256', getAppSecret())
		.update(domain)
		.update('\0')
		.update(value)
		.digest('base64url');
}

export function checkFixedLengthEqual(left: string, right: string) {
	if (left.length !== right.length) {
		return false;
	}

	const leftBuffer = Buffer.from(left);
	const rightBuffer = Buffer.from(right);

	if (leftBuffer.length !== rightBuffer.length) {
		return false;
	}

	return timingSafeEqual(leftBuffer, rightBuffer);
}
