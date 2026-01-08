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

import { currenciesStore as store } from '@/stores';
import { checkEmpty } from '@/utilities';

export default function Currencies() {
	const instance = store.instance.get();

	const allNames = store.names.use();
	const allDlcs = store.dlcs.get();

	const pinyinSortState = store.persistence.pinyinSortState.use();
	const searchValue = store.persistence.searchValue.use();

	const throttledSearchValue = useThrottle(searchValue);
	const searchResult = useSearchResult(instance, throttledSearchValue);

	const filterDlcs = store.persistence.filters.dlcs.use();

	const filterData = useCallback(
		() =>
			searchResult.filter(({ dlc }) => {
				const isDlcMatched =
					checkEmpty(filterDlcs) ||
					filterDlcs.includes(dlc.toString());

				return isDlcMatched;
			}),
		[filterDlcs, searchResult]
	);

	const filteredData = useFilteredData(instance, filterData);

	const sortedData = useSortedData(instance, filteredData, pinyinSortState);

	const pinyinSortConfig = usePinyinSortConfig(
		pinyinSortState,
		store.persistence.pinyinSortState.set
	);

	const searchConfig = useSearchConfig({
		label: '选择或输入货币名称',
		searchItems: allNames,
		searchValue,
		setSearchValue: store.persistence.searchValue.set,
		spriteTarget: 'currency',
	});

	const selectConfig = useSelectConfig([
		{
			items: allDlcs,
			label: 'DLC',
			selectedKeys: filterDlcs,
			setSelectedKeys: store.persistence.filters.dlcs.set,
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
