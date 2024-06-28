'use client';

import {memo, useMemo} from 'react';

import {useMounted, usePinyinSortConfig, useSearchConfig, useSearchResult, useSortedData, useThrottle} from '@/hooks';

import Content from '@/(pages)/ingredients/content';
import Loading from '@/loading';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {type TSelectConfig} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton from '@/components/sideSearchIconButton';

import {useIngredientsStore} from '@/stores';

export default memo(function Ingredients() {
	const store = useIngredientsStore();

	const instance = store.instance.get();

	const allNames = store.names.use();
	const allDlcs = store.dlcs.get();
	const allLevels = store.levels.get();
	const allTags = store.tags.get();

	const pinyinSortState = store.page.pinyinSortState.use();
	const searchValue = store.page.searchValue.use();

	const throttledSearchValue = useThrottle(searchValue);
	const searchResult = useSearchResult(instance, throttledSearchValue);

	const filterDlc = store.page.filters.dlc.use();
	const filterLevel = store.page.filters.level.use();
	const filterTag = store.page.filters.tag.use();
	const filterNoTag = store.page.filters.noTag.use();

	const filteredData = useMemo(
		() =>
			searchResult.filter(({dlc, level, tag: tags}) => {
				const isDlcMatch = filterDlc.length ? filterDlc.includes(dlc.toString()) : true;
				const isLevelMatch = filterLevel.length ? filterLevel.includes(level.toString()) : true;
				const isTagMatch = filterTag.length ? filterTag.some((tag) => (tags as string[]).includes(tag)) : true;
				const isNoTagMatch = filterNoTag.length
					? !filterNoTag.some((tag) => (tags as string[]).includes(tag))
					: true;

				return isDlcMatch && isLevelMatch && isTagMatch && isNoTagMatch;
			}),
		[filterDlc, filterLevel, filterNoTag, filterTag, searchResult]
	);

	const sortedData = useSortedData(instance, filteredData, pinyinSortState);

	const pinyinSortConfig = usePinyinSortConfig(pinyinSortState, store.page.pinyinSortState.set);

	const searchConfig = useSearchConfig({
		label: '选择或输入食材名称',
		searchItems: allNames,
		searchValue: searchValue,
		setSearchValue: store.page.searchValue.set,
	});

	const selectConfig = useMemo(
		() =>
			[
				{
					label: 'DLC',
					items: allDlcs,
					selectedKeys: filterDlc,
					setSelectedKeys: store.page.filters.dlc.set,
				},
				{
					label: '食材标签（包含）',
					items: allTags,
					selectedKeys: filterTag,
					setSelectedKeys: store.page.filters.tag.set,
				},
				{
					label: '食材标签（排除）',
					items: allTags,
					selectedKeys: filterNoTag,
					setSelectedKeys: store.page.filters.noTag.set,
				},
				{
					label: '等级',
					items: allLevels,
					selectedKeys: filterLevel,
					setSelectedKeys: store.page.filters.level.set,
				},
			] as const satisfies TSelectConfig,
		[
			allDlcs,
			allLevels,
			allTags,
			filterDlc,
			filterLevel,
			filterNoTag,
			filterTag,
			store.page.filters.dlc.set,
			store.page.filters.level.set,
			store.page.filters.noTag.set,
			store.page.filters.tag.set,
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
