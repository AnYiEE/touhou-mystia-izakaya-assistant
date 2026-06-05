import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { type StateCreator } from 'zustand';
import {
	type PersistOptions,
	type StateStorage,
	createJSONStorage,
	persist as persistMiddleware,
} from 'zustand/middleware';

import { safeStorage } from '@/utilities/safeStorage';

const COMPRESS_PREFIX = '__LZ__';

const lZLocalStorage = {
	getItem(name: string) {
		const value = safeStorage.getItem(name);
		if (value === null) {
			return null;
		}
		if (value.startsWith(COMPRESS_PREFIX)) {
			return decompressFromUTF16(value.slice(COMPRESS_PREFIX.length));
		}
		return value;
	},
	removeItem(name: string) {
		safeStorage.removeItem(name);
	},
	setItem(name: string, value: string) {
		safeStorage.setItem(name, COMPRESS_PREFIX + compressToUTF16(value));
	},
} satisfies StateStorage;

// eslint-disable-next-line unicorn/prefer-global-this
const isServer = typeof window === 'undefined';

export function persist<T, TPersistedState = T>(
	options: Omit<PersistOptions<T, TPersistedState>, 'storage'>
) {
	return (initializer: StateCreator<T>) => {
		if (isServer) {
			return initializer;
		}

		return persistMiddleware<T, [], [], TPersistedState>(initializer, {
			storage: createJSONStorage(() => lZLocalStorage),
			...options,
		});
	};
}
