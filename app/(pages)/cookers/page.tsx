'use client';

import { useCallback, useMemo } from 'react';

import { useFilteredData, useSortedData } from '@/hooks';

import Content from './content';
import ItemPage from '@/components/itemPage';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {
	type TSelectConfig,
} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton, {
	type IPinyinSortConfig,
} from '@/components/sidePinyinSortIconButton';

import { cookersStore as store } from '@/stores';
import { checkLengthEmpty, filterItems } from '@/utilities';
import { hasEquivalentDlcFilters } from '@/utils/availability';

export default function Cookers() {
	const instance = store.instance.get();
	const isAvailabilityDlcFilterRedundant = hasEquivalentDlcFilters(
		instance.data
	);

	const availableCategories = store.availableCategories.use();
	const availableAvailabilityDlcs = store.availableAvailabilityDlcs.use();
	const availableContentDlcs = store.availableContentDlcs.use();
	const availableTypes = store.availableTypes.use();

	const pinyinSortState = store.persistence.pinyinSortState.use();

	const filterAvailabilityDlcs =
		store.persistence.filters.availabilityDlcs.use();
	const filterContentDlcs = store.persistence.filters.contentDlcs.use();
	const filterCategories = store.persistence.filters.categories.use();
	const filterNoCategories = store.persistence.filters.noCategories.use();
	const filterTypes = store.persistence.filters.types.use();
	const filterNoTypes = store.persistence.filters.noTypes.use();

	const filterData = useCallback(
		() =>
			filterItems(instance.data, [
				{
					field: 'availabilityDlcs',
					match: 'any',
					values: isAvailabilityDlcFilterRedundant
						? []
						: filterAvailabilityDlcs,
				},
				{ field: 'dlc', match: 'in', values: filterContentDlcs },
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
			filterAvailabilityDlcs,
			filterCategories,
			filterContentDlcs,
			filterNoCategories,
			filterNoTypes,
			filterTypes,
			instance.data,
			isAvailabilityDlcFilterRedundant,
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

	const selectConfig = useMemo<TSelectConfig>(
		() => [
			{
				items: availableContentDlcs,
				label: '内容归属',
				selectedKeys: filterContentDlcs,
				setSelectedKeys: store.persistence.filters.contentDlcs.set,
				valueType: 'dlc',
			},
			...(isAvailabilityDlcFilterRedundant
				? []
				: [
						{
							items: availableAvailabilityDlcs,
							label: '可获取于',
							selectedKeys: filterAvailabilityDlcs,
							setSelectedKeys:
								store.persistence.filters.availabilityDlcs.set,
							valueType: 'dlc',
						} satisfies TSelectConfig[number],
					]),
			{
				items: availableCategories,
				label: '厨具系列（包含）',
				selectedKeys: filterCategories,
				setSelectedKeys: store.persistence.filters.categories.set,
			},
			{
				items: availableCategories,
				label: '厨具系列（排除）',
				selectedKeys: filterNoCategories,
				setSelectedKeys: store.persistence.filters.noCategories.set,
			},
			{
				items: availableTypes,
				label: '厨具类别（包含）',
				selectedKeys: filterTypes,
				setSelectedKeys: store.persistence.filters.types.set,
			},
			{
				items: availableTypes,
				label: '厨具类别（排除）',
				selectedKeys: filterNoTypes,
				setSelectedKeys: store.persistence.filters.noTypes.set,
			},
		],
		[
			availableAvailabilityDlcs,
			availableCategories,
			availableContentDlcs,
			availableTypes,
			filterAvailabilityDlcs,
			filterCategories,
			filterContentDlcs,
			filterNoCategories,
			filterNoTypes,
			filterTypes,
			isAvailabilityDlcFilterRedundant,
		]
	);

	return (
		<ItemPage
			isEmpty={checkLengthEmpty(sortedData)}
			sideButton={
				<SideButtonGroup>
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
