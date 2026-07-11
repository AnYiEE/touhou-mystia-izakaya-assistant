import { type Transaction, sql } from 'kysely';

import { getAccountDatabase } from '@/lib/account/server/db';
import { USER_STATUS_MAP } from '@/lib/account/shared/constants';
import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TDatabase,
	TSession,
	TSessionNew,
	TSessionUpdate,
	TUser,
	TUserCredential,
	TUserUpdate,
	TUserWebauthnCredential,
} from '@/lib/db/types';

const TABLE_NAME = TABLE_NAME_MAP.session;
const USER_TABLE_NAME = TABLE_NAME_MAP.user;
const USER_CREDENTIAL_TABLE_NAME = TABLE_NAME_MAP.userCredential;
const USER_WEBAUTHN_CREDENTIAL_TABLE_NAME =
	TABLE_NAME_MAP.userWebauthnCredential;

export type TSessionMutablePatch = Pick<
	TSessionUpdate,
	'ip_address' | 'last_seen_at' | 'token_hash' | 'user_agent'
>;
export type TActiveUserSessionPatch = Pick<
	TUserUpdate,
	'last_login_at' | 'updated_at'
>;
export type TAuthenticatedSessionIdentity = Pick<TSession, 'id' | 'token_hash'>;
export interface IWebauthnSessionCredentialUse {
	credentialId: TUserWebauthnCredential['credential_id'];
	expectedCounter: TUserWebauthnCredential['counter'];
	id: TUserWebauthnCredential['id'];
	lastUsedAt: TUserWebauthnCredential['last_used_at'];
	nextCounter: TUserWebauthnCredential['counter'];
}

export type TAuthenticateSessionSnapshotResult =
	| {
			cleanupFailed: boolean;
			status:
				| 'orphaned'
				| 'session-expired'
				| 'user-deleted'
				| 'user-disabled';
	  }
	| {
			status:
				| 'password-must-change'
				| 'session-not-found'
				| 'unexpected-user-status';
	  }
	| {
			credential: TUserCredential;
			session: TSession;
			shouldUpdateLastSeen: boolean;
			status: 'ok';
			user: TUser;
	  };

class WebauthnCredentialStaleError extends Error {
	constructor() {
		super('webauthn-credential-stale');
		this.name = 'WebauthnCredentialStaleError';
	}
}

export async function lockActiveUserSessionInTransaction(
	trx: Transaction<TDatabase>,
	userId: TUser['id'],
	session: TAuthenticatedSessionIdentity
) {
	const lockResult = await trx
		.updateTable(USER_TABLE_NAME)
		.set({ updated_at: sql<TUser['updated_at']>`updated_at` })
		.where('id', '=', userId)
		.where('status', '=', USER_STATUS_MAP.active)
		.where(
			'id',
			'in',
			trx
				.selectFrom(TABLE_NAME)
				.select('user_id')
				.where('id', '=', session.id)
				.where('user_id', '=', userId)
				.where('token_hash', '=', session.token_hash)
		)
		.executeTakeFirst();

	return lockResult.numUpdatedRows === 1n;
}

export async function checkActiveUserSession(
	userId: TUser['id'],
	session: TAuthenticatedSessionIdentity
) {
	const db = await getAccountDatabase();

	return db
		.transaction()
		.execute((trx) =>
			lockActiveUserSessionInTransaction(trx, userId, session)
		);
}

export async function createSession(session: TSessionNew) {
	const db = await getAccountDatabase();

	await db.insertInto(TABLE_NAME).values(session).execute();
}

export async function createSessionForActiveUser({
	credentialPasswordHash,
	session,
	user,
	userId,
	webauthnCredential,
	writeAuditLog,
}: {
	credentialPasswordHash?: TUserCredential['password_hash'];
	session: Omit<TSessionNew, 'user_id'>;
	user: TActiveUserSessionPatch;
	userId: TUser['id'];
	webauthnCredential?: IWebauthnSessionCredentialUse;
	writeAuditLog?: (trx: Transaction<TDatabase>, now: number) => Promise<void>;
}) {
	const db = await getAccountDatabase();
	const now = Date.now();

	try {
		return await db.transaction().execute(async (trx) => {
			let updateQuery = trx
				.updateTable(USER_TABLE_NAME)
				.set(user)
				.where('id', '=', userId)
				.where('status', '=', USER_STATUS_MAP.active);
			if (credentialPasswordHash !== undefined) {
				updateQuery = updateQuery.where(
					'id',
					'in',
					trx
						.selectFrom(USER_CREDENTIAL_TABLE_NAME)
						.select('user_id')
						.where('user_id', '=', userId)
						.where('password_hash', '=', credentialPasswordHash)
				);
			}
			const updateResult = await updateQuery.executeTakeFirst();
			if (updateResult.numUpdatedRows !== 1n) {
				const currentUser = await trx
					.selectFrom(USER_TABLE_NAME)
					.select('status')
					.where('id', '=', userId)
					.executeTakeFirst();
				if (currentUser?.status !== USER_STATUS_MAP.active) {
					return { status: 'user-unavailable' as const };
				}

				if (credentialPasswordHash !== undefined) {
					const currentCredential = await trx
						.selectFrom(USER_CREDENTIAL_TABLE_NAME)
						.select('password_hash')
						.where('user_id', '=', userId)
						.executeTakeFirst();
					if (
						currentCredential?.password_hash !==
						credentialPasswordHash
					) {
						return { status: 'credential-stale' as const };
					}
				}

				return { status: 'user-unavailable' as const };
			}

			if (webauthnCredential !== undefined) {
				const credentialUpdateResult = await trx
					.updateTable(USER_WEBAUTHN_CREDENTIAL_TABLE_NAME)
					.set({
						counter: webauthnCredential.nextCounter,
						last_used_at: webauthnCredential.lastUsedAt,
					})
					.where('id', '=', webauthnCredential.id)
					.where('user_id', '=', userId)
					.where(
						'credential_id',
						'=',
						webauthnCredential.credentialId
					)
					.where('counter', '=', webauthnCredential.expectedCounter)
					.executeTakeFirst();
				if (credentialUpdateResult.numUpdatedRows !== 1n) {
					throw new WebauthnCredentialStaleError();
				}
			}

			await trx
				.insertInto(TABLE_NAME)
				.values({ ...session, user_id: userId })
				.execute();
			await writeAuditLog?.(trx, now);

			return { status: 'ok' as const };
		});
	} catch (error) {
		if (error instanceof WebauthnCredentialStaleError) {
			return { status: 'credential-stale' as const };
		}
		throw error;
	}
}

export async function getSessionByTokenHash(tokenHash: TSession['token_hash']) {
	const db = await getAccountDatabase();

	return (
		(await db
			.selectFrom(TABLE_NAME)
			.selectAll()
			.where('token_hash', '=', tokenHash)
			.executeTakeFirst()) ?? null
	);
}

export async function authenticateSessionSnapshot({
	absoluteTimeoutMs,
	allowPasswordMustChange,
	idleTimeoutMs,
	lastSeenUpdateIntervalMs,
	now,
	tokenHash,
}: {
	absoluteTimeoutMs: number;
	allowPasswordMustChange: boolean;
	idleTimeoutMs: number;
	lastSeenUpdateIntervalMs: number;
	now: number;
	tokenHash: TSession['token_hash'];
}): Promise<TAuthenticateSessionSnapshotResult> {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		const session = await trx
			.selectFrom(TABLE_NAME)
			.selectAll()
			.where('token_hash', '=', tokenHash)
			.executeTakeFirst();
		if (session === undefined) {
			return { status: 'session-not-found' };
		}

		const deleteCurrentSessionBestEffort = async () => {
			try {
				await trx
					.deleteFrom(TABLE_NAME)
					.where('id', '=', session.id)
					.where('token_hash', '=', tokenHash)
					.execute();
				return false;
			} catch {
				return true;
			}
		};

		if (
			session.created_at + absoluteTimeoutMs <= now ||
			session.last_seen_at + idleTimeoutMs <= now
		) {
			return {
				cleanupFailed: await deleteCurrentSessionBestEffort(),
				status: 'session-expired',
			};
		}

		const user = await trx
			.selectFrom(USER_TABLE_NAME)
			.selectAll()
			.where('id', '=', session.user_id)
			.executeTakeFirst();
		const credential = await trx
			.selectFrom(USER_CREDENTIAL_TABLE_NAME)
			.selectAll()
			.where('user_id', '=', session.user_id)
			.executeTakeFirst();
		if (user === undefined || credential === undefined) {
			return {
				cleanupFailed: await deleteCurrentSessionBestEffort(),
				status: 'orphaned',
			};
		}

		const userStatus: string = user.status;
		if (userStatus === USER_STATUS_MAP.disabled) {
			return {
				cleanupFailed: await deleteCurrentSessionBestEffort(),
				status: 'user-disabled',
			};
		}
		if (userStatus === USER_STATUS_MAP.deleted) {
			return {
				cleanupFailed: await deleteCurrentSessionBestEffort(),
				status: 'user-deleted',
			};
		}
		if (userStatus !== USER_STATUS_MAP.active) {
			return { status: 'unexpected-user-status' };
		}
		if (credential.password_must_change === 1 && !allowPasswordMustChange) {
			return { status: 'password-must-change' };
		}

		return {
			credential,
			session,
			shouldUpdateLastSeen:
				session.last_seen_at + lastSeenUpdateIntervalMs < now,
			status: 'ok',
			user,
		};
	});
}

export async function cleanupExpiredSessions({
	absoluteBefore,
	idleBefore,
	limit,
}: {
	absoluteBefore: TSession['created_at'];
	idleBefore: TSession['last_seen_at'];
	limit?: number;
}) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		let expiredSessionsQuery = trx
			.selectFrom(TABLE_NAME)
			.select('id')
			.where((eb) =>
				eb.or([
					eb('created_at', '<=', absoluteBefore),
					eb('last_seen_at', '<=', idleBefore),
				])
			)
			.orderBy('last_seen_at', 'asc')
			.orderBy('created_at', 'asc')
			.orderBy('id', 'asc');

		if (limit !== undefined) {
			expiredSessionsQuery = expiredSessionsQuery.limit(limit);
		}

		const expiredSessions = await expiredSessionsQuery.execute();
		if (expiredSessions.length === 0) {
			return 0;
		}

		const result = await trx
			.deleteFrom(TABLE_NAME)
			.where(
				'id',
				'in',
				expiredSessions.map((session) => session.id)
			)
			.executeTakeFirst();

		return Number(result.numDeletedRows);
	});
}

export async function deleteSessionById(id: TSession['id']) {
	const db = await getAccountDatabase();

	await db.deleteFrom(TABLE_NAME).where('id', '=', id).execute();
}

export async function deleteSessionByIdWithAudit(
	userId: TUser['id'],
	session: TAuthenticatedSessionIdentity,
	writeAuditLog: (trx: Transaction<TDatabase>, now: number) => Promise<void>
) {
	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
		if (!(await lockActiveUserSessionInTransaction(trx, userId, session))) {
			return false;
		}
		const result = await trx
			.deleteFrom(TABLE_NAME)
			.where('id', '=', session.id)
			.where('user_id', '=', userId)
			.where('token_hash', '=', session.token_hash)
			.executeTakeFirst();
		if (result.numDeletedRows !== 1n) {
			return false;
		}

		await writeAuditLog(trx, now);

		return true;
	});
}

export async function deleteOtherSessionByUserId({
	currentSessionId,
	sessionId,
	userId,
}: {
	currentSessionId: TSession['id'];
	sessionId: TSession['id'];
	userId: TUser['id'];
}) {
	const db = await getAccountDatabase();
	const result = await db
		.deleteFrom(TABLE_NAME)
		.where('user_id', '=', userId)
		.where('id', '=', sessionId)
		.where('id', '!=', currentSessionId)
		.executeTakeFirst();

	return result.numDeletedRows === 1n;
}

export async function deleteOtherSessionByUserIdWithAudit(
	{
		currentSessionId,
		currentSessionTokenHash,
		sessionId,
		userId,
	}: {
		currentSessionId: TSession['id'];
		currentSessionTokenHash: TSession['token_hash'];
		sessionId: TSession['id'];
		userId: TUser['id'];
	},
	writeAuditLog: (trx: Transaction<TDatabase>, now: number) => Promise<void>
) {
	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
		if (
			!(await lockActiveUserSessionInTransaction(trx, userId, {
				id: currentSessionId,
				token_hash: currentSessionTokenHash,
			}))
		) {
			return { status: 'unauthorized' as const };
		}
		const result = await trx
			.deleteFrom(TABLE_NAME)
			.where('user_id', '=', userId)
			.where('id', '=', sessionId)
			.where('id', '!=', currentSessionId)
			.executeTakeFirst();
		if (result.numDeletedRows !== 1n) {
			return { status: 'not-found' as const };
		}

		await writeAuditLog(trx, now);

		return { status: 'ok' as const };
	});
}

export async function deleteSessionsByUserId(
	userId: TUser['id'],
	options: { createdBefore?: TSession['created_at'] } = {}
) {
	const db = await getAccountDatabase();
	const query = db.deleteFrom(TABLE_NAME).where('user_id', '=', userId);
	if (options.createdBefore === undefined) {
		const result = await query.executeTakeFirst();
		return Number(result.numDeletedRows);
	}

	const result = await query
		.where('created_at', '<', options.createdBefore)
		.executeTakeFirst();

	return Number(result.numDeletedRows);
}

export async function deleteSessionsByUserIdWithAudit(
	userId: TUser['id'],
	options: {
		createdBefore?: TSession['created_at'];
		initiatingSession?: TAuthenticatedSessionIdentity;
	} = {},
	writeAuditLog: (
		trx: Transaction<TDatabase>,
		now: number,
		deletedSessionCount: number
	) => Promise<void>
) {
	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
		if (
			options.initiatingSession !== undefined &&
			!(await lockActiveUserSessionInTransaction(
				trx,
				userId,
				options.initiatingSession
			))
		) {
			return { deletedSessionCount: 0, status: 'unauthorized' as const };
		}
		let query = trx.deleteFrom(TABLE_NAME).where('user_id', '=', userId);
		if (options.createdBefore !== undefined) {
			query = query.where('created_at', '<', options.createdBefore);
		}

		const result = await query.executeTakeFirst();
		const deletedSessionCount = Number(result.numDeletedRows);
		await writeAuditLog(trx, now, deletedSessionCount);

		return { deletedSessionCount, status: 'ok' as const };
	});
}

export async function deleteOtherSessions(
	userId: TUser['id'],
	sessionId: TSession['id']
) {
	const db = await getAccountDatabase();

	await db
		.deleteFrom(TABLE_NAME)
		.where('user_id', '=', userId)
		.where('id', '!=', sessionId)
		.execute();
}

export async function updateSessionAndDeleteOtherSessions({
	session,
	sessionId,
	sessionTokenHash,
	userId,
}: {
	session: TSessionMutablePatch;
	sessionId: TSession['id'];
	sessionTokenHash: TSession['token_hash'];
	userId: TUser['id'];
}) {
	const db = await getAccountDatabase();

	await db.transaction().execute(async (trx) => {
		if (
			!(await lockActiveUserSessionInTransaction(trx, userId, {
				id: sessionId,
				token_hash: sessionTokenHash,
			}))
		) {
			throw new Error('session-not-found');
		}
		const updateSessionResult = await trx
			.updateTable(TABLE_NAME)
			.set(session)
			.where('id', '=', sessionId)
			.where('user_id', '=', userId)
			.where('token_hash', '=', sessionTokenHash)
			.executeTakeFirst();

		if (updateSessionResult.numUpdatedRows !== 1n) {
			throw new Error('session-not-found');
		}

		await trx
			.deleteFrom(TABLE_NAME)
			.where('user_id', '=', userId)
			.where('id', '!=', sessionId)
			.execute();
	});
}

export async function updateSession(
	id: TSession['id'],
	session: TSessionMutablePatch
) {
	const db = await getAccountDatabase();

	await db
		.updateTable(TABLE_NAME)
		.set(session)
		.where('id', '=', id)
		.execute();
}

export async function listSessionsByUserId(userId: TUser['id']) {
	const db = await getAccountDatabase();

	return db
		.selectFrom(TABLE_NAME)
		.select([
			'created_at',
			'id',
			'ip_address',
			'last_seen_at',
			'user_agent',
			'user_id',
		])
		.where('user_id', '=', userId)
		.orderBy('last_seen_at', 'desc')
		.orderBy('created_at', 'desc')
		.execute();
}

export async function listSessionsForActiveUserSession(
	userId: TUser['id'],
	session: TAuthenticatedSessionIdentity
) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		if (!(await lockActiveUserSessionInTransaction(trx, userId, session))) {
			return { status: 'unauthorized' as const };
		}

		const sessions = await trx
			.selectFrom(TABLE_NAME)
			.select([
				'created_at',
				'id',
				'ip_address',
				'last_seen_at',
				'user_agent',
				'user_id',
			])
			.where('user_id', '=', userId)
			.orderBy('last_seen_at', 'desc')
			.orderBy('created_at', 'desc')
			.execute();

		return { sessions, status: 'ok' as const };
	});
}

export async function updateSessionLastSeen(
	id: TSession['id'],
	tokenHash: TSession['token_hash'],
	lastSeenAt: TSession['last_seen_at']
) {
	const db = await getAccountDatabase();

	await db
		.updateTable(TABLE_NAME)
		.set({ last_seen_at: lastSeenAt })
		.where('id', '=', id)
		.where('token_hash', '=', tokenHash)
		.where('last_seen_at', '<', lastSeenAt)
		.execute();
}
