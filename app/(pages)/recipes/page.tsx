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
			searchResult.filter(({dlc, level, kitchenware, positiveTags, negativeTags, ingredients}) => {
				const isDlcMatch = filterDlcs.length > 0 ? filterDlcs.includes(dlc.toString()) : true;
				const isLevelMatch = filterLevels.length > 0 ? filterLevels.includes(level.toString()) : true;
				const isKitchenwareMatch =
					filterKitchenwares.length > 0 ? filterKitchenwares.includes(kitchenware) : true;
				const isPositiveTagMatch =
					filterPositiveTags.length > 0
						? filterPositiveTags.some((tag) => (positiveTags as string[]).includes(tag))
						: true;
				const isNoPositiveTagMatch =
					filterNoPositiveTags.length > 0
						? !filterNoPositiveTags.some((tag) => (positiveTags as string[]).includes(tag))
						: true;
				const isNegativeTagMatch =
					filterNegativeTags.length > 0
						? filterNegativeTags.some((tag) => (negativeTags as string[]).includes(tag))
						: true;
				const isNoNegativeTagMatch =
					filterNoNegativeTags.length > 0
						? !filterNoNegativeTags.some((tag) => (negativeTags as string[]).includes(tag))
						: true;
				const isIngredientMatch =
					filterIngredients.length > 0
						? filterIngredients.some((ingredient) => (ingredients as string[]).includes(ingredient))
						: true;
				const isNoIngredientMatch =
					filterNoIngredients.length > 0
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
		searchValue,
		setSearchValue: store.page.searchValue.set,
	});

	const selectConfig = useMemo(
		() =>
			[
				{
					items: allDlcs,
					label: 'DLC',
					selectedKeys: filterDlcs,
					setSelectedKeys: store.page.filters.dlcs.set,
				},
				{
					items: allPositiveTags,
					label: '正特性（包含）',
					selectedKeys: filterPositiveTags,
					setSelectedKeys: store.page.filters.positiveTags.set,
				},
				{
					items: allPositiveTags,
					label: '正特性（排除）',
					selectedKeys: filterNoPositiveTags,
					setSelectedKeys: store.page.filters.noPositiveTags.set,
				},
				{
					items: allNegativeTags,
					label: '反特性（包含）',
					selectedKeys: filterNegativeTags,
					setSelectedKeys: store.page.filters.negativeTags.set,
				},
				{
					items: allNegativeTags,
					label: '反特性（排除）',
					selectedKeys: filterNoNegativeTags,
					setSelectedKeys: store.page.filters.noNegativeTags.set,
				},
				{
					items: allIngredients,
					label: '食材（包含）',
					selectedKeys: filterIngredients,
					setSelectedKeys: store.page.filters.ingredients.set,
					spriteTarget: 'ingredient',
				},
				{
					items: allIngredients,
					label: '食材（排除）',
					selectedKeys: filterNoIngredients,
					setSelectedKeys: store.page.filters.noIngredients.set,
					spriteTarget: 'ingredient',
				},
				{
					items: allKitchenwares,
					label: '厨具',
					selectedKeys: filterKitchenwares,
					setSelectedKeys: store.page.filters.kitchenwares.set,
					spriteTarget: 'kitchenware',
				},
				{
					items: allLevels,
					label: '等级',
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
