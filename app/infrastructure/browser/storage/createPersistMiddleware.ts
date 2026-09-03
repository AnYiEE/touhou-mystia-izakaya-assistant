import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { type StateCreator } from 'zustand';
import {
	type PersistOptions,
	type StateStorage,
	createJSONStorage,
	persist as persistMiddleware,
} from 'zustand/middleware';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import { createVersionGuardedStateStorage } from './futurePersistenceGuard';
import { safeStorage } from './safeStorage';

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

export function createPersistMiddleware<T, TPersistedState = T>(
	options: Omit<PersistOptions<T, TPersistedState>, 'storage'> & {
		normalize?: (value: unknown) => unknown;
	}
) {
	const {
		merge: mergeOption,
		migrate,
		normalize,
		...persistOptions
	} = options;
	const currentVersion = persistOptions.version ?? 0;
	const normalizeState =
		normalize === undefined
			? undefined
			: (value: unknown) => {
					const record = isObjectTagRecord(value) ? value : {};
					const persistence = isObjectTagRecord(record['persistence'])
						? record['persistence']
						: {};
					return { ...record, persistence: normalize(persistence) };
				};
	const migrateState:
		| ((
				value: unknown,
				version: number
		  ) => TPersistedState | Promise<TPersistedState>)
		| undefined =
		migrate === undefined
			? undefined
			: (value: unknown, version: number) => {
					try {
						return migrate(value, version);
					} catch {
						try {
							return (normalizeState?.(value) ??
								value) as TPersistedState;
						} catch {
							return value as TPersistedState;
						}
					}
				};

	return (initializer: StateCreator<T>) => {
		if (isServer) {
			return initializer;
		}

		const storage = createJSONStorage<TPersistedState>(() =>
			createVersionGuardedStateStorage({
				currentVersion,
				storage: lZLocalStorage,
			})
		);

		return persistMiddleware<T, [], [], TPersistedState>(initializer, {
			storage,
			...persistOptions,
			merge(persistedState, currentState) {
				const normalizedState =
					persistedState === undefined
						? persistedState
						: (normalizeState?.(persistedState) ?? persistedState);
				return (
					mergeOption ??
					((pendingState: unknown, state: T): T => {
						if (isObjectTagRecord(pendingState)) {
							return { ...state, ...pendingState };
						}
						return state;
					})
				)(normalizedState, currentState);
			},
			...(migrateState === undefined ? {} : { migrate: migrateState }),
		});
	};
}
