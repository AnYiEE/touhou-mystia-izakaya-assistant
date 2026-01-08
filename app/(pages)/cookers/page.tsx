'use client';

import { useCallback } from 'react';

import {
	useFilteredData,
	usePinyinSortConfig,
	useSearchConfig,
	useSearchResult,
	useSelectConfig,
	useSortedData,
	useThrottle,
} from '@/hooks';

import Content from './content';
import ItemPage from '@/components/itemPage';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton from '@/components/sideSearchIconButton';

import { cookersStore as store } from '@/stores';
import { checkArrayContainsOf, checkEmpty } from '@/utilities';

export default function Cookers() {
	const instance = store.instance.get();

	const allNames = store.names.use();
	const allCategories = store.categories.get();
	const allDlcs = store.dlcs.get();
	const allTypes = store.types.get();

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
			searchResult.filter(({ category, dlc, type }) => {
				const types = [type].flat();

				const isDlcMatched =
					checkEmpty(filterDlcs) ||
					filterDlcs.includes(dlc.toString());
				const isCategoryMatched =
					checkEmpty(filterCategories) ||
					filterCategories.includes(category);
				const isNoCategoryMatched =
					checkEmpty(filterNoCategories) ||
					!filterNoCategories.includes(category);
				const isTypeMatched =
					checkEmpty(filterTypes) ||
					checkArrayContainsOf(filterTypes, types);
				const isNoTypeMatched =
					checkEmpty(filterNoTypes) ||
					!checkArrayContainsOf(filterNoTypes, types);

				return (
					isDlcMatched &&
					isCategoryMatched &&
					isNoCategoryMatched &&
					isTypeMatched &&
					isNoTypeMatched
				);
			}),
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

	const pinyinSortConfig = usePinyinSortConfig(
		pinyinSortState,
		store.persistence.pinyinSortState.set
	);

	const searchConfig = useSearchConfig({
		label: '选择或输入厨具名称',
		searchItems: allNames,
		searchValue,
		setSearchValue: store.persistence.searchValue.set,
		spriteTarget: 'cooker',
	});

	const selectConfig = useSelectConfig([
		{
			items: allDlcs,
			label: 'DLC',
			selectedKeys: filterDlcs,
			setSelectedKeys: store.persistence.filters.dlcs.set,
		},
		{
			items: allCategories,
			label: '厨具系列（包含）',
			selectedKeys: filterCategories,
			setSelectedKeys: store.persistence.filters.categories.set,
		},
		{
			items: allCategories,
			label: '厨具系列（排除）',
			selectedKeys: filterNoCategories,
			setSelectedKeys: store.persistence.filters.noCategories.set,
		},
		{
			items: allTypes,
			label: '厨具类别（包含）',
			selectedKeys: filterTypes,
			setSelectedKeys: store.persistence.filters.types.set,
		},
		{
			items: allTypes,
			label: '厨具类别（排除）',
			selectedKeys: filterNoTypes,
			setSelectedKeys: store.persistence.filters.noTypes.set,
		},
	]);

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
