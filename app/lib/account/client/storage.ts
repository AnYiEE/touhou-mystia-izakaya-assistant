import { safeStorage } from '@/utilities';

export const ACCOUNT_STORAGE_KEY_MAP = {
	dirtyQueue: 'account-sync-dirty',
	lease: 'account-sync-uploader',
	syncMeta: 'account-sync-meta',
} as const;

export function createAccountStorageKey(...parts: string[]) {
	return parts.join(':');
}

export function readAccountJsonStorage<T>(key: string, fallback: T): T {
	const value = safeStorage.getItem(key);
	if (value === null) {
		return fallback;
	}

	try {
		const parsed = JSON.parse(value) as T | null;
		return parsed ?? fallback;
	} catch {
		safeStorage.removeItem(key);
		return fallback;
	}
}

export function writeAccountJsonStorage(key: string, value: unknown) {
	try {
		safeStorage.setItem(key, JSON.stringify(value));
	} catch (error) {
		console.warn('Failed to persist account storage value.', {
			error,
			key,
		});
		throw error;
	}
}

export function removeAccountStorage(key: string) {
	safeStorage.removeItem(key);
}

export function getAccountStorageKeys(prefix: string) {
	return Array.from({ length: safeStorage.length }, (_, index) =>
		safeStorage.key(index)
	).filter((key): key is string => key?.startsWith(prefix) === true);
}
