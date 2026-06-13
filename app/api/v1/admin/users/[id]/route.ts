import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityResponse,
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
} from '@/lib/account/server/routeResponses';
import {
	authenticateAdminRequest,
	checkAdminFeatureResponse,
	createAdminAuthErrorResponse,
} from '@/lib/account/server/adminRouteResponses';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
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
		'admin-user-detail'
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

	const { id } = await params;
	const [usersModule, sessionsModule, userStateModule, userModule] =
		await Promise.all([
			import('@/lib/account/server/repositories/users'),
			import('@/lib/account/server/repositories/sessions'),
			import('@/lib/account/server/repositories/userState'),
			import('@/lib/account/server/user'),
		]);
	const user = await usersModule.findUserById(id);
	if (user === null) {
		return createNoStoreErrorResponse('target-user-not-found', 404);
	}

	const [sessions, namespaces] = await Promise.all([
		sessionsModule.listSessionsByUserId(user.id),
		userStateModule.listUserNamespaces(user.id),
	]);

	return createNoStoreJsonResponse({
		namespaces,
		session_count: sessions.length,
		user: userModule.createAccountUserProfile(user),
	});
}
