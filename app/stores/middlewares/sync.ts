import { BroadcastChannel } from 'broadcast-channel';
import { isObject } from 'lodash';
import { type StateCreator } from 'zustand';

import {
	checkEmpty,
	checkLengthEqualOf,
	copyArray,
	memoize,
} from '@/utilities';

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

function isPlainObject(value: unknown): value is TPlainObject {
	if (Array.isArray(value) || !isObject(value)) {
		return false;
	}

	return Object.prototype.toString.call(value) === '[object Object]';
}

function checkEqual(value1: unknown, value2: unknown): boolean {
	if (value1 === value2) {
		return true;
	}

	if (isPlainObject(value1) && isPlainObject(value2)) {
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
		if (!isPlainObject(acc[key])) {
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

			if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
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
	watch: Array<Extract<TNestedKeys<T>, `persistence${string}`>>;
}

export function sync<T>(options: ISyncOptions<T>) {
	return (initializer: StateCreator<T>): StateCreator<T> => {
		if (isServer) {
			return initializer;
		}

		return (set, get, api) => {
			const { name, watch } = options;
			const channel = new BroadcastChannel(name, {
				webWorkerSupport: false,
			});

			void channel.postMessage(LOADED_SIGNAL);
			channel.addEventListener('message', (data) => {
				if (data === LOADED_SIGNAL) {
					const currentState = get();

					const watchedState = watch.reduce((acc, path) => {
						assign(acc, path, getNestedValue(currentState, path));

						return acc;
					}, {} as T) as object;

					if (!checkEmpty(Object.keys(watchedState))) {
						void channel.postMessage(watchedState);
					}
				} else {
					set((state) => merge(state, data as Partial<T>));
				}
			});

			const originalSet = api.setState;

			const mySet: typeof set = (...args) => {
				const prevState = get();

				originalSet(...(args as Parameters<typeof set>));

				const currentState = get();

				const watchedState = watch.reduce((acc, path) => {
					const currentValue = getNestedValue(currentState, path);
					const prevValue = getNestedValue(prevState, path);

					if (!checkEqual(currentValue, prevValue)) {
						assign(acc, path, currentValue);
					}

					return acc;
				}, {} as T) as object;

				if (!checkEmpty(Object.keys(watchedState))) {
					void channel.postMessage(watchedState);
				}
			};

			api.setState = mySet;

			return initializer(mySet, get, api);
		};
	};
}
