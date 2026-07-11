import { type Transaction, sql } from 'kysely';

import {
	type TAuthenticatedSessionIdentity,
	lockActiveUserSessionInTransaction,
} from './sessions';
import { maskBackupCode } from '@/lib/account/server/backupCode';
import { getAccountDatabase } from '@/lib/account/server/db';
import {
	calculateAccountSyncCapacity,
	checkAccountSyncCapacityAllowed,
	getAccountSyncCapacityConfiguration,
} from '@/lib/account/server/syncCapacity';
import { USER_STATUS_MAP } from '@/lib/account/shared/constants';
import { SYNC_NAMESPACE_MAP, type TSyncNamespace } from '@/lib/account/sync';
import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TBackupImportRecord,
	TDatabase,
	TSession,
	TUser,
	TUserState,
	TUserStateNew,
} from '@/lib/db/types';

const TABLE_NAME = TABLE_NAME_MAP.userState;
const USER_TABLE_NAME = TABLE_NAME_MAP.user;
const USER_CREDENTIAL_TABLE_NAME = TABLE_NAME_MAP.userCredential;
const SESSION_TABLE_NAME = TABLE_NAME_MAP.session;
const BACKUP_IMPORT_TABLE_NAME = TABLE_NAME_MAP.backupImportRecord;
const SYNC_NAMESPACE_SET = new Set<TSyncNamespace>(
	Object.values(SYNC_NAMESPACE_MAP)
);

function checkSyncNamespace(value: unknown): value is TSyncNamespace {
	return (
		typeof value === 'string' &&
		SYNC_NAMESPACE_SET.has(value as TSyncNamespace)
	);
}

function isNonNegativeSafeInteger(value: unknown): value is number {
	return (
		typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
	);
}

interface IPutUserStateEntryIfRevisionChange {
	entry: TUserStateNew;
	expectedRevision: number;
}

function parseBackupImportResults(value: TBackupImportRecord['results']) {
	let parsedValue: unknown;
	try {
		parsedValue = JSON.parse(value);
	} catch {
		return [];
	}

	if (!Array.isArray(parsedValue)) {
		return [];
	}

	return parsedValue.flatMap((item) => {
		if (item === null || typeof item !== 'object' || Array.isArray(item)) {
			return [];
		}
		const record = item as Record<string, unknown>;
		const { namespace, revision, status } = record;
		if (
			status !== 'ok' ||
			!checkSyncNamespace(namespace) ||
			!isNonNegativeSafeInteger(revision) ||
			revision >= Number.MAX_SAFE_INTEGER
		) {
			return [];
		}

		return [{ namespace, revision, status: 'ok' as const }];
	});
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
		isNonNegativeSafeInteger(entry.schema_version) &&
		isNonNegativeSafeInteger(entry.updated_at)
	);
}

type TPutUserStateEntriesIfRevisionResult =
	| { status: 'corrupt-user-state' }
	| {
			results: Array<
				| { entry: TUserStateNew; status: 'ok' }
				| {
						candidate_bytes: number;
						candidate_namespace_bytes: number;
						current_bytes: number;
						current_namespace_bytes: number;
						entry: TUserStateNew;
						limit_bytes: number;
						namespaces: Array<TUserState['namespace']>;
						status: 'capacity-exceeded';
				  }
				| {
						current: TUserState | null;
						entry: TUserStateNew;
						status: 'conflict';
				  }
				| {
						current_schema_version: number;
						entry: TUserStateNew;
						status: 'schema-version-downgrade';
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

export async function getActiveUserStateSnapshotForSession({
	namespaces,
	session,
	userId,
}: {
	namespaces: Array<TUserState['namespace']> | null;
	session: TAuthenticatedSessionIdentity;
	userId: TUser['id'];
}) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		if (!(await lockActiveUserSessionInTransaction(trx, userId, session))) {
			return { status: 'unauthorized' as const };
		}

		const user = await trx
			.selectFrom(USER_TABLE_NAME)
			.selectAll()
			.where('id', '=', userId)
			.executeTakeFirst();
		if (user?.status !== USER_STATUS_MAP.active) {
			return { status: 'unauthorized' as const };
		}
		const credential = await trx
			.selectFrom(USER_CREDENTIAL_TABLE_NAME)
			.selectAll()
			.where('user_id', '=', userId)
			.executeTakeFirst();
		if (credential === undefined) {
			return { status: 'unauthorized' as const };
		}

		let stateQuery = trx
			.selectFrom(TABLE_NAME)
			.selectAll()
			.where('user_id', '=', userId);
		if (namespaces !== null) {
			stateQuery = stateQuery.where('namespace', 'in', namespaces);
		}
		const records = await stateQuery.execute();

		return {
			credential,
			records,
			state_epoch: user.state_epoch,
			status: 'ok' as const,
			user,
		};
	});
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

		const currentEntries = await trx
			.selectFrom(TABLE_NAME)
			.selectAll()
			.where('user_id', '=', userId)
			.execute();
		const currentEntryMap = new Map(
			currentEntries.map((entry) => [entry.namespace, entry])
		);
		if (
			new Set(changes.map(({ entry }) => entry.namespace)).size !==
			changes.length
		) {
			return { status: 'corrupt-user-state' };
		}

		const preparedChanges: Array<
			| {
					current: TUserState | null;
					entry: TUserStateNew;
					status: 'conflict';
			  }
			| {
					current_schema_version: number;
					entry: TUserStateNew;
					status: 'schema-version-downgrade';
			  }
			| {
					current: TUserState | null;
					entry: TUserStateNew;
					expectedRevision: number;
					status: 'ready';
			  }
		> = [];

		for (const { entry, expectedRevision } of changes) {
			if (!checkNewUserStateEntryCounters(entry)) {
				return { status: 'corrupt-user-state' };
			}

			const current = currentEntryMap.get(entry.namespace) ?? null;
			if (
				current !== null &&
				(!isNonNegativeSafeInteger(current.schema_version) ||
					!canIncrementSyncRevision(current.revision) ||
					!canIncrementSyncTimestamp(current.updated_at))
			) {
				return { status: 'corrupt-user-state' };
			}

			const currentRevision = current?.revision ?? 0;
			if (
				current !== null &&
				entry.schema_version < current.schema_version
			) {
				preparedChanges.push({
					current_schema_version: current.schema_version,
					entry,
					status: 'schema-version-downgrade',
				});
				continue;
			}

			if (
				currentRevision !== expectedRevision ||
				entry.revision !== expectedRevision + 1
			) {
				preparedChanges.push({ current, entry, status: 'conflict' });
				continue;
			}

			const nextEntry = {
				...entry,
				updated_at: Math.max(
					entry.updated_at,
					(current?.updated_at ?? 0) + 1
				),
			} satisfies TUserStateNew;

			preparedChanges.push({
				current,
				entry: nextEntry,
				expectedRevision,
				status: 'ready',
			});
		}

		const configuration = getAccountSyncCapacityConfiguration();
		const readyChanges = preparedChanges.filter(
			(
				change
			): change is Extract<
				(typeof preparedChanges)[number],
				{ status: 'ready' }
			> => change.status === 'ready'
		);
		const capacity = calculateAccountSyncCapacity({
			currentEntries,
			replacements: readyChanges.map(({ entry }) => entry),
		});
		if (
			!checkAccountSyncCapacityAllowed({
				candidateBytes: capacity.candidateBytes,
				currentBytes: capacity.currentBytes,
				limitBytes: configuration.stateTotalMaxBytes,
			})
		) {
			const namespaces = readyChanges.map(({ entry }) => entry.namespace);
			return {
				results: preparedChanges.map((change) =>
					change.status === 'ready'
						? {
								candidate_bytes: capacity.candidateBytes,
								candidate_namespace_bytes:
									capacity.candidateNamespaceBytes[
										change.entry.namespace
									],
								current_bytes: capacity.currentBytes,
								current_namespace_bytes:
									capacity.currentNamespaceBytes[
										change.entry.namespace
									],
								entry: change.entry,
								limit_bytes: configuration.stateTotalMaxBytes,
								namespaces,
								status: 'capacity-exceeded' as const,
							}
						: change
				),
				status: 'ok',
			};
		}

		const results: Extract<
			TPutUserStateEntriesIfRevisionResult,
			{ status: 'ok' }
		>['results'] = [];
		for (const change of preparedChanges) {
			if (change.status !== 'ready') {
				results.push(change);
				continue;
			}

			const { current, entry, expectedRevision } = change;
			if (current === null) {
				const insertResult = await trx
					.insertInto(TABLE_NAME)
					.values(entry)
					.onConflict((oc) =>
						oc.columns(['user_id', 'namespace']).doNothing()
					)
					.executeTakeFirst();

				if (insertResult.numInsertedOrUpdatedRows === 1n) {
					results.push({ entry, status: 'ok' });
					continue;
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
					.where('schema_version', '<=', entry.schema_version)
					.executeTakeFirst();

				if (updateResult.numUpdatedRows === 1n) {
					results.push({ entry, status: 'ok' });
					continue;
				}
			}

			const latest =
				(await trx
					.selectFrom(TABLE_NAME)
					.selectAll()
					.where('user_id', '=', entry.user_id)
					.where('namespace', '=', entry.namespace)
					.executeTakeFirst()) ?? null;
			results.push(
				latest !== null && entry.schema_version < latest.schema_version
					? {
							current_schema_version: latest.schema_version,
							entry,
							status: 'schema-version-downgrade',
						}
					: { current: latest, entry, status: 'conflict' }
			);
		}

		return { results, status: 'ok' };
	});
}

export async function clearUserStateIfStateEpochWithAudit(
	userId: TUser['id'],
	expectedStateEpoch: TUser['state_epoch'],
	session: Pick<TSession, 'id' | 'token_hash'>,
	writeAuditLog: (
		trx: Transaction<TDatabase>,
		now: number,
		stateEpoch: TUser['state_epoch']
	) => Promise<void>
) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		const user = await trx
			.selectFrom(USER_TABLE_NAME)
			.select(['state_epoch', 'status'])
			.where('id', '=', userId)
			.executeTakeFirst();
		if (user?.status !== USER_STATUS_MAP.active) {
			return { status: 'unauthorized' as const };
		}
		if (
			!Number.isSafeInteger(user.state_epoch) ||
			user.state_epoch < 0 ||
			user.state_epoch >= Number.MAX_SAFE_INTEGER
		) {
			throw new Error('invalid-user-state-epoch');
		}
		if (user.state_epoch !== expectedStateEpoch) {
			return {
				state_epoch: user.state_epoch,
				status: 'state-epoch-mismatch' as const,
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
			if (currentUser?.status !== USER_STATUS_MAP.active) {
				return { status: 'unauthorized' as const };
			}
			return {
				state_epoch: currentUser.state_epoch,
				status: 'state-epoch-mismatch' as const,
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
			return { status: 'unauthorized' as const };
		}

		await trx
			.deleteFrom(TABLE_NAME)
			.where('user_id', '=', userId)
			.execute();
		await trx
			.deleteFrom(BACKUP_IMPORT_TABLE_NAME)
			.where('user_id', '=', userId)
			.execute();
		const now = Date.now();
		const record = await trx
			.updateTable(USER_TABLE_NAME)
			.set(({ eb, ref }) => ({
				state_epoch: eb(ref('state_epoch'), '+', 1),
				updated_at: now,
			}))
			.where('id', '=', userId)
			.where('status', '=', USER_STATUS_MAP.active)
			.where('state_epoch', '=', expectedStateEpoch)
			.returning('state_epoch')
			.executeTakeFirst();
		if (record === undefined) {
			throw new Error('state-epoch-lock-lost');
		}

		await writeAuditLog(trx, now, record.state_epoch);

		return { state_epoch: record.state_epoch, status: 'ok' as const };
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

export async function clearUserDataAndDeleteSessionsAndIncrementStateEpochWithAudit(
	userId: TUser['id'],
	writeAuditLog: (
		trx: Transaction<TDatabase>,
		now: number,
		stateEpoch: TUser['state_epoch']
	) => Promise<void>
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
		await writeAuditLog(trx, now, record.state_epoch);

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

export async function listRecentBackupImportRecordsByUserId(
	userId: TUser['id'],
	limit = 5
) {
	const db = await getAccountDatabase();
	const rows = await db
		.selectFrom(BACKUP_IMPORT_TABLE_NAME)
		.select(['code', 'created_at', 'file_name', 'results', 'state_epoch'])
		.where('user_id', '=', userId)
		.orderBy('created_at', 'desc')
		.limit(limit)
		.execute();

	return rows.map((row) => ({
		code_hash: maskBackupCode(row.code),
		created_at: row.created_at,
		file_name: row.file_name,
		results: parseBackupImportResults(row.results),
		state_epoch: row.state_epoch,
	}));
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
