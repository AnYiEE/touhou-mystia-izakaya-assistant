import { type NextRequest, type NextResponse } from 'next/server';
import { type Transaction } from 'kysely';
import { randomUUID } from 'node:crypto';

import { createCsrfToken, verifyCsrfToken } from './csrf';
import {
	getAccountCookieSecureFlag,
	getRequestIp,
	getRequestUserAgent,
} from './request';
import {
	ACCOUNT_SESSION_COOKIE_NAME,
	SESSION_ABSOLUTE_TIMEOUT_MS,
	SESSION_IDLE_TIMEOUT_MS,
	SESSION_TOKEN_BYTE_LENGTH,
	createSessionCookieOptions,
	createSessionToken,
	hashSessionToken,
} from './session';
import { getAccountDatabase } from '@/lib/account/server/db';
import {
	type TActiveUserSessionPatch,
	type TAuthenticateSessionSnapshotResult,
	authenticateSessionSnapshot,
	authenticateSessionSnapshotInTransaction,
	cleanupExpiredSessions,
	createSession,
	createSessionForActiveUser as createSessionForActiveUserRecord,
	updateSessionAndDeleteOtherSessions,
	updateSessionLastSeen,
} from '@/lib/account/server/repositories/sessions';
import { updateCredentialAndRotateSession } from '@/lib/account/server/repositories/credentials';
import {
	type TDatabase,
	type TSession,
	type TSessionNew,
	type TUser,
	type TUserCredential,
	type TUserCredentialUpdate,
	type TUserWebauthnCredential,
} from '@/lib/db/types';
import { getLogSafeErrorCode } from '@/lib/logging';

export const ACCOUNT_SESSION_CLEANUP_BATCH_LIMIT = 1000;
export const ACCOUNT_SESSION_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
export const SESSION_LAST_SEEN_UPDATE_INTERVAL = 10 * 60 * 1000;

let lastAccountSessionCleanupAt = 0;

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

export function getAccountSessionCookieOptions(request: NextRequest) {
	return createSessionCookieOptions(getAccountCookieSecureFlag(request));
}

export function createAccountSessionDraft(
	userId: TUser['id'],
	request: NextRequest,
	now = Date.now()
) {
	const token = createSessionToken();
	const tokenHash = hashSessionToken(token);
	const record = {
		created_at: now,
		id: randomUUID(),
		ip_address: getRequestIp(request),
		last_seen_at: now,
		token_hash: tokenHash,
		user_agent: getRequestUserAgent(request),
		user_id: userId,
	} satisfies TSessionNew;

	return {
		cookieOptions: getAccountSessionCookieOptions(request),
		csrfToken: createCsrfToken(tokenHash),
		record,
		token,
		tokenHash,
	};
}

export async function cleanupExpiredAccountSessionsBestEffort(
	now = Date.now()
) {
	if (
		now - lastAccountSessionCleanupAt <
		ACCOUNT_SESSION_CLEANUP_INTERVAL_MS
	) {
		return;
	}

	lastAccountSessionCleanupAt = now;
	try {
		await cleanupExpiredSessions({
			absoluteBefore: now - SESSION_ABSOLUTE_TIMEOUT_MS,
			idleBefore: now - SESSION_IDLE_TIMEOUT_MS,
			limit: ACCOUNT_SESSION_CLEANUP_BATCH_LIMIT,
		});
	} catch (error) {
		console.warn('Failed to clean up expired account sessions.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}
}

export async function createAccountSession(
	userId: TUser['id'],
	request: NextRequest
) {
	const { record, ...session } = createAccountSessionDraft(userId, request);

	await createSession(record);
	void cleanupExpiredAccountSessionsBestEffort();

	return session;
}

export async function createAccountSessionForActiveUser(
	userId: TUser['id'],
	request: NextRequest,
	user: TActiveUserSessionPatch,
	credentialPasswordHash?: TUserCredential['password_hash'],
	writeAuditLog?: (trx: Transaction<TDatabase>, now: number) => Promise<void>,
	webauthnCredential?: {
		credentialId: TUserWebauthnCredential['credential_id'];
		expectedCounter: TUserWebauthnCredential['counter'];
		id: TUserWebauthnCredential['id'];
		lastUsedAt: TUserWebauthnCredential['last_used_at'];
		nextCounter: TUserWebauthnCredential['counter'];
	}
) {
	const draft = createAccountSessionDraft(userId, request);
	const { user_id: _userId, ...session } = draft.record;

	const createResult = await createSessionForActiveUserRecord({
		...(credentialPasswordHash === undefined
			? {}
			: { credentialPasswordHash }),
		session,
		user,
		userId,
		...(webauthnCredential === undefined ? {} : { webauthnCredential }),
		...(writeAuditLog === undefined ? {} : { writeAuditLog }),
	});
	if (createResult.status !== 'ok') {
		return createResult;
	}
	void cleanupExpiredAccountSessionsBestEffort();

	return {
		cookieOptions: draft.cookieOptions,
		csrfToken: draft.csrfToken,
		status: 'ok' as const,
		token: draft.token,
		tokenHash: draft.tokenHash,
	};
}

export function setAccountSessionCookie(
	response: NextResponse,
	token: string,
	request: NextRequest
) {
	response.cookies.set(
		ACCOUNT_SESSION_COOKIE_NAME,
		token,
		getAccountSessionCookieOptions(request)
	);
}

export function clearAccountSessionCookie(
	response: NextResponse,
	request: NextRequest
) {
	response.cookies.set(ACCOUNT_SESSION_COOKIE_NAME, '', {
		...getAccountSessionCookieOptions(request),
		maxAge: 0,
	});
}

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
	if (snapshot.status === 'session-not-found') {
		return { httpStatus: 401, message: 'unauthorized', status: 'error' };
	}
	if (snapshot.status === 'session-expired') {
		if (snapshot.cleanupFailed) {
			console.warn('Failed to delete expired account session.');
		}
		return { httpStatus: 401, message: 'unauthorized', status: 'error' };
	}
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
	if (snapshot.status === 'user-disabled') {
		if (snapshot.cleanupFailed) {
			console.warn('Failed to delete disabled account session.');
		}
		return { httpStatus: 403, message: 'user-disabled', status: 'error' };
	}
	if (snapshot.status === 'user-deleted') {
		if (snapshot.cleanupFailed) {
			console.warn('Failed to delete deleted account session.');
		}
		return { httpStatus: 403, message: 'user-deleted', status: 'error' };
	}
	if (snapshot.status === 'password-must-change') {
		return {
			httpStatus: 403,
			message: 'password-must-change',
			status: 'error',
		};
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
		console.error('Failed to update account session last seen.', error);
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

export function verifyAccountCsrf(
	request: NextRequest,
	sessionTokenHash: string
) {
	const token = request.headers.get('x-csrf-token');

	return token !== null && verifyCsrfToken(token, sessionTokenHash);
}

export function verifyAccountCsrfToken(
	token: string,
	sessionTokenHash: string
) {
	return verifyCsrfToken(token, sessionTokenHash);
}

export function createAccountCsrfToken(sessionTokenHash: string) {
	return createCsrfToken(sessionTokenHash);
}
export async function rotateAccountSession(
	session: TSession,
	request: NextRequest
) {
	const token = createSessionToken();
	const tokenHash = hashSessionToken(token);
	const now = Date.now();

	await updateSessionAndDeleteOtherSessions({
		session: {
			ip_address: getRequestIp(request),
			last_seen_at: now,
			token_hash: tokenHash,
			user_agent: getRequestUserAgent(request),
		},
		sessionId: session.id,
		sessionTokenHash: session.token_hash,
		userId: session.user_id,
	});

	return { csrfToken: createCsrfToken(tokenHash), token, tokenHash };
}

export async function rotateAccountSessionWithCredentialUpdate(
	session: TSession,
	request: NextRequest,
	credential: TUserCredentialUpdate,
	writeAuditLog?: (trx: Transaction<TDatabase>, now: number) => Promise<void>
) {
	const token = createSessionToken();
	const tokenHash = hashSessionToken(token);
	const now = Date.now();

	await updateCredentialAndRotateSession({
		credential,
		expectedSessionTokenHash: session.token_hash,
		session: {
			ip_address: getRequestIp(request),
			last_seen_at: now,
			token_hash: tokenHash,
			user_agent: getRequestUserAgent(request),
		},
		sessionId: session.id,
		userId: session.user_id,
		...(writeAuditLog === undefined ? {} : { writeAuditLog }),
	});

	return { csrfToken: createCsrfToken(tokenHash), token, tokenHash };
}
