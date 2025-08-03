import { type StateCreator } from 'zustand';
import {
	type PersistOptions,
	persist as persistMiddleware,
} from 'zustand/middleware';

// eslint-disable-next-line unicorn/prefer-global-this
const isServer = typeof window === 'undefined';

export function persist<T>(options: PersistOptions<T>) {
	return (initializer: StateCreator<T>) => {
		if (isServer) {
			return initializer;
		}

		return persistMiddleware<T>(initializer, options);
	};
}
