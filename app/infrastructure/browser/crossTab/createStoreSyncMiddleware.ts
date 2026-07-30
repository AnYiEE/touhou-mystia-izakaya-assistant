import { BroadcastChannel } from 'broadcast-channel';
import { type StateCreator } from 'zustand';

import { getSafeStorageMode } from '@/infrastructure/browser/storage/safeStorage';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import { memoize } from '@/shared/utilities/cache/memoize';
import {
	checkLengthEmpty,
	checkLengthEqualOf,
} from '@/shared/utilities/collections/check';
import { copyArray } from '@/shared/utilities/collections/convert';
import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import type { IRemoteStateApplicationGuard } from './contracts';

type TPlainObject = Record<string, unknown>;

type TNestedKeys<T> = T extends TPlainObject
	? {
			[K in Extract<keyof T, string>]-?: T[K] extends TPlainObject
				? `${K}` | `${K}.${TNestedKeys<T[K]>}`
				: `${K}`;
		}[Extract<keyof T, string>]
	: never;

type TNestedType<T, P> = P extends [infer Head, ...infer Tail]
	? Head extends keyof T
		? Tail extends string[]
			?
					| TNestedType<NonNullable<T[Head]>, Tail>
					| (T[Head] extends undefined ? undefined : never)
			: never
		: undefined
	: T;

type TSplitByDot<T> = T extends ''
	? []
	: T extends `${infer Head}.${infer Tail}`
		? Head extends ''
			? TSplitByDot<Tail>
			: [Head, ...TSplitByDot<Tail>]
		: [T];

function checkEqual(value1: unknown, value2: unknown): boolean {
	if (value1 === value2) {
		return true;
	}

	if (isObjectTagRecord(value1) && isObjectTagRecord(value2)) {
		const keys1 = Object.keys(value1);
		const keys2 = Object.keys(value2);

		return (
			checkLengthEqualOf(keys1, keys2) &&
			keys1.every(
				(key) =>
					Object.hasOwn(value2, key) &&
					checkEqual(value1[key], value2[key])
			)
		);
	}

	if (Array.isArray(value1) && Array.isArray(value2)) {
		return (
			checkLengthEqualOf(value1, value2) &&
			value1.every((element, index) => checkEqual(element, value2[index]))
		);
	}

	return false;
}

const getKeys = memoize(function getKeys<T extends string>(path: T) {
	return path.split('.') as TSplitByDot<T>;
});

function getNestedValue<T, P extends TNestedKeys<T>>(object: T, path: P) {
	return getKeys(path).reduce<unknown>(
		(acc, key) =>
			acc === undefined ? undefined : (acc as TPlainObject)[key],
		object
	) as TNestedType<T, TSplitByDot<P>>;
}

function setNestedValue<T, P extends TNestedKeys<T>>(
	object: T,
	path: P,
	value: TNestedType<T, TSplitByDot<P>>
) {
	const keys = copyArray(getKeys(path));
	const lastKey = keys.pop() as string;

	const target = keys.reduce((acc, key) => {
		if (!isObjectTagRecord(acc[key])) {
			acc[key] = {};
		}

		return acc[key] as TPlainObject;
	}, object as TPlainObject);

	target[lastKey] = value;
}

function merge<T>(target: T, source: Partial<T>) {
	if (target === source) {
		return target;
	}

	let isChanged = false as boolean;

	const result = Object.keys(source).reduce(
		(acc, key) => {
			const sourceValue = (source as TPlainObject)[key];
			const targetValue = acc[key];

			if (
				isObjectTagRecord(targetValue) &&
				isObjectTagRecord(sourceValue)
			) {
				const mergedValue = merge(targetValue, sourceValue);
				if (targetValue !== mergedValue) {
					isChanged = true;
					acc[key] = mergedValue;
				}
			} else if (!checkEqual(targetValue, sourceValue)) {
				isChanged = true;
				acc[key] = sourceValue;
			}

			return acc;
		},
		{ ...target } as TPlainObject
	) as T;

	return isChanged ? result : target;
}

function assign<T, P extends TNestedKeys<T>>(
	object: T,
	path: P,
	value: TNestedType<T, TSplitByDot<P>>
) {
	const tempObjectForPath = {} as T;

	setNestedValue(tempObjectForPath, path, value);
	Object.assign(object as object, merge(object, tempObjectForPath));
}

// eslint-disable-next-line unicorn/prefer-global-this
const isServer = typeof window === 'undefined';

const LOADED_SIGNAL = '__loaded__';

interface ISyncOptions<T> {
	name: string;
	remoteStateApplicationGuard: IRemoteStateApplicationGuard;
	watch: Array<Extract<TNestedKeys<T>, `persistence${string}`>>;
}

function createStoreBroadcastChannel(name: string) {
	try {
		return new BroadcastChannel<unknown>(name, { webWorkerSupport: false });
	} catch (error) {
		console.warn('Store broadcast channel is unavailable.', {
			errorCode: getLogSafeErrorCode(error),
		});
		return null;
	}
}

function postStoreBroadcastMessage(
	channel: BroadcastChannel<unknown> | null,
	message: unknown
) {
	if (channel === null || getSafeStorageMode() !== 'local') {
		return;
	}

	try {
		void channel.postMessage(message).catch((error: unknown) => {
			console.warn('Store broadcast failed.', {
				errorCode: getLogSafeErrorCode(error),
			});
		});
	} catch (error) {
		console.warn('Store broadcast failed.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}
}

function subscribeStoreBroadcastMessage(
	channel: BroadcastChannel<unknown> | null,
	callback: (message: unknown) => void
) {
	if (channel === null) {
		return;
	}

	try {
		channel.addEventListener('message', (message) => {
			if (getSafeStorageMode() === 'local') {
				callback(message);
			}
		});
	} catch (error) {
		console.warn('Store broadcast subscription failed.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}
}

export function createStoreSyncMiddleware<T>(options: ISyncOptions<T>) {
	return (initializer: StateCreator<T>): StateCreator<T> => {
		if (isServer) {
			return initializer;
		}

		return (set, get, api) => {
			const { name, remoteStateApplicationGuard, watch } = options;
			const channel = createStoreBroadcastChannel(name);

			postStoreBroadcastMessage(channel, LOADED_SIGNAL);
			subscribeStoreBroadcastMessage(channel, (data) => {
				if (data === LOADED_SIGNAL) {
					if (checkLengthEmpty(watch)) {
						return;
					}

					const currentState = get();

					const watchedState = watch.reduce((acc, path) => {
						assign(acc, path, getNestedValue(currentState, path));

						return acc;
					}, {} as T);

					postStoreBroadcastMessage(channel, watchedState);
				} else {
					set((state) => merge(state, data as Partial<T>));
				}
			});

			const originalSet = api.setState;

			const mySet: typeof set = (...args) => {
				const prevState = get();

				originalSet(...(args as Parameters<typeof set>));

				const currentState = get();

				let hasChanges = false as boolean;
				const watchedState = watch.reduce((acc, path) => {
					const currentValue = getNestedValue(currentState, path);
					const prevValue = getNestedValue(prevState, path);

					if (!checkEqual(currentValue, prevValue)) {
						assign(acc, path, currentValue);
						hasChanges = true;
					}

					return acc;
				}, {} as T);

				if (
					hasChanges &&
					!remoteStateApplicationGuard.checkApplyingRemoteState()
				) {
					postStoreBroadcastMessage(channel, watchedState);
				}
			};

			api.setState = mySet;

			return initializer(mySet, get, api);
		};
	};
}
