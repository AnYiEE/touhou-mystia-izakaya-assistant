'use client';

import {useCallback, useMemo} from 'react';

import {
	useMounted,
	useParams,
	usePinyinSortConfig,
	useSearchConfig,
	useSearchResult,
	useSortedData,
	useThrottle,
} from '@/hooks';
import {openedPopoverParam} from '@/hooks/useOpenedFoodPopover';
import {inNewWindowParam} from '@/hooks/useViewInNewWindow';

import Content from '@/(pages)/ingredients/content';
import Loading from '@/loading';
import FakeNameContent from '@/components/fakeNameContent';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {type TSelectConfig} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton from '@/components/sideSearchIconButton';

import {ingredientsStore as store} from '@/stores';
import {checkArrayContainsOf, checkArraySubsetOf} from '@/utils';

export default function Ingredients() {
	const [params] = useParams();

	const isInNewWindow = params.has(inNewWindowParam);
	const isSpecified = params.has(openedPopoverParam);

	const instance = store.instance.get();

	const allNames = store.names.use();
	const allDlcs = store.dlcs.get();
	const allLevels = store.levels.get();
	const allTags = store.tags.get();
	const allTypes = store.types.get();

	const pinyinSortState = store.persistence.pinyinSortState.use();
	const searchValue = store.persistence.searchValue.use();

	const throttledSearchValue = useThrottle(searchValue);
	const searchResult = useSearchResult(instance, throttledSearchValue, isInNewWindow);

	const filterDlcs = store.persistence.filters.dlcs.use();
	const filterLevels = store.persistence.filters.levels.use();
	const filterTags = store.persistence.filters.tags.use();
	const filterNoTags = store.persistence.filters.noTags.use();
	const filterTypes = store.persistence.filters.types.use();
	const filterNoTypes = store.persistence.filters.noTypes.use();

	const filterData = useCallback(
		() =>
			searchResult.filter(({dlc, level, tags, type}) => {
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
		[filterDlcs, filterLevels, filterNoTags, filterNoTypes, filterTags, filterTypes, searchResult]
	);

	const filteredData = useMemo(() => filterData(), [filterData]);

	const sortedData = useSortedData(instance, filteredData, pinyinSortState, isInNewWindow);

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
					label: '食材种类（包含）',
					selectedKeys: filterTypes,
					setSelectedKeys: store.persistence.filters.types.set,
				},
				{
					items: allTypes,
					label: '食材种类（排除）',
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
		<div className="grid h-min grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
			{!isSpecified && (
				<SideButtonGroup>
					<SideSearchIconButton searchConfig={searchConfig} />
					<SidePinyinSortIconButton pinyinSortConfig={pinyinSortConfig} />
					<SideFilterIconButton selectConfig={selectConfig} />
				</SideButtonGroup>
			)}

			<Content data={sortedData} />
		</div>
	);
}
