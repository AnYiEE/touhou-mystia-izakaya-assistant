import {
	ACCOUNT_STORAGE_KEY_MAP,
	createAccountStorageKey,
	readAccountJsonStorage,
	removeAccountStorage,
	writeAccountJsonStorage,
} from './storage';
import { createAccountClientId } from './random';

export const ACCOUNT_SYNC_LEASE_TTL = 15 * 1000;
export const ACCOUNT_SYNC_LEASE_RENEW_INTERVAL = 5 * 1000;

export interface IAccountSyncLease {
	expiresAt: number;
	ownerRunId: string;
	ownerTabId: string;
	renewedAt: number;
}

interface IAccountLockManager {
	request<T>(
		name: string,
		options: { mode: 'exclusive' },
		callback: () => Promise<T> | T
	): Promise<T>;
}

function getAccountLockManager() {
	const navigatorValue = Reflect.get(globalThis, 'navigator') as
		| { locks?: IAccountLockManager }
		| undefined;

	return navigatorValue?.locks ?? null;
}

export function createAccountTabId() {
	return createAccountClientId();
}

export function createAccountSyncLeaseKey(userId: string) {
	return createAccountStorageKey(ACCOUNT_STORAGE_KEY_MAP.lease, userId);
}

export function readAccountSyncLease(userId: string) {
	return readAccountJsonStorage<IAccountSyncLease | null>(
		createAccountSyncLeaseKey(userId),
		null
	);
}

function writeAccountSyncLease(
	userId: string,
	ownerTabId: string,
	ownerRunId: string,
	now: number
) {
	writeAccountJsonStorage(createAccountSyncLeaseKey(userId), {
		expiresAt: now + ACCOUNT_SYNC_LEASE_TTL,
		ownerRunId,
		ownerTabId,
		renewedAt: now,
	} satisfies IAccountSyncLease);
}

function tryAcquireAccountSyncLease(
	userId: string,
	ownerTabId: string,
	ownerRunId: string,
	now: number
) {
	const lease = readAccountSyncLease(userId);
	if (
		lease !== null &&
		lease.expiresAt > now &&
		(lease.ownerTabId !== ownerTabId || lease.ownerRunId !== ownerRunId)
	) {
		return false;
	}

	writeAccountSyncLease(userId, ownerTabId, ownerRunId, now);

	const nextLease = readAccountSyncLease(userId);
	return (
		nextLease?.ownerTabId === ownerTabId &&
		nextLease.ownerRunId === ownerRunId
	);
}

function tryRenewAccountSyncLease(
	userId: string,
	ownerTabId: string,
	ownerRunId: string,
	now: number
) {
	const lease = readAccountSyncLease(userId);
	if (
		lease === null ||
		lease.expiresAt <= now ||
		lease.ownerTabId !== ownerTabId ||
		lease.ownerRunId !== ownerRunId
	) {
		return false;
	}

	writeAccountSyncLease(userId, ownerTabId, ownerRunId, now);

	return true;
}

function tryReleaseAccountSyncLease(
	userId: string,
	ownerTabId: string,
	ownerRunId: string
) {
	const lease = readAccountSyncLease(userId);
	if (lease?.ownerTabId === ownerTabId && lease.ownerRunId === ownerRunId) {
		removeAccountStorage(createAccountSyncLeaseKey(userId));
	}
}

export async function acquireAccountSyncLease(
	userId: string,
	ownerTabId: string,
	ownerRunId: string,
	now = Date.now()
) {
	const lockManager = getAccountLockManager();
	if (lockManager === null) {
		return tryAcquireAccountSyncLease(userId, ownerTabId, ownerRunId, now);
	}

	return lockManager.request(
		createAccountSyncLeaseKey(userId),
		{ mode: 'exclusive' },
		() =>
			tryAcquireAccountSyncLease(
				userId,
				ownerTabId,
				ownerRunId,
				Date.now()
			)
	);
}

export async function renewAccountSyncLease(
	userId: string,
	ownerTabId: string,
	ownerRunId: string,
	now = Date.now()
) {
	const lockManager = getAccountLockManager();
	if (lockManager === null) {
		return tryRenewAccountSyncLease(userId, ownerTabId, ownerRunId, now);
	}

	return lockManager.request(
		createAccountSyncLeaseKey(userId),
		{ mode: 'exclusive' },
		() =>
			tryRenewAccountSyncLease(userId, ownerTabId, ownerRunId, Date.now())
	);
}

export async function releaseAccountSyncLease(
	userId: string,
	ownerTabId: string,
	ownerRunId: string
) {
	const lockManager = getAccountLockManager();
	if (lockManager === null) {
		tryReleaseAccountSyncLease(userId, ownerTabId, ownerRunId);
		return;
	}

	await lockManager.request(
		createAccountSyncLeaseKey(userId),
		{ mode: 'exclusive' },
		() => {
			tryReleaseAccountSyncLease(userId, ownerTabId, ownerRunId);
		}
	);
}
