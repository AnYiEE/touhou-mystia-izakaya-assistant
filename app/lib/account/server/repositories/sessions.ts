import { type Transaction } from 'kysely';

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
} from '@/lib/db/types';

const TABLE_NAME = TABLE_NAME_MAP.session;
const USER_TABLE_NAME = TABLE_NAME_MAP.user;
const USER_CREDENTIAL_TABLE_NAME = TABLE_NAME_MAP.userCredential;

export type TSessionMutablePatch = Pick<
	TSessionUpdate,
	'ip_address' | 'last_seen_at' | 'token_hash' | 'user_agent'
>;
export type TActiveUserSessionPatch = Pick<
	TUserUpdate,
	'last_login_at' | 'updated_at'
>;

export async function createSession(session: TSessionNew) {
	const db = await getAccountDatabase();

	await db.insertInto(TABLE_NAME).values(session).execute();
}

export async function createSessionForActiveUser({
	credentialPasswordHash,
	session,
	user,
	userId,
	writeAuditLog,
}: {
	credentialPasswordHash?: TUserCredential['password_hash'];
	session: Omit<TSessionNew, 'user_id'>;
	user: TActiveUserSessionPatch;
	userId: TUser['id'];
	writeAuditLog?: (trx: Transaction<TDatabase>, now: number) => Promise<void>;
}) {
	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
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
			return false;
		}

		await trx
			.insertInto(TABLE_NAME)
			.values({ ...session, user_id: userId })
			.execute();
		await writeAuditLog?.(trx, now);

		return true;
	});
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
	id: TSession['id'],
	writeAuditLog: (trx: Transaction<TDatabase>, now: number) => Promise<void>
) {
	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
		const result = await trx
			.deleteFrom(TABLE_NAME)
			.where('id', '=', id)
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
		sessionId,
		userId,
	}: {
		currentSessionId: TSession['id'];
		sessionId: TSession['id'];
		userId: TUser['id'];
	},
	writeAuditLog: (trx: Transaction<TDatabase>, now: number) => Promise<void>
) {
	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
		const result = await trx
			.deleteFrom(TABLE_NAME)
			.where('user_id', '=', userId)
			.where('id', '=', sessionId)
			.where('id', '!=', currentSessionId)
			.executeTakeFirst();
		if (result.numDeletedRows !== 1n) {
			return false;
		}

		await writeAuditLog(trx, now);

		return true;
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
	options: { createdBefore?: TSession['created_at'] } = {},
	writeAuditLog: (
		trx: Transaction<TDatabase>,
		now: number,
		deletedSessionCount: number
	) => Promise<void>
) {
	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
		let query = trx.deleteFrom(TABLE_NAME).where('user_id', '=', userId);
		if (options.createdBefore !== undefined) {
			query = query.where('created_at', '<', options.createdBefore);
		}

		const result = await query.executeTakeFirst();
		const deletedSessionCount = Number(result.numDeletedRows);
		await writeAuditLog(trx, now, deletedSessionCount);

		return deletedSessionCount;
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
	userId,
}: {
	session: TSessionMutablePatch;
	sessionId: TSession['id'];
	userId: TUser['id'];
}) {
	const db = await getAccountDatabase();

	await db.transaction().execute(async (trx) => {
		const updateSessionResult = await trx
			.updateTable(TABLE_NAME)
			.set(session)
			.where('id', '=', sessionId)
			.where('user_id', '=', userId)
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

export async function updateSessionLastSeen(
	id: TSession['id'],
	lastSeenAt: TSession['last_seen_at']
) {
	const db = await getAccountDatabase();

	await db
		.updateTable(TABLE_NAME)
		.set({ last_seen_at: lastSeenAt })
		.where('id', '=', id)
		.where('last_seen_at', '<', lastSeenAt)
		.execute();
}
