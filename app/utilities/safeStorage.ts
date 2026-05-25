type TSafeStorageFallbackMode = 'memory' | 'session';
type TSafeStorageMode = TSafeStorageFallbackMode | 'local';

const fallbackModeKey = '__safeStorageFallbackMode';
const managedKeysKey = '__safeStorageManagedKeys';
const internalKeys = new Set([fallbackModeKey, managedKeysKey]);

class SafeStorage implements Storage {
	private static _instance: SafeStorage | undefined;

	private _mode: TSafeStorageMode = 'memory';
	private _managedKeys: Set<string>;
	private _staleStorage: Storage | null = null;
	private _storage: Storage | null;
	private _memoryStorage: Map<string, string>;

	private constructor() {
		this._memoryStorage = new Map();
		this._managedKeys = this.readStoredManagedKeys();
		this._storage = this.getAvailableStorage();
		this.loadToMemoryStorage();
	}

	public static getInstance() {
		return (SafeStorage._instance ??= new SafeStorage());
	}

	private checkStorageAvailable(storage: Storage) {
		const testKey = `${fallbackModeKey}:test`;

		try {
			storage.setItem(testKey, '');
			storage.removeItem(testKey);
			return true;
		} catch {
			return false;
		}
	}

	private readFallbackMode(): TSafeStorageFallbackMode | null {
		try {
			const mode = sessionStorage.getItem(fallbackModeKey);
			if (mode === 'memory') {
				sessionStorage.removeItem(fallbackModeKey);
				return null;
			}

			return mode === 'session' ? mode : null;
		} catch {
			return null;
		}
	}

	private readStoredManagedKeys() {
		const keys = new Set<string>();
		const addStoredKeys = (value: string | null) => {
			const parsed: unknown = value === null ? [] : JSON.parse(value);
			if (!Array.isArray(parsed)) {
				return;
			}

			parsed.forEach((key) => {
				if (typeof key === 'string' && !internalKeys.has(key)) {
					keys.add(key);
				}
			});
		};

		try {
			addStoredKeys(sessionStorage.getItem(managedKeysKey));
		} catch {
			/* empty */
		}
		try {
			addStoredKeys(
				this.getLocalStorageReference()?.getItem(managedKeysKey) ?? null
			);
		} catch {
			/* empty */
		}

		return keys;
	}

	private persistManagedKeys() {
		const serialized = JSON.stringify([...this._managedKeys]);
		try {
			sessionStorage.setItem(managedKeysKey, serialized);
		} catch {
			/* empty */
		}
		try {
			this.getLocalStorageReference()?.setItem(
				managedKeysKey,
				serialized
			);
		} catch {
			/* empty */
		}
	}

	private persistFallbackMode(mode: TSafeStorageFallbackMode) {
		try {
			sessionStorage.setItem(fallbackModeKey, mode);
			this.persistManagedKeys();
		} catch {
			/* empty */
		}
	}

	private markManagedKey(key: string) {
		if (internalKeys.has(key) || this._managedKeys.has(key)) {
			return;
		}

		this._managedKeys.add(key);
		this.persistManagedKeys();
	}

	private invalidateStorageKeys(storage: Storage | null) {
		if (storage === null) {
			return;
		}

		this._managedKeys.forEach((key) => {
			try {
				storage.removeItem(key);
			} catch {
				/* empty */
			}
		});
	}

	private invalidateStaleStorageKey(key: string) {
		if (this._staleStorage === null || internalKeys.has(key)) {
			return;
		}

		try {
			this._staleStorage.removeItem(key);
		} catch {
			/* empty */
		}
	}

	private getLocalStorageReference() {
		try {
			return localStorage;
		} catch {
			return null;
		}
	}

	private getAvailableStorage() {
		const fallbackMode = this.readFallbackMode();
		if (fallbackMode === 'memory') {
			this._mode = 'memory';
			return null;
		}

		if (
			fallbackMode === 'session' &&
			this.checkStorageAvailable(sessionStorage)
		) {
			this._mode = 'session';
			this._staleStorage = this.getLocalStorageReference();
			return sessionStorage;
		}

		const testKey = '__test__';

		try {
			localStorage.setItem(testKey, '');
			localStorage.removeItem(testKey);
			this._mode = 'local';
			return localStorage;
		} catch {
			/* empty */
		}

		try {
			sessionStorage.setItem(testKey, '');
			sessionStorage.removeItem(testKey);
			this._mode = 'session';
			this._staleStorage = this.getLocalStorageReference();
			this.persistFallbackMode('session');
			this.invalidateStorageKeys(this._staleStorage);
			return sessionStorage;
		} catch {
			/* empty */
		}

		return null;
	}

	private loadToMemoryStorage() {
		if (this._storage === null) {
			return;
		}

		try {
			for (let i = 0; i < this._storage.length; i++) {
				const key = this._storage.key(i);
				if (key !== null && !internalKeys.has(key)) {
					const value = this._storage.getItem(key);
					if (value !== null) {
						this._memoryStorage.set(key, value);
					}
				}
			}
		} catch {
			/* empty */
		}
	}

	private switchToMemoryStorage() {
		const previousStorage = this._storage;
		this._staleStorage = previousStorage ?? this._staleStorage;
		this._storage = null;
		this._mode = 'memory';
	}

	private restoreAvailableStorage() {
		if (this._storage !== null) {
			return;
		}

		const storage = this.getAvailableStorage();
		if (storage === null) {
			return;
		}

		try {
			this._managedKeys.forEach((key) => {
				if (internalKeys.has(key)) {
					return;
				}

				const value = this._memoryStorage.get(key);
				if (value === undefined) {
					storage.removeItem(key);
				} else {
					storage.setItem(key, value);
				}
			});
			this._memoryStorage.forEach((value, key) => {
				if (!internalKeys.has(key)) {
					storage.setItem(key, value);
				}
			});
			this._storage = storage;
			this.persistManagedKeys();
			this._staleStorage = null;
		} catch {
			this._staleStorage = storage;
			this._storage = null;
			this._mode = 'memory';
		}
	}

	private switchToFallbackStorage(key: string, value: string) {
		this.markManagedKey(key);
		const previousStorage = this._storage;
		if (this._mode !== 'session') {
			const previousValues = new Map<string, string | null>();
			const setSessionItem = (
				storageKey: string,
				storageValue: string
			) => {
				if (!previousValues.has(storageKey)) {
					previousValues.set(
						storageKey,
						sessionStorage.getItem(storageKey)
					);
				}
				sessionStorage.setItem(storageKey, storageValue);
			};

			try {
				this._memoryStorage.forEach((storedValue, storedKey) => {
					if (!internalKeys.has(storedKey)) {
						setSessionItem(storedKey, storedValue);
					}
				});
				setSessionItem(key, value);
				this._storage = sessionStorage;
				this._staleStorage = previousStorage;
				this._mode = 'session';
				this.persistFallbackMode('session');
				this.invalidateStorageKeys(previousStorage);
				return;
			} catch {
				previousValues.forEach((previousValue, previousKey) => {
					try {
						if (previousValue === null) {
							sessionStorage.removeItem(previousKey);
						} else {
							sessionStorage.setItem(previousKey, previousValue);
						}
					} catch {
						/* empty */
					}
				});
			}
		}

		this.switchToMemoryStorage();
	}

	private getStorageKeys() {
		const keys = new Set(this._memoryStorage.keys());

		if (this._storage !== null) {
			const storageKeys: string[] = [];
			try {
				for (let i = 0; i < this._storage.length; i++) {
					const key = this._storage.key(i);
					if (key !== null && !internalKeys.has(key)) {
						storageKeys.push(key);
					}
				}
			} catch {
				this.switchToMemoryStorage();
				return [...this._memoryStorage.keys()];
			}
			storageKeys.forEach((key) => {
				keys.add(key);
			});
		}

		return [...keys];
	}

	public get length() {
		return this.getStorageKeys().length;
	}

	public get mode() {
		return this._mode;
	}

	public clear() {
		this.restoreAvailableStorage();
		if (this._storage !== null) {
			const storage = this._storage;
			try {
				this._managedKeys.forEach((key) => {
					try {
						storage.removeItem(key);
					} catch {
						/* empty */
					}
				});
			} catch {
				this.switchToMemoryStorage();
			}
		}
		this.invalidateStorageKeys(this._staleStorage);
		this._memoryStorage.clear();
		this._managedKeys.clear();
		this.persistManagedKeys();
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	public getItem<T extends string = string>(key: string): T | null {
		this.markManagedKey(key);
		this.restoreAvailableStorage();
		if (this._storage !== null) {
			try {
				const value = this._storage.getItem(key);
				if (value !== null) {
					this._memoryStorage.set(key, value);
					return value as T;
				}
				this._memoryStorage.delete(key);
			} catch {
				this.switchToMemoryStorage();
			}
		}
		return (this._memoryStorage.get(key) as T | null) ?? null;
	}

	public key(index: number) {
		const keys = this.getStorageKeys();
		return keys[index] ?? null;
	}

	public removeItem(key: string) {
		this.markManagedKey(key);
		this.restoreAvailableStorage();
		if (this._storage !== null) {
			try {
				this._storage.removeItem(key);
				this.invalidateStaleStorageKey(key);
			} catch {
				this.switchToMemoryStorage();
			}
		}
		this._memoryStorage.delete(key);
	}

	public setItem(key: string, value: string) {
		this.markManagedKey(key);
		this.restoreAvailableStorage();
		if (this._storage !== null) {
			try {
				this._storage.setItem(key, value);
				this.invalidateStaleStorageKey(key);
				this._memoryStorage.set(key, value);
				return;
			} catch {
				this.switchToFallbackStorage(key, value);
			}
		}
		this._memoryStorage.set(key, value);
	}
}

export const safeStorage = SafeStorage.getInstance();

export function getSafeStorageMode() {
	return safeStorage.mode;
}
