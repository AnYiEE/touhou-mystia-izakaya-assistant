type TComputedAccessorMode = 'get' | 'use';

export function createComputedAccessor<T>(
	read: (mode: TComputedAccessorMode) => T
) {
	return { get: () => read('get'), use: () => read('use') };
}
