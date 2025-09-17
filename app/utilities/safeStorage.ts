class SafeStorage implements Storage {
	private static _instance: SafeStorage | undefined;

	private _storage: Storage | null;
	private _memoryStorage?: Map<string, string>;
	private _hasMigrated = false;

	private constructor() {
		this._storage = this.getAvailableStorage();
	}

	public static getInstance() {
		return (SafeStorage._instance ??= new SafeStorage());
	}

	private getAvailableStorage() {
		const testKey = '__test__';

		try {
			localStorage.setItem(testKey, '');
			localStorage.removeItem(testKey);
			return localStorage;
		} catch {
			/* empty */
		}

		try {
			sessionStorage.setItem(testKey, '');
			sessionStorage.removeItem(testKey);
			return sessionStorage;
		} catch {
			/* empty */
		}

		return null;
	}

	private getMemoryStorage() {
		return (this._memoryStorage ??= new Map<string, string>());
	}

	private migrateToMemoryStorage() {
		if (this._hasMigrated || this._storage === null) {
			return;
		}

		this._hasMigrated = true;

		const memoryStorage = this.getMemoryStorage();

		try {
			for (let i = 0; i < this._storage.length; i++) {
				const key = this._storage.key(i);
				if (key !== null) {
					const value = this._storage.getItem(key);
					if (value !== null) {
						memoryStorage.set(key, value);
					}
				}
			}
		} catch {
			/* empty */
		}

		this._storage = null;
	}

	public get length() {
		if (this._storage !== null) {
			return this._storage.length;
		}

		return this.getMemoryStorage().size;
	}

	public clear() {
		if (this._storage === null) {
			this.getMemoryStorage().clear();
		} else {
			this._storage.clear();
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	public getItem<T extends string = string>(key: string): T | null {
		if (this._storage !== null) {
			return this._storage.getItem(key) as T | null;
		}

		return (this.getMemoryStorage().get(key) as T | null) ?? null;
	}

	public key(index: number) {
		if (this._storage !== null) {
			return this._storage.key(index);
		}

		const keys = [...this.getMemoryStorage().keys()];

		return keys[index] ?? null;
	}

	public removeItem(key: string) {
		if (this._storage === null) {
			this.getMemoryStorage().delete(key);
		} else {
			this._storage.removeItem(key);
		}
	}

	public setItem(key: string, value: string) {
		if (this._storage === null) {
			this.getMemoryStorage().set(key, value);
		} else {
			try {
				this._storage.setItem(key, value);
			} catch {
				this.migrateToMemoryStorage();
				this.getMemoryStorage().set(key, value);
			}
		}
	}
}

export const safeStorage = SafeStorage.getInstance();
