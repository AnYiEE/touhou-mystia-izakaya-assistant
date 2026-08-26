import { type ReactNode, useCallback, useMemo } from 'react';

import { hasEquivalentDlcFilters } from '@/domain/availability';

import { filterCollectibleData } from '@/features/catalog/items/collectibles/client/queries/filterCollectibleData';
import {
	type TCollectibleCatalog,
	createCollectibleStore,
} from '@/features/catalog/items/collectibles/client/state/createCollectibleStore';
import ItemPage from '@/features/catalog/shared/client/components/ItemPage';
import SideButtonGroup from '@/features/catalog/shared/client/components/SideButtonGroup';
import SideFilterIconButton, {
	type TSelectConfig,
} from '@/features/catalog/shared/client/components/SideFilterIconButton';
import SidePinyinSortIconButton from '@/features/catalog/shared/client/components/SidePinyinSortIconButton';
import { useFilteredData } from '@/features/catalog/shared/client/hooks/useFilteredData';
import { useSortedData } from '@/features/catalog/shared/client/hooks/useSortedData';
import type { TItemData } from '@/features/catalog/shared/contracts';
import { type IPinyinSortConfig } from '@/features/catalog/shared/state/pinyinSort';

type TCollectibleStoreConfig<TCatalog extends TCollectibleCatalog> = ReturnType<
	typeof createCollectibleStore<TCatalog>
>;

export default function CollectibleCatalogPage<
	TCatalog extends TCollectibleCatalog,
>({
	config,
	renderCatalog,
	sourceFilterLabel,
}: {
	config: TCollectibleStoreConfig<TCatalog>;
	renderCatalog: (data: TItemData<TCatalog>) => ReactNode;
	sourceFilterLabel?: string;
}) {
	const { getSources, store } = config;
	const instance = store.instance.get();
	const isAvailabilityDlcFilterRedundant = hasEquivalentDlcFilters(
		instance.data
	);

	const availableAvailabilityDlcs = store.availableAvailabilityDlcs.use();
	const availableContentDlcs = store.availableContentDlcs.use();
	const availableSources = store.availableSources.use();
	const pinyinSortState = store.persistence.pinyinSortState.use();
	const filterAvailabilityDlcs =
		store.persistence.filters.availabilityDlcs.use();
	const filterContentDlcs = store.persistence.filters.contentDlcs.use();
	const filterSources = store.persistence.filters.sources.use();

	const filterData = useCallback(
		() =>
			filterCollectibleData({
				data: instance.data,
				filterAvailabilityDlcs: isAvailabilityDlcFilterRedundant
					? []
					: filterAvailabilityDlcs,
				filterContentDlcs,
				filterSources,
				getSources,
			}) as TItemData<TCatalog>,
		[
			filterAvailabilityDlcs,
			filterContentDlcs,
			filterSources,
			getSources,
			instance.data,
			isAvailabilityDlcFilterRedundant,
		]
	);
	const filteredData = useFilteredData(
		instance.data,
		filterData
	) as TItemData<TCatalog>;
	const sortedData = useSortedData(instance, filteredData, pinyinSortState);

	const pinyinSortConfig = useMemo<IPinyinSortConfig>(
		() => ({
			pinyinSortState,
			setPinyinSortState: store.persistence.pinyinSortState.set,
		}),
		[pinyinSortState, store.persistence.pinyinSortState.set]
	);
	const selectConfig = useMemo<TSelectConfig>(
		() => [
			{
				items: availableContentDlcs,
				label: '内容归属',
				selectedKeys: filterContentDlcs,
				setSelectedKeys: store.persistence.filters.contentDlcs.set,
				valueType: 'dlc',
			},
			...(isAvailabilityDlcFilterRedundant
				? []
				: [
						{
							items: availableAvailabilityDlcs,
							label: '可获取于',
							selectedKeys: filterAvailabilityDlcs,
							setSelectedKeys:
								store.persistence.filters.availabilityDlcs.set,
							valueType: 'dlc',
						} satisfies TSelectConfig[number],
					]),
			...(sourceFilterLabel !== undefined && availableSources.length > 1
				? [
						{
							items: availableSources,
							label: sourceFilterLabel,
							selectedKeys: filterSources,
							setSelectedKeys:
								store.persistence.filters.sources.set,
						} satisfies TSelectConfig[number],
					]
				: []),
		],
		[
			availableAvailabilityDlcs,
			availableContentDlcs,
			availableSources,
			filterAvailabilityDlcs,
			filterContentDlcs,
			filterSources,
			isAvailabilityDlcFilterRedundant,
			sourceFilterLabel,
			store.persistence.filters.availabilityDlcs.set,
			store.persistence.filters.contentDlcs.set,
			store.persistence.filters.sources.set,
		]
	);

	return (
		<ItemPage
			isEmpty={sortedData.length === 0}
			sideButton={
				<SideButtonGroup>
					<SidePinyinSortIconButton
						pinyinSortConfig={pinyinSortConfig}
					/>
					<SideFilterIconButton selectConfig={selectConfig} />
				</SideButtonGroup>
			}
		>
			{renderCatalog(sortedData)}
		</ItemPage>
	);
}
