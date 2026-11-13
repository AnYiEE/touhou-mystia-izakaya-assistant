import { safeStorage } from '@/infrastructure/browser/storage/safeStorage';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

export {
	ACCOUNT_STORAGE_KEY_MAP,
	createAccountStorageKey,
} from './storageKeys';

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
		console.warn('Failed to persist account storage value.', {
			errorCode: getLogSafeErrorCode(error),
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
