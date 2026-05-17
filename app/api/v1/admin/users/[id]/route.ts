import { type NextRequest } from 'next/server';

import {
	checkAccountFeatureResponse,
	checkSameOriginResponse,
} from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';
import {
	authenticateAdminRequest,
	checkAdminFeatureResponse,
} from '../../utils';

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

	const auth = authenticateAdminRequest(request);
	if (auth.status === 'error') {
		return createNoStoreErrorResponse(auth.message, auth.httpStatus);
	}

	const { id } = await params;
	const [usersModule, sessionsModule, userStateModule, userModule] =
		await Promise.all([
			import('@/actions/account/users'),
			import('@/actions/account/sessions'),
			import('@/actions/account/userState'),
			import('@/lib/account/server/user'),
		]);
	const user = await usersModule.findUserById(id);
	if (user === null) {
		return createNoStoreErrorResponse('target-user-not-found', 404);
	}

	const [sessions, namespaces] = await Promise.all([
		sessionsModule.listSessionsByUserId(id),
		userStateModule.listUserNamespaces(id),
	]);

	return createNoStoreJsonResponse({
		namespaces,
		session_count: sessions.length,
		user: userModule.createAccountUserProfile(user),
	});
}
