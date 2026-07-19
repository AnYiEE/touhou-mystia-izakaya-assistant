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

import { beveragesStore as store } from '@/stores';
import { checkLengthEmpty, filterItems } from '@/utilities';
import { hasEquivalentDlcFilters } from '@/utils/availability';

export default function Beverages() {
	const instance = store.instance.get();
	const isAvailabilityDlcFilterRedundant = hasEquivalentDlcFilters(
		instance.data
	);

	const availableAvailabilityDlcs = store.availableAvailabilityDlcs.use();
	const availableContentDlcs = store.availableContentDlcs.use();
	const availableLevels = store.availableLevels.use();
	const availablePlaces = store.availablePlaces.use();
	const availableTags = store.availableTags.use();

	const pinyinSortState = store.persistence.pinyinSortState.use();

	const filterAvailabilityDlcs =
		store.persistence.filters.availabilityDlcs.use();
	const filterContentDlcs = store.persistence.filters.contentDlcs.use();
	const filterLevels = store.persistence.filters.levels.use();
	const filterTags = store.persistence.filters.tags.use();
	const filterNoTags = store.persistence.filters.noTags.use();
	const filterPlaces = store.persistence.filters.places.use();
	const filterNoPlaces = store.persistence.filters.noPlaces.use();

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
				{ field: 'level', match: 'in', values: filterLevels },
				{ field: 'tags', match: 'all', values: filterTags },
				{ field: 'tags', match: 'excludeAny', values: filterNoTags },
				{ field: 'places', match: 'any', values: filterPlaces },
				{
					field: 'places',
					match: 'excludeAny',
					values: filterNoPlaces,
				},
			]),
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
			{
				items: availableTags,
				label: '酒水标签（包含）',
				selectedKeys: filterTags,
				setSelectedKeys: store.persistence.filters.tags.set,
			},
			{
				items: availableTags,
				label: '酒水标签（排除）',
				selectedKeys: filterNoTags,
				setSelectedKeys: store.persistence.filters.noTags.set,
			},
			{
				items: availableLevels,
				label: '等级',
				selectedKeys: filterLevels,
				setSelectedKeys: store.persistence.filters.levels.set,
			},
			{
				items: availablePlaces,
				label: '地区（包含）',
				selectedKeys: filterPlaces,
				setSelectedKeys: store.persistence.filters.places.set,
			},
			{
				items: availablePlaces,
				label: '地区（排除）',
				selectedKeys: filterNoPlaces,
				setSelectedKeys: store.persistence.filters.noPlaces.set,
			},
		],
		[
			availableAvailabilityDlcs,
			availableContentDlcs,
			availableLevels,
			availablePlaces,
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
			<Content data={sortedData} />
		</ItemPage>
	);
}
