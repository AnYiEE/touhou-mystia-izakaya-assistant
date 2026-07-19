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

import { ingredientsStore as store } from '@/stores';
import { checkLengthEmpty, filterItems } from '@/utilities';
import { hasEquivalentDlcFilters } from '@/utils/availability';

export default function Ingredients() {
	const currentPopularTrend = store.shared.popularTrend.use();
	const isFamousShop = store.shared.famousShop.use();

	const instance = store.instance.get();
	const isAvailabilityDlcFilterRedundant = hasEquivalentDlcFilters(
		instance.data
	);

	const availableAvailabilityDlcs = store.availableAvailabilityDlcs.use();
	const availableContentDlcs = store.availableContentDlcs.use();
	const availableLevels = store.availableLevels.use();
	const availablePlaces = store.availablePlaces.use();
	const availableTags = store.availableTags.use();
	const availableTypes = store.availableTypes.use();

	const pinyinSortState = store.persistence.pinyinSortState.use();

	const filterAvailabilityDlcs =
		store.persistence.filters.availabilityDlcs.use();
	const filterContentDlcs = store.persistence.filters.contentDlcs.use();
	const filterLevels = store.persistence.filters.levels.use();
	const filterTags = store.persistence.filters.tags.use();
	const filterNoTags = store.persistence.filters.noTags.use();
	const filterTypes = store.persistence.filters.types.use();
	const filterNoTypes = store.persistence.filters.noTypes.use();
	const filterPlaces = store.persistence.filters.places.use();
	const filterNoPlaces = store.persistence.filters.noPlaces.use();

	const dataWithTrend = useMemo(
		() =>
			instance.data.map((data) => ({
				...data,
				tags: instance.calculateTagsWithTrend(
					data.tags,
					currentPopularTrend,
					isFamousShop
				),
			})) as unknown as typeof instance.data,
		[currentPopularTrend, instance, isFamousShop]
	);

	const filterData = useCallback(
		() =>
			filterItems(dataWithTrend, [
				{
					field: 'availabilityDlcs',
					match: 'any',
					values: isAvailabilityDlcFilterRedundant
						? []
						: filterAvailabilityDlcs,
				},
				{ field: 'dlc', match: 'in', values: filterContentDlcs },
				{ field: 'level', match: 'in', values: filterLevels },
				{ field: 'tags', match: 'all', values: filterTags },
				{ field: 'tags', match: 'excludeAny', values: filterNoTags },
				{ field: 'type', match: 'in', values: filterTypes },
				{ field: 'type', match: 'excludeIn', values: filterNoTypes },
				{ field: 'places', match: 'any', values: filterPlaces },
				{
					field: 'places',
					match: 'excludeAny',
					values: filterNoPlaces,
				},
			]),
		[
			dataWithTrend,
			filterAvailabilityDlcs,
			filterContentDlcs,
			filterLevels,
			filterNoPlaces,
			filterNoTags,
			filterNoTypes,
			filterPlaces,
			filterTags,
			filterTypes,
			isAvailabilityDlcFilterRedundant,
		]
	);

	const filteredData = useFilteredData(dataWithTrend, filterData);

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
				items: availableTags,
				label: '食材标签（包含）',
				selectedKeys: filterTags,
				setSelectedKeys: store.persistence.filters.tags.set,
			},
			{
				items: availableTags,
				label: '食材标签（排除）',
				selectedKeys: filterNoTags,
				setSelectedKeys: store.persistence.filters.noTags.set,
			},
			{
				items: availableTypes,
				label: '食材类别（包含）',
				selectedKeys: filterTypes,
				setSelectedKeys: store.persistence.filters.types.set,
			},
			{
				items: availableTypes,
				label: '食材类别（排除）',
				selectedKeys: filterNoTypes,
				setSelectedKeys: store.persistence.filters.noTypes.set,
			},
			{
				items: availableLevels,
				label: '等级',
				selectedKeys: filterLevels,
				setSelectedKeys: store.persistence.filters.levels.set,
			},
			{
				items: availablePlaces,
				label: '地区（包含）',
				selectedKeys: filterPlaces,
				setSelectedKeys: store.persistence.filters.places.set,
			},
			{
				items: availablePlaces,
				label: '地区（排除）',
				selectedKeys: filterNoPlaces,
				setSelectedKeys: store.persistence.filters.noPlaces.set,
			},
		],
		[
			availableAvailabilityDlcs,
			availableContentDlcs,
			availableLevels,
			availablePlaces,
			availableTags,
			availableTypes,
			filterAvailabilityDlcs,
			filterContentDlcs,
			filterLevels,
			filterNoPlaces,
			filterNoTags,
			filterNoTypes,
			filterPlaces,
			filterTags,
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
