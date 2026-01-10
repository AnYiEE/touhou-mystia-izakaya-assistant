'use client';

import { useCallback, useMemo } from 'react';

import {
	useFilteredData,
	usePinyinSortConfig,
	useSearchResult,
	useSortedData,
	useThrottle,
} from '@/hooks';

import Content from './content';
import ItemPage from '@/components/itemPage';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {
	type TSelectConfig,
} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton from '@/components/sidePinyinSortIconButton';
import SideSearchIconButton, {
	type ISearchConfig,
} from '@/components/sideSearchIconButton';

import { clothesStore as store } from '@/stores';
import { checkEmpty } from '@/utilities';

export default function Clothes() {
	const instance = store.instance.get();

	const availableDlcs = store.availableDlcs.use();
	const availableNames = store.availableNames.use();

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

	const searchConfig = useMemo<ISearchConfig>(
		() => ({
			label: '选择或输入衣服名称',
			searchItems: availableNames,
			searchValue,
			setSearchValue: store.persistence.searchValue.set,
			spriteTarget: 'clothes',
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
		],
		[availableDlcs, filterDlcs]
	);

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
