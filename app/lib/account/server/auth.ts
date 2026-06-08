import { randomUUID } from 'node:crypto';
import { type NextRequest, type NextResponse } from 'next/server';

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
import { USER_STATUS_MAP } from '../shared/constants';
import {
	type TActiveUserSessionPatch,
	createSession,
	createSessionForActiveUser as createSessionForActiveUserRecord,
	deleteSessionById,
	getSessionByTokenHash,
	updateSessionAndDeleteOtherSessions,
	updateSessionLastSeen,
} from '@/actions/account/sessions';
import { findUserById } from '@/actions/account/users';
import {
	getCredentialByUserId,
	updateCredentialAndRotateSession,
} from '@/actions/account/credentials';
import {
	type TSession,
	type TSessionNew,
	type TUser,
	type TUserCredential,
	type TUserCredentialUpdate,
} from '@/lib/db/types';

export const SESSION_LAST_SEEN_UPDATE_INTERVAL = 10 * 60 * 1000;

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

export async function createAccountSession(
	userId: TUser['id'],
	request: NextRequest
) {
	const { record, ...session } = createAccountSessionDraft(userId, request);

	await createSession(record);

	return session;
}

export async function createAccountSessionForActiveUser(
	userId: TUser['id'],
	request: NextRequest,
	user: TActiveUserSessionPatch,
	credentialPasswordHash?: TUserCredential['password_hash']
) {
	const draft = createAccountSessionDraft(userId, request);
	const { user_id: _userId, ...session } = draft.record;

	const didCreate = await createSessionForActiveUserRecord({
		...(credentialPasswordHash === undefined
			? {}
			: { credentialPasswordHash }),
		session,
		user,
		userId,
	});
	if (!didCreate) {
		return null;
	}

	return {
		cookieOptions: draft.cookieOptions,
		csrfToken: draft.csrfToken,
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

export async function authenticateAccountRequest(
	request: NextRequest,
	allowPasswordMustChange = false
): Promise<TAccountAuthResult> {
	const token = request.cookies.get(ACCOUNT_SESSION_COOKIE_NAME)?.value;
	if (!token || !isValidSessionTokenFormat(token)) {
		return { httpStatus: 401, message: 'unauthorized', status: 'error' };
	}

	const sessionTokenHash = hashSessionToken(token);
	const session = await getSessionByTokenHash(sessionTokenHash);
	if (session === null) {
		return { httpStatus: 401, message: 'unauthorized', status: 'error' };
	}

	const now = Date.now();
	const isSessionExpired =
		session.created_at + SESSION_ABSOLUTE_TIMEOUT_MS <= now ||
		session.last_seen_at + SESSION_IDLE_TIMEOUT_MS <= now;
	if (isSessionExpired) {
		try {
			await deleteSessionById(session.id);
		} catch (error) {
			console.warn('Failed to delete expired account session.', error);
		}

		return { httpStatus: 401, message: 'unauthorized', status: 'error' };
	}

	const [user, credential] = await Promise.all([
		findUserById(session.user_id),
		getCredentialByUserId(session.user_id),
	]);

	if (user === null || credential === null) {
		try {
			await deleteSessionById(session.id);
		} catch (error) {
			console.warn('Failed to delete orphaned account session.', error);
		}

		return {
			httpStatus: 500,
			message: 'server-misconfigured',
			status: 'error',
		};
	}

	const userStatus: string = user.status;
	if (userStatus === USER_STATUS_MAP.disabled) {
		try {
			await deleteSessionById(session.id);
		} catch (error) {
			console.warn('Failed to delete disabled account session.', error);
		}

		return { httpStatus: 403, message: 'user-disabled', status: 'error' };
	}
	if (userStatus === USER_STATUS_MAP.deleted) {
		try {
			await deleteSessionById(session.id);
		} catch (error) {
			console.warn('Failed to delete deleted account session.', error);
		}

		return { httpStatus: 403, message: 'user-deleted', status: 'error' };
	}
	if (userStatus !== USER_STATUS_MAP.active) {
		return {
			httpStatus: 500,
			message: 'server-misconfigured',
			status: 'error',
		};
	}
	if (credential.password_must_change === 1 && !allowPasswordMustChange) {
		return {
			httpStatus: 403,
			message: 'password-must-change',
			status: 'error',
		};
	}

	if (session.last_seen_at + SESSION_LAST_SEEN_UPDATE_INTERVAL < now) {
		try {
			await updateSessionLastSeen(session.id, now);
		} catch (error) {
			console.error('Failed to update account session last seen.', error);
		}
	}

	return {
		data: { credential, session, sessionTokenHash, user },
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
		userId: session.user_id,
	});

	return { csrfToken: createCsrfToken(tokenHash), token, tokenHash };
}

export async function rotateAccountSessionWithCredentialUpdate(
	session: TSession,
	request: NextRequest,
	credential: TUserCredentialUpdate
) {
	const token = createSessionToken();
	const tokenHash = hashSessionToken(token);
	const now = Date.now();

	await updateCredentialAndRotateSession({
		credential,
		session: {
			ip_address: getRequestIp(request),
			last_seen_at: now,
			token_hash: tokenHash,
			user_agent: getRequestUserAgent(request),
		},
		sessionId: session.id,
		userId: session.user_id,
	});

	return { csrfToken: createCsrfToken(tokenHash), token, tokenHash };
}
