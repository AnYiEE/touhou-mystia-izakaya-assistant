'use client';

import {memo, useMemo, useState} from 'react';

import {useThrottle} from '@/hooks';

import Content from '@/(pages)/recipes/content';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {type SelectConfig} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton, {type PinyinSortConfig, PinyinSortState} from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton, {type SearchConfig} from '@/components/sideSearchIconButton';
import {instances} from '@/methods';
import {numberSort, pinyinSort} from '@/utils';

const {
	food: {recipe: instance},
} = instances;

const allDlcs = instance.getValuesByProp(instance.data, 'dlc', true).sort(numberSort);
const allLevels = instance.getValuesByProp(instance.data, 'level', true).sort(numberSort);
const allKitchenwares = instance.getValuesByProp(instance.data, 'kitchenware', true).sort(pinyinSort);
const allPositiveTags = instance.getValuesByProp(instance.data, 'positive', true).sort(pinyinSort);
const allNegativeTags = instance.getValuesByProp(instance.data, 'negative', true).sort(pinyinSort);
const allIngredients = instance.getValuesByProp(instance.data, 'ingredients', true).sort(pinyinSort);

export default memo(function Recipess() {
	const [pinyinSortState, setPinyinSortState] = useState<PinyinSortState>(PinyinSortState.NONE);

	const allNames = useMemo(() => {
		switch (pinyinSortState) {
			case PinyinSortState.AZ:
				return instance.getValuesByProp(instance.dataPinyinSorted, 'name', true);
			case PinyinSortState.ZA:
				return instance.getValuesByProp(instance.dataPinyinSorted.toReversed(), 'name', true);
			default:
				return instance.getValuesByProp(instance.data, 'name', true);
		}
	}, [pinyinSortState]);

	const [searchValue, setSearchValue] = useState('');
	const throttledSearchValue = useThrottle(searchValue);

	const searchResult = useMemo(() => {
		if (throttledSearchValue) {
			return instance.data.filter(({name}) => name.toLowerCase().includes(throttledSearchValue.toLowerCase()));
		}
		return instance.data;
	}, [throttledSearchValue]);

	const [filters, setFilters] = useState({
		dlc: [] as string[],
		level: [] as string[],
		kitchenware: [] as string[],
		positiveTag: [] as string[],
		noPositiveTag: [] as string[],
		negativeTag: [] as string[],
		noNegativeTag: [] as string[],
		ingredient: [] as string[],
		noIngredient: [] as string[],
	});
	const {
		dlc: filterDlc,
		level: filterLevel,
		kitchenware: filterKitchenware,
		positiveTag: filterPositiveTag,
		noPositiveTag: filterNoPositiveTag,
		negativeTag: filterNegativeTag,
		noNegativeTag: filterNoNegativeTag,
		ingredient: filterIngredient,
		noIngredient: filterNoIngredient,
	} = filters;

	const filteredData = useMemo(
		() =>
			searchResult.filter(({dlc, level, kitchenware, positive, negative, ingredients}) => {
				const isDlcMatch = filterDlc.length ? filterDlc.includes(dlc.toString()) : true;
				const isLevelMatch = filterLevel.length ? filterLevel.includes(level.toString()) : true;
				const isKitchenwareMatch = filterKitchenware.length ? filterKitchenware.includes(kitchenware) : true;
				const isPositiveTagMatch = filterPositiveTag.length
					? filterPositiveTag.some((tag) => (positive as string[]).includes(tag))
					: true;
				const isNoPositiveTagMatch = filterNoPositiveTag.length
					? !filterNoPositiveTag.some((tag) => (positive as string[]).includes(tag))
					: true;
				const isNegativeTagMatch = filterNegativeTag.length
					? filterNegativeTag.some((tag) => (negative as string[]).includes(tag))
					: true;
				const isNoNegativeTagMatch = filterNoNegativeTag.length
					? !filterNoNegativeTag.some((tag) => (negative as string[]).includes(tag))
					: true;
				const isIngredientMatch = filterIngredient.length
					? filterIngredient.some((ingredient) => (ingredients as string[]).includes(ingredient))
					: true;
				const isNoIngredientMatch = filterNoIngredient.length
					? !filterNoIngredient.some((ingredient) => (ingredients as string[]).includes(ingredient))
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
			filterDlc,
			filterKitchenware,
			filterLevel,
			filterPositiveTag,
			filterNoPositiveTag,
			filterNegativeTag,
			filterNoNegativeTag,
			filterIngredient,
			filterNoIngredient,
			searchResult,
		]
	);

	const sortedData = useMemo(() => {
		switch (pinyinSortState) {
			case PinyinSortState.AZ:
				return instance.sortByPinyin(filteredData);
			case PinyinSortState.ZA:
				return instance.sortByPinyin(filteredData).reverse();
			default:
				return filteredData;
		}
	}, [filteredData, pinyinSortState]);

	const pinyinSortConfig = useMemo(
		() =>
			({
				pinyinSortState,
				setPinyinSortState,
			}) as const satisfies PinyinSortConfig,
		[pinyinSortState, setPinyinSortState]
	);

	const searchConfig = useMemo(
		() =>
			({
				label: '选择或输入料理名称',
				searchItems: allNames,
				searchValue: searchValue,
				setSearchValue: setSearchValue,
			}) as const satisfies SearchConfig,
		[allNames, searchValue]
	);

	const selectConfig = useMemo(
		() =>
			[
				{
					label: 'DLC',
					items: allDlcs,
					selectedKeys: filterDlc,
					setSelectedKeys: (key) => setFilters((prev) => ({...prev, dlc: key})),
				},
				{
					label: '正特性（包含）',
					items: allPositiveTags,
					selectedKeys: filterPositiveTag,
					setSelectedKeys: (key) => setFilters((prev) => ({...prev, positiveTag: key})),
				},
				{
					label: '正特性（排除）',
					items: allPositiveTags,
					selectedKeys: filterNoPositiveTag,
					setSelectedKeys: (key) => setFilters((prev) => ({...prev, noPositiveTag: key})),
				},
				{
					label: '反特性（包含）',
					items: allNegativeTags,
					selectedKeys: filterNegativeTag,
					setSelectedKeys: (key) => setFilters((prev) => ({...prev, negativeTag: key})),
				},
				{
					label: '反特性（排除）',
					items: allNegativeTags,
					selectedKeys: filterNoNegativeTag,
					setSelectedKeys: (key) => setFilters((prev) => ({...prev, noNegativeTag: key})),
				},
				{
					label: '食材（包含）',
					items: allIngredients,
					selectedKeys: filterIngredient,
					setSelectedKeys: (key) => setFilters((prev) => ({...prev, ingredient: key})),
				},
				{
					label: '食材（排除）',
					items: allIngredients,
					selectedKeys: filterNoIngredient,
					setSelectedKeys: (key) => setFilters((prev) => ({...prev, noIngredient: key})),
				},
				{
					label: '厨具',
					items: allKitchenwares,
					selectedKeys: filterKitchenware,
					setSelectedKeys: (key) => setFilters((prev) => ({...prev, kitchenware: key})),
				},
				{
					label: '等级',
					items: allLevels,
					selectedKeys: filterLevel,
					setSelectedKeys: (key) => setFilters((prev) => ({...prev, level: key})),
				},
			] as const satisfies SelectConfig,
		[
			filterDlc,
			filterLevel,
			filterKitchenware,
			filterPositiveTag,
			filterNoPositiveTag,
			filterIngredient,
			filterNoIngredient,
			filterNegativeTag,
			filterNoNegativeTag,
		]
	);

	return (
		<>
			<SideButtonGroup>
				<SideSearchIconButton searchConfig={searchConfig} />
				<SidePinyinSortIconButton pinyinSortConfig={pinyinSortConfig} />
				<SideFilterIconButton selectConfig={selectConfig} />
			</SideButtonGroup>

			<Content data={sortedData} />
		</>
	);
});
