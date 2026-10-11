import { useCallback, useMemo } from 'react';

import { isAvailableWithHiddenDlcs } from '@/domain/availability';

import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import type {
	TItemData,
	TItemInstance,
} from '@/features/catalog/shared/contracts';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';

import { useSkipProcessItemData } from './useSkipProcessItemData';

export function useFilteredData<
	T extends TItemInstance | TItemData<TItemInstance>,
	U extends (T extends TItemInstance ? TItemData<T> : T),
>(instanceOrData: T, filterData: () => U) {
	const revision = useCatalogLocalizationRevision();
	const shouldSkipProcessData = useSkipProcessItemData();

	const hiddenDlcs = globalStore.hiddenDlcs.use();

	const filterHiddenDlcs = useCallback(
		<S extends TItemData<TItemInstance>>(data: S) =>
			data.filter((item) =>
				isAvailableWithHiddenDlcs(item.availabilityPaths, hiddenDlcs)
			) as unknown as S,
		[hiddenDlcs]
	);

	const filteredData = useMemo(() => {
		void revision;
		if (shouldSkipProcessData) {
			if ('length' in instanceOrData) {
				return instanceOrData;
			}
			return instanceOrData.data;
		}
		return filterHiddenDlcs(filterData());
	}, [
		filterData,
		filterHiddenDlcs,
		instanceOrData,
		revision,
		shouldSkipProcessData,
	]);

	return filteredData as Readonly<U>;
}
