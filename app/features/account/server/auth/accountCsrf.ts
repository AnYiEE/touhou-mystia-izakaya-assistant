import { type NextRequest } from 'next/server';

import { verifyCsrfToken } from './csrf';

export function verifyAccountCsrf(
	request: NextRequest,
	sessionTokenHash: string
) {
	const token = request.headers.get('x-csrf-token');

	return token !== null && verifyCsrfToken(token, sessionTokenHash);
}
