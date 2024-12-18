'use client';

import {useCallback, useMemo} from 'react';

import {
	useFilteredData,
	useMounted,
	usePinyinSortConfig,
	useSearchConfig,
	useSearchResult,
	useSkipProcessItemData,
	useSortedData,
	useThrottle,
} from '@/hooks';

import {cn} from '@nextui-org/react';

import Content from '@/(pages)/beverages/content';
import Loading from '@/loading';
import FakeNameContent from '@/components/fakeNameContent';
import Placeholder from '@/components/placeholder';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {type TSelectConfig} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton from '@/components/sideSearchIconButton';

import {beveragesStore as store} from '@/stores';
import {checkArrayContainsOf, checkArraySubsetOf} from '@/utils';

export default function Beverages() {
	const shouldSkipProcessData = useSkipProcessItemData();

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
				const isDlcMatched = filterDlcs.length > 0 ? filterDlcs.includes(dlc.toString()) : true;
				const isLevelMatched = filterLevels.length > 0 ? filterLevels.includes(level.toString()) : true;
				const isTagMatched = filterTags.length > 0 ? checkArraySubsetOf(filterTags, tags) : true;
				const isNoTagMatched = filterNoTags.length > 0 ? !checkArrayContainsOf(filterNoTags, tags) : true;

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

	const isMounted = useMounted();
	if (!isMounted) {
		return (
			<>
				<Loading />
				<FakeNameContent instance={instance} />
			</>
		);
	}

	const isEmpty = sortedData.length === 0;

	return (
		<div
			className={cn(
				'min-h-main-content',
				isEmpty
					? 'flex justify-center'
					: 'grid h-min grid-cols-2 content-start justify-items-center gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7'
			)}
		>
			{!shouldSkipProcessData && (
				<SideButtonGroup>
					<SideSearchIconButton searchConfig={searchConfig} />
					<SidePinyinSortIconButton pinyinSortConfig={pinyinSortConfig} />
					<SideFilterIconButton selectConfig={selectConfig} />
				</SideButtonGroup>
			)}

			{isEmpty ? <Placeholder>数据为空</Placeholder> : <Content data={sortedData} />}
		</div>
	);
}
