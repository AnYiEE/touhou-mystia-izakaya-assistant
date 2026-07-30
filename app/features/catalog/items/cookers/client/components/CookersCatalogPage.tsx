'use client';

import { useCallback, useMemo } from 'react';

import { hasEquivalentDlcFilters } from '@/domain/availability';

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

	const availableCategories = cookersStore.availableCategories.use();
	const availableAvailabilityDlcs =
		cookersStore.availableAvailabilityDlcs.use();
	const availableContentDlcs = cookersStore.availableContentDlcs.use();
	const availableTypes = cookersStore.availableTypes.use();

	const pinyinSortState = cookersStore.persistence.pinyinSortState.use();

	const filterAvailabilityDlcs =
		cookersStore.persistence.filters.availabilityDlcs.use();
	const filterContentDlcs =
		cookersStore.persistence.filters.contentDlcs.use();
	const filterCategories = cookersStore.persistence.filters.categories.use();
	const filterNoCategories =
		cookersStore.persistence.filters.noCategories.use();
	const filterTypes = cookersStore.persistence.filters.types.use();
	const filterNoTypes = cookersStore.persistence.filters.noTypes.use();

	const filterData = useCallback(
		() =>
			filterCookerData({
				data: instance.data,
				filterAvailabilityDlcs: isAvailabilityDlcFilterRedundant
					? []
					: filterAvailabilityDlcs,
				filterCategories,
				filterContentDlcs,
				filterNoCategories,
				filterNoTypes,
				filterTypes,
			}),
		[
			filterAvailabilityDlcs,
			filterCategories,
			filterContentDlcs,
			filterNoCategories,
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
				items: availableCategories,
				label: '厨具系列（包含）',
				selectedKeys: filterCategories,
				setSelectedKeys:
					cookersStore.persistence.filters.categories.set,
			},
			{
				items: availableCategories,
				label: '厨具系列（排除）',
				selectedKeys: filterNoCategories,
				setSelectedKeys:
					cookersStore.persistence.filters.noCategories.set,
			},
			{
				items: availableTypes,
				label: '厨具类别（包含）',
				selectedKeys: filterTypes,
				setSelectedKeys: cookersStore.persistence.filters.types.set,
			},
			{
				items: availableTypes,
				label: '厨具类别（排除）',
				selectedKeys: filterNoTypes,
				setSelectedKeys: cookersStore.persistence.filters.noTypes.set,
			},
		],
		[
			availableAvailabilityDlcs,
			availableCategories,
			availableContentDlcs,
			availableTypes,
			filterAvailabilityDlcs,
			filterCategories,
			filterContentDlcs,
			filterNoCategories,
			filterNoTypes,
			filterTypes,
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
			<CookerCatalog data={sortedData} />
		</ItemPage>
	);
}
