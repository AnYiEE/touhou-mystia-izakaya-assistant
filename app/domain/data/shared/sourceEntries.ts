import { memoize } from '@/shared/utilities/cache/memoize';

type TSourceEntry<T extends object> = {
	[K in keyof T]-?: Required<Pick<T, K>>;
}[keyof T];

function getSourceEntriesUncached<T extends object>(
	source: T
): ReadonlyArray<TSourceEntry<T>> {
	const entries: Array<TSourceEntry<T>> = [];
	for (const key in source) {
		if (!Object.hasOwn(source, key)) {
			continue;
		}
		const value = source[key as keyof T];
		if (value !== undefined) {
			entries.push({ [key]: value } as TSourceEntry<T>);
		}
	}
	return entries;
}

export const getSourceEntries = memoize(getSourceEntriesUncached, 'WeakMap');
