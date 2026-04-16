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

import { ingredientsStore as store } from '@/stores';
import { checkLengthEmpty, filterItems } from '@/utilities';

export default function Ingredients() {
	const currentPopularTrend = store.shared.popularTrend.use();
	const isFamousShop = store.shared.famousShop.use();

	const instance = store.instance.get();

	const availableDlcs = store.availableDlcs.use();
	const availableLevels = store.availableLevels.use();
	const availableNames = store.availableNames.use();
	const availablePlaces = store.availablePlaces.use();
	const availableTags = store.availableTags.use();
	const availableTypes = store.availableTypes.use();

	const pinyinSortState = store.persistence.pinyinSortState.use();
	const searchValue = store.persistence.searchValue.use();

	const throttledSearchValue = useThrottle(searchValue);
	const searchResult = useSearchResult(instance, throttledSearchValue);

	const filterDlcs = store.persistence.filters.dlcs.use();
	const filterLevels = store.persistence.filters.levels.use();
	const filterTags = store.persistence.filters.tags.use();
	const filterNoTags = store.persistence.filters.noTags.use();
	const filterTypes = store.persistence.filters.types.use();
	const filterNoTypes = store.persistence.filters.noTypes.use();
	const filterPlaces = store.persistence.filters.places.use();
	const filterNoPlaces = store.persistence.filters.noPlaces.use();

	const dataWithTrend = useMemo(
		() =>
			searchResult.map((data) => ({
				...data,
				tags: instance.calculateTagsWithTrend(
					data.tags,
					currentPopularTrend,
					isFamousShop
				),
			})) as unknown as typeof searchResult,
		[currentPopularTrend, instance, isFamousShop, searchResult]
	);

	const filterData = useCallback(
		() =>
			filterItems(dataWithTrend, [
				{ field: 'dlc', match: 'in', values: filterDlcs },
				{ field: 'level', match: 'in', values: filterLevels },
				{ field: 'tags', match: 'all', values: filterTags },
				{ field: 'tags', match: 'excludeAny', values: filterNoTags },
				{ field: 'type', match: 'in', values: filterTypes },
				{ field: 'type', match: 'excludeIn', values: filterNoTypes },
				{ field: 'places', match: 'any', values: filterPlaces },
				{
					field: 'places',
					match: 'excludeAny',
					values: filterNoPlaces,
				},
			]),
		[
			dataWithTrend,
			filterDlcs,
			filterLevels,
			filterNoPlaces,
			filterNoTags,
			filterNoTypes,
			filterPlaces,
			filterTags,
			filterTypes,
		]
	);

	const filteredData = useFilteredData(dataWithTrend, filterData);

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
			label: '选择或输入食材名称',
			searchItems: availableNames,
			searchValue,
			setSearchValue: store.persistence.searchValue.set,
			spriteTarget: 'ingredient',
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
				label: '食材标签（包含）',
				selectedKeys: filterTags,
				setSelectedKeys: store.persistence.filters.tags.set,
			},
			{
				items: availableTags,
				label: '食材标签（排除）',
				selectedKeys: filterNoTags,
				setSelectedKeys: store.persistence.filters.noTags.set,
			},
			{
				items: availableTypes,
				label: '食材类别（包含）',
				selectedKeys: filterTypes,
				setSelectedKeys: store.persistence.filters.types.set,
			},
			{
				items: availableTypes,
				label: '食材类别（排除）',
				selectedKeys: filterNoTypes,
				setSelectedKeys: store.persistence.filters.noTypes.set,
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
			availableTypes,
			filterDlcs,
			filterLevels,
			filterNoPlaces,
			filterNoTags,
			filterNoTypes,
			filterPlaces,
			filterTags,
			filterTypes,
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
