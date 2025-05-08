import {del, get, set} from 'idb-keyval';
import {type PersistStorage} from 'zustand/middleware';

const checkCache = new Map<string, boolean>();

async function check(name: string) {
	if (checkCache.has(name)) {
		return;
	}

	try {
		const oldStorage = localStorage.getItem(name);
		if (oldStorage !== null) {
			await set(name, JSON.parse(oldStorage));
			localStorage.removeItem(name);
		}
	} catch {
		/* empty */
	}

	checkCache.set(name, true);
}

const fakeStorage = {
	getItem: () => null,
	removeItem: () => {},
	setItem: () => {},
} as const;

export function createIndexDBStorage<T>(): PersistStorage<T> {
	if (typeof indexedDB === 'undefined') {
		return fakeStorage;
	}

	return {
		getItem: async (name) => {
			await check(name);
			return (await get(name)) ?? null;
		},
		removeItem: async (name) => {
			await check(name);
			await del(name);
		},
		setItem: async (name, value) => {
			await check(name);
			await set(name, value);
		},
	};
}
