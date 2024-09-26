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

import Content from '@/(pages)/recipes/content';
import Loading from '@/loading';
import FakeNameContent from '@/components/fakeNameContent';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {type TSelectConfig} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton from '@/components/sideSearchIconButton';

import {globalStore, recipesStore} from '@/stores';
import {checkArrayContainsOf, checkArraySubsetOf} from '@/utils';

export default function Recipes() {
	globalStore.persistence.popular.onChange((popularData) => {
		recipesStore.shared.popular.assign(popularData);
	});

	const shouldSkipProcessData = useSkipProcessItemData();

	const currentPopular = recipesStore.shared.popular.use();

	const instance = recipesStore.instance.get();

	const allNames = recipesStore.names.use();
	const allDlcs = recipesStore.dlcs.get();
	const allLevels = recipesStore.levels.get();
	const allCookers = recipesStore.cookers.get();
	const allIngredients = recipesStore.ingredients.get();
	const allNegativeTags = recipesStore.negativeTags.get();
	const allPositiveTags = recipesStore.positiveTags.get();

	const pinyinSortState = recipesStore.persistence.pinyinSortState.use();
	const searchValue = recipesStore.persistence.searchValue.use();

	const throttledSearchValue = useThrottle(searchValue);
	const searchResult = useSearchResult(instance, throttledSearchValue);

	const filterDlcs = recipesStore.persistence.filters.dlcs.use();
	const filterLevels = recipesStore.persistence.filters.levels.use();
	const filterCookers = recipesStore.persistence.filters.cookers.use();
	const filterIngredients = recipesStore.persistence.filters.ingredients.use();
	const filterNoIngredients = recipesStore.persistence.filters.noIngredients.use();
	const filterNegativeTags = recipesStore.persistence.filters.negativeTags.use();
	const filterNoNegativeTags = recipesStore.persistence.filters.noNegativeTags.use();
	const filterPositiveTags = recipesStore.persistence.filters.positiveTags.use();
	const filterNoPositiveTags = recipesStore.persistence.filters.noPositiveTags.use();

	const dataWithPopular = useMemo(
		() =>
			searchResult.map((data) => ({
				...data,
				positiveTags: instance.calculateTagsWithPopular(
					instance.composeTags(data.ingredients, [], data.positiveTags, []),
					currentPopular
				),
			})) as unknown as typeof searchResult,
		[currentPopular, instance, searchResult]
	);

	const filterData = useCallback(
		() =>
			dataWithPopular.filter(({dlc, level, cooker, ingredients, negativeTags, positiveTags}) => {
				const isDlcMatched = filterDlcs.length > 0 ? filterDlcs.includes(dlc.toString()) : true;
				const isLevelMatched = filterLevels.length > 0 ? filterLevels.includes(level.toString()) : true;
				const isCookerMatched = filterCookers.length > 0 ? filterCookers.includes(cooker) : true;
				const isIngredientMatched =
					filterIngredients.length > 0 ? checkArraySubsetOf(filterIngredients, ingredients) : true;
				const isNoIngredientMatched =
					filterNoIngredients.length > 0 ? !checkArrayContainsOf(filterNoIngredients, ingredients) : true;
				const isNegativeTagMatched =
					filterNegativeTags.length > 0 ? checkArraySubsetOf(filterNegativeTags, negativeTags) : true;
				const isNoNegativeTagMatched =
					filterNoNegativeTags.length > 0 ? !checkArrayContainsOf(filterNoNegativeTags, negativeTags) : true;
				const isPositiveTagMatched =
					filterPositiveTags.length > 0 ? checkArraySubsetOf(filterPositiveTags, positiveTags) : true;
				const isNoPositiveTagMatched =
					filterNoPositiveTags.length > 0 ? !checkArrayContainsOf(filterNoPositiveTags, positiveTags) : true;

				return (
					isDlcMatched &&
					isLevelMatched &&
					isIngredientMatched &&
					isNoIngredientMatched &&
					isCookerMatched &&
					isNegativeTagMatched &&
					isNoNegativeTagMatched &&
					isPositiveTagMatched &&
					isNoPositiveTagMatched
				);
			}),
		[
			dataWithPopular,
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

	const filteredData = useFilteredData(instance, filterData);

	const sortedData = useSortedData(instance, filteredData, pinyinSortState);

	const pinyinSortConfig = usePinyinSortConfig(pinyinSortState, recipesStore.persistence.pinyinSortState.set);

	const searchConfig = useSearchConfig({
		label: '选择或输入料理名称',
		searchItems: allNames,
		searchValue,
		setSearchValue: recipesStore.persistence.searchValue.set,
		spriteTarget: 'recipe',
	});

	const selectConfig = useMemo(
		() =>
			[
				{
					items: allDlcs,
					label: 'DLC',
					selectedKeys: filterDlcs,
					setSelectedKeys: recipesStore.persistence.filters.dlcs.set,
				},
				{
					items: allPositiveTags,
					label: '正特性（包含）',
					selectedKeys: filterPositiveTags,
					setSelectedKeys: recipesStore.persistence.filters.positiveTags.set,
				},
				{
					items: allPositiveTags,
					label: '正特性（排除）',
					selectedKeys: filterNoPositiveTags,
					setSelectedKeys: recipesStore.persistence.filters.noPositiveTags.set,
				},
				{
					items: allNegativeTags,
					label: '反特性（包含）',
					selectedKeys: filterNegativeTags,
					setSelectedKeys: recipesStore.persistence.filters.negativeTags.set,
				},
				{
					items: allNegativeTags,
					label: '反特性（排除）',
					selectedKeys: filterNoNegativeTags,
					setSelectedKeys: recipesStore.persistence.filters.noNegativeTags.set,
				},
				{
					items: allIngredients,
					label: '食材（包含）',
					selectedKeys: filterIngredients,
					setSelectedKeys: recipesStore.persistence.filters.ingredients.set,
					spriteTarget: 'ingredient',
				},
				{
					items: allIngredients,
					label: '食材（排除）',
					selectedKeys: filterNoIngredients,
					setSelectedKeys: recipesStore.persistence.filters.noIngredients.set,
					spriteTarget: 'ingredient',
				},
				{
					items: allCookers,
					label: '厨具',
					selectedKeys: filterCookers,
					setSelectedKeys: recipesStore.persistence.filters.cookers.set,
					spriteTarget: 'cooker',
				},
				{
					items: allLevels,
					label: '等级',
					selectedKeys: filterLevels,
					setSelectedKeys: recipesStore.persistence.filters.levels.set,
				},
			] as const satisfies TSelectConfig,
		[
			allCookers,
			allDlcs,
			allIngredients,
			allLevels,
			allNegativeTags,
			allPositiveTags,
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
			{!shouldSkipProcessData && (
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
