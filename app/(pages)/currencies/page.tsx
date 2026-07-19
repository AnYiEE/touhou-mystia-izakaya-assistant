'use client';

import { useCallback, useMemo } from 'react';

import { useFilteredData, useSortedData } from '@/hooks';

import Content from './content';
import ItemPage from '@/components/itemPage';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {
	type TSelectConfig,
} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton, {
	type IPinyinSortConfig,
} from '@/components/sidePinyinSortIconButton';

import { currenciesStore as store } from '@/stores';
import { checkLengthEmpty, filterItems } from '@/utilities';
import { hasEquivalentDlcFilters } from '@/utils/availability';

export default function Currencies() {
	const instance = store.instance.get();
	const isAvailabilityDlcFilterRedundant = hasEquivalentDlcFilters(
		instance.data
	);

	const availableAvailabilityDlcs = store.availableAvailabilityDlcs.use();
	const availableContentDlcs = store.availableContentDlcs.use();

	const pinyinSortState = store.persistence.pinyinSortState.use();

	const filterAvailabilityDlcs =
		store.persistence.filters.availabilityDlcs.use();
	const filterContentDlcs = store.persistence.filters.contentDlcs.use();

	const filterData = useCallback(
		() =>
			filterItems(instance.data, [
				{
					field: 'availabilityDlcs',
					match: 'any',
					values: isAvailabilityDlcFilterRedundant
						? []
						: filterAvailabilityDlcs,
				},
				{ field: 'dlc', match: 'in', values: filterContentDlcs },
			]),
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
			setPinyinSortState: store.persistence.pinyinSortState.set,
		}),
		[pinyinSortState]
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
			<Content data={sortedData} />
		</ItemPage>
	);
}
