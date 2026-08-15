import { type Transaction } from 'kysely';
import { type NextRequest } from 'next/server';

import { getAccountDatabase } from '@/features/account/server/persistence/database';
import {
	type TAuthenticateSessionSnapshotResult,
	authenticateSessionSnapshot,
	authenticateSessionSnapshotInTransaction,
	updateSessionLastSeen,
} from '@/features/account/server/persistence/repositories/sessions';

import type {
	TDatabase,
	TSession,
	TUser,
	TUserCredential,
} from '@/infrastructure/database/schema';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import {
	ACCOUNT_SESSION_COOKIE_NAME,
	SESSION_ABSOLUTE_TIMEOUT_MS,
	SESSION_IDLE_TIMEOUT_MS,
	SESSION_TOKEN_BYTE_LENGTH,
	hashSessionToken,
} from './session';
import {
	SESSION_LAST_SEEN_UPDATE_INTERVAL,
	cleanupExpiredAccountSessionsBestEffort,
} from './sessionLifecycle';

export type TAccountAuthErrorMessage =
	| 'password-must-change'
	| 'server-misconfigured'
	| 'unauthorized'
	| 'user-deleted'
	| 'user-disabled';

export interface IAuthenticatedAccount {
	credential: TUserCredential;
	session: TSession;
	sessionTokenHash: string;
	user: TUser;
}

export type TAccountAuthResult =
	| { data: IAuthenticatedAccount; status: 'ok' }
	| {
			httpStatus: number;
			message: TAccountAuthErrorMessage;
			status: 'error';
	  };

export type TAccountAuthTransactionResult<TResult> =
	| { data: IAuthenticatedAccount; result: Awaited<TResult>; status: 'ok' }
	| Extract<TAccountAuthResult, { status: 'error' }>;

function isValidSessionTokenFormat(token: string) {
	const expectedLength = Math.ceil((SESSION_TOKEN_BYTE_LENGTH * 8) / 6);

	return token.length === expectedLength && /^[A-Za-z0-9_-]+$/u.test(token);
}

function createAccountAuthResult(
	snapshot: Exclude<TAuthenticateSessionSnapshotResult, { status: 'ok' }>,
	sessionTokenHash: string
): Extract<TAccountAuthResult, { status: 'error' }>;
function createAccountAuthResult(
	snapshot: TAuthenticateSessionSnapshotResult,
	sessionTokenHash: string
): TAccountAuthResult;
function createAccountAuthResult(
	snapshot: Awaited<ReturnType<typeof authenticateSessionSnapshot>>,
	sessionTokenHash: string
): TAccountAuthResult {
	if (snapshot.status === 'orphaned') {
		if (snapshot.cleanupFailed) {
			console.warn('Failed to delete orphaned account session.');
		}
		return {
			httpStatus: 500,
			message: 'server-misconfigured',
			status: 'error',
		};
	}
	if (snapshot.status === 'password-must-change') {
		return {
			httpStatus: 403,
			message: 'password-must-change',
			status: 'error',
		};
	}
	if (snapshot.status === 'session-expired') {
		if (snapshot.cleanupFailed) {
			console.warn('Failed to delete expired account session.');
		}
		return { httpStatus: 401, message: 'unauthorized', status: 'error' };
	}
	if (snapshot.status === 'session-not-found') {
		return { httpStatus: 401, message: 'unauthorized', status: 'error' };
	}
	if (snapshot.status === 'user-deleted') {
		if (snapshot.cleanupFailed) {
			console.warn('Failed to delete deleted account session.');
		}
		return { httpStatus: 403, message: 'user-deleted', status: 'error' };
	}
	if (snapshot.status === 'user-disabled') {
		if (snapshot.cleanupFailed) {
			console.warn('Failed to delete disabled account session.');
		}
		return { httpStatus: 403, message: 'user-disabled', status: 'error' };
	}
	if (snapshot.status !== 'ok') {
		return {
			httpStatus: 500,
			message: 'server-misconfigured',
			status: 'error',
		};
	}

	const { credential, session, user } = snapshot;

	return {
		data: { credential, session, sessionTokenHash, user },
		status: 'ok',
	};
}

async function updateSessionLastSeenBestEffort(
	account: IAuthenticatedAccount,
	now: number
) {
	try {
		await updateSessionLastSeen(
			account.session.id,
			account.sessionTokenHash,
			now
		);
	} catch (error) {
		console.error('Failed to update account session last seen.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}
}

export async function authenticateAccountFromRequest(
	request: NextRequest,
	allowPasswordMustChange = false
): Promise<TAccountAuthResult> {
	const token = request.cookies.get(ACCOUNT_SESSION_COOKIE_NAME)?.value;
	if (!token || !isValidSessionTokenFormat(token)) {
		return { httpStatus: 401, message: 'unauthorized', status: 'error' };
	}

	const sessionTokenHash = hashSessionToken(token);
	const now = Date.now();
	void cleanupExpiredAccountSessionsBestEffort(now);
	const snapshot = await authenticateSessionSnapshot({
		absoluteTimeoutMs: SESSION_ABSOLUTE_TIMEOUT_MS,
		allowPasswordMustChange,
		idleTimeoutMs: SESSION_IDLE_TIMEOUT_MS,
		lastSeenUpdateIntervalMs: SESSION_LAST_SEEN_UPDATE_INTERVAL,
		now,
		tokenHash: sessionTokenHash,
	});

	const auth = createAccountAuthResult(snapshot, sessionTokenHash);
	if (auth.status === 'error') {
		return auth;
	}
	if (snapshot.status === 'ok' && snapshot.shouldUpdateLastSeen) {
		await updateSessionLastSeenBestEffort(auth.data, now);
	}

	return auth;
}

export async function authenticateAccountFromRequestWithTransaction<TResult>(
	request: NextRequest,
	read: (
		trx: Transaction<TDatabase>,
		account: IAuthenticatedAccount
	) => Promise<TResult>,
	allowPasswordMustChange = false
): Promise<TAccountAuthTransactionResult<TResult>> {
	const token = request.cookies.get(ACCOUNT_SESSION_COOKIE_NAME)?.value;
	if (!token || !isValidSessionTokenFormat(token)) {
		return { httpStatus: 401, message: 'unauthorized', status: 'error' };
	}

	const sessionTokenHash = hashSessionToken(token);
	const now = Date.now();
	void cleanupExpiredAccountSessionsBestEffort(now);
	const db = await getAccountDatabase();

	type TSessionSnapshot = Awaited<
		ReturnType<typeof authenticateSessionSnapshotInTransaction>
	>;
	type TTransactionResult =
		| {
				result: Awaited<TResult>;
				snapshot: Extract<TSessionSnapshot, { status: 'ok' }>;
		  }
		| { snapshot: Exclude<TSessionSnapshot, { status: 'ok' }> };

	const lastSeenAccounts: IAuthenticatedAccount[] = [];
	const transactionResult: TTransactionResult = await (async () => {
		try {
			return await db.transaction().execute(async (trx) => {
				const transactionSnapshot =
					await authenticateSessionSnapshotInTransaction(trx, {
						absoluteTimeoutMs: SESSION_ABSOLUTE_TIMEOUT_MS,
						allowPasswordMustChange,
						idleTimeoutMs: SESSION_IDLE_TIMEOUT_MS,
						lastSeenUpdateIntervalMs:
							SESSION_LAST_SEEN_UPDATE_INTERVAL,
						lockActiveSession: true,
						now,
						tokenHash: sessionTokenHash,
					});
				if (transactionSnapshot.status !== 'ok') {
					return { snapshot: transactionSnapshot };
				}

				const account = {
					credential: transactionSnapshot.credential,
					session: transactionSnapshot.session,
					sessionTokenHash,
					user: transactionSnapshot.user,
				} satisfies IAuthenticatedAccount;
				if (transactionSnapshot.shouldUpdateLastSeen) {
					lastSeenAccounts.push(account);
				}

				return {
					result: await read(trx, account),
					snapshot: transactionSnapshot,
				};
			});
		} finally {
			const [lastSeenAccount] = lastSeenAccounts;
			if (lastSeenAccount !== undefined) {
				await updateSessionLastSeenBestEffort(lastSeenAccount, now);
			}
		}
	})();
	if (!('result' in transactionResult)) {
		return createAccountAuthResult(
			transactionResult.snapshot,
			sessionTokenHash
		);
	}

	const { result, snapshot } = transactionResult;

	return {
		data: {
			credential: snapshot.credential,
			session: snapshot.session,
			sessionTokenHash,
			user: snapshot.user,
		},
		result,
		status: 'ok',
	};
}
