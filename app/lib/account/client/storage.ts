import { safeStorage } from '@/utilities/safeStorage';

export const ACCOUNT_STORAGE_KEY_MAP = {
	baseSnapshot: 'account:sync-base',
	conflictResolution: 'account-sync-conflict-resolution',
	dirtyEvidence: 'account-sync-dirty-evidence-v1',
	dirtyQueue: 'account-sync-dirty',
	dirtyQueueV2: 'account-sync-dirty-v2',
	dirtyTransition: 'account-sync-dirty-transition',
	lease: 'account-sync-uploader',
	resetGeneration: 'account-sync-reset-generation',
	runtimeSignal: 'account-runtime-signal',
	syncMeta: 'account-sync-meta',
	syncOperation: 'account-sync-operation',
} as const;

export function createAccountStorageKey(...parts: string[]) {
	return parts.join(':');
}

export function readAccountStorage(key: string) {
	return safeStorage.getItem(key);
}

export function readAccountJsonStorage<T>(key: string, fallback: T): T {
	const value = readAccountStorage(key);
	if (value === null) {
		return fallback;
	}

	try {
		const parsed = JSON.parse(value) as T | null;
		return parsed ?? fallback;
	} catch {
		return fallback;
	}
}

export function writeAccountStorage(key: string, value: string) {
	safeStorage.setItem(key, value);
}

export function writeAccountJsonStorage(key: string, value: unknown) {
	try {
		writeAccountStorage(key, JSON.stringify(value));
	} catch (error) {
		console.warn('Failed to persist account storage value.', { error });
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
