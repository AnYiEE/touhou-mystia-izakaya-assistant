import { type NextRequest } from 'next/server';

import {
	checkAdminUserIdAuthorized,
	getAdminSessionToken,
} from '@/features/account/admin/server/auth';
import { authenticateAccountFromRequest } from '@/features/account/server/auth/requestAuthentication';

import { authenticateAdminSessionToken } from './guards';

export async function authenticateAdminFromRequest(request: NextRequest) {
	const adminSessionResult = authenticateAdminSessionToken(
		getAdminSessionToken(request)
	);
	if (adminSessionResult.status === 'ok') {
		return {
			actorId: adminSessionResult.data.payload.username,
			payload: adminSessionResult.data.payload,
			source: 'credentials' as const,
			status: 'ok' as const,
			token: adminSessionResult.data.token,
		};
	}

	const accountAuthResult = await authenticateAccountFromRequest(request);
	if (
		accountAuthResult.status === 'ok' &&
		checkAdminUserIdAuthorized(accountAuthResult.data.user.id)
	) {
		return {
			actorId: accountAuthResult.data.user.id,
			payload: {
				expires_at:
					accountAuthResult.data.session.created_at +
					12 * 60 * 60 * 1000,
				issued_at: accountAuthResult.data.session.created_at,
				nonce: accountAuthResult.data.session.id,
				username: accountAuthResult.data.user.username,
			},
			source: 'user' as const,
			status: 'ok' as const,
			token: `account:${accountAuthResult.data.sessionTokenHash}`,
		};
	}

	return adminSessionResult;
}
