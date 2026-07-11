import { type Transaction, sql } from 'kysely';

import { deleteCredentialsByUserIdInTransaction } from './webauthnCredentials';
import { getAccountDatabase } from '@/lib/account/server/db';
import { USER_STATUS_MAP } from '@/lib/account/shared/constants';
import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TDatabase,
	TSession,
	TUser,
	TUserCredential,
	TUserCredentialNew,
	TUserCredentialUpdate,
} from '@/lib/db/types';
import {
	type TAuthenticatedSessionIdentity,
	type TSessionMutablePatch,
	lockActiveUserSessionInTransaction,
} from './sessions';

const TABLE_NAME = TABLE_NAME_MAP.userCredential;
const SESSION_TABLE_NAME = TABLE_NAME_MAP.session;
const USER_TABLE_NAME = TABLE_NAME_MAP.user;
export const CREDENTIAL_FAILED_ATTEMPT_LIMIT = 5;
export const CREDENTIAL_LOCK_MS = 15 * 60 * 1000;

export type TCredentialAttemptState =
	| { status: 'failed' }
	| { retryAfter: number; status: 'locked' }
	| { status: 'ok' }
	| { status: 'stale' };

function getCredentialRetryAfter(lockedUntil: number, now: number) {
	return Math.ceil((lockedUntil - now) / 1000);
}

export function getCredentialLockState(
	credential: Pick<TUserCredential, 'locked_until'>,
	now = Date.now()
): Extract<TCredentialAttemptState, { status: 'locked' }> | { status: 'ok' } {
	if (credential.locked_until !== null && credential.locked_until > now) {
		return {
			retryAfter: getCredentialRetryAfter(credential.locked_until, now),
			status: 'locked',
		};
	}

	return { status: 'ok' };
}

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

	const result = await db
		.updateTable(TABLE_NAME)
		.set(credential)
		.where('user_id', '=', userId)
		.executeTakeFirst();

	if (result.numUpdatedRows !== 1n) {
		throw new Error('credential-not-found');
	}
}

export async function updateCredentialAndDeleteSessions(
	userId: TUser['id'],
	credential: TUserCredentialUpdate
) {
	const db = await getAccountDatabase();

	await db.transaction().execute(async (trx) => {
		const updateCredentialResult = await trx
			.updateTable(TABLE_NAME)
			.set(credential)
			.where('user_id', '=', userId)
			.where(
				'user_id',
				'in',
				trx
					.selectFrom(USER_TABLE_NAME)
					.select('id')
					.where('id', '=', userId)
					.where('status', '!=', USER_STATUS_MAP.deleted)
			)
			.executeTakeFirst();

		if (updateCredentialResult.numUpdatedRows !== 1n) {
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

			throw new Error('credential-not-found');
		}

		await trx
			.deleteFrom(SESSION_TABLE_NAME)
			.where('user_id', '=', userId)
			.execute();
	});
}

export async function updateCredentialAndDeleteSessionsWithAudit(
	userId: TUser['id'],
	credential: TUserCredentialUpdate,
	writeAuditLog: (trx: Transaction<TDatabase>, now: number) => Promise<void>
) {
	const db = await getAccountDatabase();

	await db.transaction().execute(async (trx) => {
		const now = Date.now();
		const updateCredentialResult = await trx
			.updateTable(TABLE_NAME)
			.set(credential)
			.where('user_id', '=', userId)
			.where(
				'user_id',
				'in',
				trx
					.selectFrom(USER_TABLE_NAME)
					.select('id')
					.where('id', '=', userId)
					.where('status', '!=', USER_STATUS_MAP.deleted)
			)
			.executeTakeFirst();

		if (updateCredentialResult.numUpdatedRows !== 1n) {
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

			throw new Error('credential-not-found');
		}

		await trx
			.deleteFrom(SESSION_TABLE_NAME)
			.where('user_id', '=', userId)
			.execute();
		await deleteCredentialsByUserIdInTransaction(trx, userId);
		await writeAuditLog(trx, now);
	});
}

export async function updateCredentialAndRotateSession({
	credential,
	expectedSessionTokenHash,
	session,
	sessionId,
	userId,
	writeAuditLog,
}: {
	credential: TUserCredentialUpdate;
	expectedSessionTokenHash: TSession['token_hash'];
	session: TSessionMutablePatch;
	sessionId: TSession['id'];
	userId: TUser['id'];
	writeAuditLog?: (trx: Transaction<TDatabase>, now: number) => Promise<void>;
}) {
	const db = await getAccountDatabase();
	const { last_seen_at: lastSeenAt, ...sessionPatch } = session;
	const now = Date.now();

	await db.transaction().execute(async (trx) => {
		if (
			!(await lockActiveUserSessionInTransaction(trx, userId, {
				id: sessionId,
				token_hash: expectedSessionTokenHash,
			}))
		) {
			throw new Error('session-not-found');
		}

		const updateCredentialResult = await trx
			.updateTable(TABLE_NAME)
			.set(credential)
			.where('user_id', '=', userId)
			.where(
				'user_id',
				'in',
				trx
					.selectFrom(USER_TABLE_NAME)
					.select('id')
					.where('id', '=', userId)
					.where('status', '=', USER_STATUS_MAP.active)
			)
			.executeTakeFirst();

		if (updateCredentialResult.numUpdatedRows !== 1n) {
			const user = await trx
				.selectFrom(USER_TABLE_NAME)
				.select('status')
				.where('id', '=', userId)
				.executeTakeFirst();

			if (user === undefined) {
				throw new Error('user-not-found');
			}
			if (user.status !== USER_STATUS_MAP.active) {
				throw new Error('invalid-user-status');
			}

			throw new Error('credential-not-found');
		}

		const updateSessionResult = await trx
			.updateTable(SESSION_TABLE_NAME)
			.set(({ ref }) => ({
				...sessionPatch,
				...(lastSeenAt === undefined
					? {}
					: {
							last_seen_at: sql<
								TSession['last_seen_at']
							>`max(${ref('last_seen_at')}, ${lastSeenAt})`,
						}),
			}))
			.where('id', '=', sessionId)
			.where('user_id', '=', userId)
			.where('token_hash', '=', expectedSessionTokenHash)
			.executeTakeFirst();

		if (updateSessionResult.numUpdatedRows !== 1n) {
			throw new Error('session-not-found');
		}

		await trx
			.deleteFrom(SESSION_TABLE_NAME)
			.where('user_id', '=', userId)
			.where('id', '!=', sessionId)
			.execute();
		await writeAuditLog?.(trx, now);
	});
}

export async function updateCredentialAndKeepCurrentSession({
	credential,
	expectedPasswordHash,
	lastSeenAt,
	sessionId,
	sessionTokenHash,
	userId,
	writeAuditLog,
}: {
	credential: TUserCredentialUpdate;
	expectedPasswordHash: TUserCredential['password_hash'];
	lastSeenAt: TSession['last_seen_at'];
	sessionId: TSession['id'];
	sessionTokenHash: TSession['token_hash'];
	userId: TUser['id'];
	writeAuditLog?: (trx: Transaction<TDatabase>, now: number) => Promise<void>;
}) {
	const db = await getAccountDatabase();
	const now = Date.now();

	await db.transaction().execute(async (trx) => {
		if (
			!(await lockActiveUserSessionInTransaction(trx, userId, {
				id: sessionId,
				token_hash: sessionTokenHash,
			}))
		) {
			throw new Error('session-not-found');
		}

		const updateCredentialResult = await trx
			.updateTable(TABLE_NAME)
			.set(credential)
			.where('user_id', '=', userId)
			.where('password_hash', '=', expectedPasswordHash)
			.where(
				'user_id',
				'in',
				trx
					.selectFrom(USER_TABLE_NAME)
					.select('id')
					.where('id', '=', userId)
					.where('status', '=', USER_STATUS_MAP.active)
			)
			.executeTakeFirst();

		if (updateCredentialResult.numUpdatedRows !== 1n) {
			const user = await trx
				.selectFrom(USER_TABLE_NAME)
				.select('status')
				.where('id', '=', userId)
				.executeTakeFirst();

			if (user === undefined) {
				throw new Error('user-not-found');
			}
			if (user.status !== USER_STATUS_MAP.active) {
				throw new Error('invalid-user-status');
			}

			const currentCredential = await trx
				.selectFrom(TABLE_NAME)
				.select('password_hash')
				.where('user_id', '=', userId)
				.executeTakeFirst();
			if (currentCredential === undefined) {
				throw new Error('credential-not-found');
			}

			throw new Error('credential-changed');
		}

		const deleteOtherSessionsCreatedBefore = Date.now() + 1;
		const updateSessionResult = await trx
			.updateTable(SESSION_TABLE_NAME)
			.set(({ ref }) => ({
				last_seen_at: sql<
					TSession['last_seen_at']
				>`max(${ref('last_seen_at')}, ${lastSeenAt})`,
			}))
			.where('id', '=', sessionId)
			.where('user_id', '=', userId)
			.where('token_hash', '=', sessionTokenHash)
			.executeTakeFirst();

		if (updateSessionResult.numUpdatedRows !== 1n) {
			throw new Error('session-not-found');
		}

		await trx
			.deleteFrom(SESSION_TABLE_NAME)
			.where('user_id', '=', userId)
			.where('id', '!=', sessionId)
			.where('created_at', '<', deleteOtherSessionsCreatedBefore)
			.execute();
		await writeAuditLog?.(trx, now);
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
		.executeTakeFirst();

	if (record === undefined) {
		throw new Error('credential-not-found');
	}

	return record.failed_attempts;
}

export async function recordFailedCredentialAttempt({
	expectedPasswordHash,
	now = Date.now(),
	session,
	userId,
}: {
	expectedPasswordHash: TUserCredential['password_hash'];
	now?: number;
	session?: TAuthenticatedSessionIdentity;
	userId: TUser['id'];
}): Promise<
	| Extract<
			TCredentialAttemptState,
			{ status: 'failed' | 'locked' | 'stale' }
	  >
	| { status: 'unauthorized' }
> {
	const db = await getAccountDatabase();
	const lockedUntil = now + CREDENTIAL_LOCK_MS;
	return db.transaction().execute(async (trx) => {
		if (
			session !== undefined &&
			!(await lockActiveUserSessionInTransaction(trx, userId, session))
		) {
			return { status: 'unauthorized' as const };
		}

		const record = await trx
			.updateTable(TABLE_NAME)
			.set(({ ref }) => {
				const nextFailedAttempts = sql<
					TUserCredential['failed_attempts']
				>`case when ${ref('locked_until')} is not null and ${ref('locked_until')} <= ${now} then 1 else ${ref('failed_attempts')} + 1 end`;

				return {
					failed_attempts: nextFailedAttempts,
					locked_until: sql<
						TUserCredential['locked_until']
					>`case when ${nextFailedAttempts} >= ${CREDENTIAL_FAILED_ATTEMPT_LIMIT} then ${lockedUntil} else null end`,
					updated_at: now,
				};
			})
			.where('user_id', '=', userId)
			.where('password_hash', '=', expectedPasswordHash)
			.where((eb) =>
				eb.or([
					eb('locked_until', 'is', null),
					eb('locked_until', '<=', now),
				])
			)
			.returning(['failed_attempts', 'locked_until'])
			.executeTakeFirst();

		if (record === undefined) {
			const credential = await trx
				.selectFrom(TABLE_NAME)
				.selectAll()
				.where('user_id', '=', userId)
				.executeTakeFirst();
			if (credential === undefined) {
				throw new Error('credential-not-found');
			}

			if (credential.password_hash !== expectedPasswordHash) {
				return { status: 'stale' as const };
			}

			const lockState = getCredentialLockState(credential, now);
			if (lockState.status === 'locked') {
				return lockState;
			}

			throw new Error('credential-update-conflict');
		}

		const lockState = getCredentialLockState(record, now);
		if (lockState.status === 'locked') {
			return lockState;
		}

		return { status: 'failed' as const };
	});
}

export async function resetFailedAttemptsForCredential({
	now = Date.now(),
	passwordHash,
	userId,
}: {
	now?: number;
	passwordHash: TUserCredential['password_hash'];
	userId: TUser['id'];
}): Promise<
	Extract<TCredentialAttemptState, { status: 'locked' | 'ok' | 'stale' }>
> {
	const db = await getAccountDatabase();
	const record = await db
		.updateTable(TABLE_NAME)
		.set({ failed_attempts: 0, locked_until: null, updated_at: now })
		.where('user_id', '=', userId)
		.where('password_hash', '=', passwordHash)
		.where((eb) =>
			eb.or([
				eb('locked_until', 'is', null),
				eb('locked_until', '<=', now),
			])
		)
		.returning('user_id')
		.executeTakeFirst();

	if (record !== undefined) {
		return { status: 'ok' };
	}

	const credential = await getCredentialByUserId(userId);
	if (credential === null) {
		throw new Error('credential-not-found');
	}

	const lockState = getCredentialLockState(credential, now);
	if (lockState.status === 'locked') {
		return lockState;
	}

	return { status: 'stale' };
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
