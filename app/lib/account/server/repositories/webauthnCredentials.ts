import { type Transaction } from 'kysely';

import { getAccountDatabase } from '@/lib/account/server/db';
import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TDatabase,
	TUser,
	TUserWebauthnCredential,
	TUserWebauthnCredentialNew,
} from '@/lib/db/types';

const TABLE_NAME = TABLE_NAME_MAP.userWebauthnCredential;

export async function listCredentialsByUserId(userId: TUser['id']) {
	const db = await getAccountDatabase();

	return db
		.selectFrom(TABLE_NAME)
		.selectAll()
		.where('user_id', '=', userId)
		.orderBy('created_at', 'asc')
		.execute();
}

export async function getCredentialByCredentialId(
	credentialId: TUserWebauthnCredential['credential_id']
) {
	const db = await getAccountDatabase();

	return (
		(await db
			.selectFrom(TABLE_NAME)
			.selectAll()
			.where('credential_id', '=', credentialId)
			.executeTakeFirst()) ?? null
	);
}

export async function countCredentialsByUserId(userId: TUser['id']) {
	const db = await getAccountDatabase();
	const record = await db
		.selectFrom(TABLE_NAME)
		.select((eb) => eb.fn.countAll<number>().as('count'))
		.where('user_id', '=', userId)
		.executeTakeFirst();

	return record?.count ?? 0;
}

export async function createCredential(credential: TUserWebauthnCredentialNew) {
	const db = await getAccountDatabase();

	await db.insertInto(TABLE_NAME).values(credential).execute();
}

export async function deleteCredentialByIdForUser(
	id: TUserWebauthnCredential['id'],
	userId: TUser['id']
) {
	const db = await getAccountDatabase();
	const result = await db
		.deleteFrom(TABLE_NAME)
		.where('id', '=', id)
		.where('user_id', '=', userId)
		.executeTakeFirst();

	return result.numDeletedRows === 1n;
}

export async function renameCredentialForUser(
	id: TUserWebauthnCredential['id'],
	userId: TUser['id'],
	name: TUserWebauthnCredential['name']
) {
	const db = await getAccountDatabase();
	const result = await db
		.updateTable(TABLE_NAME)
		.set({ name })
		.where('id', '=', id)
		.where('user_id', '=', userId)
		.executeTakeFirst();

	return result.numUpdatedRows === 1n;
}

export async function deleteCredentialsByUserIdInTransaction(
	trx: Transaction<TDatabase>,
	userId: TUser['id']
) {
	const result = await trx
		.deleteFrom(TABLE_NAME)
		.where('user_id', '=', userId)
		.executeTakeFirst();

	return Number(result.numDeletedRows);
}

export async function updateCredentialOnUse(
	id: TUserWebauthnCredential['id'],
	counter: TUserWebauthnCredential['counter'],
	lastUsedAt: TUserWebauthnCredential['last_used_at']
) {
	const db = await getAccountDatabase();

	await db
		.updateTable(TABLE_NAME)
		.set({ counter, last_used_at: lastUsedAt })
		.where('id', '=', id)
		.execute();
}
