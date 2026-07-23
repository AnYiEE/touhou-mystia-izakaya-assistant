import { type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	readJsonBodyResult,
} from '@/lib/account/server/routeResponses';
import {
	ACCOUNT_SYNC_STATUS_MAP,
	USER_STATUS_MAP,
} from '@/lib/account/shared/constants';
import { type IAuthLoginSuccessResponse } from '@/lib/account/shared/types';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	createNoStoreRedirectResponse,
} from '@/lib/api/routeResponses';
import { getLogSafeErrorCode } from '@/lib/logging';
import { createMainSiteUrl } from '@/lib/siteUrl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SSO_AUTHORIZE_PATH = '/sso/authorize';

type TAuthRegisterRouteSuccessResponse = IAuthLoginSuccessResponse & {
	redirect_to?: string;
};

function checkJsonResponseRequest(request: NextRequest) {
	return (
		request.headers
			.get('accept')
			?.split(',')
			.some(
				(item) => item.trim().split(';', 1)[0] === 'application/json'
			) === true
	);
}

export async function POST(request: NextRequest) {
	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return featureResponse;
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

	const bodyResult =
		await readJsonBodyResult<Record<string, unknown>>(request);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}
	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	const usernameValue = body?.['username'];
	const passwordValue = body?.['password'];
	const nicknameValue = body?.['nickname'];
	if (
		typeof usernameValue !== 'string' ||
		typeof passwordValue !== 'string' ||
		(nicknameValue !== undefined &&
			typeof nicknameValue !== 'string' &&
			nicknameValue !== null)
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const [
		passwordModule,
		usersModule,
		authModule,
		userModule,
		accountAuditModule,
	] = await Promise.all([
		import('@/lib/account/server/password'),
		import('@/lib/account/server/repositories/users'),
		import('@/lib/account/server/auth'),
		import('@/lib/account/server/user'),
		import('@/lib/account/server/accountAuditService'),
	]);

	const username = usernameValue.trim();
	if (!userModule.checkUsernamePolicy(username)) {
		return createNoStoreErrorResponse('invalid-username', 400);
	}
	if (!passwordModule.checkPasswordPolicy(passwordValue)) {
		return createNoStoreErrorResponse('invalid-password-rule', 400);
	}
	const nickname =
		nicknameValue === undefined || nicknameValue === null
			? null
			: userModule.normalizeNickname(nicknameValue);
	if (!userModule.checkNicknamePolicy(nickname)) {
		return createNoStoreErrorResponse('invalid-nickname', 400);
	}

	const usernameNormalized = userModule.normalizeUsername(username);
	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'register',
		usernameNormalized,
		{ noTrustedIpGate: true }
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const existingUser =
		await usersModule.findUserByUsernameNormalized(usernameNormalized);
	if (existingUser !== null) {
		return createNoStoreErrorResponse('username-conflict', 409);
	}

	const now = Date.now();
	const userId = randomUUID();

	let session: ReturnType<typeof authModule.createAccountSessionDraft>;
	let user: Awaited<
		ReturnType<typeof usersModule.createUserWithCredentialAndSession>
	>;

	try {
		const passwordHash = await passwordModule.hashPassword(passwordValue);
		session = authModule.createAccountSessionDraft(userId, request, now);
		user = await usersModule.createUserWithCredentialAndSession(
			{
				created_at: now,
				deleted_at: null,
				id: userId,
				last_login_at: now,
				nickname,
				state_epoch: 0,
				status: USER_STATUS_MAP.active,
				sync_generation: 0,
				sync_status: ACCOUNT_SYNC_STATUS_MAP.active,
				updated_at: now,
				username,
				username_normalized: usernameNormalized,
			},
			{
				failed_attempts: 0,
				locked_until: null,
				password_hash: passwordHash,
				password_must_change: 0,
				password_set: 1,
				updated_at: now,
				user_id: userId,
			},
			session.record,
			(trx, auditNow, createdUser) =>
				accountAuditModule.writeAccountAuditLogInTransaction(
					trx,
					accountAuditModule.createAccountUserAuditLogInput({
						action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
							.registered,
						metadata: {
							auth_record_digest:
								accountAuditModule.createAccountAuditValueDigest(
									session.record.id
								),
							nickname,
							username,
						},
						request,
						userId: createdUser.id,
					}),
					auditNow
				)
		);
	} catch (error) {
		console.warn('Failed to create account registration records.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return createNoStoreErrorResponse('server-misconfigured', 500);
	}
	if (user === null) {
		return createNoStoreErrorResponse('username-conflict', 409);
	}

	const ssoModule = await import('@/lib/account/server/sso');
	const ssoContext = ssoModule.getSsoContextCookie(request);
	const ssoAuthorizeUrl = createMainSiteUrl(SSO_AUTHORIZE_PATH);
	if (ssoContext !== null && !checkJsonResponseRequest(request)) {
		const response = createNoStoreRedirectResponse(ssoAuthorizeUrl);
		authModule.setAccountSessionCookie(response, session.token, request);

		return response;
	}

	const response = createNoStoreJsonResponse({
		csrf_token: session.csrfToken,
		has_password: true,
		password_must_change: false,
		...(ssoContext === null
			? {}
			: { redirect_to: ssoAuthorizeUrl.toString() }),
		user: userModule.createAccountUserProfile(user),
	} satisfies TAuthRegisterRouteSuccessResponse);

	authModule.setAccountSessionCookie(response, session.token, request);

	return response;
}
