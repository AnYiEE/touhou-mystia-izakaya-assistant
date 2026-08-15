import { type Selection } from '@heroui/table';

export function toSelectionKeySet(
	values: Iterable<number | string>
): Set<string> {
	return new Set(Array.from(values, String));
}

export function selectionToStringValues(selection: Selection): string[] | null {
	if (selection === 'all') {
		return null;
	}

	const values = [...selection];
	return values.every((value): value is string => typeof value === 'string')
		? values
		: null;
}

export function selectionToKnownValues<T>(
	selection: Selection,
	valueByKey: ReadonlyMap<string, T>,
	compare?: (a: T, b: T) => number
): T[] | null {
	const keys = selectionToStringValues(selection);
	if (keys === null) {
		return null;
	}

	const values: T[] = [];
	for (const key of keys) {
		const value = valueByKey.get(key);
		if (value === undefined) {
			return null;
		}
		values.push(value);
	}

	return compare === undefined ? values : values.sort(compare);
}
