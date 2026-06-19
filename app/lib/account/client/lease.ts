import {
	ACCOUNT_STORAGE_KEY_MAP,
	createAccountStorageKey,
	readAccountJsonStorage,
	removeAccountStorage,
	writeAccountJsonStorage,
} from './storage';
import { createAccountClientId } from './random';

import { withCrossTabLock } from '@/utilities/crossTabLock';

export const ACCOUNT_SYNC_LEASE_TTL = 15 * 1000;
export const ACCOUNT_SYNC_LEASE_RENEW_INTERVAL = 5 * 1000;

const ACCOUNT_SYNC_LEASE_LOCK_TTL = 3000;

export interface IAccountSyncLease {
	expiresAt: number;
	ownerRunId: string;
	ownerTabId: string;
	renewedAt: number;
}

type TAccountSyncLeaseAcquireResult =
	| { acquired: true; status: 'acquired' }
	| { acquired: false; status: 'busy' };

export function createAccountTabId() {
	return createAccountClientId();
}

export function createAccountSyncLeaseKey(userId: string) {
	return createAccountStorageKey(ACCOUNT_STORAGE_KEY_MAP.lease, userId);
}

function checkAccountSyncLease(value: unknown): value is IAccountSyncLease {
	return (
		value !== null &&
		!Array.isArray(value) &&
		typeof value === 'object' &&
		'expiresAt' in value &&
		typeof value.expiresAt === 'number' &&
		Number.isFinite(value.expiresAt) &&
		value.expiresAt >= 0 &&
		'renewedAt' in value &&
		typeof value.renewedAt === 'number' &&
		Number.isFinite(value.renewedAt) &&
		value.renewedAt >= 0 &&
		'ownerRunId' in value &&
		typeof value.ownerRunId === 'string' &&
		value.ownerRunId !== '' &&
		'ownerTabId' in value &&
		typeof value.ownerTabId === 'string' &&
		value.ownerTabId !== ''
	);
}

export function readAccountSyncLease(userId: string) {
	const key = createAccountSyncLeaseKey(userId);
	const lease = readAccountJsonStorage<unknown>(key, null);
	if (lease === null) {
		return null;
	}
	if (!checkAccountSyncLease(lease)) {
		removeAccountStorage(key);
		return null;
	}

	return lease;
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
	now?: number
) {
	const acquired = await withCrossTabLock(
		createAccountSyncLeaseKey(userId),
		() =>
			tryAcquireAccountSyncLease(
				userId,
				ownerTabId,
				ownerRunId,
				now ?? Date.now()
			),
		{ fallbackTtl: ACCOUNT_SYNC_LEASE_LOCK_TTL }
	);

	return acquired
		? ({
				acquired: true,
				status: 'acquired',
			} satisfies TAccountSyncLeaseAcquireResult)
		: ({
				acquired: false,
				status: 'busy',
			} satisfies TAccountSyncLeaseAcquireResult);
}

export function renewAccountSyncLease(
	userId: string,
	ownerTabId: string,
	ownerRunId: string,
	now?: number
) {
	return withCrossTabLock(
		createAccountSyncLeaseKey(userId),
		() =>
			tryRenewAccountSyncLease(
				userId,
				ownerTabId,
				ownerRunId,
				now ?? Date.now()
			),
		{ fallbackTtl: ACCOUNT_SYNC_LEASE_LOCK_TTL }
	).then((isRenewed) => isRenewed === true);
}

export async function releaseAccountSyncLease(
	userId: string,
	ownerTabId: string,
	ownerRunId: string
) {
	await withCrossTabLock(
		createAccountSyncLeaseKey(userId),
		() => {
			tryReleaseAccountSyncLease(userId, ownerTabId, ownerRunId);
		},
		{ fallbackTtl: ACCOUNT_SYNC_LEASE_LOCK_TTL }
	);
}
