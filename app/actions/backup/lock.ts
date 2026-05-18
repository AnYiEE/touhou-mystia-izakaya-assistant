import { randomUUID } from 'node:crypto';

import { TABLE_NAME_MAP } from '@/lib/db';
import { db } from '@/lib/db/db';

const backupCodeLocks = new Map<string, Promise<void>>();
const BACKUP_CODE_LOCK_RETRY_MS = 50;
const BACKUP_CODE_LOCK_TIMEOUT_MS = 10 * 1000;
const BACKUP_CODE_LOCK_TTL_MS = 60 * 1000;
const TABLE_NAME = TABLE_NAME_MAP.backupCodeLock;

function delay(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function tryAcquireSharedBackupCodeLock(
	code: string,
	ownerId: string,
	now = Date.now()
) {
	await db
		.deleteFrom(TABLE_NAME)
		.where('code', '=', code)
		.where('expires_at', '<=', now)
		.execute();

	const insertResult = await db
		.insertInto(TABLE_NAME)
		.values({
			code,
			expires_at: now + BACKUP_CODE_LOCK_TTL_MS,
			owner_id: ownerId,
		})
		.onConflict((oc) => oc.column('code').doNothing())
		.executeTakeFirst();

	return insertResult.numInsertedOrUpdatedRows === 1n;
}

async function acquireSharedBackupCodeLock(code: string, ownerId: string) {
	const deadline = Date.now() + BACKUP_CODE_LOCK_TIMEOUT_MS;

	for (;;) {
		if (await tryAcquireSharedBackupCodeLock(code, ownerId)) {
			return;
		}

		const remainingMs = deadline - Date.now();
		if (remainingMs <= 0) {
			throw new Error('backup-code-lock-timeout');
		}

		await delay(Math.min(BACKUP_CODE_LOCK_RETRY_MS, remainingMs));
	}
}

async function renewSharedBackupCodeLock(code: string, ownerId: string) {
	const updateResult = await db
		.updateTable(TABLE_NAME)
		.set({ expires_at: Date.now() + BACKUP_CODE_LOCK_TTL_MS })
		.where('code', '=', code)
		.where('owner_id', '=', ownerId)
		.executeTakeFirst();

	return updateResult.numUpdatedRows === 1n;
}

async function releaseSharedBackupCodeLock(code: string, ownerId: string) {
	await db
		.deleteFrom(TABLE_NAME)
		.where('code', '=', code)
		.where('owner_id', '=', ownerId)
		.execute();
}

export async function withBackupCodeLock<T>(
	code: string,
	task: () => Promise<T>
) {
	const previousLock = backupCodeLocks.get(code) ?? Promise.resolve();
	let releaseCurrentLock!: () => void;
	const currentLock = new Promise<void>((resolve) => {
		releaseCurrentLock = resolve;
	});
	backupCodeLocks.set(code, currentLock);

	try {
		await previousLock.catch(() => {});

		const ownerId = randomUUID();
		let renewalTimer: ReturnType<typeof setInterval> | null = null;

		try {
			await acquireSharedBackupCodeLock(code, ownerId);
			renewalTimer = setInterval(() => {
				void renewSharedBackupCodeLock(code, ownerId)
					.then((isRenewed) => {
						if (!isRenewed) {
							console.warn(
								'Backup code lock renewal lost ownership.'
							);
						}
					})
					.catch((error: unknown) => {
						console.warn(
							'Failed to renew backup code lock.',
							error
						);
					});
			}, BACKUP_CODE_LOCK_TTL_MS / 3);

			return await task();
		} finally {
			if (renewalTimer !== null) {
				clearInterval(renewalTimer);
			}

			try {
				await releaseSharedBackupCodeLock(code, ownerId);
			} catch (error) {
				console.warn('Failed to release backup code lock.', error);
			}
		}
	} finally {
		releaseCurrentLock();
		if (backupCodeLocks.get(code) === currentLock) {
			backupCodeLocks.delete(code);
		}
	}
}
