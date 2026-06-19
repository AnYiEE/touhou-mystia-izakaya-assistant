import 'client-only';

import { safeStorage } from '@/utilities/safeStorage';

const CROSS_TAB_LOCK_STORAGE_PREFIX = 'cross-tab-lock:';
const DEFAULT_FALLBACK_TTL = 3000;

interface ICrossTabLockManager {
	request<T>(
		name: string,
		options: { ifAvailable?: boolean; mode: 'exclusive' },
		callback: (lock: object | null) => Promise<T> | T
	): Promise<T>;
}

interface ICrossTabFallbackLockRecord {
	expiresAt: number;
	ownerId: string;
}

interface ICrossTabLockOptions {
	fallbackTtl?: number;
	ifAvailable?: boolean;
}

function getCrossTabLockManager() {
	const navigatorValue = Reflect.get(globalThis, 'navigator') as
		| { locks?: ICrossTabLockManager }
		| undefined;

	return navigatorValue?.locks ?? null;
}

export function checkCrossTabNativeLockSupported() {
	return getCrossTabLockManager() !== null;
}

function createCrossTabLockOwnerId() {
	const { crypto } = globalThis as {
		crypto?: Pick<Crypto, 'getRandomValues' | 'randomUUID'>;
	};
	const randomUUID = crypto?.randomUUID;
	if (randomUUID !== undefined) {
		return randomUUID.call(crypto);
	}

	const getRandomValues = crypto?.getRandomValues;
	if (getRandomValues !== undefined) {
		const values = new Uint32Array(4);
		getRandomValues.call(crypto, values);

		return Array.from(values, (value) =>
			value.toString(36).padStart(7, '0')
		).join('');
	}

	return `${Date.now().toString(36)}-${globalThis.performance.now().toString(36)}`;
}

function createCrossTabFallbackLockKey(name: string) {
	return `${CROSS_TAB_LOCK_STORAGE_PREFIX}${name}`;
}

function parseCrossTabFallbackLockRecord(
	value: string | null
): ICrossTabFallbackLockRecord | null {
	if (value === null) {
		return null;
	}

	try {
		const parsed: unknown = JSON.parse(value);
		if (
			parsed === null ||
			Array.isArray(parsed) ||
			typeof parsed !== 'object'
		) {
			return null;
		}

		const { expiresAt, ownerId } = parsed as Partial<
			Record<keyof ICrossTabFallbackLockRecord, unknown>
		>;
		if (
			typeof expiresAt !== 'number' ||
			!Number.isFinite(expiresAt) ||
			expiresAt < 0 ||
			typeof ownerId !== 'string' ||
			ownerId === ''
		) {
			return null;
		}

		return { expiresAt, ownerId };
	} catch {
		return null;
	}
}

function writeCrossTabFallbackLock(
	key: string,
	ownerId: string,
	fallbackTtl: number
) {
	safeStorage.setItem(
		key,
		JSON.stringify({
			expiresAt: Date.now() + fallbackTtl,
			ownerId,
		} satisfies ICrossTabFallbackLockRecord)
	);
}

function releaseCrossTabFallbackLock(key: string, ownerId: string) {
	const lock = parseCrossTabFallbackLockRecord(safeStorage.getItem(key));
	if (lock?.ownerId === ownerId) {
		safeStorage.removeItem(key);
	}
}

function tryAcquireCrossTabFallbackLock(
	key: string,
	ownerId: string,
	fallbackTtl: number
) {
	const lock = parseCrossTabFallbackLockRecord(safeStorage.getItem(key));
	if (lock !== null && lock.expiresAt > Date.now()) {
		return false;
	}

	writeCrossTabFallbackLock(key, ownerId, fallbackTtl);

	const nextLock = parseCrossTabFallbackLockRecord(safeStorage.getItem(key));
	return nextLock?.ownerId === ownerId;
}

function delay(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function acquireCrossTabFallbackLock(
	key: string,
	ownerId: string,
	fallbackTtl: number,
	ifAvailable: boolean
) {
	if (tryAcquireCrossTabFallbackLock(key, ownerId, fallbackTtl)) {
		return true;
	}
	if (ifAvailable) {
		return false;
	}

	const deadline = Date.now() + fallbackTtl;
	while (Date.now() < deadline) {
		await delay(50);
		if (tryAcquireCrossTabFallbackLock(key, ownerId, fallbackTtl)) {
			return true;
		}
	}

	return false;
}

async function withCrossTabFallbackLock<T>(
	name: string,
	callback: () => Promise<T> | T,
	options: Required<ICrossTabLockOptions>
) {
	const key = createCrossTabFallbackLockKey(name);
	const ownerId = createCrossTabLockOwnerId();
	const acquired = await acquireCrossTabFallbackLock(
		key,
		ownerId,
		options.fallbackTtl,
		options.ifAvailable
	);
	if (!acquired) {
		return null;
	}

	try {
		return await callback();
	} finally {
		releaseCrossTabFallbackLock(key, ownerId);
	}
}

export async function withCrossTabLock<T>(
	name: string,
	callback: () => Promise<T> | T,
	options: ICrossTabLockOptions = {}
) {
	const resolvedOptions = {
		fallbackTtl: options.fallbackTtl ?? DEFAULT_FALLBACK_TTL,
		ifAvailable: options.ifAvailable ?? false,
	} satisfies Required<ICrossTabLockOptions>;
	const lockManager = getCrossTabLockManager();
	if (lockManager === null) {
		return withCrossTabFallbackLock(name, callback, resolvedOptions);
	}

	return lockManager.request(
		name,
		{ ifAvailable: resolvedOptions.ifAvailable, mode: 'exclusive' },
		(lock) => {
			if (lock === null) {
				return null;
			}

			return callback();
		}
	);
}
