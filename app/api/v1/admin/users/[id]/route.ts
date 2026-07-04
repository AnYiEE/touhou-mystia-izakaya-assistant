import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/lib/account/server/routeResponses';
import {
	authenticateAdminFromRequest,
	checkAdminFeatureRouteResponse,
	createAdminAuthErrorRouteResponse,
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
	const { id } = await params;
	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const adminFeatureResponse = checkAdminFeatureRouteResponse();
	if (adminFeatureResponse !== null) {
		return adminFeatureResponse;
	}

	const sameOriginResponse = checkSameOriginRouteResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse =
		checkAccountCookieSecurityRouteResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'admin-user-detail',
		'',
		{ parts: [{ name: 'target-user', value: id }] }
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const auth = await authenticateAdminFromRequest(request);
	if (auth.status === 'error') {
		return createAdminAuthErrorRouteResponse(
			request,
			auth.message,
			auth.httpStatus
		);
	}

	const [
		usersModule,
		credentialsModule,
		sessionsModule,
		userStateModule,
		webauthnCredentialsModule,
		presentationModule,
		userModule,
	] = await Promise.all([
		import('@/lib/account/server/repositories/users'),
		import('@/lib/account/server/repositories/credentials'),
		import('@/lib/account/server/repositories/sessions'),
		import('@/lib/account/server/repositories/userState'),
		import('@/lib/account/server/repositories/webauthnCredentials'),
		import('@/lib/account/server/webauthnPresentation'),
		import('@/lib/account/server/user'),
	]);
	const user = await usersModule.findUserById(id);
	if (user === null) {
		return createNoStoreErrorResponse('target-user-not-found', 404);
	}

	const [backupImports, credential, sessions, namespaces, passkeys] =
		await Promise.all([
			userStateModule.listRecentBackupImportRecordsByUserId(user.id),
			credentialsModule.getCredentialByUserId(user.id),
			sessionsModule.listSessionsByUserId(user.id),
			userStateModule.listUserNamespaces(user.id),
			webauthnCredentialsModule.listCredentialsByUserId(user.id),
		]);

	return createNoStoreJsonResponse({
		backup_imports: backupImports,
		has_password: credential?.password_set === 1,
		namespaces,
		passkeys: passkeys.map((passkey) =>
			presentationModule.createWebauthnCredentialSummary(passkey)
		),
		session_count: sessions.length,
		user: userModule.createAccountUserProfile(user),
	});
}
