import { sql } from 'kysely';

import { enqueueSsoCallbacksForUserEventInTransaction } from './sso';
import { getAccountDatabase } from '@/lib/account/server/db';
import { type TUserStatus } from '@/lib/account/shared/types';
import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TSessionNew,
	TUser,
	TUserCredentialNew,
	TUserNew,
	TUserUpdate,
} from '@/lib/db/types';

const TABLE_NAME = TABLE_NAME_MAP.user;
const CREDENTIAL_TABLE_NAME = TABLE_NAME_MAP.userCredential;
const SESSION_TABLE_NAME = TABLE_NAME_MAP.session;

function assertStatusCanBeSetDirectly(status: TUserStatus) {
	if (status === 'deleted') {
		throw new Error('deleted-status-requires-delete-flow');
	}
}

function escapeLikePattern(pattern: string) {
	return pattern.replaceAll(/[\\%_]/gu, (character) => `\\${character}`);
}

function normalizeTotalCount(value: number | string | bigint) {
	const totalCount = Number(value);

	if (!Number.isSafeInteger(totalCount) || totalCount < 0) {
		throw new Error('invalid-user-count');
	}

	return totalCount;
}

export interface IListUsersOptions {
	limit: number;
	offset: number;
	query?: string;
	status?: TUserStatus;
}

export interface IListUsersResult {
	totalCount: number;
	users: TUser[];
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
	query: searchQuery,
	status,
}: IListUsersOptions): Promise<IListUsersResult> {
	const db = await getAccountDatabase();
	const normalizedSearchQuery = searchQuery?.trim().toLowerCase();
	let usersQuery = db.selectFrom(TABLE_NAME).selectAll();
	let totalCountQuery = db
		.selectFrom(TABLE_NAME)
		.select((eb) => eb.fn.countAll<number>().as('total_count'));

	if (normalizedSearchQuery !== undefined && normalizedSearchQuery !== '') {
		const escapedSearchQuery = escapeLikePattern(normalizedSearchQuery);
		const likePattern = `%${escapedSearchQuery}%`;
		usersQuery = usersQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref('username_normalized')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('id')} like ${likePattern} escape '\\'`,
			])
		);
		totalCountQuery = totalCountQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref('username_normalized')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('id')} like ${likePattern} escape '\\'`,
			])
		);
	}
	if (status !== undefined) {
		usersQuery = usersQuery.where('status', '=', status);
		totalCountQuery = totalCountQuery.where('status', '=', status);
	}

	const [users, totalCountRecord] = await Promise.all([
		usersQuery
			.orderBy('updated_at', 'desc')
			.orderBy('id', 'desc')
			.limit(limit)
			.offset(offset)
			.execute(),
		totalCountQuery.executeTakeFirstOrThrow(),
	]);

	return {
		totalCount: normalizeTotalCount(totalCountRecord.total_count),
		users,
	};
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
	assertStatusCanBeSetDirectly(status);

	const now = Date.now();
	await updateUser(id, { deleted_at: null, status, updated_at: now });
}

export async function setUserStatusIfCurrentStatus(
	id: TUser['id'],
	currentStatus: TUserStatus,
	nextStatus: TUserStatus,
	deleteSessions = false
) {
	assertStatusCanBeSetDirectly(nextStatus);

	const db = await getAccountDatabase();
	const now = Date.now();
	const userUpdate = {
		deleted_at: null,
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
				state_epoch:
					status === 'deleted'
						? sql<TUser['state_epoch']>`state_epoch + 1`
						: sql<TUser['state_epoch']>`state_epoch`,
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

		if (status === 'deleted') {
			await enqueueSsoCallbacksForUserEventInTransaction(
				trx,
				id,
				'user_deleted',
				now
			);
		}
	});
}

export async function disableUserAndDeleteSessionsWithSsoCallbacks(
	id: TUser['id']
) {
	const db = await getAccountDatabase();
	const now = Date.now();
	const userUpdate = {
		deleted_at: null,
		status: 'disabled',
		updated_at: now,
	} satisfies TUserUpdate;

	return db.transaction().execute(async (trx) => {
		const result = await trx
			.updateTable(TABLE_NAME)
			.set(userUpdate)
			.where('id', '=', id)
			.where('status', '=', 'active')
			.executeTakeFirst();
		if (result.numUpdatedRows !== 1n) {
			return false;
		}

		await trx
			.deleteFrom(SESSION_TABLE_NAME)
			.where('user_id', '=', id)
			.execute();
		await enqueueSsoCallbacksForUserEventInTransaction(
			trx,
			id,
			'user_disabled',
			now
		);

		return true;
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
		.executeTakeFirst();

	if (record === undefined) {
		throw new Error('user-not-found');
	}

	return record.state_epoch;
}
