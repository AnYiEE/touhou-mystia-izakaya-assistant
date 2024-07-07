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

export default memo(function Recipes() {
	const store = useRecipesStore();

	const instance = store.instance.get();

	const allNames = store.names.use();
	const allDlcs = store.dlcs.get();
	const allLevels = store.levels.get();
	const allKitchenwares = store.kitchenwares.get();
	const allIngredients = store.ingredients.get();
	const allNegativeTags = store.negativeTags.get();
	const allPositiveTags = store.positiveTags.get();

	const pinyinSortState = store.persistence.pinyinSortState.use();
	const searchValue = store.persistence.searchValue.use();

	const throttledSearchValue = useThrottle(searchValue);
	const searchResult = useSearchResult(instance, throttledSearchValue);

	const filterDlcs = store.persistence.filters.dlcs.use();
	const filterLevels = store.persistence.filters.levels.use();
	const filterIngredients = store.persistence.filters.ingredients.use();
	const filterNoIngredients = store.persistence.filters.noIngredients.use();
	const filterKitchenwares = store.persistence.filters.kitchenwares.use();
	const filterNegativeTags = store.persistence.filters.negativeTags.use();
	const filterNoNegativeTags = store.persistence.filters.noNegativeTags.use();
	const filterPositiveTags = store.persistence.filters.positiveTags.use();
	const filterNoPositiveTags = store.persistence.filters.noPositiveTags.use();

	const filteredData = useMemo(
		() =>
			searchResult.filter(({dlc, level, ingredients, kitchenware, negativeTags, positiveTags}) => {
				const isDlcMatched = filterDlcs.length > 0 ? filterDlcs.includes(dlc.toString()) : true;
				const isLevelMatched = filterLevels.length > 0 ? filterLevels.includes(level.toString()) : true;
				const isIngredientMatched =
					filterIngredients.length > 0
						? filterIngredients.some((ingredient) => (ingredients as string[]).includes(ingredient))
						: true;
				const isNoIngredientMatched =
					filterNoIngredients.length > 0
						? !filterNoIngredients.some((ingredient) => (ingredients as string[]).includes(ingredient))
						: true;
				const isKitchenwareMatched =
					filterKitchenwares.length > 0 ? filterKitchenwares.includes(kitchenware) : true;
				const isNegativeTagMatched =
					filterNegativeTags.length > 0
						? filterNegativeTags.some((tag) => (negativeTags as string[]).includes(tag))
						: true;
				const isNoNegativeTagMatched =
					filterNoNegativeTags.length > 0
						? !filterNoNegativeTags.some((tag) => (negativeTags as string[]).includes(tag))
						: true;
				const isPositiveTagMatched =
					filterPositiveTags.length > 0
						? filterPositiveTags.some((tag) => (positiveTags as string[]).includes(tag))
						: true;
				const isNoPositiveTagMatched =
					filterNoPositiveTags.length > 0
						? !filterNoPositiveTags.some((tag) => (positiveTags as string[]).includes(tag))
						: true;

				return (
					isDlcMatched &&
					isLevelMatched &&
					isIngredientMatched &&
					isNoIngredientMatched &&
					isKitchenwareMatched &&
					isNegativeTagMatched &&
					isNoNegativeTagMatched &&
					isPositiveTagMatched &&
					isNoPositiveTagMatched
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

	const pinyinSortConfig = usePinyinSortConfig(pinyinSortState, store.persistence.pinyinSortState.set);

	const searchConfig = useSearchConfig({
		label: '选择或输入料理名称',
		searchItems: allNames,
		searchValue,
		setSearchValue: store.persistence.searchValue.set,
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
					items: allKitchenwares,
					label: '厨具',
					selectedKeys: filterKitchenwares,
					setSelectedKeys: store.persistence.filters.kitchenwares.set,
					spriteTarget: 'kitchenware',
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
			store.persistence.filters.dlcs.set,
			store.persistence.filters.ingredients.set,
			store.persistence.filters.kitchenwares.set,
			store.persistence.filters.levels.set,
			store.persistence.filters.negativeTags.set,
			store.persistence.filters.noIngredients.set,
			store.persistence.filters.noNegativeTags.set,
			store.persistence.filters.noPositiveTags.set,
			store.persistence.filters.positiveTags.set,
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
