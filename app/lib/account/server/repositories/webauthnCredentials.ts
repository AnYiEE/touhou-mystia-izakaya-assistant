import { type Transaction } from 'kysely';

import { getAccountDatabase } from '@/lib/account/server/db';
import {
	type TAuthenticatedSessionIdentity,
	lockActiveUserSessionInTransaction,
} from '@/lib/account/server/repositories/sessions';
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

export async function listCredentialsForActiveUserSession(
	userId: TUser['id'],
	session: TAuthenticatedSessionIdentity
) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		if (!(await lockActiveUserSessionInTransaction(trx, userId, session))) {
			return { status: 'unauthorized' as const };
		}

		const credentials = await trx
			.selectFrom(TABLE_NAME)
			.selectAll()
			.where('user_id', '=', userId)
			.orderBy('created_at', 'asc')
			.execute();

		return { credentials, status: 'ok' as const };
	});
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

export async function createCredentialForActiveSession(
	credential: TUserWebauthnCredentialNew,
	maxCredentials: number,
	session: TAuthenticatedSessionIdentity,
	writeAuditLog: (trx: Transaction<TDatabase>, now: number) => Promise<void>
) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		if (
			!(await lockActiveUserSessionInTransaction(
				trx,
				credential.user_id,
				session
			))
		) {
			return { status: 'unauthorized' as const };
		}

		const countRecord = await trx
			.selectFrom(TABLE_NAME)
			.select((eb) => eb.fn.countAll<number>().as('count'))
			.where('user_id', '=', credential.user_id)
			.executeTakeFirst();
		if ((countRecord?.count ?? 0) >= maxCredentials) {
			return { status: 'too-many' as const };
		}

		await trx.insertInto(TABLE_NAME).values(credential).execute();
		await writeAuditLog(trx, Date.now());
		const credentials = await trx
			.selectFrom(TABLE_NAME)
			.selectAll()
			.where('user_id', '=', credential.user_id)
			.orderBy('created_at', 'asc')
			.execute();

		return { credentials, status: 'ok' as const };
	});
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

export async function deleteCredentialForActiveSession(
	id: TUserWebauthnCredential['id'],
	userId: TUser['id'],
	session: TAuthenticatedSessionIdentity,
	writeAuditLog: (trx: Transaction<TDatabase>, now: number) => Promise<void>
) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		if (!(await lockActiveUserSessionInTransaction(trx, userId, session))) {
			return { status: 'unauthorized' as const };
		}
		const result = await trx
			.deleteFrom(TABLE_NAME)
			.where('id', '=', id)
			.where('user_id', '=', userId)
			.executeTakeFirst();
		if (result.numDeletedRows !== 1n) {
			return { status: 'not-found' as const };
		}

		await writeAuditLog(trx, Date.now());

		return { status: 'ok' as const };
	});
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

export async function renameCredentialForActiveSession(
	id: TUserWebauthnCredential['id'],
	userId: TUser['id'],
	name: TUserWebauthnCredential['name'],
	session: TAuthenticatedSessionIdentity
) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		if (!(await lockActiveUserSessionInTransaction(trx, userId, session))) {
			return { status: 'unauthorized' as const };
		}
		const result = await trx
			.updateTable(TABLE_NAME)
			.set({ name })
			.where('id', '=', id)
			.where('user_id', '=', userId)
			.executeTakeFirst();
		if (result.numUpdatedRows !== 1n) {
			return { status: 'not-found' as const };
		}

		const credentials = await trx
			.selectFrom(TABLE_NAME)
			.selectAll()
			.where('user_id', '=', userId)
			.orderBy('created_at', 'asc')
			.execute();

		return { credentials, status: 'ok' as const };
	});
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
