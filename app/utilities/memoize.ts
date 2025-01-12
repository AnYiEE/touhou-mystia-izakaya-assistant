import {isObject} from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TFunction = (...args: any[]) => any;

type TFirstParameterType<T extends TFunction> = Parameters<T>[0];
type TIsObject<T> = T extends object ? (T extends null ? false : true) : false;

type TCache<T extends TFunction> =
	TIsObject<TFirstParameterType<T>> extends true
		? WeakMap<TFirstParameterType<T>, ReturnType<T>>
		: Map<TFirstParameterType<T>, ReturnType<T>>;

type TMemoizedFn<T extends TFunction> = T & {
	cache: TCache<T>;
};

export function memoize<T extends TFunction>(fn: T, cacheType?: 'Map' | 'WeakMap') {
	const isWeakMap = cacheType === 'WeakMap';
	const cache = (isWeakMap ? new WeakMap() : new Map()) as TCache<T>;

	const memoized = (...args: Parameters<T>) => {
		const key = args[0] as TFirstParameterType<T>;

		if (isWeakMap && !isObject(key)) {
			throw new TypeError('[utilities/memoize]: `WeakMap` only supports objects as keys');
		}

		if (cache.has(key)) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return cache.get(key) as ReturnType<T>;
		}

		const result = fn(...args) as ReturnType<T>;

		cache.set(key, result);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return result;
	};

	memoized.cache = cache;

	return memoized as TMemoizedFn<T>;
}
