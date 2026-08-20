import { BroadcastChannel } from 'broadcast-channel';
import { compareVersions } from 'compare-versions';
import { type StateCreator } from 'zustand';

import { getSafeStorageMode } from '@/infrastructure/browser/storage/safeStorage';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import { memoize } from '@/shared/utilities/cache/memoize';
import {
	checkLengthEmpty,
	checkLengthEqualOf,
} from '@/shared/utilities/collections/check';
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
	const keys = [...getKeys(path)];
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

const STORE_SYNC_MESSAGE_KEY = '__storeSync__';
const STORE_SYNC_PROTOCOL_VERSION = 1;

interface IStoreSyncLoadedMessage {
	protocolVersion: typeof STORE_SYNC_PROTOCOL_VERSION;
	storeVersion: number;
	type: 'loaded';
}

interface IStoreSyncStateMessage {
	protocolVersion: typeof STORE_SYNC_PROTOCOL_VERSION;
	state: TPlainObject;
	storeVersion: number;
	type: 'state';
}

type TStoreSyncMessage = IStoreSyncLoadedMessage | IStoreSyncStateMessage;

function readStoreSyncMessage(message: unknown): TStoreSyncMessage | null {
	if (!isObjectTagRecord(message)) {
		return null;
	}
	const envelope = message[STORE_SYNC_MESSAGE_KEY];
	if (
		!isObjectTagRecord(envelope) ||
		envelope['protocolVersion'] !== STORE_SYNC_PROTOCOL_VERSION
	) {
		return null;
	}

	if (
		(envelope['type'] !== 'loaded' && envelope['type'] !== 'state') ||
		typeof envelope['storeVersion'] !== 'number' ||
		!Number.isSafeInteger(envelope['storeVersion']) ||
		envelope['storeVersion'] < 0
	) {
		return null;
	}
	if (envelope['type'] === 'loaded') {
		return envelope as unknown as IStoreSyncLoadedMessage;
	}

	return isObjectTagRecord(envelope['state'])
		? (envelope as unknown as IStoreSyncStateMessage)
		: null;
}

function createStoreSyncLoadedMessage(storeVersion: number) {
	return {
		[STORE_SYNC_MESSAGE_KEY]: {
			protocolVersion: STORE_SYNC_PROTOCOL_VERSION,
			storeVersion,
			type: 'loaded',
		},
	};
}

function createStoreSyncStateMessage(
	storeVersion: number,
	state: TPlainObject
) {
	return {
		[STORE_SYNC_MESSAGE_KEY]: {
			protocolVersion: STORE_SYNC_PROTOCOL_VERSION,
			state,
			storeVersion,
			type: 'state',
		},
	};
}

function checkStoreSyncLoaded(message: unknown, storeVersion: number) {
	const parsed = readStoreSyncMessage(message);
	return parsed?.type === 'loaded' && parsed.storeVersion === storeVersion;
}

function readStoreSyncStateMessage(message: unknown) {
	const parsed = readStoreSyncMessage(message);
	return parsed?.type === 'state'
		? { state: parsed.state, storeVersion: parsed.storeVersion }
		: null;
}

interface IAppVersionSyncOptions<T> {
	current: string;
	createRemoteState(appVersion: string): Partial<T>;
	readRemoteState(state: unknown): string | null;
}

interface ISyncOptions<T> {
	appVersion?: IAppVersionSyncOptions<T>;
	name: string;
	normalizeRemoteState?: (state: unknown) => Partial<T> | null;
	remoteStateApplicationGuard: IRemoteStateApplicationGuard;
	storeVersion: number;
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
			const {
				appVersion,
				name,
				normalizeRemoteState,
				remoteStateApplicationGuard,
				storeVersion,
				watch,
			} = options;
			const channel = createStoreBroadcastChannel(name);

			const handleRemoteAppVersion = (
				remoteAppVersion: string | null
			) => {
				if (appVersion === undefined || remoteAppVersion === null) {
					return;
				}

				let comparison: number;
				try {
					comparison = compareVersions(
						remoteAppVersion,
						appVersion.current
					);
				} catch {
					return;
				}

				if (comparison > 0) {
					set((state) =>
						merge(
							state,
							appVersion.createRemoteState(remoteAppVersion)
						)
					);
				}
			};

			const createWatchedState = () => {
				const currentState = get();
				return watch.reduce((acc, path) => {
					assign(acc, path, getNestedValue(currentState, path));

					return acc;
				}, {} as T);
			};

			postStoreBroadcastMessage(
				channel,
				createStoreSyncLoadedMessage(storeVersion)
			);
			subscribeStoreBroadcastMessage(channel, (data) => {
				if (checkStoreSyncLoaded(data, storeVersion)) {
					if (!checkLengthEmpty(watch)) {
						postStoreBroadcastMessage(
							channel,
							createStoreSyncStateMessage(
								storeVersion,
								createWatchedState() as TPlainObject
							)
						);
					}
					return;
				}

				const remoteStateMessage = readStoreSyncStateMessage(data);
				if (remoteStateMessage !== null) {
					handleRemoteAppVersion(
						appVersion?.readRemoteState(remoteStateMessage.state) ??
							null
					);
					if (remoteStateMessage.storeVersion !== storeVersion) {
						return;
					}

					const remoteState =
						normalizeRemoteState === undefined
							? (remoteStateMessage.state as Partial<T>)
							: normalizeRemoteState(remoteStateMessage.state);
					if (remoteState !== null) {
						set((state) => merge(state, remoteState));
					}
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
					postStoreBroadcastMessage(
						channel,
						createStoreSyncStateMessage(
							storeVersion,
							watchedState as TPlainObject
						)
					);
				}
			};

			api.setState = mySet;

			return initializer(mySet, get, api);
		};
	};
}
