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
import {
	checkArrayContainsOf,
	checkArraySubsetOf,
	checkEmpty,
} from '@/utilities';

export default function Ingredients() {
	const currentPopularTrend = store.shared.popularTrend.use();
	const isFamousShop = store.shared.famousShop.use();

	const instance = store.instance.get();

	const availableDlcs = store.availableDlcs.use();
	const availableLevels = store.availableLevels.use();
	const availableNames = store.availableNames.use();
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
			dataWithTrend.filter(({ dlc, level, tags, type }) => {
				const isDlcMatched =
					checkEmpty(filterDlcs) ||
					filterDlcs.includes(dlc.toString());
				const isLevelMatched =
					checkEmpty(filterLevels) ||
					filterLevels.includes(level.toString());
				const isTagMatched =
					checkEmpty(filterTags) ||
					checkArraySubsetOf(filterTags, tags);
				const isNoTagMatched =
					checkEmpty(filterNoTags) ||
					!checkArrayContainsOf(filterNoTags, tags);
				const isTypeMatched =
					checkEmpty(filterTypes) || filterTypes.includes(type);
				const isNoTypeMatched =
					checkEmpty(filterNoTypes) || !filterNoTypes.includes(type);

				return (
					isDlcMatched &&
					isLevelMatched &&
					isTagMatched &&
					isNoTagMatched &&
					isTypeMatched &&
					isNoTypeMatched
				);
			}),
		[
			dataWithTrend,
			filterDlcs,
			filterLevels,
			filterNoTags,
			filterNoTypes,
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
		],
		[
			availableDlcs,
			availableLevels,
			availableTags,
			availableTypes,
			filterDlcs,
			filterLevels,
			filterNoTags,
			filterNoTypes,
			filterTags,
			filterTypes,
		]
	);

	return (
		<ItemPage
			isEmpty={checkEmpty(sortedData)}
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
