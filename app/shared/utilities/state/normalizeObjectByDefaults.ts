import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

export function normalizeObjectByDefaults<T extends object>(
	value: unknown,
	defaults: T,
	normalizeValue: (
		key: keyof T,
		value: unknown,
		defaultValue: unknown
	) => unknown
): T {
	const record = isObjectTagRecord(value) ? value : {};
	const result = { ...record };
	const entries = Object.entries(defaults) as Array<[keyof T, unknown]>;

	entries.forEach(([key, defaultValue]) => {
		const stringKey = key as string;
		result[stringKey] = normalizeValue(
			key,
			record[stringKey],
			defaultValue
		);
	});

	return result as T;
}
