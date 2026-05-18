import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TUser,
	TUserCredential,
	TUserCredentialNew,
	TUserCredentialUpdate,
} from '@/lib/db/types';

import { getAccountDatabase } from '@/lib/account/server/db';

const TABLE_NAME = TABLE_NAME_MAP.userCredential;
const SESSION_TABLE_NAME = TABLE_NAME_MAP.session;

export async function createCredential(credential: TUserCredentialNew) {
	const db = await getAccountDatabase();

	await db.insertInto(TABLE_NAME).values(credential).execute();
}

export async function getCredentialByUserId(userId: TUser['id']) {
	const db = await getAccountDatabase();

	return (
		(await db
			.selectFrom(TABLE_NAME)
			.selectAll()
			.where('user_id', '=', userId)
			.executeTakeFirst()) ?? null
	);
}

export async function updateCredential(
	userId: TUser['id'],
	credential: TUserCredentialUpdate
) {
	const db = await getAccountDatabase();

	await db
		.updateTable(TABLE_NAME)
		.set(credential)
		.where('user_id', '=', userId)
		.execute();
}

export async function updateCredentialAndDeleteSessions(
	userId: TUser['id'],
	credential: TUserCredentialUpdate
) {
	const db = await getAccountDatabase();

	await db.transaction().execute(async (trx) => {
		await trx
			.updateTable(TABLE_NAME)
			.set(credential)
			.where('user_id', '=', userId)
			.execute();

		await trx
			.deleteFrom(SESSION_TABLE_NAME)
			.where('user_id', '=', userId)
			.execute();
	});
}

export async function incrementFailedAttempts(userId: TUser['id']) {
	const db = await getAccountDatabase();
	const record = await db
		.updateTable(TABLE_NAME)
		.set(({ eb, ref }) => ({
			failed_attempts: eb(ref('failed_attempts'), '+', 1),
			updated_at: Date.now(),
		}))
		.where('user_id', '=', userId)
		.returning('failed_attempts')
		.executeTakeFirstOrThrow();

	return record.failed_attempts;
}

export async function resetFailedAttempts(userId: TUser['id']) {
	await updateCredential(userId, {
		failed_attempts: 0,
		locked_until: null,
		updated_at: Date.now(),
	});
}

export async function setLockedUntil(
	userId: TUser['id'],
	lockedUntil: TUserCredential['locked_until']
) {
	await updateCredential(userId, {
		locked_until: lockedUntil,
		updated_at: Date.now(),
	});
}
