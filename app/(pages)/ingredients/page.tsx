'use client';

import {useCallback, useMemo} from 'react';

import {
	useFilteredData,
	useMounted,
	usePinyinSortConfig,
	useSearchConfig,
	useSearchResult,
	useSortedData,
	useThrottle,
} from '@/hooks';

import Content from '@/(pages)/ingredients/content';
import Loading from '@/loading';
import FakeNameContent from '@/components/fakeNameContent';
import ItemPage from '@/components/itemPage';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {type TSelectConfig} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton from '@/components/sideSearchIconButton';

import {ingredientsStore as store} from '@/stores';
import {checkArrayContainsOf, checkArraySubsetOf} from '@/utilities';

export default function Ingredients() {
	const currentPopularTrend = store.shared.popularTrend.use();
	const isFamousShop = store.shared.famousShop.use();

	const instance = store.instance.get();

	const allNames = store.names.use();
	const allDlcs = store.dlcs.get();
	const allLevels = store.levels.get();
	const allTags = store.tags.get();
	const allTypes = store.types.get();

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

	const dataWithTrend = useMemo(
		() =>
			searchResult.map((data) => ({
				...data,
				tags: instance.calculateTagsWithTrend(data.tags, currentPopularTrend, isFamousShop),
			})) as unknown as typeof searchResult,
		[currentPopularTrend, instance, isFamousShop, searchResult]
	);

	const filterData = useCallback(
		() =>
			dataWithTrend.filter(({dlc, level, tags, type}) => {
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
		[dataWithTrend, filterDlcs, filterLevels, filterNoTags, filterNoTypes, filterTags, filterTypes]
	);

	const filteredData = useFilteredData(dataWithTrend, filterData);

	const sortedData = useSortedData(instance, filteredData, pinyinSortState);

	const pinyinSortConfig = usePinyinSortConfig(pinyinSortState, store.persistence.pinyinSortState.set);

	const searchConfig = useSearchConfig({
		label: '选择或输入食材名称',
		searchItems: allNames,
		searchValue,
		setSearchValue: store.persistence.searchValue.set,
		spriteTarget: 'ingredient',
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
					label: '食材标签（包含）',
					selectedKeys: filterTags,
					setSelectedKeys: store.persistence.filters.tags.set,
				},
				{
					items: allTags,
					label: '食材标签（排除）',
					selectedKeys: filterNoTags,
					setSelectedKeys: store.persistence.filters.noTags.set,
				},
				{
					items: allTypes,
					label: '食材类别（包含）',
					selectedKeys: filterTypes,
					setSelectedKeys: store.persistence.filters.types.set,
				},
				{
					items: allTypes,
					label: '食材类别（排除）',
					selectedKeys: filterNoTypes,
					setSelectedKeys: store.persistence.filters.noTypes.set,
				},
				{
					items: allLevels,
					label: '等级',
					selectedKeys: filterLevels,
					setSelectedKeys: store.persistence.filters.levels.set,
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

	return (
		<ItemPage
			isEmpty={sortedData.length === 0}
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
