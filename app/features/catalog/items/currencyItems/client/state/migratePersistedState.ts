export const CURRENCY_ITEMS_STORE_VERSION = {
	initial: 0, // eslint-disable-next-line sort-keys
	filterDlcs: 1,
	removeSearchValue: 2, // eslint-disable-next-line sort-keys
	availabilityDlcFilter: 3,
} as const;

export function migrateCurrencyItemsPersistedState<T>(
	persistedState: T,
	version: number
): T {
	if (version >= CURRENCY_ITEMS_STORE_VERSION.availabilityDlcFilter) {
		return persistedState;
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
	const oldState = structuredClone(persistedState) as any;
	if (version < CURRENCY_ITEMS_STORE_VERSION.filterDlcs) {
		oldState.persistence.filters = { dlcs: [] };
	}
	if (version < CURRENCY_ITEMS_STORE_VERSION.removeSearchValue) {
		delete oldState.persistence.searchValue;
	}
	if (version < CURRENCY_ITEMS_STORE_VERSION.availabilityDlcFilter) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		oldState.persistence.filters.contentDlcs =
			oldState.persistence.filters.dlcs;
		oldState.persistence.filters.availabilityDlcs = [];
		delete oldState.persistence.filters.dlcs;
	}
	return oldState as T;
}
