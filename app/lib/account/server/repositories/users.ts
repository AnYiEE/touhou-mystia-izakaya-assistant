import { type Transaction, sql } from 'kysely';

import { enqueueSsoCallbacksForUserEventInTransaction } from './sso';
import { getAccountDatabase } from '@/lib/account/server/db';
import { type TUserStatus } from '@/lib/account/shared/types';
import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TDatabase,
	TSessionNew,
	TUser,
	TUserCredential,
	TUserCredentialNew,
	TUserNew,
	TUserUpdate,
} from '@/lib/db/types';

const TABLE_NAME = TABLE_NAME_MAP.user;
const CREDENTIAL_TABLE_NAME = TABLE_NAME_MAP.userCredential;
const SESSION_TABLE_NAME = TABLE_NAME_MAP.session;

type TUpdateActiveUserProfileResult =
	| { retryAfter: number; status: 'credential-locked' }
	| { status: 'credential-stale' }
	| { status: 'ok'; user: TUser }
	| { status: 'username-conflict' };

function getCredentialRetryAfter(lockedUntil: number, now: number) {
	return Math.ceil((lockedUntil - now) / 1000);
}

function checkUsernameUniqueConstraintError(error: unknown) {
	return (
		error instanceof Error &&
		'code' in error &&
		(error as { code?: unknown }).code === 'SQLITE_CONSTRAINT_UNIQUE'
	);
}

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

export async function listUsersByIds(ids: Array<TUser['id']>) {
	const uniqueIds = [...new Set(ids)];
	if (uniqueIds.length === 0) {
		return [];
	}

	const db = await getAccountDatabase();
	const chunkSize = 500;
	const users: TUser[] = [];
	for (let index = 0; index < uniqueIds.length; index += chunkSize) {
		users.push(
			...(await db
				.selectFrom(TABLE_NAME)
				.selectAll()
				.where('id', 'in', uniqueIds.slice(index, index + chunkSize))
				.execute())
		);
	}

	return users;
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
	session: TSessionNew,
	writeAuditLog?: (
		trx: Transaction<TDatabase>,
		now: number,
		user: TUser
	) => Promise<void>
) {
	const db = await getAccountDatabase();
	const now = Date.now();

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
		await writeAuditLog?.(trx, now, record);

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

export async function updateActiveUserProfile({
	credentialPasswordHash,
	nickname,
	now = Date.now(),
	oldNickname,
	oldUsername,
	userId,
	username,
	usernameNormalized,
	writeAuditLog,
}: {
	credentialPasswordHash?: TUserCredential['password_hash'];
	nickname?: TUser['nickname'];
	now?: number;
	oldNickname?: TUser['nickname'];
	oldUsername?: TUser['username'];
	userId: TUser['id'];
	writeAuditLog?: (
		trx: Transaction<TDatabase>,
		now: number,
		user: TUser
	) => Promise<void>;
	username?: TUser['username'];
	usernameNormalized?: TUser['username_normalized'];
}): Promise<TUpdateActiveUserProfileResult> {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		if (credentialPasswordHash !== undefined) {
			const credential = await trx
				.selectFrom(CREDENTIAL_TABLE_NAME)
				.select(['locked_until', 'password_hash'])
				.where('user_id', '=', userId)
				.executeTakeFirst();
			if (credential === undefined) {
				throw new Error('credential-not-found');
			}
			if (credential.password_hash !== credentialPasswordHash) {
				return { status: 'credential-stale' };
			}
			if (
				credential.locked_until !== null &&
				credential.locked_until > now
			) {
				return {
					retryAfter: getCredentialRetryAfter(
						credential.locked_until,
						now
					),
					status: 'credential-locked',
				};
			}
		}

		if (usernameNormalized !== undefined) {
			const conflictingUser = await trx
				.selectFrom(TABLE_NAME)
				.select('id')
				.where('username_normalized', '=', usernameNormalized)
				.where('id', '!=', userId)
				.executeTakeFirst();
			if (conflictingUser !== undefined) {
				return { status: 'username-conflict' };
			}
		}

		if (credentialPasswordHash !== undefined) {
			const resetResult = await trx
				.updateTable(CREDENTIAL_TABLE_NAME)
				.set({
					failed_attempts: 0,
					locked_until: null,
					updated_at: now,
				})
				.where('user_id', '=', userId)
				.where('password_hash', '=', credentialPasswordHash)
				.where((eb) =>
					eb.or([
						eb('locked_until', 'is', null),
						eb('locked_until', '<=', now),
					])
				)
				.executeTakeFirst();
			if (resetResult.numUpdatedRows !== 1n) {
				return { status: 'credential-stale' };
			}
		}

		let updatedUser: TUser | undefined;
		try {
			updatedUser = await trx
				.updateTable(TABLE_NAME)
				.set({
					...(nickname === undefined ? {} : { nickname }),
					updated_at: now,
					...(username === undefined ? {} : { username }),
					...(usernameNormalized === undefined
						? {}
						: { username_normalized: usernameNormalized }),
				})
				.where('id', '=', userId)
				.where('status', '=', 'active')
				.returningAll()
				.executeTakeFirst();
		} catch (error) {
			if (checkUsernameUniqueConstraintError(error)) {
				return { status: 'username-conflict' };
			}

			throw error;
		}

		if (updatedUser === undefined) {
			const currentUser = await trx
				.selectFrom(TABLE_NAME)
				.select(['id', 'status'])
				.where('id', '=', userId)
				.executeTakeFirst();
			if (currentUser === undefined) {
				throw new Error('user-not-found');
			}
			if (currentUser.status !== 'active') {
				throw new Error('invalid-user-status');
			}

			throw new Error('profile-update-conflict');
		}

		await enqueueSsoCallbacksForUserEventInTransaction(
			trx,
			userId,
			'user_profile_updated',
			now,
			{
				new_nickname: updatedUser.nickname,
				new_username: updatedUser.username,
				...(oldNickname === undefined
					? {}
					: { old_nickname: oldNickname }),
				...(oldUsername === undefined
					? {}
					: { old_username: oldUsername }),
			}
		);
		await writeAuditLog?.(trx, now, updatedUser);

		return { status: 'ok', user: updatedUser };
	});
}

export async function setUserStatusIfCurrentStatusWithAudit(
	id: TUser['id'],
	currentStatus: TUserStatus,
	nextStatus: TUserStatus,
	deleteSessions: boolean,
	writeAuditLog: (trx: Transaction<TDatabase>, now: number) => Promise<void>
) {
	assertStatusCanBeSetDirectly(nextStatus);

	const db = await getAccountDatabase();
	const now = Date.now();
	const userUpdate = {
		deleted_at: null,
		status: nextStatus,
		updated_at: now,
	} satisfies TUserUpdate;

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

		if (deleteSessions) {
			await trx
				.deleteFrom(SESSION_TABLE_NAME)
				.where('user_id', '=', id)
				.execute();
		}
		await writeAuditLog(trx, now);

		return true;
	});
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

export async function setUserStatusAndDeleteSessionsWithAudit(
	id: TUser['id'],
	status: TUserStatus,
	writeAuditLog: (trx: Transaction<TDatabase>, now: number) => Promise<void>
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
		await writeAuditLog(trx, now);
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

export async function disableUserAndDeleteSessionsWithSsoCallbacksAndAudit(
	id: TUser['id'],
	writeAuditLog: (trx: Transaction<TDatabase>, now: number) => Promise<void>
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
		await writeAuditLog(trx, now);

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
