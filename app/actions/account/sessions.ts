import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TSession,
	TSessionNew,
	TSessionUpdate,
	TUser,
	TUserUpdate,
} from '@/lib/db/types';

import { getAccountDatabase } from '@/lib/account/server/db';
import { USER_STATUS_MAP } from '@/lib/account/shared/constants';

const TABLE_NAME = TABLE_NAME_MAP.session;
const USER_TABLE_NAME = TABLE_NAME_MAP.user;

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
	session,
	user,
	userId,
}: {
	session: TSessionNew;
	user: TActiveUserSessionPatch;
	userId: TUser['id'];
}) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		const updateResult = await trx
			.updateTable(USER_TABLE_NAME)
			.set(user)
			.where('id', '=', userId)
			.where('status', '=', USER_STATUS_MAP.active)
			.executeTakeFirst();
		if (updateResult.numUpdatedRows !== 1n) {
			return false;
		}

		await trx
			.insertInto(TABLE_NAME)
			.values({ ...session, user_id: userId })
			.execute();

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

export async function deleteSessionById(id: TSession['id']) {
	const db = await getAccountDatabase();

	await db.deleteFrom(TABLE_NAME).where('id', '=', id).execute();
}

export async function deleteSessionsByUserId(userId: TUser['id']) {
	const db = await getAccountDatabase();

	await db.deleteFrom(TABLE_NAME).where('user_id', '=', userId).execute();
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
