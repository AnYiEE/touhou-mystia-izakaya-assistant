import { useCallback } from 'react';

import { type NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';
import { type SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';

import { type normalGuestStore } from '@/features/catalog/guests/normal/client/state/store';
import { filterGuestData } from '@/features/catalog/guests/shared/queries/filterGuestData';
import { type specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import { useFilteredData } from '@/features/catalog/shared/client/hooks/useFilteredData';
import { useSortedData } from '@/features/catalog/shared/client/hooks/useSortedData';
import type { TItemData } from '@/features/catalog/shared/contracts';

type TGuestCatalog = NormalGuestCatalog | SpecialGuestCatalog;
type TGuestRouteStore = typeof normalGuestStore | typeof specialGuestStore;
type TGuestFilterState =
	TGuestRouteStore['persistence']['guest']['filters']['excludes'];

type TGuestData =
	| TItemData<NormalGuestCatalog>
	| TItemData<SpecialGuestCatalog>;
type TGuestRouteItem =
	| TItemData<NormalGuestCatalog>[number]
	| TItemData<SpecialGuestCatalog>[number];

function useGuestFilterValues(state: TGuestFilterState) {
	// The two accessors differ only by their concrete guest-ID union, so their
	// no-selector result can be safely consumed through the shared numeric ID.
	const useValues = state.use as () => ReadonlyArray<number>;
	return useValues();
}

export function useGuestRouteData(
	catalog: NormalGuestCatalog,
	store: typeof normalGuestStore
): { guestSortedData: TItemData<NormalGuestCatalog> };
export function useGuestRouteData(
	catalog: SpecialGuestCatalog,
	store: typeof specialGuestStore
): { guestSortedData: TItemData<SpecialGuestCatalog> };
export function useGuestRouteData(
	catalog: TGuestCatalog,
	store: TGuestRouteStore
) {
	const guestPinyinSortState = store.persistence.guest.pinyinSortState.use();

	const guestFilterAvailabilityDlcs =
		store.persistence.guest.filters.availabilityDlcs.use();
	const guestFilterExcludes = useGuestFilterValues(
		store.persistence.guest.filters.excludes
	);
	const guestFilterIncludes = useGuestFilterValues(
		store.persistence.guest.filters.includes
	);
	const guestFilterNoMaps = store.persistence.guest.filters.noPlaces.use();
	const guestFilterMaps = store.persistence.guest.filters.places.use();

	const filterData = useCallback(
		() =>
			filterGuestData<TGuestRouteItem>({
				guestData: catalog.data,
				guestFilterAvailabilityDlcs,
				guestFilterExcludes,
				guestFilterIncludes,
				guestFilterMaps,
				guestFilterNoMaps,
			}) as TGuestData,
		[
			guestFilterAvailabilityDlcs,
			guestFilterExcludes,
			guestFilterIncludes,
			guestFilterMaps,
			guestFilterNoMaps,
			catalog.data,
		]
	);
	const guestFilteredData = useFilteredData(catalog, filterData);

	const guestSortedData = useSortedData(
		catalog,
		guestFilteredData,
		guestPinyinSortState
	);

	return { guestSortedData };
}
