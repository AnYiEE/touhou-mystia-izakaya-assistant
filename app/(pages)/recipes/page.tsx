'use client';

import { useCallback, useMemo } from 'react';

import {
	useFilteredData,
	useSearchResult,
	useSortedData,
	useThrottle,
} from '@/hooks';

import { tUI } from '@/i18n';

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

import { recipesStore as store } from '@/stores';
import { checkLengthEmpty, filterItems } from '@/utilities';

export default function Recipes() {
	const currentPopularTrend = store.shared.popularTrend.use();
	const isFamousShop = store.shared.famousShop.use();

	const instance = store.instance.get();

	const availableDlcs = store.availableDlcs.use();
	const availableCookers = store.availableCookers.use();
	const availableIngredients = store.availableIngredients.use();
	const availableLevels = store.availableLevels.use();
	const availableNames = store.availableNames.use();
	const availableNegativeTags = store.availableNegativeTags.use();
	const availablePositiveTags = store.availablePositiveTags.use();

	const pinyinSortState = store.persistence.pinyinSortState.use();
	const searchValue = store.persistence.searchValue.use();

	const throttledSearchValue = useThrottle(searchValue);
	const searchResult = useSearchResult(instance, throttledSearchValue);

	const filterDlcs = store.persistence.filters.dlcs.use();
	const filterLevels = store.persistence.filters.levels.use();
	const filterCookers = store.persistence.filters.cookers.use();
	const filterIngredients = store.persistence.filters.ingredients.use();
	const filterNoIngredients = store.persistence.filters.noIngredients.use();
	const filterNegativeTags = store.persistence.filters.negativeTags.use();
	const filterNoNegativeTags = store.persistence.filters.noNegativeTags.use();
	const filterPositiveTags = store.persistence.filters.positiveTags.use();
	const filterNoPositiveTags = store.persistence.filters.noPositiveTags.use();

	const dataWithTrend = useMemo(
		() =>
			searchResult.map((data) => ({
				...data,
				positiveTags: instance.calculateTagsWithTrend(
					instance.composeTagsWithPopularTrend(
						data.ingredients,
						[],
						data.positiveTags,
						[],
						null
					),
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
				{ field: 'cooker', match: 'in', values: filterCookers },
				{
					field: 'ingredients',
					match: 'all',
					values: filterIngredients,
				},
				{
					field: 'ingredients',
					match: 'excludeAny',
					values: filterNoIngredients,
				},
				{
					field: 'negativeTags',
					match: 'all',
					values: filterNegativeTags,
				},
				{
					field: 'negativeTags',
					match: 'excludeAny',
					values: filterNoNegativeTags,
				},
				{
					field: 'positiveTags',
					match: 'all',
					values: filterPositiveTags,
				},
				{
					field: 'positiveTags',
					match: 'excludeAny',
					values: filterNoPositiveTags,
				},
			]),
		[
			dataWithTrend,
			filterCookers,
			filterDlcs,
			filterIngredients,
			filterLevels,
			filterNegativeTags,
			filterNoIngredients,
			filterNoNegativeTags,
			filterNoPositiveTags,
			filterPositiveTags,
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
			label: tUI('选择或输入料理名称'),
			searchItems: availableNames,
			searchValue,
			setSearchValue: store.persistence.searchValue.set,
			spriteTarget: 'recipe',
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
				items: availablePositiveTags,
				label: tUI('正特性（包含）'),
				selectedKeys: filterPositiveTags,
				setSelectedKeys: store.persistence.filters.positiveTags.set,
			},
			{
				items: availablePositiveTags,
				label: tUI('正特性（排除）'),
				selectedKeys: filterNoPositiveTags,
				setSelectedKeys: store.persistence.filters.noPositiveTags.set,
			},
			{
				items: availableNegativeTags,
				label: tUI('反特性（包含）'),
				selectedKeys: filterNegativeTags,
				setSelectedKeys: store.persistence.filters.negativeTags.set,
			},
			{
				items: availableNegativeTags,
				label: tUI('反特性（排除）'),
				selectedKeys: filterNoNegativeTags,
				setSelectedKeys: store.persistence.filters.noNegativeTags.set,
			},
			{
				items: availableIngredients,
				label: tUI('食材（包含）'),
				selectedKeys: filterIngredients,
				setSelectedKeys: store.persistence.filters.ingredients.set,
				spriteTarget: 'ingredient',
			},
			{
				items: availableIngredients,
				label: tUI('食材（排除）'),
				selectedKeys: filterNoIngredients,
				setSelectedKeys: store.persistence.filters.noIngredients.set,
				spriteTarget: 'ingredient',
			},
			{
				items: availableCookers,
				label: tUI('厨具'),
				selectedKeys: filterCookers,
				setSelectedKeys: store.persistence.filters.cookers.set,
				spriteTarget: 'cooker',
			},
			{
				items: availableLevels,
				label: tUI('等级'),
				selectedKeys: filterLevels,
				setSelectedKeys: store.persistence.filters.levels.set,
			},
		],
		[
			availableCookers,
			availableDlcs,
			availableIngredients,
			availableLevels,
			availableNegativeTags,
			availablePositiveTags,
			filterCookers,
			filterDlcs,
			filterIngredients,
			filterLevels,
			filterNegativeTags,
			filterNoIngredients,
			filterNoNegativeTags,
			filterNoPositiveTags,
			filterPositiveTags,
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
