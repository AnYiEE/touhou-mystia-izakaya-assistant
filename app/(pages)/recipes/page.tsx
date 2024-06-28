'use client';

import {memo, useMemo} from 'react';

import {useMounted, usePinyinSortConfig, useSearchConfig, useSearchResult, useSortedData, useThrottle} from '@/hooks';

import Content from '@/(pages)/recipes/content';
import Loading from '@/loading';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {type TSelectConfig} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton from '@/components/sideSearchIconButton';

import {useRecipesStore} from '@/stores';

export default memo(function Recipess() {
	const store = useRecipesStore();

	const instance = store.instance.get();

	const allNames = store.names.use();
	const allDlcs = store.dlcs.get();
	const allLevels = store.levels.get();
	const allKitchenwares = store.kitchenwares.get();
	const allPositiveTags = store.positiveTags.get();
	const allNegativeTags = store.negativeTags.get();
	const allIngredients = store.ingredients.get();

	const pinyinSortState = store.page.pinyinSortState.use();
	const searchValue = store.page.searchValue.use();

	const throttledSearchValue = useThrottle(searchValue);
	const searchResult = useSearchResult(instance, throttledSearchValue);

	const filterDlcs = store.page.filters.dlcs.use();
	const filterLevels = store.page.filters.levels.use();
	const filterKitchenwares = store.page.filters.kitchenwares.use();
	const filterPositiveTags = store.page.filters.positiveTags.use();
	const filterNoPositiveTags = store.page.filters.noPositiveTags.use();
	const filterNegativeTags = store.page.filters.negativeTags.use();
	const filterNoNegativeTags = store.page.filters.noNegativeTags.use();
	const filterIngredients = store.page.filters.ingredients.use();
	const filterNoIngredients = store.page.filters.noIngredients.use();

	const filteredData = useMemo(
		() =>
			searchResult.filter(({dlc, level, kitchenware, positive, negative, ingredients}) => {
				const isDlcMatch = filterDlcs.length ? filterDlcs.includes(dlc.toString()) : true;
				const isLevelMatch = filterLevels.length ? filterLevels.includes(level.toString()) : true;
				const isKitchenwareMatch = filterKitchenwares.length ? filterKitchenwares.includes(kitchenware) : true;
				const isPositiveTagMatch = filterPositiveTags.length
					? filterPositiveTags.some((tag) => (positive as string[]).includes(tag))
					: true;
				const isNoPositiveTagMatch = filterNoPositiveTags.length
					? !filterNoPositiveTags.some((tag) => (positive as string[]).includes(tag))
					: true;
				const isNegativeTagMatch = filterNegativeTags.length
					? filterNegativeTags.some((tag) => (negative as string[]).includes(tag))
					: true;
				const isNoNegativeTagMatch = filterNoNegativeTags.length
					? !filterNoNegativeTags.some((tag) => (negative as string[]).includes(tag))
					: true;
				const isIngredientMatch = filterIngredients.length
					? filterIngredients.some((ingredient) => (ingredients as string[]).includes(ingredient))
					: true;
				const isNoIngredientMatch = filterNoIngredients.length
					? !filterNoIngredients.some((ingredient) => (ingredients as string[]).includes(ingredient))
					: true;

				return (
					isDlcMatch &&
					isLevelMatch &&
					isKitchenwareMatch &&
					isPositiveTagMatch &&
					isNoPositiveTagMatch &&
					isNegativeTagMatch &&
					isNoNegativeTagMatch &&
					isIngredientMatch &&
					isNoIngredientMatch
				);
			}),
		[
			filterDlcs,
			filterIngredients,
			filterKitchenwares,
			filterLevels,
			filterNegativeTags,
			filterNoIngredients,
			filterNoNegativeTags,
			filterNoPositiveTags,
			filterPositiveTags,
			searchResult,
		]
	);

	const sortedData = useSortedData(instance, filteredData, pinyinSortState);

	const pinyinSortConfig = usePinyinSortConfig(pinyinSortState, store.page.pinyinSortState.set);

	const searchConfig = useSearchConfig({
		label: '选择或输入料理名称',
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
					selectedKeys: filterDlcs,
					setSelectedKeys: store.page.filters.dlcs.set,
				},
				{
					label: '正特性（包含）',
					items: allPositiveTags,
					selectedKeys: filterPositiveTags,
					setSelectedKeys: store.page.filters.positiveTags.set,
				},
				{
					label: '正特性（排除）',
					items: allPositiveTags,
					selectedKeys: filterNoPositiveTags,
					setSelectedKeys: store.page.filters.noPositiveTags.set,
				},
				{
					label: '反特性（包含）',
					items: allNegativeTags,
					selectedKeys: filterNegativeTags,
					setSelectedKeys: store.page.filters.negativeTags.set,
				},
				{
					label: '反特性（排除）',
					items: allNegativeTags,
					selectedKeys: filterNoNegativeTags,
					setSelectedKeys: store.page.filters.noNegativeTags.set,
				},
				{
					label: '食材（包含）',
					items: allIngredients,
					selectedKeys: filterIngredients,
					setSelectedKeys: store.page.filters.ingredients.set,
					spriteTarget: 'ingredient',
				},
				{
					label: '食材（排除）',
					items: allIngredients,
					selectedKeys: filterNoIngredients,
					setSelectedKeys: store.page.filters.noIngredients.set,
					spriteTarget: 'ingredient',
				},
				{
					label: '厨具',
					items: allKitchenwares,
					selectedKeys: filterKitchenwares,
					setSelectedKeys: store.page.filters.kitchenwares.set,
					spriteTarget: 'kitchenware',
				},
				{
					label: '等级',
					items: allLevels,
					selectedKeys: filterLevels,
					setSelectedKeys: store.page.filters.levels.set,
				},
			] as const satisfies TSelectConfig,
		[
			allDlcs,
			allIngredients,
			allKitchenwares,
			allLevels,
			allNegativeTags,
			allPositiveTags,
			filterDlcs,
			filterIngredients,
			filterKitchenwares,
			filterLevels,
			filterNegativeTags,
			filterNoIngredients,
			filterNoNegativeTags,
			filterNoPositiveTags,
			filterPositiveTags,
			store.page.filters.dlcs.set,
			store.page.filters.ingredients.set,
			store.page.filters.kitchenwares.set,
			store.page.filters.levels.set,
			store.page.filters.negativeTags.set,
			store.page.filters.noIngredients.set,
			store.page.filters.noNegativeTags.set,
			store.page.filters.noPositiveTags.set,
			store.page.filters.positiveTags.set,
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
