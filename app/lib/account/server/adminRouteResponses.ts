import { type NextRequest } from 'next/server';

import {
	checkAdminUserIdAuthorized,
	getAdminSessionToken,
} from '@/lib/account/server/admin';
import { authenticateAccountFromRequest } from '@/lib/account/server/auth';
import {
	authenticateAdminSessionToken,
	checkAdminCsrfGuard,
	checkAdminFeatureGuard,
} from '@/lib/account/server/guards';
import { createNoStoreErrorResponse } from '@/lib/api/routeResponses';

export function checkAdminFeatureRouteResponse() {
	const result = checkAdminFeatureGuard();
	if (result.status === 'ok') {
		return null;
	}

	return createNoStoreErrorResponse(result.message, result.httpStatus);
}

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

export function createAdminAuthErrorRouteResponse(
	request: NextRequest,
	message: string,
	httpStatus: number
) {
	void request;

	return createNoStoreErrorResponse(message, httpStatus);
}

export function checkAdminCsrfRouteResponse(
	request: NextRequest,
	token: string
) {
	const result = checkAdminCsrfGuard(
		request.headers.get('x-csrf-token'),
		token
	);
	if (result.status === 'ok') {
		return null;
	}

	return createNoStoreErrorResponse(result.message, result.httpStatus);
}
