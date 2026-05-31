import { createHash, randomUUID } from 'node:crypto';

import { TABLE_NAME_MAP } from '@/lib/db';
import { db } from '@/lib/db/db';
import { getLogSafeErrorCode } from '@/lib/logging';

const backupCodeLocks = new Map<string, Promise<void>>();
const BACKUP_CODE_LOCK_RETRY_MS = 50;
const BACKUP_CODE_LOCK_TIMEOUT_MS = 10 * 1000;
const BACKUP_CODE_LOCK_TTL_MS = 15 * 1000;
const BACKUP_CODE_LOCK_LOST_MESSAGE = 'backup-code-lock-lost';
const BACKUP_CODE_LOCK_TIMEOUT_MESSAGE = 'backup-code-lock-timeout';
const TABLE_NAME = TABLE_NAME_MAP.backupCodeLock;

export interface IBackupCodeLockSignal {
	readonly aborted: boolean;
	readonly committed: boolean;
	readonly reason?: unknown;
}

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
	previousLock: Promise<void>
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

export async function withBackupCodeLock<T>(
	code: string,
	task: (signal: IBackupCodeLockSignal) => Promise<T>
) {
	const previousLock = backupCodeLocks.get(code) ?? Promise.resolve();
	let releaseCurrentLock!: () => void;
	const currentLock = new Promise<void>((resolve) => {
		releaseCurrentLock = resolve;
	});
	backupCodeLocks.set(code, currentLock);

	try {
		await waitForPreviousBackupCodeLock(code, previousLock);

		const ownerId = randomUUID();
		const lockSignal: {
			aborted: boolean;
			committed: boolean;
			reason?: unknown;
		} = { aborted: false, committed: false };
		let renewalTimer: ReturnType<typeof setInterval> | null = null;
		const abortTask = (message: string, error?: unknown) => {
			if (lockSignal.aborted) {
				return;
			}

			const lockLostError = createBackupCodeLockLostError();
			lockSignal.aborted = true;
			lockSignal.reason = lockLostError;
			if (renewalTimer !== null) {
				clearInterval(renewalTimer);
				renewalTimer = null;
			}
			console.warn(message, {
				codeHash: maskBackupCodeForLog(code),
				...(error === undefined
					? {}
					: { errorCode: getLogSafeErrorCode(error) }),
				ownerId,
			});
		};

		try {
			await acquireSharedBackupCodeLock(code, ownerId);
			renewalTimer = setInterval(() => {
				void renewSharedBackupCodeLock(code, ownerId)
					.then((isRenewed) => {
						if (!isRenewed) {
							abortTask(
								'Backup code lock renewal lost ownership.'
							);
						}
					})
					.catch((error: unknown) => {
						abortTask('Failed to renew backup code lock.', error);
					});
			}, BACKUP_CODE_LOCK_TTL_MS / 3);

			const result = await task(lockSignal);
			if (!lockSignal.committed) {
				throwIfBackupCodeLockLost(lockSignal);
			}
			return result;
		} finally {
			if (renewalTimer !== null) {
				clearInterval(renewalTimer);
			}

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
		releaseCurrentLock();
		if (backupCodeLocks.get(code) === currentLock) {
			backupCodeLocks.delete(code);
		}
	}
}
