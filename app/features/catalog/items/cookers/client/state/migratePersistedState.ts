import { resolveLegacyCookerSeries } from '@/domain/catalog/legacy/resolveLegacyCookerSeries';
import { resolveLegacyCookerType } from '@/domain/catalog/legacy/resolveLegacyCookerType';

export const COOKERS_STORE_VERSION = {
	initial: 0,
	removeSearchValue: 1, // eslint-disable-next-line sort-keys
	availabilityDlcFilter: 2,
	recordIdentity: 3,
} as const;

export function migrateCookersPersistedState<T>(
	persistedState: T,
	version: number
): T {
	if (version >= COOKERS_STORE_VERSION.recordIdentity) {
		return persistedState;
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
	const oldState = structuredClone(persistedState) as any;
	if (version < COOKERS_STORE_VERSION.removeSearchValue) {
		delete oldState.persistence.searchValue;
	}
	if (version < COOKERS_STORE_VERSION.availabilityDlcFilter) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		oldState.persistence.filters.contentDlcs =
			oldState.persistence.filters.dlcs;
		oldState.persistence.filters.availabilityDlcs = [];
		delete oldState.persistence.filters.dlcs;
	}
	if (version < COOKERS_STORE_VERSION.recordIdentity) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { filters } = oldState.persistence;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.noSeries = filters.noCategories.flatMap((label: string) =>
			resolveLegacyCookerSeries(label)
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.noTypes = filters.noTypes.map((label: string) =>
			resolveLegacyCookerType(label)
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.series = filters.categories.flatMap((label: string) =>
			resolveLegacyCookerSeries(label)
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.types = filters.types.map((label: string) =>
			resolveLegacyCookerType(label)
		);
		delete filters.categories;
		delete filters.noCategories;
	}
	return oldState as T;
}
