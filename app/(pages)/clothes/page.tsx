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

import {cn} from '@/design/ui/components';

import Content from '@/(pages)/clothes/content';
import Loading from '@/loading';
import FakeNameContent from '@/components/fakeNameContent';
import Placeholder from '@/components/placeholder';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {type TSelectConfig} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton from '@/components/sideSearchIconButton';

import {clothesStore as store} from '@/stores';

export default function Clothes() {
	const shouldSkipProcessData = useSkipProcessItemData();

	const instance = store.instance.get();

	const allNames = store.names.use();
	const allDlcs = store.dlcs.get();

	const pinyinSortState = store.persistence.pinyinSortState.use();
	const searchValue = store.persistence.searchValue.use();

	const throttledSearchValue = useThrottle(searchValue);
	const searchResult = useSearchResult(instance, throttledSearchValue);

	const filterDlcs = store.persistence.filters.dlcs.use();

	const filterData = useCallback(
		() =>
			searchResult.filter(({dlc}) => {
				const isDlcMatched = filterDlcs.length > 0 ? filterDlcs.includes(dlc.toString()) : true;

				return isDlcMatched;
			}),
		[filterDlcs, searchResult]
	);

	const filteredData = useFilteredData(instance, filterData);

	const sortedData = useSortedData(instance, filteredData, pinyinSortState);

	const pinyinSortConfig = usePinyinSortConfig(pinyinSortState, store.persistence.pinyinSortState.set);

	const searchConfig = useSearchConfig({
		label: '选择或输入衣服名称',
		searchItems: allNames,
		searchValue,
		setSearchValue: store.persistence.searchValue.set,
		spriteTarget: 'clothes',
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
			] as const satisfies TSelectConfig,
		[allDlcs, filterDlcs]
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
