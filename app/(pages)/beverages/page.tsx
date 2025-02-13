'use client';

import {useCallback, useMemo} from 'react';

import {
	useFilteredData,
	usePinyinSortConfig,
	useSearchConfig,
	useSearchResult,
	useSortedData,
	useThrottle,
} from '@/hooks';

import Content from './content';
import ItemPage from '@/components/itemPage';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {type TSelectConfig} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton from '@/components/sideSearchIconButton';

import {beveragesStore as store} from '@/stores';
import {checkArrayContainsOf, checkArraySubsetOf, checkEmpty} from '@/utilities';

export default function Beverages() {
	const instance = store.instance.get();

	const allNames = store.names.use();
	const allDlcs = store.dlcs.get();
	const allLevels = store.levels.get();
	const allTags = store.tags.get();

	const pinyinSortState = store.persistence.pinyinSortState.use();
	const searchValue = store.persistence.searchValue.use();

	const throttledSearchValue = useThrottle(searchValue);
	const searchResult = useSearchResult(instance, throttledSearchValue);

	const filterDlcs = store.persistence.filters.dlcs.use();
	const filterLevels = store.persistence.filters.levels.use();
	const filterTags = store.persistence.filters.tags.use();
	const filterNoTags = store.persistence.filters.noTags.use();

	const filterData = useCallback(
		() =>
			searchResult.filter(({dlc, level, tags}) => {
				const isDlcMatched = checkEmpty(filterDlcs) || filterDlcs.includes(dlc.toString());
				const isLevelMatched = checkEmpty(filterLevels) || filterLevels.includes(level.toString());
				const isTagMatched = checkEmpty(filterTags) || checkArraySubsetOf(filterTags, tags);
				const isNoTagMatched = checkEmpty(filterNoTags) || !checkArrayContainsOf(filterNoTags, tags);

				return isDlcMatched && isLevelMatched && isTagMatched && isNoTagMatched;
			}),
		[filterDlcs, filterLevels, filterNoTags, filterTags, searchResult]
	);

	const filteredData = useFilteredData(instance, filterData);

	const sortedData = useSortedData(instance, filteredData, pinyinSortState);

	const pinyinSortConfig = usePinyinSortConfig(pinyinSortState, store.persistence.pinyinSortState.set);

	const searchConfig = useSearchConfig({
		label: '选择或输入酒水名称',
		searchItems: allNames,
		searchValue,
		setSearchValue: store.persistence.searchValue.set,
		spriteTarget: 'beverage',
	});

	const selectConfig = useMemo(
		() =>
			[
				{
					items: allDlcs,
					label: 'DLC',
					selectedKeys: filterDlcs,
					setSelectedKeys: store.persistence.filters.dlcs.set,
				},
				{
					items: allTags,
					label: '酒水标签（包含）',
					selectedKeys: filterTags,
					setSelectedKeys: store.persistence.filters.tags.set,
				},
				{
					items: allTags,
					label: '酒水标签（排除）',
					selectedKeys: filterNoTags,
					setSelectedKeys: store.persistence.filters.noTags.set,
				},
				{
					items: allLevels,
					label: '等级',
					selectedKeys: filterLevels,
					setSelectedKeys: store.persistence.filters.levels.set,
				},
			] as const satisfies TSelectConfig,
		[allDlcs, allLevels, allTags, filterDlcs, filterLevels, filterNoTags, filterTags]
	);

	return (
		<ItemPage
			isEmpty={checkEmpty(sortedData)}
			sideButton={
				<SideButtonGroup>
					<SideSearchIconButton searchConfig={searchConfig} />
					<SidePinyinSortIconButton pinyinSortConfig={pinyinSortConfig} />
					<SideFilterIconButton selectConfig={selectConfig} />
				</SideButtonGroup>
			}
		>
			<Content data={sortedData} />
		</ItemPage>
	);
}
