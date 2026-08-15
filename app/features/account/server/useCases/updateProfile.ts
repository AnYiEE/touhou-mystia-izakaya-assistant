import { type Transaction } from 'kysely';
import { type NextRequest } from 'next/server';

import {
	ACCOUNT_AUDIT_ACTION_MAP,
	createAccountUserAuditLogInput,
	writeAccountAuditLogBestEffort,
	writeAccountAuditLogInTransaction,
} from '@/features/account/server/audit/service';
import { createAccountCsrfToken } from '@/features/account/server/auth/accountCsrf';
import { verifyPassword } from '@/features/account/server/auth/password';
import { type IAuthenticatedAccount } from '@/features/account/server/auth/requestAuthentication';
import {
	getCredentialLockState,
	recordFailedCredentialAttempt,
} from '@/features/account/server/persistence/repositories/credentials';
import { checkActiveUserSession } from '@/features/account/server/persistence/repositories/sessions';
import { updateActiveUserProfile } from '@/features/account/server/persistence/repositories/users';

import type { TDatabase, TUser } from '@/infrastructure/database/schema';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

type TUpdateProfileErrorMessage =
	| 'credential-changed'
	| 'invalid-password'
	| 'invalid-user-status'
	| 'password-not-set'
	| 'server-misconfigured'
	| 'unauthorized'
	| 'username-conflict';

export type TUpdateProfileResult =
	| { message: TUpdateProfileErrorMessage; status: 'error' }
	| { retryAfter: number; status: 'locked' }
	| { csrfToken: string; status: 'ok'; user: TUser };

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
	nicknameMetadata,
	request,
	userId,
	usernameMetadata,
}: {
	nicknameMetadata?: Record<string, unknown>;
	request: NextRequest;
	userId: string;
	usernameMetadata?: Record<string, unknown>;
}) {
	if (usernameMetadata !== undefined) {
		await writeAccountAuditLogBestEffort(
			createAccountUserAuditLogInput({
				action: ACCOUNT_AUDIT_ACTION_MAP.usernameChanged,
				metadata: usernameMetadata,
				request,
				userId,
			})
		);
	}
	if (nicknameMetadata !== undefined) {
		await writeAccountAuditLogBestEffort(
			createAccountUserAuditLogInput({
				action: ACCOUNT_AUDIT_ACTION_MAP.nicknameChanged,
				metadata: nicknameMetadata,
				request,
				userId,
			})
		);
	}
}

async function writeProfileAuditLogsInTransaction({
	auditNow,
	nicknameMetadata,
	request,
	trx,
	userId,
	usernameMetadata,
}: {
	auditNow: number;
	nicknameMetadata?: Record<string, unknown>;
	request: NextRequest;
	trx: Transaction<TDatabase>;
	userId: string;
	usernameMetadata?: Record<string, unknown>;
}) {
	if (usernameMetadata !== undefined) {
		await writeAccountAuditLogInTransaction(
			trx,
			createAccountUserAuditLogInput({
				action: ACCOUNT_AUDIT_ACTION_MAP.usernameChanged,
				metadata: usernameMetadata,
				request,
				userId,
			}),
			auditNow
		);
	}
	if (nicknameMetadata !== undefined) {
		await writeAccountAuditLogInTransaction(
			trx,
			createAccountUserAuditLogInput({
				action: ACCOUNT_AUDIT_ACTION_MAP.nicknameChanged,
				metadata: nicknameMetadata,
				request,
				userId,
			}),
			auditNow
		);
	}
}

export async function updateProfile({
	account,
	currentPassword,
	nickname,
	request,
	username,
	usernameNormalized,
}: {
	account: IAuthenticatedAccount;
	currentPassword?: string;
	nickname?: string | null;
	request: NextRequest;
	username?: string;
	usernameNormalized?: string;
}): Promise<TUpdateProfileResult> {
	const oldUsernameNormalized = account.user.username_normalized;
	const oldUsername = account.user.username;
	const oldNickname = account.user.nickname;
	const willChangeUsername =
		usernameNormalized !== undefined &&
		usernameNormalized !== oldUsernameNormalized;
	const willChangeNickname =
		nickname !== undefined && nickname !== oldNickname;

	if (!willChangeUsername && !willChangeNickname) {
		const isSessionCurrent = await checkActiveUserSession(account.user.id, {
			id: account.session.id,
			token_hash: account.sessionTokenHash,
		});
		return isSessionCurrent
			? {
					csrfToken: createAccountCsrfToken(account.sessionTokenHash),
					status: 'ok',
					user: account.user,
				}
			: { message: 'unauthorized', status: 'error' };
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
		if (username === undefined) {
			return { message: 'server-misconfigured', status: 'error' };
		}
		if (account.credential.password_set !== 1) {
			return { message: 'password-not-set', status: 'error' };
		}
		if (currentPassword === undefined) {
			return { message: 'invalid-password', status: 'error' };
		}
		usernameMetadata = createUsernameAuditMetadata({
			newUsername: username,
			newUsernameNormalized: usernameNormalized,
			oldNickname,
			oldUsername,
			oldUsernameNormalized,
			result: 'ok',
		});

		const lockState = getCredentialLockState(account.credential, now);
		if (lockState.status === 'locked') {
			await writeProfileAuditLogsBestEffort({
				request,
				userId: account.user.id,
				usernameMetadata: {
					...usernameMetadata,
					result: 'credential-locked',
				},
			});
			return lockState;
		}

		if (
			!(await verifyPassword(
				account.credential.password_hash,
				currentPassword
			))
		) {
			const failureState = await recordFailedCredentialAttempt({
				expectedPasswordHash: account.credential.password_hash,
				now,
				session: {
					id: account.session.id,
					token_hash: account.sessionTokenHash,
				},
				userId: account.user.id,
			});
			if (failureState.status === 'locked') {
				await writeProfileAuditLogsBestEffort({
					request,
					userId: account.user.id,
					usernameMetadata: {
						...usernameMetadata,
						result: 'credential-locked-after-failure',
					},
				});
				return failureState;
			}
			if (failureState.status === 'stale') {
				await writeProfileAuditLogsBestEffort({
					request,
					userId: account.user.id,
					usernameMetadata: {
						...usernameMetadata,
						result: 'credential-changed',
					},
				});
				return { message: 'credential-changed', status: 'error' };
			}
			if (failureState.status === 'unauthorized') {
				return { message: 'unauthorized', status: 'error' };
			}

			await writeProfileAuditLogsBestEffort({
				request,
				userId: account.user.id,
				usernameMetadata: {
					...usernameMetadata,
					result: 'invalid-current-password',
				},
			});
			return { message: 'invalid-password', status: 'error' };
		}
	}

	try {
		const profileUpdateInput: Parameters<
			typeof updateActiveUserProfile
		>[0] = {
			now,
			oldNickname,
			oldUsername,
			session: {
				id: account.session.id,
				token_hash: account.session.token_hash,
			},
			userId: account.user.id,
		};
		if (willChangeUsername) {
			profileUpdateInput.credentialPasswordHash =
				account.credential.password_hash;
		}
		if (willChangeNickname) {
			profileUpdateInput.nickname = nickname;
		}
		profileUpdateInput.writeAuditLog = (trx, auditNow) =>
			writeProfileAuditLogsInTransaction({
				auditNow,
				...(nicknameMetadata === undefined ? {} : { nicknameMetadata }),
				request,
				trx,
				userId: account.user.id,
				...(usernameMetadata === undefined ? {} : { usernameMetadata }),
			});
		if (username !== undefined && usernameNormalized !== undefined) {
			profileUpdateInput.username = username;
			profileUpdateInput.usernameNormalized = usernameNormalized;
		}

		const result = await updateActiveUserProfile(profileUpdateInput);
		if (result.status === 'credential-locked') {
			await writeProfileAuditLogsBestEffort({
				request,
				userId: account.user.id,
				...(usernameMetadata === undefined
					? {}
					: {
							usernameMetadata: {
								...usernameMetadata,
								result: 'credential-locked-after-verify',
							},
						}),
			});
			return { retryAfter: result.retryAfter, status: 'locked' };
		}
		if (result.status === 'credential-stale') {
			await writeProfileAuditLogsBestEffort({
				request,
				userId: account.user.id,
				...(usernameMetadata === undefined
					? {}
					: {
							usernameMetadata: {
								...usernameMetadata,
								result: 'credential-changed',
							},
						}),
			});
			return { message: 'credential-changed', status: 'error' };
		}
		if (result.status === 'unauthorized') {
			return { message: 'unauthorized', status: 'error' };
		}
		if (result.status === 'username-conflict') {
			await writeProfileAuditLogsBestEffort({
				request,
				userId: account.user.id,
				...(usernameMetadata === undefined
					? {}
					: {
							usernameMetadata: {
								...usernameMetadata,
								result: 'username-conflict',
							},
						}),
			});
			return { message: 'username-conflict', status: 'error' };
		}

		return {
			csrfToken: createAccountCsrfToken(account.sessionTokenHash),
			status: 'ok',
			user: result.user,
		};
	} catch (error) {
		if (Error.isError(error)) {
			if (error.message === 'invalid-user-status') {
				return { message: 'invalid-user-status', status: 'error' };
			}
			if (error.message === 'user-not-found') {
				return { message: 'unauthorized', status: 'error' };
			}
		}

		console.warn('Failed to change account profile.', {
			errorCode: getLogSafeErrorCode(error),
		});
		return { message: 'server-misconfigured', status: 'error' };
	}
}
