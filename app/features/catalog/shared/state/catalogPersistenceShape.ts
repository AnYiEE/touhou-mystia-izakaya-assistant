import { type TPinyinSortState } from '@/features/catalog/shared/state/pinyinSort';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';
import type { ILocalPersistedShape } from '@/shared/utilities/state/persistedShape';

export interface ICatalogPersistenceShapeConfig<
	TFilters extends Record<string, ReadonlyArray<number | string>>,
> {
	allowedValues?: Partial<
		Record<keyof TFilters, ReadonlySet<number | string>>
	>;
	createDefaultFilters(): TFilters;
	currentVersion?: number;
	filterKinds?: Partial<Record<keyof TFilters, 'number' | 'string'>>;
	pinyinSortState?: TPinyinSortState;
}

export interface TCatalogPersistence<
	TFilters extends Record<string, ReadonlyArray<number | string>>,
> {
	filters: TFilters;
	pinyinSortState: TPinyinSortState;
}

const validPinyinSortStates = new Set<number>([0, 1, 2]);

export function toAllowedValueSet(
	values: Iterable<number | string>
): ReadonlySet<number | string> {
	const result = new Set<number | string>();
	for (const value of values) {
		result.add(value);
		result.add(value.toString());
		if (typeof value === 'string' && /^\d+$/u.test(value)) {
			result.add(Number(value));
		}
	}
	return result;
}

export function isAllowedFilterValue(
	value: unknown,
	allowed: ReadonlySet<number | string> | undefined
): value is number | string {
	if (typeof value !== 'number' && typeof value !== 'string') {
		return false;
	}
	if (allowed === undefined) {
		return true;
	}
	if (
		allowed.has(value) ||
		allowed.has(value.toString()) ||
		(typeof value === 'string' && allowed.has(Number(value)))
	) {
		return true;
	}
	return false;
}

export function normalizeAllowedArray<T extends number | string>(
	data: unknown,
	allowed: ReadonlySet<number | string> | undefined,
	kind?: 'number' | 'string'
): T[] {
	return Array.isArray(data)
		? data.filter(
				(item): item is T =>
					(typeof item === 'number' || typeof item === 'string') &&
					(kind === undefined ||
						(kind === 'number'
							? typeof item === 'number'
							: typeof item === 'string')) &&
					(allowed === undefined ||
						isAllowedFilterValue(item, allowed))
			)
		: [];
}

export function createCatalogPersistenceShape<
	TFilters extends Record<string, ReadonlyArray<number | string>>,
>({
	allowedValues = {},
	createDefaultFilters,
	currentVersion = 0,
	filterKinds = {},
	pinyinSortState = 0,
}: ICatalogPersistenceShapeConfig<TFilters>): ILocalPersistedShape<
	TCatalogPersistence<TFilters>
> {
	const defaults: TCatalogPersistence<TFilters> = {
		filters: createDefaultFilters(),
		pinyinSortState,
	};

	return {
		createDefault() {
			return structuredClone(defaults);
		},
		currentVersion,
		normalize(value: unknown): TCatalogPersistence<TFilters> {
			const record: Record<string, unknown> = isObjectTagRecord(value)
				? value
				: {};
			const filtersRecord: Record<string, unknown> = isObjectTagRecord(
				record['filters']
			)
				? record['filters']
				: {};
			const normalizedFilters: Record<
				string,
				ReadonlyArray<number | string>
			> = {};
			Object.entries(defaults.filters).forEach(([key, defaultValue]) => {
				const current = filtersRecord[key];
				const allowed = allowedValues[key as keyof TFilters];
				normalizedFilters[key] = Array.isArray(current)
					? normalizeAllowedArray<number | string>(
							current,
							allowed,
							filterKinds[key as keyof TFilters]
						)
					: [...defaultValue];
			});

			return {
				...record,
				filters: { ...filtersRecord, ...normalizedFilters } as TFilters,
				pinyinSortState:
					typeof record['pinyinSortState'] === 'number' &&
					validPinyinSortStates.has(record['pinyinSortState'])
						? (record['pinyinSortState'] as TPinyinSortState)
						: defaults.pinyinSortState,
			};
		},
		validate(value: unknown): value is TCatalogPersistence<TFilters> {
			return (
				isObjectTagRecord(value) &&
				isObjectTagRecord(value['filters']) &&
				Object.entries(defaults.filters).every(([key]) => {
					const current = (
						value['filters'] as Record<string, unknown>
					)[key];
					if (!Array.isArray(current)) {
						return false;
					}
					const allowed = allowedValues[key as keyof TFilters];
					const kind = filterKinds[key as keyof TFilters];
					return current.every((item) => {
						if (
							(typeof item !== 'number' &&
								typeof item !== 'string') ||
							(kind === 'number' && typeof item !== 'number') ||
							(kind === 'string' && typeof item !== 'string') ||
							(allowed !== undefined &&
								!isAllowedFilterValue(item, allowed))
						) {
							return false;
						}
						return true;
					});
				}) &&
				typeof value['pinyinSortState'] === 'number' &&
				validPinyinSortStates.has(value['pinyinSortState'])
			);
		},
	};
}
