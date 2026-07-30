import { type Transaction } from 'kysely';
import { type NextRequest, type NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

import { updateCredentialAndRotateSession } from '@/features/account/server/persistence/repositories/credentials';
import {
	type TActiveUserSessionPatch,
	cleanupExpiredSessions,
	createSession,
	createSessionForActiveUser as createSessionForActiveUserRecord,
	updateSessionAndDeleteOtherSessions,
} from '@/features/account/server/persistence/repositories/sessions';

import type {
	TDatabase,
	TSession,
	TSessionNew,
	TUser,
	TUserCredential,
	TUserCredentialUpdate,
	TUserWebauthnCredential,
} from '@/infrastructure/database/schema';
import {
	getRequestIp,
	getRequestUserAgent,
} from '@/infrastructure/http/server/requestContext';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import { getAccountCookieSecureFlag } from './cookiePolicy';
import { createCsrfToken } from './csrf';
import {
	ACCOUNT_SESSION_COOKIE_NAME,
	SESSION_ABSOLUTE_TIMEOUT_MS,
	SESSION_IDLE_TIMEOUT_MS,
	createSessionCookieOptions,
	createSessionToken,
	hashSessionToken,
} from './session';

export const ACCOUNT_SESSION_CLEANUP_BATCH_LIMIT = 1000;
export const ACCOUNT_SESSION_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
export const SESSION_LAST_SEEN_UPDATE_INTERVAL = 10 * 60 * 1000;

let lastAccountSessionCleanupAt = 0;

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
