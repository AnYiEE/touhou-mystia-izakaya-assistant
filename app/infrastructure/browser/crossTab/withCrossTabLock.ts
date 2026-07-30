import 'client-only';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import {
	acquireCrossTabIdbLock,
	releaseCrossTabIdbLock,
	renewCrossTabIdbLock,
} from './crossTabLockDatabase';

const CROSS_TAB_LOCK_STORAGE_PREFIX = 'cross-tab-lock:';
const DEFAULT_FALLBACK_TTL = 3000;
const FALLBACK_RETRY_DELAY_MS = 50;

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
	onFallbackLeaseLost?: () => void;
	renewFallbackLease?: boolean;
}

interface IResolvedCrossTabLockOptions {
	fallbackTtl: number;
	ifAvailable: boolean;
	onFallbackLeaseLost: (() => void) | null;
	renewFallbackLease: boolean;
}

type TCrossTabFallbackLockOwnership =
	| { backend: 'idb'; name: string; ownerId: string }
	| {
			backend: 'local-storage';
			key: string;
			ownerId: string;
			storage: Storage;
	  };

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

function getCrossTabLockLocalStorage() {
	try {
		return localStorage;
	} catch {
		return null;
	}
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

function writeCrossTabLocalStorageLock(
	storage: Storage,
	key: string,
	ownerId: string,
	fallbackTtl: number
) {
	try {
		storage.setItem(
			key,
			JSON.stringify({
				expiresAt: Date.now() + fallbackTtl,
				ownerId,
			} satisfies ICrossTabFallbackLockRecord)
		);
		return true;
	} catch {
		return false;
	}
}

function releaseCrossTabLocalStorageLock(
	storage: Storage,
	key: string,
	ownerId: string
) {
	try {
		const lock = parseCrossTabFallbackLockRecord(storage.getItem(key));
		if (lock?.ownerId === ownerId) {
			storage.removeItem(key);
		}
	} catch {
		/* best-effort compatibility fallback */
	}
}

function renewCrossTabLocalStorageLock(
	storage: Storage,
	key: string,
	ownerId: string,
	fallbackTtl: number
) {
	let lock: ICrossTabFallbackLockRecord | null;
	try {
		lock = parseCrossTabFallbackLockRecord(storage.getItem(key));
	} catch {
		return false;
	}
	if (lock?.ownerId !== ownerId) {
		return false;
	}

	if (!writeCrossTabLocalStorageLock(storage, key, ownerId, fallbackTtl)) {
		return false;
	}

	try {
		const nextLock = parseCrossTabFallbackLockRecord(storage.getItem(key));
		return nextLock?.ownerId === ownerId;
	} catch {
		return false;
	}
}

async function renewCrossTabFallbackLock(
	ownership: TCrossTabFallbackLockOwnership,
	fallbackTtl: number
) {
	if (ownership.backend === 'idb') {
		return (
			(await renewCrossTabIdbLock({
				fallbackTtl,
				name: ownership.name,
				ownerId: ownership.ownerId,
			})) === 'renewed'
		);
	}

	return renewCrossTabLocalStorageLock(
		ownership.storage,
		ownership.key,
		ownership.ownerId,
		fallbackTtl
	);
}

function startCrossTabFallbackLockRenewal(
	ownership: TCrossTabFallbackLockOwnership,
	fallbackTtl: number,
	onFallbackLeaseLost: (() => void) | null
) {
	const renewalDelay = Math.max(1, Math.floor(fallbackTtl / 2));
	let didNotifyLeaseLost = false;
	let isStopped = false;
	let timer: ReturnType<typeof setTimeout> | null = null;
	const notifyLeaseLost = () => {
		if (didNotifyLeaseLost) {
			return;
		}

		didNotifyLeaseLost = true;
		try {
			onFallbackLeaseLost?.();
		} catch (error) {
			console.warn('Cross-tab fallback lease-lost callback failed.', {
				errorCode: getLogSafeErrorCode(error),
			});
		}
	};
	const renew = () => {
		timer = null;
		if (isStopped) {
			return;
		}

		void renewCrossTabFallbackLock(ownership, fallbackTtl)
			.then((isRenewed) => {
				if (isStopped) {
					return;
				}
				if (!isRenewed) {
					notifyLeaseLost();
					return;
				}

				timer = setTimeout(renew, renewalDelay);
			})
			.catch(() => {
				if (!isStopped) {
					notifyLeaseLost();
				}
			});
	};
	timer = setTimeout(renew, renewalDelay);

	return () => {
		isStopped = true;
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
	};
}

function tryAcquireCrossTabLocalStorageLock(
	storage: Storage,
	key: string,
	ownerId: string,
	fallbackTtl: number
) {
	let lock: ICrossTabFallbackLockRecord | null;
	try {
		lock = parseCrossTabFallbackLockRecord(storage.getItem(key));
	} catch {
		return 'unavailable' as const;
	}
	if (lock !== null && lock.expiresAt > Date.now()) {
		return 'busy' as const;
	}

	if (!writeCrossTabLocalStorageLock(storage, key, ownerId, fallbackTtl)) {
		return 'unavailable' as const;
	}

	try {
		const nextLock = parseCrossTabFallbackLockRecord(storage.getItem(key));
		return nextLock?.ownerId === ownerId
			? ('acquired' as const)
			: ('busy' as const);
	} catch {
		return 'unavailable' as const;
	}
}

function delay(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function acquireCrossTabLocalStorageFallbackLock(
	name: string,
	ownerId: string,
	fallbackTtl: number,
	ifAvailable: boolean,
	deadline = Date.now() + fallbackTtl
): Promise<TCrossTabFallbackLockOwnership | null> {
	const storage = getCrossTabLockLocalStorage();
	if (storage === null) {
		return null;
	}

	const key = createCrossTabFallbackLockKey(name);
	const tryAcquire = () =>
		tryAcquireCrossTabLocalStorageLock(storage, key, ownerId, fallbackTtl);
	const createOwnership = () =>
		({
			backend: 'local-storage',
			key,
			ownerId,
			storage,
		}) satisfies TCrossTabFallbackLockOwnership;
	const initialResult = tryAcquire();
	if (initialResult === 'acquired') {
		return createOwnership();
	}
	if (initialResult === 'unavailable' || ifAvailable) {
		return null;
	}

	while (Date.now() < deadline) {
		await delay(FALLBACK_RETRY_DELAY_MS);
		const result = tryAcquire();
		if (result === 'acquired') {
			return createOwnership();
		}
		if (result === 'unavailable') {
			return null;
		}
	}

	return null;
}

async function acquireCrossTabFallbackLock(
	name: string,
	ownerId: string,
	fallbackTtl: number,
	ifAvailable: boolean
): Promise<TCrossTabFallbackLockOwnership | null> {
	const createIdbOwnership = () =>
		({
			backend: 'idb',
			name,
			ownerId,
		}) satisfies TCrossTabFallbackLockOwnership;
	const tryAcquireIdb = () =>
		acquireCrossTabIdbLock({ fallbackTtl, name, ownerId });
	const initialResult = await tryAcquireIdb();
	if (initialResult === 'acquired') {
		return createIdbOwnership();
	}
	if (initialResult === 'unavailable') {
		return acquireCrossTabLocalStorageFallbackLock(
			name,
			ownerId,
			fallbackTtl,
			ifAvailable
		);
	}
	if (ifAvailable) {
		return null;
	}

	const deadline = Date.now() + fallbackTtl;
	while (Date.now() < deadline) {
		await delay(FALLBACK_RETRY_DELAY_MS);
		const result = await tryAcquireIdb();
		if (result === 'acquired') {
			return createIdbOwnership();
		}
		if (result === 'unavailable') {
			return acquireCrossTabLocalStorageFallbackLock(
				name,
				ownerId,
				fallbackTtl,
				false,
				deadline
			);
		}
	}

	return null;
}

async function releaseCrossTabFallbackLock(
	ownership: TCrossTabFallbackLockOwnership
) {
	if (ownership.backend === 'idb') {
		await releaseCrossTabIdbLock({
			name: ownership.name,
			ownerId: ownership.ownerId,
		});
		return;
	}

	releaseCrossTabLocalStorageLock(
		ownership.storage,
		ownership.key,
		ownership.ownerId
	);
}

async function withCrossTabFallbackLock<T>(
	name: string,
	callback: () => Promise<T> | T,
	options: IResolvedCrossTabLockOptions
) {
	if (!Number.isFinite(options.fallbackTtl) || options.fallbackTtl <= 0) {
		return null;
	}

	const ownerId = createCrossTabLockOwnerId();
	const ownership = await acquireCrossTabFallbackLock(
		name,
		ownerId,
		options.fallbackTtl,
		options.ifAvailable
	);
	if (ownership === null) {
		return null;
	}

	const stopRenewal = options.renewFallbackLease
		? startCrossTabFallbackLockRenewal(
				ownership,
				options.fallbackTtl,
				options.onFallbackLeaseLost
			)
		: null;
	try {
		return await callback();
	} finally {
		stopRenewal?.();
		await releaseCrossTabFallbackLock(ownership);
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
		onFallbackLeaseLost: options.onFallbackLeaseLost ?? null,
		renewFallbackLease: options.renewFallbackLease ?? false,
	} satisfies IResolvedCrossTabLockOptions;
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
