import {
	ACCOUNT_STORAGE_KEY_MAP,
	createAccountStorageKey,
	readAccountJsonStorage,
	removeAccountStorage,
	writeAccountJsonStorage,
} from './storage';

export const ACCOUNT_SYNC_LEASE_TTL = 15 * 1000;
export const ACCOUNT_SYNC_LEASE_RENEW_INTERVAL = 5 * 1000;

export interface IAccountSyncLease {
	expiresAt: number;
	ownerTabId: string;
	renewedAt: number;
}

export function createAccountTabId() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
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

export function acquireAccountSyncLease(
	userId: string,
	ownerTabId: string,
	now = Date.now()
) {
	const lease = readAccountSyncLease(userId);
	if (
		lease !== null &&
		lease.expiresAt > now &&
		lease.ownerTabId !== ownerTabId
	) {
		return false;
	}

	writeAccountJsonStorage(createAccountSyncLeaseKey(userId), {
		expiresAt: now + ACCOUNT_SYNC_LEASE_TTL,
		ownerTabId,
		renewedAt: now,
	} satisfies IAccountSyncLease);

	return readAccountSyncLease(userId)?.ownerTabId === ownerTabId;
}

export function renewAccountSyncLease(
	userId: string,
	ownerTabId: string,
	now = Date.now()
) {
	const lease = readAccountSyncLease(userId);
	if (lease?.ownerTabId !== ownerTabId) {
		return false;
	}

	writeAccountJsonStorage(createAccountSyncLeaseKey(userId), {
		expiresAt: now + ACCOUNT_SYNC_LEASE_TTL,
		ownerTabId,
		renewedAt: now,
	} satisfies IAccountSyncLease);

	return true;
}

export function releaseAccountSyncLease(userId: string, ownerTabId: string) {
	if (readAccountSyncLease(userId)?.ownerTabId === ownerTabId) {
		removeAccountStorage(createAccountSyncLeaseKey(userId));
	}
}
