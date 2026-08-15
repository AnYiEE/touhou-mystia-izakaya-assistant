'use client';

import { useCallback, useMemo } from 'react';

import { hasEquivalentDlcFilters } from '@/domain/availability';

import { filterBeverageData } from '@/features/catalog/items/beverages/client/queries/filterBeverageData';
import { beveragesStore } from '@/features/catalog/items/beverages/client/state/store';
import ItemPage from '@/features/catalog/shared/client/components/ItemPage';
import SideButtonGroup from '@/features/catalog/shared/client/components/SideButtonGroup';
import SideFilterIconButton, {
	type TSelectConfig,
} from '@/features/catalog/shared/client/components/SideFilterIconButton';
import SidePinyinSortIconButton from '@/features/catalog/shared/client/components/SidePinyinSortIconButton';
import { useFilteredData } from '@/features/catalog/shared/client/hooks/useFilteredData';
import { useSortedData } from '@/features/catalog/shared/client/hooks/useSortedData';
import { type IPinyinSortConfig } from '@/features/catalog/shared/state/pinyinSort';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

import BeverageCatalog from './BeverageCatalog';

export default function BeveragesCatalogPage() {
	const instance = beveragesStore.instance.get();
	const isAvailabilityDlcFilterRedundant = hasEquivalentDlcFilters(
		instance.data
	);

	const availableAvailabilityDlcs =
		beveragesStore.availableAvailabilityDlcs.use();
	const availableContentDlcs = beveragesStore.availableContentDlcs.use();
	const availableLevels = beveragesStore.availableLevels.use();
	const availableMaps = beveragesStore.availableMaps.use();
	const availableTags = beveragesStore.availableTags.use();

	const pinyinSortState = beveragesStore.persistence.pinyinSortState.use();

	const filterAvailabilityDlcs =
		beveragesStore.persistence.filters.availabilityDlcs.use();
	const filterContentDlcs =
		beveragesStore.persistence.filters.contentDlcs.use();
	const filterLevels = beveragesStore.persistence.filters.levels.use();
	const filterTags = beveragesStore.persistence.filters.tags.use();
	const filterNoTags = beveragesStore.persistence.filters.noTags.use();
	const filterPlaces = beveragesStore.persistence.filters.places.use();
	const filterNoPlaces = beveragesStore.persistence.filters.noPlaces.use();

	const filterData = useCallback(
		() =>
			filterBeverageData({
				data: instance.data,
				filterAvailabilityDlcs: isAvailabilityDlcFilterRedundant
					? []
					: filterAvailabilityDlcs,
				filterContentDlcs,
				filterLevels,
				filterMaps: filterPlaces,
				filterNoMaps: filterNoPlaces,
				filterNoTags,
				filterTags,
			}),
		[
			filterAvailabilityDlcs,
			filterContentDlcs,
			filterLevels,
			filterNoPlaces,
			filterNoTags,
			filterPlaces,
			filterTags,
			instance.data,
			isAvailabilityDlcFilterRedundant,
		]
	);

	const filteredData = useFilteredData(instance, filterData);

	const sortedData = useSortedData(instance, filteredData, pinyinSortState);

	const pinyinSortConfig = useMemo<IPinyinSortConfig>(
		() => ({
			pinyinSortState,
			setPinyinSortState: beveragesStore.persistence.pinyinSortState.set,
		}),
		[pinyinSortState]
	);

	const selectConfig = useMemo<TSelectConfig>(
		() => [
			{
				items: availableContentDlcs,
				label: '内容归属',
				selectedKeys: filterContentDlcs,
				setSelectedKeys:
					beveragesStore.persistence.filters.contentDlcs.set,
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
								beveragesStore.persistence.filters
									.availabilityDlcs.set,
							valueType: 'dlc',
						} satisfies TSelectConfig[number],
					]),
			{
				items: availableTags,
				label: '酒水标签（包含）',
				selectedKeys: filterTags,
				setSelectedKeys: beveragesStore.persistence.filters.tags.set,
				valueType: 'beverageTag',
			},
			{
				items: availableTags,
				label: '酒水标签（排除）',
				selectedKeys: filterNoTags,
				setSelectedKeys: beveragesStore.persistence.filters.noTags.set,
				valueType: 'beverageTag',
			},
			{
				items: availableLevels,
				label: '等级',
				selectedKeys: filterLevels,
				setSelectedKeys: beveragesStore.persistence.filters.levels.set,
			},
			{
				items: availableMaps,
				label: '地区（包含）',
				selectedKeys: filterPlaces,
				setSelectedKeys: beveragesStore.persistence.filters.places.set,
				valueType: 'map',
			},
			{
				items: availableMaps,
				label: '地区（排除）',
				selectedKeys: filterNoPlaces,
				setSelectedKeys:
					beveragesStore.persistence.filters.noPlaces.set,
				valueType: 'map',
			},
		],
		[
			availableAvailabilityDlcs,
			availableContentDlcs,
			availableLevels,
			availableMaps,
			availableTags,
			filterAvailabilityDlcs,
			filterContentDlcs,
			filterLevels,
			filterNoPlaces,
			filterNoTags,
			filterPlaces,
			filterTags,
			isAvailabilityDlcFilterRedundant,
		]
	);

	return (
		<ItemPage
			isEmpty={checkLengthEmpty(sortedData)}
			sideButton={
				<SideButtonGroup>
					<SidePinyinSortIconButton
						pinyinSortConfig={pinyinSortConfig}
					/>
					<SideFilterIconButton selectConfig={selectConfig} />
				</SideButtonGroup>
			}
		>
			<BeverageCatalog data={sortedData} />
		</ItemPage>
	);
}
