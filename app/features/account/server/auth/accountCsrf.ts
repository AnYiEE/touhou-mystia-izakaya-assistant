import { type NextRequest } from 'next/server';

import { createCsrfToken, verifyCsrfToken } from './csrf';

export function verifyAccountCsrf(
	request: NextRequest,
	sessionTokenHash: string
) {
	const token = request.headers.get('x-csrf-token');

	return token !== null && verifyCsrfToken(token, sessionTokenHash);
}

export function verifyAccountCsrfToken(
	token: string,
	sessionTokenHash: string
) {
	return verifyCsrfToken(token, sessionTokenHash);
}

export function createAccountCsrfToken(sessionTokenHash: string) {
	return createCsrfToken(sessionTokenHash);
}
