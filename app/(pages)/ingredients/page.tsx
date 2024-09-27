'use client';

import {useCallback, useMemo} from 'react';
import {twJoin} from 'tailwind-merge';

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

import Content from '@/(pages)/ingredients/content';
import Loading from '@/loading';
import FakeNameContent from '@/components/fakeNameContent';
import Placeholder from '@/components/placeholder';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {type TSelectConfig} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton from '@/components/sideSearchIconButton';

import {globalStore, ingredientsStore} from '@/stores';
import {checkArrayContainsOf, checkArraySubsetOf} from '@/utils';

export default function Ingredients() {
	globalStore.persistence.popular.onChange((popularData) => {
		ingredientsStore.shared.popular.assign(popularData);
	});

	const shouldSkipProcessData = useSkipProcessItemData();

	const currentPopular = ingredientsStore.shared.popular.use();

	const instance = ingredientsStore.instance.get();

	const allNames = ingredientsStore.names.use();
	const allDlcs = ingredientsStore.dlcs.get();
	const allLevels = ingredientsStore.levels.get();
	const allTags = ingredientsStore.tags.get();
	const allTypes = ingredientsStore.types.get();

	const pinyinSortState = ingredientsStore.persistence.pinyinSortState.use();
	const searchValue = ingredientsStore.persistence.searchValue.use();

	const throttledSearchValue = useThrottle(searchValue);
	const searchResult = useSearchResult(instance, throttledSearchValue);

	const filterDlcs = ingredientsStore.persistence.filters.dlcs.use();
	const filterLevels = ingredientsStore.persistence.filters.levels.use();
	const filterTags = ingredientsStore.persistence.filters.tags.use();
	const filterNoTags = ingredientsStore.persistence.filters.noTags.use();
	const filterTypes = ingredientsStore.persistence.filters.types.use();
	const filterNoTypes = ingredientsStore.persistence.filters.noTypes.use();

	const dataWithPopular = useMemo(
		() =>
			searchResult.map((data) => ({
				...data,
				tags: instance.calculateTagsWithPopular(data.tags, currentPopular),
			})) as unknown as typeof searchResult,
		[currentPopular, instance, searchResult]
	);

	const filterData = useCallback(
		() =>
			dataWithPopular.filter(({dlc, level, tags, type}) => {
				const isDlcMatched = filterDlcs.length > 0 ? filterDlcs.includes(dlc.toString()) : true;
				const isLevelMatched = filterLevels.length > 0 ? filterLevels.includes(level.toString()) : true;
				const isTagMatched = filterTags.length > 0 ? checkArraySubsetOf(filterTags, tags) : true;
				const isNoTagMatched = filterNoTags.length > 0 ? !checkArrayContainsOf(filterNoTags, tags) : true;
				const isTypeMatched = filterTypes.length > 0 ? filterTypes.includes(type) : true;
				const isNoTypeMatched = filterNoTypes.length > 0 ? !filterNoTypes.includes(type) : true;

				return (
					isDlcMatched && isLevelMatched && isTagMatched && isNoTagMatched && isTypeMatched && isNoTypeMatched
				);
			}),
		[dataWithPopular, filterDlcs, filterLevels, filterNoTags, filterNoTypes, filterTags, filterTypes]
	);

	const filteredData = useFilteredData(instance, filterData);

	const sortedData = useSortedData(instance, filteredData, pinyinSortState);

	const pinyinSortConfig = usePinyinSortConfig(pinyinSortState, ingredientsStore.persistence.pinyinSortState.set);

	const searchConfig = useSearchConfig({
		label: '选择或输入食材名称',
		searchItems: allNames,
		searchValue,
		setSearchValue: ingredientsStore.persistence.searchValue.set,
		spriteTarget: 'ingredient',
	});

	const selectConfig = useMemo(
		() =>
			[
				{
					items: allDlcs,
					label: 'DLC',
					selectedKeys: filterDlcs,
					setSelectedKeys: ingredientsStore.persistence.filters.dlcs.set,
				},
				{
					items: allTags,
					label: '食材标签（包含）',
					selectedKeys: filterTags,
					setSelectedKeys: ingredientsStore.persistence.filters.tags.set,
				},
				{
					items: allTags,
					label: '食材标签（排除）',
					selectedKeys: filterNoTags,
					setSelectedKeys: ingredientsStore.persistence.filters.noTags.set,
				},
				{
					items: allTypes,
					label: '食材类别（包含）',
					selectedKeys: filterTypes,
					setSelectedKeys: ingredientsStore.persistence.filters.types.set,
				},
				{
					items: allTypes,
					label: '食材类别（排除）',
					selectedKeys: filterNoTypes,
					setSelectedKeys: ingredientsStore.persistence.filters.noTypes.set,
				},
				{
					items: allLevels,
					label: '等级',
					selectedKeys: filterLevels,
					setSelectedKeys: ingredientsStore.persistence.filters.levels.set,
				},
			] as const satisfies TSelectConfig,
		[
			allDlcs,
			allLevels,
			allTags,
			allTypes,
			filterDlcs,
			filterLevels,
			filterNoTags,
			filterNoTypes,
			filterTags,
			filterTypes,
		]
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
			className={twJoin(
				isEmpty
					? 'flex justify-center'
					: 'grid h-min grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7'
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
