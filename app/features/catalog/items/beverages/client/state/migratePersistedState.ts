import { resolveLegacyMapLabel } from '@/domain/catalog/legacy/resolveLegacyMapLabel';
import { resolveLegacyTagLabel } from '@/domain/catalog/legacy/resolveLegacyTagLabel';
import { BEVERAGE_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TBeverageTagId } from '@/domain/data/tags/types';

export const BEVERAGES_STORE_VERSION = {
	initial: 0,
	popular: 1, // eslint-disable-next-line sort-keys
	filterPlaces: 2,
	removeSearchValue: 3, // eslint-disable-next-line sort-keys
	availabilityDlcFilter: 4,
	recordIdentity: 5,
} as const;

const storeVersion = BEVERAGES_STORE_VERSION;

export function migrateBeveragesPersistedState<T>(
	persistedState: T,
	version: number
): T {
	if (version >= storeVersion.recordIdentity) {
		return persistedState;
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
	const oldState = structuredClone(persistedState) as any;
	if (version < storeVersion.popular) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		oldState.persistence = oldState.page;
		delete oldState.page;
	}
	if (version < storeVersion.filterPlaces) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const {
			persistence: { filters },
		} = oldState;
		filters.places = [];
		filters.noPlaces = [];
	}
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
	if (version < storeVersion.recordIdentity) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { filters } = oldState.persistence;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.noPlaces = filters.noPlaces.map((label: string) =>
			resolveLegacyMapLabel({
				errorCode: 'invalid-legacy-beverage-filter-map',
				label,
			})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.noTags = filters.noTags.map((label: string) =>
			resolveLegacyTagLabel<TBeverageTagId>({
				errorCode: 'invalid-legacy-beverage-filter-tag',
				facts: BEVERAGE_TAG_MAP,
				label,
			})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.places = filters.places.map((label: string) =>
			resolveLegacyMapLabel({
				errorCode: 'invalid-legacy-beverage-filter-map',
				label,
			})
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		filters.tags = filters.tags.map((label: string) =>
			resolveLegacyTagLabel<TBeverageTagId>({
				errorCode: 'invalid-legacy-beverage-filter-tag',
				facts: BEVERAGE_TAG_MAP,
				label,
			})
		);
	}
	return oldState as T;
}
