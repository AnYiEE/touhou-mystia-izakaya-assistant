'use client';

import {memo, useMemo, useState} from 'react';

import {useThrottle} from '@/hooks';

import Content from '@/(pages)/ingredients/content';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {type SelectConfig} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton, {type PinyinSortConfig, PinyinSortState} from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton, {type SearchConfig} from '@/components/sideSearchIconButton';
import {instances} from '@/methods';
import {numberSort, pinyinSort} from '@/utils';

const {
	food: {ingredient: instance},
} = instances;

const allDlcs = instance.getValuesByProp(instance.data, 'dlc', true).sort(numberSort);
const allLevels = instance.getValuesByProp(instance.data, 'level', true).sort(numberSort);
const allTags = instance.getValuesByProp(instance.data, 'tag', true).sort(pinyinSort);

export default memo(function Ingredients() {
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
		tag: [] as string[],
		noTag: [] as string[],
	});
	const {dlc: filterDlc, level: filterLevel, tag: filterTag, noTag: filterNoTag} = filters;

	const filteredData = useMemo(
		() =>
			searchResult.filter(({dlc, level, tag: tags}) => {
				const isDlcMatch = filterDlc.length ? filterDlc.includes(dlc.toString()) : true;
				const isLevelMatch = filterLevel.length ? filterLevel.includes(level.toString()) : true;
				const isTagMatch = filterTag.length ? filterTag.some((tag) => (tags as string[]).includes(tag)) : true;
				const isNoTagMatch = filterNoTag.length
					? !filterNoTag.some((tag) => (tags as string[]).includes(tag))
					: true;

				return isDlcMatch && isLevelMatch && isTagMatch && isNoTagMatch;
			}),
		[filterDlc, filterTag, filterNoTag, filterLevel, searchResult]
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
				label: '选择或输入食材名称',
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
					label: '食材标签（包含）',
					items: allTags,
					selectedKeys: filterTag,
					setSelectedKeys: (key) => setFilters((prev) => ({...prev, tag: key})),
				},
				{
					label: '食材标签（排除）',
					items: allTags,
					selectedKeys: filterNoTag,
					setSelectedKeys: (key) => setFilters((prev) => ({...prev, noTag: key})),
				},
				{
					label: '等级',
					items: allLevels,
					selectedKeys: filterLevel,
					setSelectedKeys: (key) => setFilters((prev) => ({...prev, level: key})),
				},
			] as const satisfies SelectConfig,
		[filterDlc, filterLevel, filterTag, filterNoTag]
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
