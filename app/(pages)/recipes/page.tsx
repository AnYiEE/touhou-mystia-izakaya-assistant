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

import Content from '@/(pages)/recipes/content';
import Loading from '@/loading';
import FakeNameContent from '@/components/fakeNameContent';
import Placeholder from '@/components/placeholder';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {type TSelectConfig} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton from '@/components/sideSearchIconButton';

import {recipesStore as store} from '@/stores';
import {checkArrayContainsOf, checkArraySubsetOf} from '@/utilities';

export default function Recipes() {
	const shouldSkipProcessData = useSkipProcessItemData();

	const currentPopular = store.shared.popular.use();
	const isFamousShop = store.shared.famousShop.use();

	const instance = store.instance.get();

	const allNames = store.names.use();
	const allDlcs = store.dlcs.get();
	const allLevels = store.levels.get();
	const allCookers = store.cookers.get();
	const allIngredients = store.ingredients.get();
	const allNegativeTags = store.negativeTags.get();
	const allPositiveTags = store.positiveTags.get();

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

	const dataWithPopular = useMemo(
		() =>
			searchResult.map((data) => ({
				...data,
				positiveTags: instance.calculateTagsWithPopular(
					instance.composeTagsWithPopular(data.ingredients, [], data.positiveTags, [], null),
					currentPopular,
					isFamousShop
				),
			})) as unknown as typeof searchResult,
		[currentPopular, instance, isFamousShop, searchResult]
	);

	const filterData = useCallback(
		() =>
			dataWithPopular.filter(({cooker, dlc, ingredients, level, negativeTags, positiveTags}) => {
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

	const filteredData = useFilteredData(dataWithPopular, filterData);

	const sortedData = useSortedData(instance, filteredData, pinyinSortState);

	const pinyinSortConfig = usePinyinSortConfig(pinyinSortState, store.persistence.pinyinSortState.set);

	const searchConfig = useSearchConfig({
		label: '选择或输入料理名称',
		searchItems: allNames,
		searchValue,
		setSearchValue: store.persistence.searchValue.set,
		spriteTarget: 'recipe',
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
					items: allPositiveTags,
					label: '正特性（包含）',
					selectedKeys: filterPositiveTags,
					setSelectedKeys: store.persistence.filters.positiveTags.set,
				},
				{
					items: allPositiveTags,
					label: '正特性（排除）',
					selectedKeys: filterNoPositiveTags,
					setSelectedKeys: store.persistence.filters.noPositiveTags.set,
				},
				{
					items: allNegativeTags,
					label: '反特性（包含）',
					selectedKeys: filterNegativeTags,
					setSelectedKeys: store.persistence.filters.negativeTags.set,
				},
				{
					items: allNegativeTags,
					label: '反特性（排除）',
					selectedKeys: filterNoNegativeTags,
					setSelectedKeys: store.persistence.filters.noNegativeTags.set,
				},
				{
					items: allIngredients,
					label: '食材（包含）',
					selectedKeys: filterIngredients,
					setSelectedKeys: store.persistence.filters.ingredients.set,
					spriteTarget: 'ingredient',
				},
				{
					items: allIngredients,
					label: '食材（排除）',
					selectedKeys: filterNoIngredients,
					setSelectedKeys: store.persistence.filters.noIngredients.set,
					spriteTarget: 'ingredient',
				},
				{
					items: allCookers,
					label: '厨具',
					selectedKeys: filterCookers,
					setSelectedKeys: store.persistence.filters.cookers.set,
					spriteTarget: 'cooker',
				},
				{
					items: allLevels,
					label: '等级',
					selectedKeys: filterLevels,
					setSelectedKeys: store.persistence.filters.levels.set,
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
