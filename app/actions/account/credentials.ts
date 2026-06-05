import { sql } from 'kysely';

import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TSession,
	TUser,
	TUserCredential,
	TUserCredentialNew,
	TUserCredentialUpdate,
} from '@/lib/db/types';
import { type TSessionMutablePatch } from './sessions';

import { getAccountDatabase } from '@/lib/account/server/db';
import { USER_STATUS_MAP } from '@/lib/account/shared/constants';

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

export async function updateCredentialAndRotateSession({
	credential,
	session,
	sessionId,
	userId,
}: {
	credential: TUserCredentialUpdate;
	session: TSessionMutablePatch;
	sessionId: TSession['id'];
	userId: TUser['id'];
}) {
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
			.set(session)
			.where('id', '=', sessionId)
			.where('user_id', '=', userId)
			.executeTakeFirst();

		if (updateSessionResult.numUpdatedRows !== 1n) {
			throw new Error('session-not-found');
		}

		await trx
			.deleteFrom(SESSION_TABLE_NAME)
			.where('user_id', '=', userId)
			.where('id', '!=', sessionId)
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
		.executeTakeFirst();

	if (record === undefined) {
		throw new Error('credential-not-found');
	}

	return record.failed_attempts;
}

export async function recordFailedCredentialAttempt(
	userId: TUser['id'],
	now = Date.now()
): Promise<Extract<TCredentialAttemptState, { status: 'failed' | 'locked' }>> {
	const db = await getAccountDatabase();
	const lockedUntil = now + CREDENTIAL_LOCK_MS;
	const record = await db
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
		.where((eb) =>
			eb.or([
				eb('locked_until', 'is', null),
				eb('locked_until', '<=', now),
			])
		)
		.returning(['failed_attempts', 'locked_until'])
		.executeTakeFirst();

	if (record === undefined) {
		const credential = await getCredentialByUserId(userId);
		if (credential === null) {
			throw new Error('credential-not-found');
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

	return { status: 'failed' };
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
