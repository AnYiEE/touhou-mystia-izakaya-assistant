import { sql } from 'kysely';

import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TSessionNew,
	TUser,
	TUserCredentialNew,
	TUserNew,
	TUserUpdate,
} from '@/lib/db/types';

import { getAccountDatabase } from '@/lib/account/server/db';
import { type TUserStatus } from '@/lib/account/shared/types';

const TABLE_NAME = TABLE_NAME_MAP.user;
const CREDENTIAL_TABLE_NAME = TABLE_NAME_MAP.userCredential;
const SESSION_TABLE_NAME = TABLE_NAME_MAP.session;

function escapeLikePattern(pattern: string) {
	return pattern.replaceAll(/[\\%_]/gu, (character) => `\\${character}`);
}

export interface IListUsersOptions {
	limit: number;
	offset: number;
	query?: string;
	status?: TUserStatus;
}

export async function findUserById(id: TUser['id']) {
	const db = await getAccountDatabase();

	return (
		(await db
			.selectFrom(TABLE_NAME)
			.selectAll()
			.where('id', '=', id)
			.executeTakeFirst()) ?? null
	);
}

export async function findUserByUsernameNormalized(
	usernameNormalized: TUser['username_normalized']
) {
	const db = await getAccountDatabase();

	return (
		(await db
			.selectFrom(TABLE_NAME)
			.selectAll()
			.where('username_normalized', '=', usernameNormalized)
			.executeTakeFirst()) ?? null
	);
}

export async function listUsers({
	limit,
	offset,
	query: usernameQuery,
	status,
}: IListUsersOptions) {
	const db = await getAccountDatabase();
	const normalizedUsernameQuery = usernameQuery?.trim().toLowerCase();
	let query = db.selectFrom(TABLE_NAME).selectAll();

	if (
		normalizedUsernameQuery !== undefined &&
		normalizedUsernameQuery !== ''
	) {
		const escapedUsernameQuery = escapeLikePattern(normalizedUsernameQuery);
		query = query.where(
			sql<boolean>`${sql.ref('username_normalized')} like ${`%${escapedUsernameQuery}%`} escape '\\'`
		);
	}
	if (status !== undefined) {
		query = query.where('status', '=', status);
	}

	return query
		.orderBy('updated_at', 'desc')
		.orderBy('id', 'desc')
		.limit(limit)
		.offset(offset)
		.execute();
}

export async function createUser(user: TUserNew) {
	const db = await getAccountDatabase();

	return db
		.insertInto(TABLE_NAME)
		.values(user)
		.returningAll()
		.executeTakeFirstOrThrow();
}

export async function createUserWithCredential(
	user: TUserNew,
	credential: TUserCredentialNew
) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		const record = await trx
			.insertInto(TABLE_NAME)
			.values(user)
			.onConflict((oc) => oc.column('username_normalized').doNothing())
			.returningAll()
			.executeTakeFirst();

		if (record === undefined) {
			return null;
		}

		await trx
			.insertInto(CREDENTIAL_TABLE_NAME)
			.values({ ...credential, user_id: record.id })
			.execute();

		return record;
	});
}

export async function createUserWithCredentialAndSession(
	user: TUserNew,
	credential: TUserCredentialNew,
	session: TSessionNew
) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		const record = await trx
			.insertInto(TABLE_NAME)
			.values(user)
			.onConflict((oc) => oc.column('username_normalized').doNothing())
			.returningAll()
			.executeTakeFirst();

		if (record === undefined) {
			return null;
		}

		await trx
			.insertInto(CREDENTIAL_TABLE_NAME)
			.values({ ...credential, user_id: record.id })
			.execute();
		await trx
			.insertInto(SESSION_TABLE_NAME)
			.values({ ...session, user_id: record.id })
			.execute();

		return record;
	});
}

export async function updateUser(id: TUser['id'], user: TUserUpdate) {
	const db = await getAccountDatabase();

	const result = await db
		.updateTable(TABLE_NAME)
		.set(user)
		.where('id', '=', id)
		.executeTakeFirst();
	if (result.numUpdatedRows !== 1n) {
		throw new Error('user-not-found');
	}
}

export async function setUserStatus(id: TUser['id'], status: TUserStatus) {
	const now = Date.now();
	await updateUser(id, {
		deleted_at: status === 'deleted' ? now : null,
		status,
		updated_at: now,
	});
}

export async function setUserStatusIfCurrentStatus(
	id: TUser['id'],
	currentStatus: TUserStatus,
	nextStatus: TUserStatus,
	deleteSessions = false
) {
	const db = await getAccountDatabase();
	const now = Date.now();
	const userUpdate = {
		deleted_at: nextStatus === 'deleted' ? now : null,
		status: nextStatus,
		updated_at: now,
	} satisfies TUserUpdate;

	if (!deleteSessions) {
		const result = await db
			.updateTable(TABLE_NAME)
			.set(userUpdate)
			.where('id', '=', id)
			.where('status', '=', currentStatus)
			.executeTakeFirst();

		return result.numUpdatedRows === 1n;
	}

	return db.transaction().execute(async (trx) => {
		const result = await trx
			.updateTable(TABLE_NAME)
			.set(userUpdate)
			.where('id', '=', id)
			.where('status', '=', currentStatus)
			.executeTakeFirst();
		if (result.numUpdatedRows !== 1n) {
			return false;
		}

		await trx
			.deleteFrom(SESSION_TABLE_NAME)
			.where('user_id', '=', id)
			.execute();

		return true;
	});
}

export async function setUserStatusAndDeleteSessions(
	id: TUser['id'],
	status: TUserStatus
) {
	const db = await getAccountDatabase();
	const now = Date.now();

	await db.transaction().execute(async (trx) => {
		const result = await trx
			.updateTable(TABLE_NAME)
			.set({
				deleted_at: status === 'deleted' ? now : null,
				status,
				updated_at: now,
			})
			.where('id', '=', id)
			.executeTakeFirst();
		if (result.numUpdatedRows !== 1n) {
			throw new Error('user-not-found');
		}

		await trx
			.deleteFrom(SESSION_TABLE_NAME)
			.where('user_id', '=', id)
			.execute();
	});
}

export async function incrementStateEpoch(id: TUser['id']) {
	const db = await getAccountDatabase();
	const record = await db
		.updateTable(TABLE_NAME)
		.set(({ eb, ref }) => ({
			state_epoch: eb(ref('state_epoch'), '+', 1),
			updated_at: Date.now(),
		}))
		.where('id', '=', id)
		.returning('state_epoch')
		.executeTakeFirstOrThrow();

	return record.state_epoch;
}
