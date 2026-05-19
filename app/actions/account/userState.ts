import { sql } from 'kysely';

import { TABLE_NAME_MAP } from '@/lib/db';
import type { TUser, TUserState, TUserStateNew } from '@/lib/db/types';

import { getAccountDatabase } from '@/lib/account/server/db';

const TABLE_NAME = TABLE_NAME_MAP.userState;
const USER_TABLE_NAME = TABLE_NAME_MAP.user;

type TPutUserStateEntryIfRevisionResult =
	| { status: 'conflict'; current: TUserState | null }
	| { status: 'ok' }
	| { state_epoch: number; status: 'state-epoch-mismatch' };

export async function getUserState(
	userId: TUser['id'],
	namespace: TUserState['namespace']
) {
	const db = await getAccountDatabase();

	return (
		(await db
			.selectFrom(TABLE_NAME)
			.selectAll()
			.where('user_id', '=', userId)
			.where('namespace', '=', namespace)
			.executeTakeFirst()) ?? null
	);
}

export async function putUserStateEntries(entries: TUserStateNew[]) {
	if (entries.length === 0) {
		return;
	}

	const db = await getAccountDatabase();

	await db
		.insertInto(TABLE_NAME)
		.values(entries)
		.onConflict((oc) =>
			oc
				.columns(['user_id', 'namespace'])
				.doUpdateSet({
					data: sql<TUserState['data']>`excluded.data`,
					revision: sql<TUserState['revision']>`excluded.revision`,
					schema_version: sql<
						TUserState['schema_version']
					>`excluded.schema_version`,
					updated_at: sql<
						TUserState['updated_at']
					>`excluded.updated_at`,
				})
		)
		.execute();
}

export async function putUserStateEntryIfRevision(
	entry: TUserStateNew,
	expectedRevision: number,
	expectedStateEpoch: number
): Promise<TPutUserStateEntryIfRevisionResult> {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		const user = await trx
			.selectFrom(USER_TABLE_NAME)
			.select('state_epoch')
			.where('id', '=', entry.user_id)
			.executeTakeFirstOrThrow();
		if (user.state_epoch !== expectedStateEpoch) {
			return {
				state_epoch: user.state_epoch,
				status: 'state-epoch-mismatch',
			};
		}

		const stateEpochLockResult = await trx
			.updateTable(USER_TABLE_NAME)
			.set({ updated_at: sql<TUser['updated_at']>`updated_at` })
			.where('id', '=', entry.user_id)
			.where('state_epoch', '=', expectedStateEpoch)
			.executeTakeFirst();
		if (stateEpochLockResult.numUpdatedRows !== 1n) {
			const currentUser = await trx
				.selectFrom(USER_TABLE_NAME)
				.select('state_epoch')
				.where('id', '=', entry.user_id)
				.executeTakeFirstOrThrow();

			return {
				state_epoch: currentUser.state_epoch,
				status: 'state-epoch-mismatch',
			};
		}

		const current =
			(await trx
				.selectFrom(TABLE_NAME)
				.selectAll()
				.where('user_id', '=', entry.user_id)
				.where('namespace', '=', entry.namespace)
				.executeTakeFirst()) ?? null;
		const currentRevision = current?.revision ?? 0;

		if (currentRevision !== expectedRevision) {
			return { current, status: 'conflict' };
		}
		if (entry.revision !== expectedRevision + 1) {
			return { current, status: 'conflict' };
		}

		if (current === null) {
			const insertResult = await trx
				.insertInto(TABLE_NAME)
				.values(entry)
				.onConflict((oc) =>
					oc.columns(['user_id', 'namespace']).doNothing()
				)
				.executeTakeFirst();

			if (insertResult.numInsertedOrUpdatedRows === 1n) {
				return { status: 'ok' };
			}
		} else {
			const updateResult = await trx
				.updateTable(TABLE_NAME)
				.set({
					data: entry.data,
					revision: entry.revision,
					schema_version: entry.schema_version,
					updated_at: entry.updated_at,
				})
				.where('user_id', '=', entry.user_id)
				.where('namespace', '=', entry.namespace)
				.where('revision', '=', expectedRevision)
				.executeTakeFirst();

			if (updateResult.numUpdatedRows === 1n) {
				return { status: 'ok' };
			}
		}

		return {
			current:
				(await trx
					.selectFrom(TABLE_NAME)
					.selectAll()
					.where('user_id', '=', entry.user_id)
					.where('namespace', '=', entry.namespace)
					.executeTakeFirst()) ?? null,
			status: 'conflict',
		};
	});
}

export async function clearUserState(userId: TUser['id']) {
	const db = await getAccountDatabase();

	await db.deleteFrom(TABLE_NAME).where('user_id', '=', userId).execute();
}

export async function clearUserStateAndIncrementStateEpoch(
	userId: TUser['id']
) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		await trx
			.deleteFrom(TABLE_NAME)
			.where('user_id', '=', userId)
			.execute();
		const record = await trx
			.updateTable(USER_TABLE_NAME)
			.set(({ eb, ref }) => ({
				state_epoch: eb(ref('state_epoch'), '+', 1),
				updated_at: Date.now(),
			}))
			.where('id', '=', userId)
			.returning('state_epoch')
			.executeTakeFirstOrThrow();

		return record.state_epoch;
	});
}

export async function listUserNamespaces(userId: TUser['id']) {
	const db = await getAccountDatabase();

	return db
		.selectFrom(TABLE_NAME)
		.select(['namespace', 'revision', 'schema_version', 'updated_at'])
		.where('user_id', '=', userId)
		.execute();
}

export async function listUserState(userId: TUser['id']) {
	const db = await getAccountDatabase();

	return db
		.selectFrom(TABLE_NAME)
		.selectAll()
		.where('user_id', '=', userId)
		.execute();
}

export async function listUserStateByNamespaces(
	userId: TUser['id'],
	namespaces: Array<TUserState['namespace']>
) {
	if (namespaces.length === 0) {
		return listUserState(userId);
	}

	const db = await getAccountDatabase();

	return db
		.selectFrom(TABLE_NAME)
		.selectAll()
		.where('user_id', '=', userId)
		.where('namespace', 'in', namespaces)
		.execute();
}
