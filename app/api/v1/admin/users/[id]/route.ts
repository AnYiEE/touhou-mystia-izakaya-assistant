import { type NextRequest } from 'next/server';

import { authenticateAdminFromRequest } from '@/features/account/admin/server/http/authentication';
import {
	checkAdminFeatureRouteResponse,
	createAdminAuthErrorRouteResponse,
} from '@/features/account/admin/server/http/routeResponses';
import { ACCOUNT_API_RESPONSE_CODE_MAP } from '@/features/account/apiResponseCodes';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';

import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';

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
		import('@/features/account/server/persistence/repositories/users'),
		import('@/features/account/server/persistence/repositories/credentials'),
		import('@/features/account/server/persistence/repositories/sessions'),
		import('@/features/account/sync/server'),
		import('@/features/account/webauthn/server/persistence/credentials'),
		import('@/features/account/webauthn/server/presentation'),
		import('@/features/account/server/presentation/user'),
	]);
	const user = await usersModule.findUserById(id);
	if (user === null) {
		return createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.targetUserNotFound,
			404
		);
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
