import { type Transaction } from 'kysely';
import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	createAccountAuthErrorRouteResponse,
	readJsonBodyResult,
} from '@/lib/account/server/routeResponses';
import {
	type IAccountProfileUpdateBody,
	type IAuthLoginSuccessResponse,
} from '@/lib/account/shared/types';
import { createRetryAfterHeaders } from '@/lib/api/http';
import { type TDatabase } from '@/lib/db/types';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';
import { getLogSafeErrorCode } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function createNicknameAuditMetadata({
	newNickname,
	oldNickname,
	oldUsername,
	result,
}: {
	newNickname: string | null;
	oldNickname: string | null;
	oldUsername: string;
	result: string;
}) {
	return {
		new_nickname: newNickname,
		new_nickname_empty: newNickname === null,
		nickname: oldNickname,
		old_nickname: oldNickname,
		old_nickname_empty: oldNickname === null,
		result,
		username: oldUsername,
	};
}

function createUsernameAuditMetadata({
	newUsername,
	newUsernameNormalized,
	oldNickname,
	oldUsername,
	oldUsernameNormalized,
	result,
}: {
	newUsername: string;
	newUsernameNormalized: string;
	oldNickname: string | null;
	oldUsername: string;
	oldUsernameNormalized: string;
	result: string;
}) {
	return {
		new_username: newUsername,
		new_username_normalized: newUsernameNormalized,
		nickname: oldNickname,
		old_username: oldUsername,
		old_username_normalized: oldUsernameNormalized,
		result,
		username: oldUsername,
	};
}

async function writeProfileAuditLogsBestEffort({
	accountAuditModule,
	nicknameMetadata,
	request,
	userId,
	usernameMetadata,
}: {
	accountAuditModule: typeof import('@/lib/account/server/accountAuditService');
	nicknameMetadata?: Record<string, unknown>;
	request: NextRequest;
	userId: string;
	usernameMetadata?: Record<string, unknown>;
}) {
	if (usernameMetadata !== undefined) {
		await accountAuditModule.writeAccountAuditLogBestEffort(
			accountAuditModule.createAccountUserAuditLogInput({
				action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
					.usernameChanged,
				metadata: usernameMetadata,
				request,
				userId,
			})
		);
	}
	if (nicknameMetadata !== undefined) {
		await accountAuditModule.writeAccountAuditLogBestEffort(
			accountAuditModule.createAccountUserAuditLogInput({
				action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
					.nicknameChanged,
				metadata: nicknameMetadata,
				request,
				userId,
			})
		);
	}
}

async function writeProfileAuditLogsInTransaction({
	accountAuditModule,
	auditNow,
	nicknameMetadata,
	request,
	trx,
	userId,
	usernameMetadata,
}: {
	accountAuditModule: typeof import('@/lib/account/server/accountAuditService');
	auditNow: number;
	nicknameMetadata?: Record<string, unknown>;
	request: NextRequest;
	trx: Transaction<TDatabase>;
	userId: string;
	usernameMetadata?: Record<string, unknown>;
}) {
	if (usernameMetadata !== undefined) {
		await accountAuditModule.writeAccountAuditLogInTransaction(
			trx,
			accountAuditModule.createAccountUserAuditLogInput({
				action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
					.usernameChanged,
				metadata: usernameMetadata,
				request,
				userId,
			}),
			auditNow
		);
	}
	if (nicknameMetadata !== undefined) {
		await accountAuditModule.writeAccountAuditLogInTransaction(
			trx,
			accountAuditModule.createAccountUserAuditLogInput({
				action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
					.nicknameChanged,
				metadata: nicknameMetadata,
				request,
				userId,
			}),
			auditNow
		);
	}
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

	const preAuthRateLimitResponse = checkAccountPreAuthRateLimitRouteResponse(
		request,
		'account-profile-update'
	);
	if (preAuthRateLimitResponse !== null) {
		return preAuthRateLimitResponse;
	}

	const bodyResult =
		await readJsonBodyResult<IAccountProfileUpdateBody>(request);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}

	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	if (body === null || typeof body !== 'object') {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}
	const bodyRecord = body as Record<string, unknown>;
	if (
		bodyRecord['username'] !== undefined &&
		typeof bodyRecord['username'] !== 'string'
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}
	if (
		bodyRecord['nickname'] !== undefined &&
		typeof bodyRecord['nickname'] !== 'string' &&
		bodyRecord['nickname'] !== null
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}
	if (
		bodyRecord['current_password'] !== undefined &&
		typeof bodyRecord['current_password'] !== 'string'
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}
	if (
		bodyRecord['username'] === undefined &&
		bodyRecord['nickname'] === undefined
	) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const [
		passwordModule,
		credentialsModule,
		authModule,
		userModule,
		usersModule,
		accountAuditModule,
	] = await Promise.all([
		import('@/lib/account/server/password'),
		import('@/lib/account/server/repositories/credentials'),
		import('@/lib/account/server/auth'),
		import('@/lib/account/server/user'),
		import('@/lib/account/server/repositories/users'),
		import('@/lib/account/server/accountAuditService'),
	]);

	const auth = await authModule.authenticateAccountFromRequest(request, true);
	if (auth.status === 'error') {
		return createAccountAuthErrorRouteResponse(auth, request);
	}
	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const oldUsernameNormalized = auth.data.user.username_normalized;
	const oldUsername = auth.data.user.username;
	const oldNickname = auth.data.user.nickname;
	const username =
		typeof bodyRecord['username'] === 'string'
			? bodyRecord['username'].trim()
			: undefined;
	const usernameNormalized =
		username === undefined
			? undefined
			: userModule.normalizeUsername(username);
	const nickname =
		bodyRecord['nickname'] === undefined
			? undefined
			: userModule.normalizeNickname(
					typeof bodyRecord['nickname'] === 'string'
						? bodyRecord['nickname']
						: ''
				);
	const willChangeUsername =
		usernameNormalized !== undefined &&
		usernameNormalized !== oldUsernameNormalized;
	const willChangeNickname =
		nickname !== undefined && nickname !== oldNickname;
	if (username !== undefined && !userModule.checkUsernamePolicy(username)) {
		return createNoStoreErrorResponse('invalid-username', 400);
	}
	if (nickname !== undefined && !userModule.checkNicknamePolicy(nickname)) {
		return createNoStoreErrorResponse('invalid-nickname', 400);
	}

	if (!willChangeUsername && !willChangeNickname) {
		return createNoStoreJsonResponse({
			csrf_token: authModule.createAccountCsrfToken(
				auth.data.sessionTokenHash
			),
			password_must_change:
				auth.data.credential.password_must_change === 1,
			user: userModule.createAccountUserProfile(auth.data.user),
		} satisfies IAuthLoginSuccessResponse);
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'change-profile',
		oldUsernameNormalized
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const now = Date.now();
	let usernameMetadata: Record<string, unknown> | undefined;
	const nicknameMetadata = willChangeNickname
		? createNicknameAuditMetadata({
				newNickname: nickname ?? null,
				oldNickname,
				oldUsername,
				result: 'ok',
			})
		: undefined;
	if (willChangeUsername) {
		const nextUsername = username;
		const nextUsernameNormalized = usernameNormalized;
		if (nextUsername === undefined) {
			return createNoStoreErrorResponse('invalid-object-structure', 400);
		}

		if (typeof bodyRecord['current_password'] !== 'string') {
			return createNoStoreErrorResponse('invalid-password', 401);
		}
		usernameMetadata = createUsernameAuditMetadata({
			newUsername: nextUsername,
			newUsernameNormalized: nextUsernameNormalized,
			oldNickname,
			oldUsername,
			oldUsernameNormalized,
			result: 'ok',
		});

		const lockState = credentialsModule.getCredentialLockState(
			auth.data.credential,
			now
		);
		if (lockState.status === 'locked') {
			await writeProfileAuditLogsBestEffort({
				accountAuditModule,
				request,
				userId: auth.data.user.id,
				usernameMetadata: createUsernameAuditMetadata({
					newUsername: nextUsername,
					newUsernameNormalized: nextUsernameNormalized,
					oldNickname,
					oldUsername,
					oldUsernameNormalized,
					result: 'credential-locked',
				}),
			});

			return createNoStoreErrorResponse(
				'too-many-requests',
				429,
				{ retry_after: lockState.retryAfter },
				{ headers: createRetryAfterHeaders(lockState.retryAfter) }
			);
		}

		const isValidPassword = await passwordModule.verifyPassword(
			auth.data.credential.password_hash,
			bodyRecord['current_password']
		);
		if (!isValidPassword) {
			const failureState =
				await credentialsModule.recordFailedCredentialAttempt(
					auth.data.user.id,
					now
				);
			if (failureState.status === 'locked') {
				await writeProfileAuditLogsBestEffort({
					accountAuditModule,
					request,
					userId: auth.data.user.id,
					usernameMetadata: createUsernameAuditMetadata({
						newUsername: nextUsername,
						newUsernameNormalized: nextUsernameNormalized,
						oldNickname,
						oldUsername,
						oldUsernameNormalized,
						result: 'credential-locked-after-failure',
					}),
				});

				return createNoStoreErrorResponse(
					'too-many-requests',
					429,
					{ retry_after: failureState.retryAfter },
					{
						headers: createRetryAfterHeaders(
							failureState.retryAfter
						),
					}
				);
			}

			await writeProfileAuditLogsBestEffort({
				accountAuditModule,
				request,
				userId: auth.data.user.id,
				usernameMetadata: createUsernameAuditMetadata({
					newUsername: nextUsername,
					newUsernameNormalized: nextUsernameNormalized,
					oldNickname,
					oldUsername,
					oldUsernameNormalized,
					result: 'invalid-current-password',
				}),
			});

			return createNoStoreErrorResponse('invalid-password', 401);
		}
	}

	try {
		const profileUpdateInput: Parameters<
			typeof usersModule.updateActiveUserProfile
		>[0] = { now, oldNickname, oldUsername, userId: auth.data.user.id };
		if (willChangeUsername) {
			profileUpdateInput.credentialPasswordHash =
				auth.data.credential.password_hash;
		}
		if (willChangeNickname) {
			profileUpdateInput.nickname = nickname;
		}
		profileUpdateInput.writeAuditLog = (trx, auditNow) =>
			writeProfileAuditLogsInTransaction({
				accountAuditModule,
				auditNow,
				...(nicknameMetadata === undefined ? {} : { nicknameMetadata }),
				request,
				trx,
				userId: auth.data.user.id,
				...(usernameMetadata === undefined ? {} : { usernameMetadata }),
			});
		if (username !== undefined && usernameNormalized !== undefined) {
			profileUpdateInput.username = username;
			profileUpdateInput.usernameNormalized = usernameNormalized;
		}

		const user =
			await usersModule.updateActiveUserProfile(profileUpdateInput);
		if (user.status === 'credential-locked') {
			const lockedAuditInput: Parameters<
				typeof writeProfileAuditLogsBestEffort
			>[0] = { accountAuditModule, request, userId: auth.data.user.id };
			if (usernameMetadata !== undefined) {
				lockedAuditInput.usernameMetadata = {
					...usernameMetadata,
					result: 'credential-locked-after-verify',
				};
			}

			await writeProfileAuditLogsBestEffort(lockedAuditInput);

			return createNoStoreErrorResponse(
				'too-many-requests',
				429,
				{ retry_after: user.retryAfter },
				{ headers: createRetryAfterHeaders(user.retryAfter) }
			);
		}
		if (user.status === 'credential-stale') {
			const staleAuditInput: Parameters<
				typeof writeProfileAuditLogsBestEffort
			>[0] = { accountAuditModule, request, userId: auth.data.user.id };
			if (usernameMetadata !== undefined) {
				staleAuditInput.usernameMetadata = {
					...usernameMetadata,
					result: 'credential-stale-after-verify',
				};
			}

			await writeProfileAuditLogsBestEffort(staleAuditInput);

			return createNoStoreErrorResponse('invalid-password', 401);
		}
		if (user.status === 'username-conflict') {
			const conflictAuditInput: Parameters<
				typeof writeProfileAuditLogsBestEffort
			>[0] = { accountAuditModule, request, userId: auth.data.user.id };
			if (usernameMetadata !== undefined) {
				conflictAuditInput.usernameMetadata = {
					...usernameMetadata,
					result: 'username-conflict',
				};
			}

			await writeProfileAuditLogsBestEffort({ ...conflictAuditInput });

			return createNoStoreErrorResponse('username-conflict', 409);
		}

		return createNoStoreJsonResponse({
			csrf_token: authModule.createAccountCsrfToken(
				auth.data.sessionTokenHash
			),
			password_must_change:
				auth.data.credential.password_must_change === 1,
			user: userModule.createAccountUserProfile(user.user),
		} satisfies IAuthLoginSuccessResponse);
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === 'invalid-user-status') {
				return createNoStoreErrorResponse('invalid-user-status', 403);
			}
			if (error.message === 'user-not-found') {
				return createNoStoreErrorResponse('unauthorized', 401);
			}
		}

		console.warn('Failed to change account profile.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return createNoStoreErrorResponse('server-misconfigured', 500);
	}
}
