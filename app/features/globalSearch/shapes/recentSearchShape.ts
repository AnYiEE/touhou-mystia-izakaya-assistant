import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';
import type { IPersistedShape } from '@/shared/utilities/state/persistedShape';

export interface IGlobalSearchRecentState {
	extra?: Record<string, unknown>;
	items: string[];
	queries: string[];
}

export const recentSearchShape = {
	createDefault() {
		return { items: [], queries: [] } satisfies IGlobalSearchRecentState;
	},
	migrate(value: unknown): IGlobalSearchRecentState {
		return recentSearchShape.normalize(value);
	},
	normalize(value: unknown): IGlobalSearchRecentState {
		const record = isObjectTagRecord(value) ? value : {};
		const items =
			isObjectTagRecord(record) && Array.isArray(record['items'])
				? record['items'].filter(
						(item): item is string => typeof item === 'string'
					)
				: [];
		const queries =
			isObjectTagRecord(record) && Array.isArray(record['queries'])
				? record['queries'].filter(
						(item): item is string => typeof item === 'string'
					)
				: [];
		const extra = Object.fromEntries(
			Object.entries(record).filter(
				([key]) => key !== 'items' && key !== 'queries'
			)
		) as Record<string, unknown>;

		return {
			...(Object.keys(extra).length === 0 ? {} : { extra }),
			items,
			queries,
		};
	},
	validate(value: unknown): value is IGlobalSearchRecentState {
		return (
			isObjectTagRecord(value) &&
			Array.isArray(value['items']) &&
			value['items'].every((item) => typeof item === 'string') &&
			Array.isArray(value['queries']) &&
			value['queries'].every((item) => typeof item === 'string')
		);
	},
} satisfies IPersistedShape<IGlobalSearchRecentState>;
