export const PARTNERS_STORE_VERSION = {
	initial: 0,
	removeSearchValue: 1, // eslint-disable-next-line sort-keys
	availabilityDlcFilter: 2,
} as const;

const storeVersion = PARTNERS_STORE_VERSION;

export function migratePartnersPersistedState<T>(
	persistedState: T,
	version: number
): T {
	if (version >= storeVersion.availabilityDlcFilter) {
		return persistedState;
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
	const oldState = structuredClone(persistedState) as any;
	if (version < storeVersion.removeSearchValue) {
		delete oldState.persistence.searchValue;
	}
	if (version < storeVersion.availabilityDlcFilter) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		oldState.persistence.filters.contentDlcs =
			oldState.persistence.filters.dlcs;
		oldState.persistence.filters.availabilityDlcs = [];
		delete oldState.persistence.filters.dlcs;
	}
	return oldState as T;
}
