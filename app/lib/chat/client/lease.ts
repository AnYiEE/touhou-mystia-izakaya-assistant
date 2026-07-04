'use client';

import { safeStorage } from '@/utilities/safeStorage';
import { withCrossTabLock } from '@/utilities/crossTabLock';

export const CHAT_RUNTIME_LEASE_TTL = 20 * 1000;
export const CHAT_RUNTIME_LEASE_RENEW_INTERVAL = 8 * 1000;

const CHAT_RUNTIME_LEASE_LOCK_TTL = 3000;
const CHAT_RUNTIME_STORAGE_PREFIX = 'chat-runtime';

export interface IChatRuntimeLease {
	expiresAt: number;
	ownerRunId: string;
	ownerTabId: string;
	renewedAt: number;
}

export function createChatRuntimeTabId() {
	const { crypto } = globalThis as { crypto?: Pick<Crypto, 'randomUUID'> };
	const randomUUID = crypto?.randomUUID;
	if (randomUUID !== undefined) {
		return randomUUID.call(crypto);
	}

	return `${Date.now()}-${Math.random()}`;
}

export function createChatRuntimeLeaseKey(userId: string) {
	return `${CHAT_RUNTIME_STORAGE_PREFIX}:lease:${userId}`;
}

function checkChatRuntimeLease(value: unknown): value is IChatRuntimeLease {
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

export function readChatRuntimeLease(userId: string) {
	const leaseKey = createChatRuntimeLeaseKey(userId);
	const value = safeStorage.getItem(leaseKey);
	if (value === null) {
		return null;
	}

	try {
		const parsed = JSON.parse(value);
		if (checkChatRuntimeLease(parsed)) {
			return parsed;
		}
	} catch {
		/* empty */
	}

	safeStorage.removeItem(leaseKey);
	return null;
}

function writeChatRuntimeLease(
	userId: string,
	ownerTabId: string,
	ownerRunId: string,
	now: number
) {
	safeStorage.setItem(
		createChatRuntimeLeaseKey(userId),
		JSON.stringify({
			expiresAt: now + CHAT_RUNTIME_LEASE_TTL,
			ownerRunId,
			ownerTabId,
			renewedAt: now,
		} satisfies IChatRuntimeLease)
	);
}

function tryAcquireChatRuntimeLease(
	userId: string,
	ownerTabId: string,
	ownerRunId: string,
	now: number
) {
	const lease = readChatRuntimeLease(userId);
	if (
		lease !== null &&
		lease.expiresAt > now &&
		(lease.ownerTabId !== ownerTabId || lease.ownerRunId !== ownerRunId)
	) {
		return false;
	}

	writeChatRuntimeLease(userId, ownerTabId, ownerRunId, now);
	const nextLease = readChatRuntimeLease(userId);

	return (
		nextLease?.ownerTabId === ownerTabId &&
		nextLease.ownerRunId === ownerRunId
	);
}

function tryRenewChatRuntimeLease(
	userId: string,
	ownerTabId: string,
	ownerRunId: string,
	now: number
) {
	const lease = readChatRuntimeLease(userId);
	if (
		lease === null ||
		lease.expiresAt <= now ||
		lease.ownerTabId !== ownerTabId ||
		lease.ownerRunId !== ownerRunId
	) {
		return false;
	}

	writeChatRuntimeLease(userId, ownerTabId, ownerRunId, now);
	return true;
}

function tryReleaseChatRuntimeLease(
	userId: string,
	ownerTabId: string,
	ownerRunId: string
) {
	const lease = readChatRuntimeLease(userId);
	if (lease?.ownerTabId === ownerTabId && lease.ownerRunId === ownerRunId) {
		safeStorage.removeItem(createChatRuntimeLeaseKey(userId));
	}
}

export async function acquireChatRuntimeLease(
	userId: string,
	ownerTabId: string,
	ownerRunId: string,
	now = Date.now()
) {
	return (
		(await withCrossTabLock(
			createChatRuntimeLeaseKey(userId),
			() =>
				tryAcquireChatRuntimeLease(userId, ownerTabId, ownerRunId, now),
			{ fallbackTtl: CHAT_RUNTIME_LEASE_LOCK_TTL }
		)) === true
	);
}

export async function renewChatRuntimeLease(
	userId: string,
	ownerTabId: string,
	ownerRunId: string,
	now = Date.now()
) {
	return (
		(await withCrossTabLock(
			createChatRuntimeLeaseKey(userId),
			() => tryRenewChatRuntimeLease(userId, ownerTabId, ownerRunId, now),
			{ fallbackTtl: CHAT_RUNTIME_LEASE_LOCK_TTL }
		)) === true
	);
}

export async function releaseChatRuntimeLease(
	userId: string,
	ownerTabId: string,
	ownerRunId: string
) {
	await withCrossTabLock(
		createChatRuntimeLeaseKey(userId),
		() => {
			tryReleaseChatRuntimeLease(userId, ownerTabId, ownerRunId);
		},
		{ fallbackTtl: CHAT_RUNTIME_LEASE_LOCK_TTL }
	);
}
