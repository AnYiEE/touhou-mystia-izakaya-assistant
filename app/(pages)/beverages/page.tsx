'use client';

import {memo, useMemo} from 'react';

import {useMounted, usePinyinSortConfig, useSearchConfig, useSearchResult, useSortedData, useThrottle} from '@/hooks';

import Content from '@/(pages)/beverages/content';
import Loading from '@/loading';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {type TSelectConfig} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton from '@/components/sideSearchIconButton';

import {useBeveragesStore} from '@/stores';

export default memo(function Beverages() {
	const store = useBeveragesStore();

	const instance = store.instance.get();

	const allNames = store.names.use();
	const allDlcs = store.dlcs.get();
	const allLevels = store.levels.get();
	const allTags = store.tags.get();

	const pinyinSortState = store.page.pinyinSortState.use();
	const searchValue = store.page.searchValue.use();

	const throttledSearchValue = useThrottle(searchValue);
	const searchResult = useSearchResult(instance, throttledSearchValue);

	const filterDlcs = store.page.filters.dlcs.use();
	const filterLevels = store.page.filters.levels.use();
	const filterTags = store.page.filters.tags.use();
	const filterNoTags = store.page.filters.noTags.use();

	const filteredData = useMemo(
		() =>
			searchResult.filter(({dlc, level, tags}) => {
				const isDlcMatch = filterDlcs.length > 0 ? filterDlcs.includes(dlc.toString()) : true;
				const isLevelMatch = filterLevels.length > 0 ? filterLevels.includes(level.toString()) : true;
				const isTagMatch =
					filterTags.length > 0 ? filterTags.some((tag) => (tags as string[]).includes(tag)) : true;
				const isNoTagMatch =
					filterNoTags.length > 0 ? !filterNoTags.some((tag) => (tags as string[]).includes(tag)) : true;

				return isDlcMatch && isLevelMatch && isTagMatch && isNoTagMatch;
			}),
		[filterDlcs, filterLevels, filterNoTags, filterTags, searchResult]
	);

	const sortedData = useSortedData(instance, filteredData, pinyinSortState);

	const pinyinSortConfig = usePinyinSortConfig(pinyinSortState, store.page.pinyinSortState.set);

	const searchConfig = useSearchConfig({
		label: '选择或输入酒水名称',
		searchItems: allNames,
		searchValue,
		setSearchValue: store.page.searchValue.set,
	});

	const selectConfig = useMemo(
		() =>
			[
				{
					items: allDlcs,
					label: 'DLC',
					selectedKeys: filterDlcs,
					setSelectedKeys: store.page.filters.dlcs.set,
				},
				{
					items: allTags,
					label: '酒水标签（包含）',
					selectedKeys: filterTags,
					setSelectedKeys: store.page.filters.tags.set,
				},
				{
					items: allTags,
					label: '酒水标签（排除）',
					selectedKeys: filterNoTags,
					setSelectedKeys: store.page.filters.noTags.set,
				},
				{
					items: allLevels,
					label: '等级',
					selectedKeys: filterLevels,
					setSelectedKeys: store.page.filters.levels.set,
				},
			] as const satisfies TSelectConfig,
		[
			allDlcs,
			allLevels,
			allTags,
			filterDlcs,
			filterLevels,
			filterNoTags,
			filterTags,
			store.page.filters.dlcs.set,
			store.page.filters.levels.set,
			store.page.filters.noTags.set,
			store.page.filters.tags.set,
		]
	);

	const isMounted = useMounted();
	if (!isMounted) {
		return <Loading />;
	}

	return (
		<div className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
			<SideButtonGroup>
				<SideSearchIconButton searchConfig={searchConfig} />
				<SidePinyinSortIconButton pinyinSortConfig={pinyinSortConfig} />
				<SideFilterIconButton selectConfig={selectConfig} />
			</SideButtonGroup>

			<Content data={sortedData} />
		</div>
	);
});
