'use client';

import { useCallback, useMemo } from 'react';

import { hasEquivalentDlcFilters } from '@/domain/availability';

import { filterClothesData } from '@/features/catalog/items/clothes/client/queries/filterClothesData';
import { clothesStore } from '@/features/catalog/items/clothes/client/state/store';
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

import ClothesCatalog from './ClothesCatalog';

export default function ClothesCatalogPage() {
	const instance = clothesStore.instance.get();
	const isAvailabilityDlcFilterRedundant = hasEquivalentDlcFilters(
		instance.data
	);

	const availableAvailabilityDlcs =
		clothesStore.availableAvailabilityDlcs.use();
	const availableContentDlcs = clothesStore.availableContentDlcs.use();

	const pinyinSortState = clothesStore.persistence.pinyinSortState.use();

	const filterAvailabilityDlcs =
		clothesStore.persistence.filters.availabilityDlcs.use();
	const filterContentDlcs =
		clothesStore.persistence.filters.contentDlcs.use();

	const filterData = useCallback(
		() =>
			filterClothesData({
				data: instance.data,
				filterAvailabilityDlcs: isAvailabilityDlcFilterRedundant
					? []
					: filterAvailabilityDlcs,
				filterContentDlcs,
			}),
		[
			filterAvailabilityDlcs,
			filterContentDlcs,
			instance.data,
			isAvailabilityDlcFilterRedundant,
		]
	);

	const filteredData = useFilteredData(instance, filterData);

	const sortedData = useSortedData(instance, filteredData, pinyinSortState);

	const pinyinSortConfig = useMemo<IPinyinSortConfig>(
		() => ({
			pinyinSortState,
			setPinyinSortState: clothesStore.persistence.pinyinSortState.set,
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
					clothesStore.persistence.filters.contentDlcs.set,
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
								clothesStore.persistence.filters
									.availabilityDlcs.set,
							valueType: 'dlc',
						} satisfies TSelectConfig[number],
					]),
		],
		[
			availableAvailabilityDlcs,
			availableContentDlcs,
			filterAvailabilityDlcs,
			filterContentDlcs,
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
			<ClothesCatalog data={sortedData} />
		</ItemPage>
	);
}
