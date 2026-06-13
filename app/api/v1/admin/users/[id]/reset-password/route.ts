import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityResponse,
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
	readJsonBodyResult,
} from '@/lib/account/server/routeResponses';
import {
	authenticateAdminRequest,
	checkAdminCsrfResponse,
	checkAdminFeatureResponse,
	createAdminAuthErrorResponse,
} from '@/lib/account/server/adminRouteResponses';
import { USER_STATUS_MAP } from '@/lib/account/shared/constants';
import { type IAdminResetPasswordBody } from '@/lib/account/shared/types';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const featureResponse = await checkAccountFeatureResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const adminFeatureResponse = checkAdminFeatureResponse();
	if (adminFeatureResponse !== null) {
		return adminFeatureResponse;
	}

	const sameOriginResponse = checkSameOriginResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse = checkAccountCookieSecurityResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const rateLimitResponse = checkAccountRateLimitResponse(
		request,
		'admin-reset-password'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const auth = authenticateAdminRequest(request);
	if (auth.status === 'error') {
		return createAdminAuthErrorResponse(
			request,
			auth.message,
			auth.httpStatus
		);
	}
	const csrfResponse = checkAdminCsrfResponse(request, auth.token);
	if (csrfResponse !== null) {
		return csrfResponse;
	}

	const bodyResult =
		await readJsonBodyResult<IAdminResetPasswordBody>(request);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}

	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	if (typeof body?.password !== 'string') {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const { id } = await params;
	const [passwordModule, usersModule, credentialsModule] = await Promise.all([
		import('@/lib/account/server/password'),
		import('@/lib/account/server/repositories/users'),
		import('@/lib/account/server/repositories/credentials'),
	]);

	if (!passwordModule.checkPasswordPolicy(body.password)) {
		return createNoStoreErrorResponse('invalid-password-rule', 400);
	}
	const user = await usersModule.findUserById(id);
	if (user === null) {
		return createNoStoreErrorResponse('target-user-not-found', 404);
	}
	if (user.status === USER_STATUS_MAP.deleted) {
		return createNoStoreErrorResponse('invalid-user-status', 403);
	}

	try {
		await credentialsModule.updateCredentialAndDeleteSessions(id, {
			failed_attempts: 0,
			locked_until: null,
			password_hash: await passwordModule.hashPassword(body.password),
			password_must_change: 1,
			updated_at: Date.now(),
		});
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === 'user-not-found') {
				return createNoStoreErrorResponse('target-user-not-found', 404);
			}
			if (error.message === 'invalid-user-status') {
				return createNoStoreErrorResponse('invalid-user-status', 403);
			}
			if (error.message === 'credential-not-found') {
				return createNoStoreErrorResponse('credential-not-found', 500);
			}
		}

		throw error;
	}

	return createNoStoreJsonResponse({ message: 'password-reset' });
}
