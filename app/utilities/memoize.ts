import {isObject} from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TFunction = (...args: any[]) => any;

type TFirstParameterType<T extends TFunction> = Parameters<T>[0];
type TIsObject<T> = T extends object ? (T extends null ? false : true) : false;

type TCache<T extends TFunction> =
	TIsObject<TFirstParameterType<T>> extends true
		? WeakMap<TFirstParameterType<T>, ReturnType<T>>
		: Map<TFirstParameterType<T>, ReturnType<T>>;

type TCacheType = 'Map' | 'WeakMap';

type TMemoizedFn<T extends TFunction> = T & {
	cache: TCache<T>;
};

export function memoize<T extends TFunction>(fn: T, cacheType?: TCacheType) {
	const useWeakMap = cacheType === 'WeakMap';

	const cache = (useWeakMap ? new WeakMap() : new Map()) as TCache<T>;

	const memoized = function (this: unknown, ...args: Parameters<T>) {
		const cacheKey = args[0] as TFirstParameterType<T>;

		if (useWeakMap && !isObject(cacheKey)) {
			throw new TypeError('[utilities/memoize]: `WeakMap` only supports objects as keys');
		}

		if (cache.has(cacheKey)) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return cache.get(cacheKey) as ReturnType<T>;
		}

		const result = fn.apply(this, args) as ReturnType<T>;

		cache.set(cacheKey, result);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return result;
	};

	memoized.cache = cache;

	return memoized as TMemoizedFn<T>;
}
