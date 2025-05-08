import {isObject} from 'lodash';
import {type StateCreator} from 'zustand';

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
			? TNestedType<NonNullable<T[Head]>, Tail> | (T[Head] extends undefined ? undefined : never)
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

function isEqual(value1: unknown, value2: unknown): boolean {
	if (Object.is(value1, value2)) {
		return true;
	}

	if (isPlainObject(value1) && isPlainObject(value2)) {
		const keys1 = Object.keys(value1);
		const keys2 = Object.keys(value2);

		return (
			keys1.length === keys2.length &&
			keys1.every((key) => Object.hasOwn(value2, key) && isEqual(value1[key], value2[key]))
		);
	}

	if (Array.isArray(value1) && Array.isArray(value2)) {
		return value1.length === value2.length && value1.every((element, index) => isEqual(element, value2[index]));
	}

	return false;
}

function getNestedValue<T, P extends TNestedKeys<T>>(object: T, path: P) {
	return path
		.split('.')
		.reduce<unknown>(
			(acc, key) => (acc === undefined ? undefined : (acc as TPlainObject)[key]),
			object
		) as TNestedType<T, TSplitByDot<P>>;
}

function setNestedValue<T, P extends TNestedKeys<T>>(object: T, path: P, value: TNestedType<T, TSplitByDot<P>>) {
	const keys = path.split('.') as TSplitByDot<P>;
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
			} else if (!isEqual(targetValue, sourceValue)) {
				isChanged = true;
				acc[key] = sourceValue;
			}

			return acc;
		},
		{
			...target,
		} as TPlainObject
	) as T;

	return isChanged ? result : target;
}

function assign<T, P extends TNestedKeys<T>>(object: T, path: P, value: TNestedType<T, TSplitByDot<P>>) {
	const tempObjectForPath = {} as T;

	setNestedValue(tempObjectForPath, path, value);
	Object.assign(object as object, merge(object, tempObjectForPath));
}

interface ISyncOptions<T> {
	name: string;
	watch: Array<TNestedKeys<T>>;
}

const LOADED_SIGNAL = '__loaded__';

export function sync<T>(options: ISyncOptions<T>) {
	return (initializer: StateCreator<T>): StateCreator<T> =>
		(set, get, api) => {
			const {name, watch} = options;
			const channel = new BroadcastChannel(name);

			channel.postMessage(LOADED_SIGNAL);
			channel.addEventListener('message', ({data}) => {
				if (data === LOADED_SIGNAL) {
					const currentState = get();

					const watchedState = watch.reduce((acc, path) => {
						assign(acc, path, getNestedValue(currentState, path));

						return acc;
					}, {} as T) as object;

					if (Object.keys(watchedState).length > 0) {
						channel.postMessage(watchedState);
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

					if (!isEqual(currentValue, prevValue)) {
						assign(acc, path, currentValue);
					}

					return acc;
				}, {} as T) as object;

				if (Object.keys(watchedState).length > 0) {
					channel.postMessage(watchedState);
				}
			};

			api.setState = mySet;

			return initializer(mySet, get, api);
		};
}
