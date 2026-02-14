class SafeStorage implements Storage {
	private static _instance: SafeStorage | undefined;

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

	public get length() {
		return this._memoryStorage.size;
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
		const keys = [...this._memoryStorage.keys()];
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
			} catch {
				/* empty */
			}
		}
		this._memoryStorage.set(key, value);
	}
}

export const safeStorage = SafeStorage.getInstance();
