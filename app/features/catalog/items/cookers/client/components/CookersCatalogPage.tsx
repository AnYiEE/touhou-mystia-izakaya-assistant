'use client';

import { useCallback, useMemo } from 'react';

import { hasEquivalentDlcFilters } from '@/domain/availability';
import type { TCookerSeriesId } from '@/domain/data/cookers/types';

import { filterCookerData } from '@/features/catalog/items/cookers/client/queries/filterCookerData';
import { cookersStore } from '@/features/catalog/items/cookers/client/state/store';
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

import CookerCatalog from './CookerCatalog';

export default function CookersCatalogPage() {
	const instance = cookersStore.instance.get();
	const isAvailabilityDlcFilterRedundant = hasEquivalentDlcFilters(
		instance.data
	);

	const availableSeries = cookersStore.availableSeries.use();
	const availableAvailabilityDlcs =
		cookersStore.availableAvailabilityDlcs.use();
	const availableContentDlcs = cookersStore.availableContentDlcs.use();
	const availableTypes = cookersStore.availableTypes.use();

	const pinyinSortState = cookersStore.persistence.pinyinSortState.use();

	const filterAvailabilityDlcs =
		cookersStore.persistence.filters.availabilityDlcs.use();
	const filterContentDlcs =
		cookersStore.persistence.filters.contentDlcs.use();
	const filterSeries = cookersStore.persistence.filters.series.use();
	const filterNoSeries = cookersStore.persistence.filters.noSeries.use();
	const filterTypes = cookersStore.persistence.filters.types.use();
	const filterNoTypes = cookersStore.persistence.filters.noTypes.use();
	const filterSeriesGroupValues = useMemo(
		() =>
			availableSeries
				.filter(({ series }) =>
					series.some((value) => filterSeries.includes(value))
				)
				.map(({ value }) => value),
		[availableSeries, filterSeries]
	);
	const filterNoSeriesGroupValues = useMemo(
		() =>
			availableSeries
				.filter(({ series }) =>
					series.some((value) => filterNoSeries.includes(value))
				)
				.map(({ value }) => value),
		[availableSeries, filterNoSeries]
	);
	const setFilterSeriesGroupValues = useCallback(
		(groupValues: TCookerSeriesId[]) => {
			cookersStore.persistence.filters.series.set(
				instance.expandSeriesGroupValues(availableSeries, groupValues)
			);
		},
		[availableSeries, instance]
	);
	const setFilterNoSeriesGroupValues = useCallback(
		(groupValues: TCookerSeriesId[]) => {
			cookersStore.persistence.filters.noSeries.set(
				instance.expandSeriesGroupValues(availableSeries, groupValues)
			);
		},
		[availableSeries, instance]
	);

	const filterData = useCallback(
		() =>
			filterCookerData({
				data: instance.data,
				filterAvailabilityDlcs: isAvailabilityDlcFilterRedundant
					? []
					: filterAvailabilityDlcs,
				filterContentDlcs,
				filterNoSeries,
				filterNoTypes,
				filterSeries,
				filterTypes,
			}),
		[
			filterAvailabilityDlcs,
			filterSeries,
			filterContentDlcs,
			filterNoSeries,
			filterNoTypes,
			filterTypes,
			instance.data,
			isAvailabilityDlcFilterRedundant,
		]
	);

	const filteredData = useFilteredData(instance, filterData);

	const sortedData = useSortedData(instance, filteredData, pinyinSortState);

	const pinyinSortConfig = useMemo<IPinyinSortConfig>(
		() => ({
			pinyinSortState,
			setPinyinSortState: cookersStore.persistence.pinyinSortState.set,
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
					cookersStore.persistence.filters.contentDlcs.set,
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
								cookersStore.persistence.filters
									.availabilityDlcs.set,
							valueType: 'dlc',
						} satisfies TSelectConfig[number],
					]),
			{
				items: availableSeries,
				label: '厨具系列（包含）',
				selectedKeys: filterSeriesGroupValues,
				setSelectedKeys: setFilterSeriesGroupValues,
				valueType: 'cookerSeries',
			},
			{
				items: availableSeries,
				label: '厨具系列（排除）',
				selectedKeys: filterNoSeriesGroupValues,
				setSelectedKeys: setFilterNoSeriesGroupValues,
				valueType: 'cookerSeries',
			},
			{
				items: availableTypes,
				label: '厨具类别（包含）',
				selectedKeys: filterTypes,
				setSelectedKeys: cookersStore.persistence.filters.types.set,
				valueType: 'cookerType',
			},
			{
				items: availableTypes,
				label: '厨具类别（排除）',
				selectedKeys: filterNoTypes,
				setSelectedKeys: cookersStore.persistence.filters.noTypes.set,
				valueType: 'cookerType',
			},
		],
		[
			availableAvailabilityDlcs,
			availableSeries,
			availableContentDlcs,
			availableTypes,
			filterAvailabilityDlcs,
			filterContentDlcs,
			filterNoSeriesGroupValues,
			filterSeriesGroupValues,
			filterNoTypes,
			filterTypes,
			isAvailabilityDlcFilterRedundant,
			setFilterNoSeriesGroupValues,
			setFilterSeriesGroupValues,
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
			<CookerCatalog data={sortedData} />
		</ItemPage>
	);
}
