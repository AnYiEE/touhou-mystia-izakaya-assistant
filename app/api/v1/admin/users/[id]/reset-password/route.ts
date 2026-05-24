import { type NextRequest } from 'next/server';

import {
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
	readJsonBody,
} from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';
import { type IAdminResetPasswordBody } from '@/lib/account/shared/types';
import {
	authenticateAdminRequest,
	checkAdminCsrfResponse,
	checkAdminFeatureResponse,
} from '../../../utils';

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

	const rateLimitResponse = checkAccountRateLimitResponse(
		request,
		'admin-reset-password'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const auth = authenticateAdminRequest(request);
	if (auth.status === 'error') {
		return createNoStoreErrorResponse(auth.message, auth.httpStatus);
	}
	const csrfResponse = checkAdminCsrfResponse(request, auth.token);
	if (csrfResponse !== null) {
		return csrfResponse;
	}

	const body = await readJsonBody<IAdminResetPasswordBody>(request);
	if (typeof body?.password !== 'string') {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const { id } = await params;
	const [passwordModule, usersModule, credentialsModule] = await Promise.all([
		import('@/lib/account/server/password'),
		import('@/actions/account/users'),
		import('@/actions/account/credentials'),
	]);
	if (!passwordModule.checkPasswordPolicy(body.password)) {
		return createNoStoreErrorResponse('invalid-password-rule', 400);
	}
	const user = await usersModule.findUserById(id);
	if (user === null) {
		return createNoStoreErrorResponse('target-user-not-found', 404);
	}
	if (user.status === 'deleted') {
		return createNoStoreErrorResponse('invalid-user-status', 403);
	}

	await credentialsModule.updateCredentialAndDeleteSessions(id, {
		failed_attempts: 0,
		locked_until: null,
		password_hash: await passwordModule.hashPassword(body.password),
		password_must_change: 1,
		updated_at: Date.now(),
	});

	return createNoStoreJsonResponse({ message: 'password-reset' });
}
