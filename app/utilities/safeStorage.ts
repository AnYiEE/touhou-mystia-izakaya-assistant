class SafeStorage implements Storage {
	private static _instance: SafeStorage | undefined;

	private _mode: 'local' | 'memory' | 'session' = 'memory';
	private _storage: Storage | null;
	private _memoryStorage: Map<string, string>;

	private constructor() {
		this._storage = this.getAvailableStorage();
		this._memoryStorage = new Map();
		this.loadToMemoryStorage();
	}

	public static getInstance() {
		return (SafeStorage._instance ??= new SafeStorage());
	}

	private getAvailableStorage() {
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
				if (key !== null) {
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

	private switchToFallbackStorage(key: string, value: string) {
		if (this._mode !== 'session') {
			try {
				this._memoryStorage.forEach((storedValue, storedKey) => {
					sessionStorage.setItem(storedKey, storedValue);
				});
				sessionStorage.setItem(key, value);
				this._storage = sessionStorage;
				this._mode = 'session';
				return;
			} catch {
				/* empty */
			}
		}

		this._storage = null;
		this._mode = 'memory';
	}

	private getStorageKeys() {
		const keys = new Set(this._memoryStorage.keys());

		if (this._storage !== null) {
			try {
				for (let i = 0; i < this._storage.length; i++) {
					const key = this._storage.key(i);
					if (key !== null) {
						keys.add(key);
					}
				}
			} catch {
				/* empty */
			}
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
		if (this._storage !== null) {
			try {
				this._storage.clear();
			} catch {
				/* empty */
			}
		}
		this._memoryStorage.clear();
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	public getItem<T extends string = string>(key: string): T | null {
		if (this._storage !== null) {
			try {
				const value = this._storage.getItem(key);
				if (value !== null) {
					this._memoryStorage.set(key, value);
					return value as T;
				}
				this._memoryStorage.delete(key);
			} catch {
				/* empty */
			}
		}
		return (this._memoryStorage.get(key) as T | null) ?? null;
	}

	public key(index: number) {
		const keys = this.getStorageKeys();
		return keys[index] ?? null;
	}

	public removeItem(key: string) {
		if (this._storage !== null) {
			try {
				this._storage.removeItem(key);
			} catch {
				/* empty */
			}
		}
		this._memoryStorage.delete(key);
	}

	public setItem(key: string, value: string) {
		if (this._storage !== null) {
			try {
				this._storage.setItem(key, value);
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
