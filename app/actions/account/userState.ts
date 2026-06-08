import { sql } from 'kysely';

import { getAccountDatabase } from '@/lib/account/server/db';
import { USER_STATUS_MAP } from '@/lib/account/shared/constants';
import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TSession,
	TUser,
	TUserState,
	TUserStateNew,
} from '@/lib/db/types';
import { isNonNegativeSafeInteger } from '@/lib/account/sync/serializers/utils';

const TABLE_NAME = TABLE_NAME_MAP.userState;
const USER_TABLE_NAME = TABLE_NAME_MAP.user;
const SESSION_TABLE_NAME = TABLE_NAME_MAP.session;
const BACKUP_IMPORT_TABLE_NAME = TABLE_NAME_MAP.backupImportRecord;

type TPutUserStateEntryIfRevisionResult =
	| { status: 'corrupt-user-state' }
	| { status: 'conflict'; current: TUserState | null }
	| { status: 'ok' }
	| { status: 'unauthorized' }
	| { state_epoch: number; status: 'state-epoch-mismatch' };

interface IPutUserStateEntryIfRevisionChange {
	entry: TUserStateNew;
	expectedRevision: number;
}

function canIncrementSyncRevision(value: unknown): value is number {
	return (
		isNonNegativeSafeInteger(value) && value < Number.MAX_SAFE_INTEGER - 1
	);
}

function canIncrementSyncTimestamp(value: unknown): value is number {
	return isNonNegativeSafeInteger(value) && value < Number.MAX_SAFE_INTEGER;
}

function checkNewUserStateEntryCounters(entry: TUserStateNew) {
	return (
		isNonNegativeSafeInteger(entry.revision) &&
		entry.revision < Number.MAX_SAFE_INTEGER &&
		isNonNegativeSafeInteger(entry.updated_at)
	);
}

type TPutUserStateEntriesIfRevisionResult =
	| { status: 'corrupt-user-state' }
	| {
			results: Array<
				| { entry: TUserStateNew; status: 'ok' }
				| {
						current: TUserState | null;
						entry: TUserStateNew;
						status: 'conflict';
				  }
			>;
			status: 'ok';
	  }
	| { status: 'unauthorized' }
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

export async function putUserStateEntriesIfRevision(
	changes: IPutUserStateEntryIfRevisionChange[],
	expectedStateEpoch: number,
	session: Pick<TSession, 'id' | 'token_hash'>,
	userId: TUser['id']
): Promise<TPutUserStateEntriesIfRevisionResult> {
	const db = await getAccountDatabase();
	if (changes.some((change) => change.entry.user_id !== userId)) {
		throw new Error('mixed-user-state-entries');
	}

	return db.transaction().execute(async (trx) => {
		const user = await trx
			.selectFrom(USER_TABLE_NAME)
			.select(['state_epoch', 'status'])
			.where('id', '=', userId)
			.executeTakeFirst();
		if (user === undefined) {
			return { status: 'unauthorized' };
		}
		if (user.status !== USER_STATUS_MAP.active) {
			return { status: 'unauthorized' };
		}
		if (user.state_epoch !== expectedStateEpoch) {
			return {
				state_epoch: user.state_epoch,
				status: 'state-epoch-mismatch',
			};
		}

		const stateEpochLockResult = await trx
			.updateTable(USER_TABLE_NAME)
			.set({ updated_at: sql<TUser['updated_at']>`updated_at` })
			.where('id', '=', userId)
			.where('status', '=', USER_STATUS_MAP.active)
			.where('state_epoch', '=', expectedStateEpoch)
			.executeTakeFirst();
		if (stateEpochLockResult.numUpdatedRows !== 1n) {
			const currentUser = await trx
				.selectFrom(USER_TABLE_NAME)
				.select(['state_epoch', 'status'])
				.where('id', '=', userId)
				.executeTakeFirst();
			if (currentUser === undefined) {
				return { status: 'unauthorized' };
			}
			if (currentUser.status !== USER_STATUS_MAP.active) {
				return { status: 'unauthorized' };
			}

			return {
				state_epoch: currentUser.state_epoch,
				status: 'state-epoch-mismatch',
			};
		}

		const currentSession = await trx
			.selectFrom(SESSION_TABLE_NAME)
			.select('id')
			.where('id', '=', session.id)
			.where('user_id', '=', userId)
			.where('token_hash', '=', session.token_hash)
			.executeTakeFirst();
		if (currentSession === undefined) {
			return { status: 'unauthorized' };
		}

		const results: Extract<
			TPutUserStateEntriesIfRevisionResult,
			{ status: 'ok' }
		>['results'] = [];

		for (const { entry, expectedRevision } of changes) {
			if (!checkNewUserStateEntryCounters(entry)) {
				return { status: 'corrupt-user-state' };
			}

			const current =
				(await trx
					.selectFrom(TABLE_NAME)
					.selectAll()
					.where('user_id', '=', entry.user_id)
					.where('namespace', '=', entry.namespace)
					.executeTakeFirst()) ?? null;
			if (
				current !== null &&
				(!canIncrementSyncRevision(current.revision) ||
					!canIncrementSyncTimestamp(current.updated_at))
			) {
				return { status: 'corrupt-user-state' };
			}

			const currentRevision = current?.revision ?? 0;

			if (
				currentRevision !== expectedRevision ||
				entry.revision !== expectedRevision + 1
			) {
				results.push({ current, entry, status: 'conflict' });
				continue;
			}

			const nextEntry = {
				...entry,
				updated_at: Math.max(
					entry.updated_at,
					(current?.updated_at ?? 0) + 1
				),
			} satisfies TUserStateNew;

			if (current === null) {
				const insertResult = await trx
					.insertInto(TABLE_NAME)
					.values(nextEntry)
					.onConflict((oc) =>
						oc.columns(['user_id', 'namespace']).doNothing()
					)
					.executeTakeFirst();

				if (insertResult.numInsertedOrUpdatedRows === 1n) {
					results.push({ entry: nextEntry, status: 'ok' });
					continue;
				}
			} else {
				const updateResult = await trx
					.updateTable(TABLE_NAME)
					.set({
						data: nextEntry.data,
						revision: nextEntry.revision,
						schema_version: nextEntry.schema_version,
						updated_at: nextEntry.updated_at,
					})
					.where('user_id', '=', nextEntry.user_id)
					.where('namespace', '=', nextEntry.namespace)
					.where('revision', '=', expectedRevision)
					.executeTakeFirst();

				if (updateResult.numUpdatedRows === 1n) {
					results.push({ entry: nextEntry, status: 'ok' });
					continue;
				}
			}

			results.push({
				current:
					(await trx
						.selectFrom(TABLE_NAME)
						.selectAll()
						.where('user_id', '=', nextEntry.user_id)
						.where('namespace', '=', nextEntry.namespace)
						.executeTakeFirst()) ?? null,
				entry: nextEntry,
				status: 'conflict',
			});
		}

		return { results, status: 'ok' };
	});
}

export async function putUserStateEntryIfRevision(
	entry: TUserStateNew,
	expectedRevision: number,
	expectedStateEpoch: number,
	session: Pick<TSession, 'id' | 'token_hash'>
): Promise<TPutUserStateEntryIfRevisionResult> {
	const result = await putUserStateEntriesIfRevision(
		[{ entry, expectedRevision }],
		expectedStateEpoch,
		session,
		entry.user_id
	);
	if (result.status === 'unauthorized') {
		return { status: 'unauthorized' };
	}
	if (result.status === 'state-epoch-mismatch') {
		return result;
	}
	if (result.status === 'corrupt-user-state') {
		return result;
	}

	const [entryResult] = result.results;
	if (entryResult === undefined || entryResult.status === 'ok') {
		return { status: 'ok' };
	}

	return { current: entryResult.current, status: 'conflict' };
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
		await trx
			.deleteFrom(BACKUP_IMPORT_TABLE_NAME)
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
			.executeTakeFirst();

		if (record === undefined) {
			throw new Error('user-not-found');
		}

		return record.state_epoch;
	});
}

export async function clearUserDataAndDeleteSessionsAndIncrementStateEpoch(
	userId: TUser['id']
) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		const now = Date.now();
		const record = await trx
			.updateTable(USER_TABLE_NAME)
			.set(({ eb, ref }) => ({
				state_epoch: eb(ref('state_epoch'), '+', 1),
				updated_at: now,
			}))
			.where('id', '=', userId)
			.where('status', '!=', USER_STATUS_MAP.deleted)
			.returning('state_epoch')
			.executeTakeFirst();

		if (record === undefined) {
			const user = await trx
				.selectFrom(USER_TABLE_NAME)
				.select('status')
				.where('id', '=', userId)
				.executeTakeFirst();
			if (user === undefined) {
				throw new Error('user-not-found');
			}
			if (user.status === USER_STATUS_MAP.deleted) {
				throw new Error('invalid-user-status');
			}

			throw new Error('update-not-applied');
		}

		await trx
			.deleteFrom(TABLE_NAME)
			.where('user_id', '=', userId)
			.execute();
		await trx
			.deleteFrom(BACKUP_IMPORT_TABLE_NAME)
			.where('user_id', '=', userId)
			.execute();
		await trx
			.deleteFrom(SESSION_TABLE_NAME)
			.where('user_id', '=', userId)
			.execute();

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

export async function getUserStateSnapshot(userId: TUser['id']) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		const user = await trx
			.selectFrom(USER_TABLE_NAME)
			.selectAll()
			.where('id', '=', userId)
			.executeTakeFirst();
		if (user === undefined) {
			return null;
		}

		const state = await trx
			.selectFrom(TABLE_NAME)
			.selectAll()
			.where('user_id', '=', userId)
			.execute();

		return { state, user };
	});
}

export async function listUserStateByNamespaces(
	userId: TUser['id'],
	namespaces: Array<TUserState['namespace']>
) {
	if (namespaces.length === 0) {
		return [];
	}

	const db = await getAccountDatabase();

	return db
		.selectFrom(TABLE_NAME)
		.selectAll()
		.where('user_id', '=', userId)
		.where('namespace', 'in', namespaces)
		.execute();
}
