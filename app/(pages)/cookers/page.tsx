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

import { cookersStore as store } from '@/stores';
import { checkLengthEmpty, filterItems } from '@/utilities';

export default function Cookers() {
	const instance = store.instance.get();

	const availableCategories = store.availableCategories.use();
	const availableDlcs = store.availableDlcs.use();
	const availableNames = store.availableNames.use();
	const availableTypes = store.availableTypes.use();

	const pinyinSortState = store.persistence.pinyinSortState.use();
	const searchValue = store.persistence.searchValue.use();

	const throttledSearchValue = useThrottle(searchValue);
	const searchResult = useSearchResult(instance, throttledSearchValue);

	const filterDlcs = store.persistence.filters.dlcs.use();
	const filterCategories = store.persistence.filters.categories.use();
	const filterNoCategories = store.persistence.filters.noCategories.use();
	const filterTypes = store.persistence.filters.types.use();
	const filterNoTypes = store.persistence.filters.noTypes.use();

	const filterData = useCallback(
		() =>
			filterItems(searchResult, [
				{ field: 'dlc', match: 'in', values: filterDlcs },
				{ field: 'category', match: 'in', values: filterCategories },
				{
					field: 'category',
					match: 'excludeIn',
					values: filterNoCategories,
				},
				{ field: 'type', match: 'any', values: filterTypes },
				{ field: 'type', match: 'excludeAny', values: filterNoTypes },
			]),
		[
			filterCategories,
			filterDlcs,
			filterNoCategories,
			filterNoTypes,
			filterTypes,
			searchResult,
		]
	);

	const filteredData = useFilteredData(instance, filterData);

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
			label: tUI('选择或输入厨具名称'),
			searchItems: availableNames,
			searchValue,
			setSearchValue: store.persistence.searchValue.set,
			spriteTarget: 'cooker',
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
				items: availableCategories,
				label: tUI('厨具系列（包含）'),
				selectedKeys: filterCategories,
				setSelectedKeys: store.persistence.filters.categories.set,
			},
			{
				items: availableCategories,
				label: tUI('厨具系列（排除）'),
				selectedKeys: filterNoCategories,
				setSelectedKeys: store.persistence.filters.noCategories.set,
			},
			{
				items: availableTypes,
				label: tUI('厨具类别（包含）'),
				selectedKeys: filterTypes,
				setSelectedKeys: store.persistence.filters.types.set,
			},
			{
				items: availableTypes,
				label: tUI('厨具类别（排除）'),
				selectedKeys: filterNoTypes,
				setSelectedKeys: store.persistence.filters.noTypes.set,
			},
		],
		[
			availableCategories,
			availableDlcs,
			availableTypes,
			filterCategories,
			filterDlcs,
			filterNoCategories,
			filterNoTypes,
			filterTypes,
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
