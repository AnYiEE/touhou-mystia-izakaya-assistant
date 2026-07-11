import { getAccountDatabase } from '@/lib/account/server/db';
import {
	type TAuthenticatedSessionIdentity,
	lockActiveUserSessionInTransaction,
} from '@/lib/account/server/repositories/sessions';
import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TUser,
	TWebauthnChallenge,
	TWebauthnChallengeNew,
} from '@/lib/db/types';
import { getLogSafeErrorCode } from '@/lib/logging';

const TABLE_NAME = TABLE_NAME_MAP.webauthnChallenge;
const CREDENTIAL_TABLE_NAME = TABLE_NAME_MAP.userWebauthnCredential;
const WEBAUTHN_CHALLENGE_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

let lastWebauthnChallengeCleanupAt = 0;

export type TWebauthnChallengePurpose =
	| 'account_registration'
	| 'authentication'
	| 'registration';

export async function deleteExpiredChallenges(now = Date.now()) {
	const db = await getAccountDatabase();

	await db.deleteFrom(TABLE_NAME).where('expires_at', '<=', now).execute();
}

async function cleanupExpiredWebauthnChallengesBestEffort(now = Date.now()) {
	if (
		now - lastWebauthnChallengeCleanupAt <
		WEBAUTHN_CHALLENGE_CLEANUP_INTERVAL_MS
	) {
		return;
	}

	lastWebauthnChallengeCleanupAt = now;
	try {
		await deleteExpiredChallenges(now);
	} catch (error) {
		console.warn('Failed to clean up expired WebAuthn challenges.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}
}

export async function createChallenge(challenge: TWebauthnChallengeNew) {
	const db = await getAccountDatabase();

	await db.insertInto(TABLE_NAME).values(challenge).execute();
	void cleanupExpiredWebauthnChallengesBestEffort();
}

export async function createRegistrationChallengeForActiveSession(
	challenge: TWebauthnChallengeNew,
	userId: TUser['id'],
	session: TAuthenticatedSessionIdentity,
	maxCredentials: number
) {
	const db = await getAccountDatabase();
	const result = await db.transaction().execute(async (trx) => {
		if (!(await lockActiveUserSessionInTransaction(trx, userId, session))) {
			return { status: 'unauthorized' as const };
		}

		const countRecord = await trx
			.selectFrom(CREDENTIAL_TABLE_NAME)
			.select((eb) => eb.fn.countAll<number>().as('count'))
			.where('user_id', '=', userId)
			.executeTakeFirst();
		if ((countRecord?.count ?? 0) >= maxCredentials) {
			return { status: 'too-many' as const };
		}

		await trx.insertInto(TABLE_NAME).values(challenge).execute();

		return { status: 'ok' as const };
	});
	void cleanupExpiredWebauthnChallengesBestEffort();

	return result;
}

export async function consumeChallenge(
	id: TWebauthnChallenge['id'],
	purpose: TWebauthnChallengePurpose,
	now = Date.now()
) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		const record = await trx
			.selectFrom(TABLE_NAME)
			.selectAll()
			.where('id', '=', id)
			.executeTakeFirst();

		if (record === undefined) {
			return null;
		}

		await trx.deleteFrom(TABLE_NAME).where('id', '=', id).execute();

		if (record.purpose !== purpose || record.expires_at <= now) {
			return null;
		}

		return record;
	});
}

export async function consumeRegistrationChallengeForActiveSession(
	id: TWebauthnChallenge['id'],
	userId: TUser['id'],
	session: TAuthenticatedSessionIdentity,
	now = Date.now()
) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		if (!(await lockActiveUserSessionInTransaction(trx, userId, session))) {
			return { status: 'unauthorized' as const };
		}
		const record = await trx
			.selectFrom(TABLE_NAME)
			.selectAll()
			.where('id', '=', id)
			.executeTakeFirst();
		if (record === undefined) {
			return { status: 'not-found' as const };
		}

		await trx.deleteFrom(TABLE_NAME).where('id', '=', id).execute();
		if (
			record.user_id !== userId ||
			record.purpose !== 'registration' ||
			record.expires_at <= now
		) {
			return { status: 'not-found' as const };
		}

		return { challenge: record, status: 'ok' as const };
	});
}
