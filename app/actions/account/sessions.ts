import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TSession,
	TSessionNew,
	TSessionUpdate,
	TUser,
} from '@/lib/db/types';

import { getAccountDatabase } from '@/lib/account/server/db';

const TABLE_NAME = TABLE_NAME_MAP.session;

export type TSessionMutablePatch = Pick<
	TSessionUpdate,
	'ip_address' | 'last_seen_at' | 'token_hash' | 'user_agent'
>;

export async function createSession(session: TSessionNew) {
	const db = await getAccountDatabase();

	await db.insertInto(TABLE_NAME).values(session).execute();
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
		.selectAll()
		.where('user_id', '=', userId)
		.execute();
}

export async function updateSessionLastSeen(
	id: TSession['id'],
	lastSeenAt: TSessionUpdate['last_seen_at']
) {
	const db = await getAccountDatabase();

	await db
		.updateTable(TABLE_NAME)
		.set({ last_seen_at: lastSeenAt })
		.where('id', '=', id)
		.execute();
}
