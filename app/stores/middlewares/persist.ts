import {type StateCreator} from 'zustand';
import {type PersistOptions, persist as persistMiddleware} from 'zustand/middleware';

export function persist<T>(options: PersistOptions<T>) {
	return (initializer: StateCreator<T>) => persistMiddleware<T>(initializer, options);
}
