import { createHash, randomUUID } from 'node:crypto';

import { TABLE_NAME_MAP } from '@/lib/db';
import { db } from '@/lib/db/db';
import type { TDatabase } from '@/lib/db/types';
import { getLogSafeErrorCode } from '@/lib/logging';
import type { Transaction } from 'kysely';

const BACKUP_CODE_LOCK_QUEUE_RELEASED = Symbol(
	'backup-code-lock-queue-released'
);
type TBackupCodeQueuedLock = Promise<typeof BACKUP_CODE_LOCK_QUEUE_RELEASED>;
const backupCodeLocks = new Map<string, TBackupCodeQueuedLock>();
const BACKUP_CODE_LOCK_RETRY_MS = 50;
const BACKUP_CODE_LOCK_TTL_MS = 15 * 1000;
const BACKUP_CODE_LOCK_TIMEOUT_MS =
	BACKUP_CODE_LOCK_TTL_MS + BACKUP_CODE_LOCK_RETRY_MS * 2;
const BACKUP_CODE_LOCK_LOST_MESSAGE = 'backup-code-lock-lost';
const BACKUP_CODE_LOCK_TIMEOUT_MESSAGE = 'backup-code-lock-timeout';
const TABLE_NAME = TABLE_NAME_MAP.backupCodeLock;

export interface IBackupCodeLockSignal {
	readonly aborted: boolean;
	readonly code: string;
	readonly committed: boolean;
	readonly ownerId: string;
	readonly reason?: unknown;
}

type TMutableBackupCodeLockSignal = IBackupCodeLockSignal & {
	renewedAt: number;
};

function delay(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function maskBackupCodeForLog(code: string) {
	return `sha256:${createHash('sha256').update(code).digest('hex').slice(0, 12)}`;
}

async function waitForPreviousBackupCodeLock(
	code: string,
	previousLock: TBackupCodeQueuedLock
) {
	let timeoutId!: ReturnType<typeof setTimeout>;
	const timeout = new Promise<'timeout'>((resolve) => {
		timeoutId = setTimeout(() => {
			resolve('timeout');
		}, BACKUP_CODE_LOCK_TIMEOUT_MS);
	});
	const result = await Promise.race([
		previousLock.then(
			() => 'released' as const,
			() => 'released' as const
		),
		timeout,
	]);

	clearTimeout(timeoutId);
	if (result === 'timeout') {
		console.warn('Timed out waiting for backup code in-process queue.', {
			codeHash: maskBackupCodeForLog(code),
		});
		throw new Error(BACKUP_CODE_LOCK_TIMEOUT_MESSAGE);
	}
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
			throw new Error(BACKUP_CODE_LOCK_TIMEOUT_MESSAGE);
		}

		await delay(Math.min(BACKUP_CODE_LOCK_RETRY_MS, remainingMs));
	}
}

async function renewSharedBackupCodeLock(code: string, ownerId: string) {
	const now = Date.now();
	const updateResult = await db
		.updateTable(TABLE_NAME)
		.set({ expires_at: now + BACKUP_CODE_LOCK_TTL_MS })
		.where('code', '=', code)
		.where('owner_id', '=', ownerId)
		.executeTakeFirst();

	return updateResult.numUpdatedRows === 1n ? now : null;
}

async function releaseSharedBackupCodeLock(code: string, ownerId: string) {
	await db
		.deleteFrom(TABLE_NAME)
		.where('code', '=', code)
		.where('owner_id', '=', ownerId)
		.execute();
}

function createBackupCodeLockLostError() {
	return new Error(BACKUP_CODE_LOCK_LOST_MESSAGE);
}

export function checkBackupCodeLockLostError(error: unknown) {
	return (
		error instanceof Error &&
		error.message === BACKUP_CODE_LOCK_LOST_MESSAGE
	);
}

export function checkBackupCodeLockTimeoutError(error: unknown) {
	return (
		error instanceof Error &&
		error.message === BACKUP_CODE_LOCK_TIMEOUT_MESSAGE
	);
}

export function throwIfBackupCodeLockLost(signal: IBackupCodeLockSignal) {
	if (!signal.aborted) {
		return;
	}

	if (checkBackupCodeLockLostError(signal.reason)) {
		throw signal.reason;
	}

	throw createBackupCodeLockLostError();
}

export function markBackupCodeLockCommitted(signal: IBackupCodeLockSignal) {
	(signal as { committed: boolean }).committed = true;
}

function markBackupCodeLockLost(signal: IBackupCodeLockSignal) {
	const lockLostError = createBackupCodeLockLostError();
	(signal as { aborted: boolean; reason?: unknown }).aborted = true;
	(signal as { reason?: unknown }).reason = lockLostError;
	throw lockLostError;
}

function markBackupCodeLockRenewed(
	signal: IBackupCodeLockSignal,
	renewedAt: number
) {
	(signal as TMutableBackupCodeLockSignal).renewedAt = renewedAt;
}

function getBackupCodeLockRenewDeadline(signal: IBackupCodeLockSignal) {
	return (
		(signal as TMutableBackupCodeLockSignal).renewedAt +
		BACKUP_CODE_LOCK_TTL_MS
	);
}

function checkBackupCodeLockRenewDeadline(signal: IBackupCodeLockSignal) {
	if (Date.now() > getBackupCodeLockRenewDeadline(signal)) {
		markBackupCodeLockLost(signal);
	}
}

export async function withFreshBackupCodeLock<T>(
	signal: IBackupCodeLockSignal,
	task: (trx: Transaction<TDatabase>) => Promise<T>
) {
	throwIfBackupCodeLockLost(signal);
	checkBackupCodeLockRenewDeadline(signal);

	return await db.transaction().execute(async (trx) => {
		const now = Date.now();
		const updateResult = await trx
			.updateTable(TABLE_NAME)
			.set({ expires_at: now + BACKUP_CODE_LOCK_TTL_MS })
			.where('code', '=', signal.code)
			.where('owner_id', '=', signal.ownerId)
			.executeTakeFirst();

		if (updateResult.numUpdatedRows !== 1n) {
			markBackupCodeLockLost(signal);
		}
		markBackupCodeLockRenewed(signal, now);

		return await task(trx);
	});
}

export async function withBackupCodeLock<T>(
	code: string,
	task: (signal: IBackupCodeLockSignal) => Promise<T>
) {
	const previousLock =
		backupCodeLocks.get(code) ??
		Promise.resolve(BACKUP_CODE_LOCK_QUEUE_RELEASED);
	const { promise: currentLock, resolve: releaseCurrentLock } =
		Promise.withResolvers<typeof BACKUP_CODE_LOCK_QUEUE_RELEASED>();
	backupCodeLocks.set(code, currentLock);

	try {
		await waitForPreviousBackupCodeLock(code, previousLock);

		const ownerId = randomUUID();
		const lockSignal: {
			aborted: boolean;
			code: string;
			committed: boolean;
			ownerId: string;
			renewedAt: number;
			reason?: unknown;
		} = {
			aborted: false,
			code,
			committed: false,
			ownerId,
			renewedAt: Date.now(),
		};
		let isRenewalActive = false;
		let renewalTimer: ReturnType<typeof setTimeout> | null = null;
		const clearRenewalTimer = () => {
			isRenewalActive = false;
			if (renewalTimer !== null) {
				clearTimeout(renewalTimer);
				renewalTimer = null;
			}
		};
		const abortTask = (message: string, error?: unknown) => {
			if (lockSignal.aborted) {
				return;
			}

			const lockLostError = createBackupCodeLockLostError();
			lockSignal.aborted = true;
			lockSignal.reason = lockLostError;
			clearRenewalTimer();
			console.warn(message, {
				codeHash: maskBackupCodeForLog(code),
				...(error === undefined
					? {}
					: { errorCode: getLogSafeErrorCode(error) }),
				ownerId,
			});
		};
		let scheduleRenewal: (delayMs: number) => void = () => {};
		const renewLock = async () => {
			if (!isRenewalActive || lockSignal.aborted) {
				return;
			}
			if (Date.now() > getBackupCodeLockRenewDeadline(lockSignal)) {
				abortTask('Backup code lock renewal expired.');
				return;
			}

			try {
				const renewedAt = await renewSharedBackupCodeLock(
					code,
					ownerId
				);
				if (renewedAt === null) {
					abortTask('Backup code lock renewal lost ownership.');
					return;
				}

				markBackupCodeLockRenewed(lockSignal, renewedAt);
				scheduleRenewal(BACKUP_CODE_LOCK_TTL_MS / 3);
			} catch (error: unknown) {
				const remainingMs =
					getBackupCodeLockRenewDeadline(lockSignal) - Date.now();
				if (remainingMs <= 0) {
					abortTask('Failed to renew backup code lock.', error);
					return;
				}

				console.warn('Backup code lock renewal temporarily failed.', {
					codeHash: maskBackupCodeForLog(code),
					errorCode: getLogSafeErrorCode(error),
					ownerId,
				});
				scheduleRenewal(
					Math.min(BACKUP_CODE_LOCK_RETRY_MS, remainingMs)
				);
			}
		};
		scheduleRenewal = (delayMs) => {
			if (!isRenewalActive || lockSignal.aborted) {
				return;
			}

			renewalTimer = setTimeout(() => {
				renewalTimer = null;
				void renewLock();
			}, delayMs);
		};

		try {
			await acquireSharedBackupCodeLock(code, ownerId);
			markBackupCodeLockRenewed(lockSignal, Date.now());
			isRenewalActive = true;
			scheduleRenewal(BACKUP_CODE_LOCK_TTL_MS / 3);

			const result = await task(lockSignal);
			if (!lockSignal.committed) {
				throwIfBackupCodeLockLost(lockSignal);
			}
			return result;
		} finally {
			clearRenewalTimer();

			try {
				await releaseSharedBackupCodeLock(code, ownerId);
			} catch (error) {
				console.warn('Failed to release backup code lock.', {
					codeHash: maskBackupCodeForLog(code),
					errorCode: getLogSafeErrorCode(error),
					ownerId,
				});
			}
		}
	} finally {
		releaseCurrentLock(BACKUP_CODE_LOCK_QUEUE_RELEASED);
		if (backupCodeLocks.get(code) === currentLock) {
			backupCodeLocks.delete(code);
		}
	}
}
