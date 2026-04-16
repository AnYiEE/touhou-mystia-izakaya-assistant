'use client';

import { useCallback, useMemo } from 'react';

import {
	useFilteredData,
	useSearchResult,
	useSortedData,
	useThrottle,
} from '@/hooks';

import Content from './content';
import ItemPage from '@/components/itemPage';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {
	type TSelectConfig,
} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton, {
	type IPinyinSortConfig,
} from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton, {
	type ISearchConfig,
} from '@/components/sideSearchIconButton';

import { beveragesStore as store } from '@/stores';
import { checkLengthEmpty, filterItems } from '@/utilities';

export default function Beverages() {
	const instance = store.instance.get();

	const availableDlcs = store.availableDlcs.use();
	const availableLevels = store.availableLevels.use();
	const availableNames = store.availableNames.use();
	const availablePlaces = store.availablePlaces.use();
	const availableTags = store.availableTags.use();

	const pinyinSortState = store.persistence.pinyinSortState.use();
	const searchValue = store.persistence.searchValue.use();

	const throttledSearchValue = useThrottle(searchValue);
	const searchResult = useSearchResult(instance, throttledSearchValue);

	const filterDlcs = store.persistence.filters.dlcs.use();
	const filterLevels = store.persistence.filters.levels.use();
	const filterTags = store.persistence.filters.tags.use();
	const filterNoTags = store.persistence.filters.noTags.use();
	const filterPlaces = store.persistence.filters.places.use();
	const filterNoPlaces = store.persistence.filters.noPlaces.use();

	const filterData = useCallback(
		() =>
			filterItems(searchResult, [
				{ field: 'dlc', match: 'in', values: filterDlcs },
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
			filterDlcs,
			filterLevels,
			filterNoPlaces,
			filterNoTags,
			filterPlaces,
			filterTags,
			searchResult,
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

	const searchConfig = useMemo<ISearchConfig>(
		() => ({
			label: '选择或输入酒水名称',
			searchItems: availableNames,
			searchValue,
			setSearchValue: store.persistence.searchValue.set,
			spriteTarget: 'beverage',
		}),
		[availableNames, searchValue]
	);

	const selectConfig = useMemo<TSelectConfig>(
		() => [
			{
				items: availableDlcs,
				label: 'DLC',
				selectedKeys: filterDlcs,
				setSelectedKeys: store.persistence.filters.dlcs.set,
			},
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
			availableDlcs,
			availableLevels,
			availablePlaces,
			availableTags,
			filterDlcs,
			filterLevels,
			filterNoPlaces,
			filterNoTags,
			filterPlaces,
			filterTags,
		]
	);

	return (
		<ItemPage
			isEmpty={checkLengthEmpty(sortedData)}
			sideButton={
				<SideButtonGroup>
					<SideSearchIconButton searchConfig={searchConfig} />
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
