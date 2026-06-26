import { getAccountDatabase } from '@/lib/account/server/db';
import { TABLE_NAME_MAP } from '@/lib/db';
import type { TWebauthnChallenge, TWebauthnChallengeNew } from '@/lib/db/types';
import { getLogSafeErrorCode } from '@/lib/logging';

const TABLE_NAME = TABLE_NAME_MAP.webauthnChallenge;
const WEBAUTHN_CHALLENGE_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

let lastWebauthnChallengeCleanupAt = 0;

export type TWebauthnChallengePurpose = 'authentication' | 'registration';

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
